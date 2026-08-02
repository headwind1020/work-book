import { NextRequest, NextResponse } from 'next/server'
import { stripLatex } from '@/lib/text-utils'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64, subject } = body as { imageBase64?: string; subject?: string }

    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    const apiKey = process.env.DASHSCOPE_API_KEY
    const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    const model = process.env.QWEN_VL_MODEL || 'qwen-vl-max'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'DASHSCOPE_API_KEY 未配置，请在 Vercel 环境变量中设置' },
        { status: 500 }
      )
    }

    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '')

    // Vercel 默认请求体 4.5MB；prompt 加上 base64 后接近限制时容易被网关截断
    if (cleanedBase64.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '图片过大（>3.5MB），请压缩或重新拍照后重试' },
        { status: 413 }
      )
    }

    // 给上游 DashScope 请求加 50s 超时
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 50_000)

    let response: Response
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `你是初中数学错题解析老师，必须严格按以下流程作答：

## 一、解题流程（先步骤、后答案）
1. **审题**：先列出已知条件、未知量、约束关系
2. **列式**：根据题意建立方程/不等式/函数表达式
3. **求解**：一步一步推导，每一步都要有明确的数学依据，禁止跳步
4. **分类讨论**：若涉及绝对值、区间、分情况，必须逐一讨论并列出所有解
5. **自检环节（必做，不可省略）**：
   - 把最终答案代入原题条件，逐条验证
   - 检查计算过程是否有算术错误（符号、系数、移项）
   - 检查逻辑是否自洽（条件是否全部用上、解的个数是否合理）
   - 若发现错误，立即修正并重新给出答案

## 二、输出格式
- 必须先输出完整解题步骤（analysis）
- 步骤之后再输出最终答案（correctAnswer）
- 答案要具体：数值、坐标、表达式，不要"略"或"见上"
- 全部用 JSON 输出，不要 markdown 代码块，不要任何解释文字

## 三、表达规范
- 数学公式用 LaTeX 行内格式 $...$
- 步骤用"步骤1: ... 步骤2: ..."编号
- 自检环节单独一段，标"【自检】"
- 自检发现问题要明确说明"原答案有误，修正为..."`,
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
  "content": "题目原文（公式用 $LaTeX$）",
  "correctAnswer": "本题最终答案（用具体数字或表达式）",
  "analysis": "步骤1: ...\\n步骤2: ...\\n步骤3: ...\\n【自检】代入验证：...",
  "knowledgePoint": "考察的知识点（≤10字）",
  "difficulty": "easy|medium|hard",
  "errorReason": "常见错误原因"
}

**重要**：
- correctAnswer 必须填具体答案
- analysis 必须先写步骤，步骤之后必须包含【自检】环节
- 自检要把答案代入原题验证
- 如果分类讨论有多种情况，请全部列出`,
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 2048,
          response_format: { type: 'json_object' },
        }),
    })
    } catch (upstreamErr) {
      clearTimeout(timeout)
      const aborted = upstreamErr instanceof Error && upstreamErr.name === 'AbortError'
      console.error('Qwen-VL fetch 异常:', upstreamErr)
      return NextResponse.json(
        { error: aborted ? '识别超时（>50s），请稍后重试或换张更清晰的图片' : `上游识别失败：${(upstreamErr as Error).message}` },
        { status: aborted ? 504 : 502 }
      )
    }
    clearTimeout(timeout)

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
    let content = message.content || ''
    const reasoning = message.reasoning_content || ''

    // 剥离可能的 <think>...</think> 块
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

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
      analysis: stripLatex((parsed.analysis as string) || (reasoning ? `\n\n【模型推理】\n${reasoning}` : '')),
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