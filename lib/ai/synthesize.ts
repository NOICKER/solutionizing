import { ApiMissionFeedback } from '../../types/api'

export class SynthesisError extends Error {
  code: string
  status: number

  constructor(
    message = 'Synthesis failed — please try again.',
    code = 'SYNTHESIS_FAILED',
    status = 502
  ) {
    super(message)
    this.name = 'SynthesisError'
    this.code = code
    this.status = status
  }
}

export async function synthesizeFeedback(feedback: ApiMissionFeedback): Promise<{
  recommendation: string
  frictionPoints: string[]
  signalStrength: 'HIGH' | 'MEDIUM' | 'LOW'
  summary: string
}> {
  const prompt = `
Analyze this mission feedback data and provide insights in JSON format only.

Mission feedback summary:
- Completed responses: ${feedback.summary.completedCount}
- Clarity score: ${feedback.summary.clarityScore ?? 'N/A'}
- Recommendation likelihood: ${feedback.summary.recommendationLikelihood ?? 'N/A'}%
- Representative quote: "${feedback.summary.representativeQuote ?? 'None'}"

Questions and responses:
${feedback.byQuestion.map(q => {
  let details = `Question: ${q.text} (${q.type})\nResponses: ${q.responseCount}\n`
  if (q.type === 'RATING_1_5') {
    details += `Average rating: ${q.averageRating ?? 'N/A'}\nDistribution: ${q.distribution.map((d: any) => `${d.rating}: ${d.percentage}%`).join(', ')}\n`
  } else if (q.type === 'MULTIPLE_CHOICE' || q.type === 'YES_NO') {
    details += `Breakdown: ${q.breakdown.map((b: any) => `${b.option}: ${b.percentage}%`).join(', ')}\n`
  } else {
    details += `Sample responses: ${(q as any).sampleResponses.slice(0, 3).map((s: any) => `"${s}"`).join(', ')}\n`
  }
  return details
}).join('\n')}

Based on this data, return JSON with:
- recommendation: one actionable sentence for the founder
- frictionPoints: array of up to 3 specific friction points found
- signalStrength: HIGH/MEDIUM/LOW based on sample size and score consistency
- summary: 2-3 sentence plain English summary of what the feedback means
`.trim()

  if (!process.env.GEMINI_API_KEY) {
    throw new SynthesisError('Synthesis failed — please try again.', 'SYNTHESIS_NOT_CONFIGURED', 500)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      }
    )

    if (!response.ok) {
      throw new SynthesisError()
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new SynthesisError()
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new SynthesisError()
    }

    const result = JSON.parse(jsonMatch[0])

    if (
      typeof result.recommendation !== 'string' ||
      !Array.isArray(result.frictionPoints) ||
      !['HIGH', 'MEDIUM', 'LOW'].includes(result.signalStrength) ||
      typeof result.summary !== 'string'
    ) {
      throw new SynthesisError()
    }

    return result
  } catch (error) {
    if (error instanceof SynthesisError) {
      throw error
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new SynthesisError('Synthesis failed — please try again.', 'SYNTHESIS_TIMEOUT', 504)
    }

    throw new SynthesisError()
  } finally {
    clearTimeout(timeoutId)
  }
}
