import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const defaultModel = process.env.OPENAI_MODEL || process.env.AI_MODEL || process.env.ANTHROPIC_MODEL || 'gpt-5.4'
    const { messages, model = defaultModel } = body

    const baseUrl = (process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
    const normalizedModel = typeof model === 'string' ? model.replace(/^<(.+)>$/, '$1') : model

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY (or AI_API_KEY) not configured' },
        { status: 500 }
      )
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    console.log('AI API request:', { baseUrl, model, messagesCount: messages?.length })

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: normalizedModel,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    console.log('AI API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error response:', errorText)
      return NextResponse.json(
        { error: `API error: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('AI API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
