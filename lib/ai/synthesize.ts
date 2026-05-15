import { callMercury } from '@/lib/inception'
import { ApiMissionFeedback } from '../../types/api'

type SynthesisResult = {
  recommendation: string
  frictionPoints: string[]
  signalStrength: 'HIGH' | 'MEDIUM' | 'LOW'
  summary: string
}

export class SynthesisError extends Error {
  code: string
  status: number

  constructor(
    message = 'Synthesis failed - please try again.',
    code = 'SYNTHESIS_FAILED',
    status = 502
  ) {
    super(message)
    this.name = 'SynthesisError'
    this.code = code
    this.status = status
  }
}

function formatQuestionFeedback(question: ApiMissionFeedback['byQuestion'][number]) {
  let details = `Question: ${question.text} (${question.type})\nResponses: ${question.responseCount}\n`

  switch (question.type) {
    case 'RATING_1_5': {
      const distribution = question.distribution
        .map((item) => `${item.rating}: ${item.percentage}%`)
        .join(', ')

      return `${details}Average rating: ${question.averageRating ?? 'N/A'}\nDistribution: ${distribution}\n`
    }
    case 'MULTIPLE_CHOICE':
    case 'YES_NO': {
      const breakdown = question.breakdown
        .map((item) => `${item.option}: ${item.percentage}%`)
        .join(', ')

      return `${details}Breakdown: ${breakdown}\n`
    }
    case 'TEXT_SHORT':
    case 'TEXT_LONG': {
      const samples = question.sampleResponses
        .slice(0, 3)
        .map((sample) => `"${sample}"`)
        .join(', ')

      return `${details}Sample responses: ${samples}\n`
    }
  }
}

function parseSynthesisResult(text: string): SynthesisResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new SynthesisError()
  }

  const result = JSON.parse(jsonMatch[0]) as Partial<SynthesisResult>
  const signalStrength = result.signalStrength
  const frictionPoints = Array.isArray(result.frictionPoints)
    ? result.frictionPoints.filter((point): point is string => typeof point === 'string').slice(0, 3)
    : []

  if (
    typeof result.recommendation !== 'string' ||
    !Array.isArray(result.frictionPoints) ||
    !['HIGH', 'MEDIUM', 'LOW'].includes(signalStrength ?? '') ||
    typeof result.summary !== 'string'
  ) {
    throw new SynthesisError()
  }

  return {
    recommendation: result.recommendation,
    frictionPoints,
    signalStrength: signalStrength as SynthesisResult['signalStrength'],
    summary: result.summary,
  }
}

export async function synthesizeFeedback(feedback: ApiMissionFeedback): Promise<SynthesisResult> {
  const prompt = `
Analyze this mission feedback data and provide insights in JSON format only.

Mission feedback summary:
- Completed responses: ${feedback.summary.completedCount}
- Clarity score: ${feedback.summary.clarityScore ?? 'N/A'}
- Recommendation likelihood: ${feedback.summary.recommendationLikelihood ?? 'N/A'}%
- Representative quote: "${feedback.summary.representativeQuote ?? 'None'}"

Questions and responses:
${feedback.byQuestion.map(formatQuestionFeedback).join('\n')}

Based on this data, return JSON with:
- recommendation: one actionable sentence for the founder
- frictionPoints: array of up to 3 specific friction points found
- signalStrength: HIGH/MEDIUM/LOW based on sample size and score consistency
- summary: 2-3 sentence plain English summary of what the feedback means
`.trim()

  try {
    const text = await callMercury([
      {
        role: 'system',
        content: 'You are a product research analyst. Return valid JSON only, with no markdown fences or commentary.',
      },
      { role: 'user', content: prompt },
    ], {
      reasoning_effort: 'medium',
      temperature: 0.35,
      max_tokens: 1200,
    })

    return parseSynthesisResult(text)
  } catch (error) {
    if (error instanceof SynthesisError) {
      throw error
    }

    if (error instanceof Error && error.message.includes('INCEPTION_API_KEY')) {
      throw new SynthesisError('Synthesis failed - please try again.', 'SYNTHESIS_NOT_CONFIGURED', 500)
    }

    throw new SynthesisError()
  }
}
