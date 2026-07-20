import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import Client, { RecognizeAllTextRequest } from '@alicloud/ocr-api20210707'
import { Config } from '@alicloud/openapi-core/dist/utils'
import { RuntimeOptions } from '@alicloud/tea-util'

export const runtime = 'nodejs'

function createClient() {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET

  if (!accessKeyId || !accessKeySecret) {
    throw new Error('阿里云 AccessKey 未配置')
  }

  const config = new Config({
    accessKeyId,
    accessKeySecret,
  })
  config.endpoint = 'ocr-api.cn-hangzhou.aliyuncs.com'
  return new Client(config)
}

/**
 * 从 OCR 响应中提取行文字
 */
function extractLines(rawData: unknown): string[] {
  if (!rawData || typeof rawData !== 'object') return []
  const data = rawData as {
    subImages?: Array<{
      blockInfo?: { blockDetails?: Array<{ paragraphDetails?: Array<{ paragraphInfo?: { wordInfo?: { wordDetails?: Array<{ wordText?: string }> } } }> }> }
      paragraphInfo?: { paragraphDetails?: Array<{ paragraphText?: string }> }
      rowInfo?: { rowDetails?: Array<{ rowText?: string }> }
    }>
  }

  const lines: string[] = []
  data.subImages?.forEach((img) => {
    const blocks = img.blockInfo?.blockDetails || []
    blocks.forEach((block) => {
      const paragraphs = block.paragraphDetails || []
      paragraphs.forEach((para) => {
        const words = para.paragraphInfo?.wordInfo?.wordDetails || []
        const line = words.map((w) => w.wordText || '').join('')
        if (line.trim()) lines.push(line.trim())
      })
    })

    if (lines.length === 0) {
      const paragraphs = img.paragraphInfo?.paragraphDetails || []
      paragraphs.forEach((p) => {
        if (p.paragraphText) lines.push(p.paragraphText)
      })
    }

    if (lines.length === 0) {
      const rows = img.rowInfo?.rowDetails || []
      rows.forEach((r) => {
        if (r.rowText) lines.push(r.rowText)
      })
    }
  })
  return lines
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64 } = body as { imageBase64?: string }

    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    // 去掉 data:image/...;base64, 前缀
    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '')

    const client = createClient()

    // 将 base64 转换为 buffer 流
    const buffer = Buffer.from(cleanedBase64, 'base64')
    const stream = Readable.from(buffer)

    // type=Advanced：通用文字识别高精版
    const req = new RecognizeAllTextRequest({
      type: 'Advanced',
      body: stream,
    })

    const runtime = new RuntimeOptions({})
    const resp = await client.recognizeAllTextWithOptions(req, runtime)

    const lines = extractLines(resp.body?.data)
    const text = lines.join('\n')

    return NextResponse.json({
      success: true,
      text,
      lines,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'OCR 调用失败'
    console.error('OCR error:', error)

    // 阿里云 SDK 抛出的客户端错误（如图片过小/格式错）以 code 开头
    // 客户端错误返回 4xx，服务端错误返回 5xx
    const status = /^(illegalImageSize|Image Decode Error|Invalid Input Parameters|410|416|400|60103|50207|61301)/i.test(message)
      ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}