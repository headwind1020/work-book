import { NextRequest, NextResponse } from 'next/server'
import { stripLatex } from '@/lib/text-utils'

export const runtime = 'nodejs'
export const maxDuration = 90

const DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64, subject } = body as { imageBase64?: string; subject?: string }

    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    const apiKey = process.env.DASHSCOPE_API_KEY
    const model = process.env.QWEN_VL_MODEL || 'qwen-vl-max'
    // 强制使用公开端点：Vercel serverless 函数访问不到 maas 专属域

    if (!apiKey) {
      return NextResponse.json(
        { error: 'DASHSCOPE_API_KEY 未配置，请在 Vercel 环境变量中设置' },
        { status: 500 }
      )
    }

    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '')

    if (cleanedBase64.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '图片过大（>3.5MB），请压缩或重新拍照后重试' },
        { status: 413 }
      )
    }

    // 强制使用默认公开端点（Vercel 网络环境不支持 maas 专属域）
    const candidateBaseUrls = [DEFAULT_BASE_URL]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 80_000)

    let response: Response | null = null
    let lastError: Error | null = null

    const fetchPayload = JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `你是初中数学错题解析助手。要求：
1. 快速识别图片中的题目
2. 给出正确答案（必须具体：数值或表达式）
3. 写简要解题步骤（不必过详，关键步骤即可）

只输出 JSON，不要任何解释文字。`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${cleanedBase64}` },
            },
            {
              type: 'text',
              text: `分析这张${subject ?? '数学'}错题图片。

**严格**输出 JSON（不要 markdown 标记、不要任何额外文字）：

{
  "content": "题目原文",
  "correctAnswer": "本题最终答案",
  "analysis": "关键解题步骤（简洁，不必过详）",
  "knowledgePoint": "考察的知识点（≤10字）",
  "difficulty": "easy|medium|hard",
  "errorReason": "常见错误原因"
}`,
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    })

    // 依次尝试每个 baseUrl，每个 baseUrl 内最多 3 次重试
    outer: for (const tryBaseUrl of candidateBaseUrls) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[recognize] 尝试 ${tryBaseUrl} 第 ${attempt}/3 次`)
          const r = await fetch(`${tryBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            signal: controller.signal,
            body: fetchPayload,
          })
          // 401/403/404 等认证/路由错误不算成功，跳到下一个 baseUrl
          if (r.status === 401 || r.status === 403 || r.status === 404) {
            const t = await r.text()
            console.warn(`[recognize] ${tryBaseUrl} 认证失败:`, r.status, t)
            lastError = new Error(`${tryBaseUrl} 认证失败 (${r.status})`)
            continue outer
          }
          response = r
          break outer
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          console.warn(`[recognize] ${tryBaseUrl} 第 ${attempt} 次失败:`, lastError.message)
          // 网络层失败，间隔 500ms 再试
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 500))
          }
        }
      }
    }
    clearTimeout(timeout)

    if (!response) {
      const aborted = lastError?.name === 'AbortError'
      const message = lastError?.message || '未知错误'
      console.error('所有 baseUrl 都失败:', message)
      return NextResponse.json(
        {
          error: aborted
            ? '识别超时（>25s），请稍后重试或换张更清晰的图片'
            : `上游识别失败：${message}`,
        },
        { status: aborted ? 504 : 502 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Qwen-VL API 错误:', response.status, errorText)
      return NextResponse.json(
        { error: `Qwen-VL API 调用失败: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message || {}
    const content = message.content || ''
    const reasoning = message.reasoning_content || ''

    let parsed: Record<string, unknown> = {}

    // 1. 优先尝试剥 ```json ... ``` 标记
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      try {
        parsed = JSON.parse(codeBlockMatch[1].trim())
      } catch {
        // 继续尝试下一个策略
      }
    }

    // 2. 尝试匹配第一个 { ... } 块
    if (Object.keys(parsed).length === 0) {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch {
          // 继续 fallback
        }
      }
    }

    // 3. 实在解析不出来，把整段当 content 返回
    if (Object.keys(parsed).length === 0) {
      return NextResponse.json({
        content: stripLatex(content.trim()),
        correctAnswer: '',
        analysis: stripLatex(reasoning ? `\n\n【模型推理】\n${reasoning}` : ''),
        knowledgePoint: '',
        difficulty: 'medium',
        errorReason: '',
        _parseWarning: '模型未返回标准 JSON，已原样返回内容',
      })
    }

    return NextResponse.json({
      content: stripLatex((parsed.content as string) ?? ''),
      correctAnswer: stripLatex((parsed.correctAnswer as string) ?? ''),
      analysis: stripLatex(
        (parsed.analysis as string) ||
          (reasoning ? `\n\n【模型推理】\n${reasoning}` : '')
      ),
      knowledgePoint: stripLatex((parsed.knowledgePoint as string) ?? ''),
      difficulty: parsed.difficulty ?? 'medium',
      errorReason: stripLatex((parsed.errorReason as string) ?? ''),
    })
  } catch (error) {
    console.error('recognize error:', error)
    const message = error instanceof Error ? error.message : '识别失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}