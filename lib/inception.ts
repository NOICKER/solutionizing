const INCEPTION_BASE_URL = 'https://api.inceptionlabs.ai/v1'

type MercuryMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type MercuryOptions = {
  reasoning_effort?: 'low' | 'medium' | 'high' | 'instant'
  max_tokens?: number
  temperature?: number
}

type MercuryResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export async function callMercury(
  messages: MercuryMessage[],
  options?: MercuryOptions
) {
  const apiKey = process.env.INCEPTION_API_KEY

  if (!apiKey) {
    throw new Error('INCEPTION_API_KEY is not configured')
  }

  const res = await fetch(`${INCEPTION_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mercury-2',
      messages,
      reasoning_effort: options?.reasoning_effort ?? 'medium',
      temperature: options?.temperature ?? 0.75,
      max_tokens: options?.max_tokens ?? 8192,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Mercury API error: ${res.status} - ${error}`)
  }

  const data = (await res.json()) as MercuryResponse
  const content = data.choices?.[0]?.message?.content

  if (typeof content !== 'string') {
    throw new Error('Mercury API error: missing completion content')
  }

  return content
}
