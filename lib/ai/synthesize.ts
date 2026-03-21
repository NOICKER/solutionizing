import { ApiMissionFeedback } from '../../types/api'

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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('No response from Gemini')
    }

    // Extract JSON from response (Gemini might wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const result = JSON.parse(jsonMatch[0])

    // Validate the result has required fields
    if (typeof result.recommendation !== 'string' ||
        !Array.isArray(result.frictionPoints) ||
        !['HIGH', 'MEDIUM', 'LOW'].includes(result.signalStrength) ||
        typeof result.summary !== 'string') {
      throw new Error('Invalid response structure')
    }

    return result
  } catch (error) {
    console.error('Synthesis error:', error)
    return {
      recommendation: 'Not enough data to generate a recommendation.',
      frictionPoints: [],
      signalStrength: 'LOW',
      summary: 'Synthesis unavailable.'
    }
  }
}