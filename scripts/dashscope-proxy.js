// 阿里云 DashScope 代理
// 监听 0.0.0.0:3030，转发 /v1/chat/completions 到 dashscope-intl.aliyuncs.com
const http = require('http')
const https = require('https')

const PORT = 3030

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // 读 body
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)

  // 转发到阿里云国际端点
  const apiKey = req.headers['authorization'] || ''
  const upstream = https.request(
    {
      hostname: 'dashscope-intl.aliyuncs.com',
      port: 443,
      path: '/compatible-mode/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
        'Content-Length': body.length,
      },
      timeout: 80000,
    },
    (upRes) => {
      res.writeHead(upRes.statusCode || 502, {
        'Content-Type': upRes.headers['content-type'] || 'application/json',
        'Access-Control-Allow-Origin': '*',
      })
      upRes.pipe(res)
    }
  )

  upstream.on('error', (err) => {
    console.error('[proxy] upstream error:', err.message)
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: `proxy upstream error: ${err.message}` }))
    }
  })

  upstream.on('timeout', () => {
    console.error('[proxy] upstream timeout')
    upstream.destroy()
    if (!res.headersSent) {
      res.writeHead(504, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'proxy upstream timeout' }))
    }
  })

  upstream.write(body)
  upstream.end()
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] listening on 0.0.0.0:${PORT}`)
  console.log(`[proxy] forwarding to dashscope-intl.aliyuncs.com`)
})