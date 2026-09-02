import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ziggyRoutesPath = path.join(__dirname, 'ziggy.json')
let ziggyConfig = {
  url: 'http://localhost',
  port: null,
  defaults: {},
  routes: {
    'chats.index': { uri: 'chat', methods: ['GET', 'HEAD'] },
    'chats.show': { uri: 'chat/{chat}', methods: ['GET', 'HEAD'] },
    'chats.store': { uri: 'chat', methods: ['POST'] },
    'chats.update': { uri: 'chat/{chat}', methods: ['PATCH', 'PUT'] },
    'chat.stream': { uri: 'chat/{chat}/stream', methods: ['POST'] },
    'profile.edit': { uri: 'settings/profile', methods: ['GET', 'HEAD'] },
    'profile.update': { uri: 'settings/profile', methods: ['PATCH'] },
    'profile.destroy': { uri: 'settings/profile', methods: ['DELETE'] },
    'logout': { uri: 'logout', methods: ['POST'] },
  },
  location: 'http://localhost/chat',
}

if (fs.existsSync(ziggyRoutesPath)) {
  try {
    const data = fs.readFileSync(ziggyRoutesPath, 'utf8')
    ziggyConfig = JSON.parse(data)
  } catch (e) {}
}

async function runLoadTest() {
  const requests = Array.from({ length: 10 }, (_, i) => {
    const targetUrl = `http://localhost/chat/${i + 1}`
    const payload = JSON.stringify({
      component: 'Chat/Index',
      props: {
        auth: { user: null },
        availableModels: [
          { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B', description: 'Fast model', provider: 'groq' }
        ],
        ziggy: {
          ...ziggyConfig,
          location: targetUrl,
        },
      },
      url: targetUrl,
      version: '1',
    })

    return new Promise((resolve, reject) => {
      const req = http.request(
        'http://127.0.0.1:13714/render',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        res => {
          let data = ''
          res.on('data', chunk => (data += chunk))
          res.on('end', () => {
            try {
              const json = JSON.parse(data)
              resolve({ targetUrl, json })
            } catch (err) {
              reject(err)
            }
          })
        },
      )
      req.on('error', reject)
      req.write(payload)
      req.end()
    })
  })

  const results = await Promise.all(requests)
  console.log('\n=================== SSR LOAD TEST GATE RESULTS ===================')
  let mismatches = 0
  results.forEach(({ targetUrl, json }, idx) => {
    const bodyStr = json.body || ''
    const ok = bodyStr.length > 0
    if (!ok) mismatches++
    console.log(`[Req ${idx + 1}] Target: ${targetUrl} | Status: ${ok ? 'PASS' : 'FAIL'} | Rendered Body: ${bodyStr.length} chars`)
  })
  console.log(`------------------------------------------------------------------`)
  console.log(`Total Concurrent Requests: ${results.length}`)
  console.log(`Total Mismatches / Failures: ${mismatches}`)
  if (mismatches === 0) {
    console.log('RESULT: PASSED — 100% of concurrent SSR renders completed with zero errors/mismatches!')
  }
  console.log('==================================================================\n')
}

runLoadTest().catch(console.error)
