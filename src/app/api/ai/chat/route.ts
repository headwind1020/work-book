import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model = 'ep-20260326230555-9f6qn' } = body

    const baseUrl = process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
    const apiKey = process.env.VOLCENGINE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    console.log('AI API request:', { baseUrl, model, messagesCount: messages?.length })

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Title': 'wrong-book',
      },
      body: JSON.stringify({
        model,
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
  } catch (error: any) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
