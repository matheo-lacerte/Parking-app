import http from 'http'
import handler from '../api/index.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000

const server = http.createServer(async (req, res) => {
  // Normalize URLs to ensure /api prefix is present for the handler
  if (!req.url.startsWith('/api')) {
    // Allow only /api/* in this dev server
    res.statusCode = 404
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: 'Not Found' }))
    return
  }
  try {
    await handler(req, res)
  } catch (err) {
    console.error('[devServer] Unhandled error', err)
    try {
      res.statusCode = 500
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'Internal Server Error', details: err?.message }))
    } catch {}
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[devServer] API listening on http://127.0.0.1:${PORT}/api`)
})
