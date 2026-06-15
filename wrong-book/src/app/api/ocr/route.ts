import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File | null

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
    const apiKey = process.env.VOLCENGINE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Title': 'wrong-book',
      },
      body: JSON.stringify({
        model: 'ep-20260326230555-9f6qn',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请分析这张图片中的数学/物理/化学等理科题目，按以下JSON格式返回：
{
  "content": "题目文字内容",
  "hasDiagram": true/false,
  "diagramDescription": "示意图的简要描述（如：抛物线图像、三角形、力学示意图等），如果没有示意图则为空"
}

要求：
1. content: 只需要输出题目文字部分，不要包含解析
2. hasDiagram: 图片中是否有示意图/图表/图像（不是文字的图片）
3. diagramDescription: 简单描述示意图是什么

请直接返回JSON，不要其他内容。`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vision API error:', errorText)
      return NextResponse.json(
        { error: `API error: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

    let result = {
      content: '',
      hasDiagram: false,
      diagramDescription: ''
    }

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      }
    } catch {
      result.content = aiResponse
    }

    return NextResponse.json({
      result: result.content,
      hasDiagram: result.hasDiagram,
      diagramDescription: result.diagramDescription,
      imageBase64: base64Image
    })
  } catch (error) {
    console.error('OCR API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
