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
    const targetId = i + 1
    const targetUrl = `/chat/${targetId}`
    const fullLocationUrl = `http://localhost/chat/${targetId}`

    const payload = JSON.stringify({
      component: 'Chat/Index',
      props: {
        auth: { user: null },
        availableModels: [
          { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B', description: 'Fast model', provider: 'groq' }
        ],
        ziggy: {
          ...ziggyConfig,
          location: fullLocationUrl,
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
              const bodyHtml = json.body || ''

              let renderedUrl = null
              let renderedZiggyLocation = null

              // Extract Inertia page JSON from <script data-page="app" type="application/json">...</script>
              const scriptMatch = bodyHtml.match(/<script data-page="app" type="application\/json">(.*?)<\/script>/s)
              if (scriptMatch && scriptMatch[1]) {
                const parsed = JSON.parse(scriptMatch[1])
                renderedUrl = parsed.url
                renderedZiggyLocation = parsed.props?.ziggy?.location
              }

              resolve({
                reqId: targetId,
                requestedUrl: targetUrl,
                requestedLocation: fullLocationUrl,
                renderedUrl,
                renderedZiggyLocation,
                bodyHtml,
              })
            } catch (err) {
              console.error('Raw response data error:', err)
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

  console.log('\n========================================================================================================')
  console.log('                        SSR CONCURRENCY RACE CONDITION VERIFICATION (10 REQUESTS)')
  console.log('========================================================================================================')

  let mismatches = 0
  results.forEach(res => {
    const isUrlMatch = res.renderedUrl === res.requestedUrl
    const isLocationMatch = res.renderedZiggyLocation === res.requestedLocation
    const pass = isUrlMatch && isLocationMatch

    if (!pass) mismatches++

    console.log(`[Req #${String(res.reqId).padStart(2)}] Requested: ${res.requestedUrl.padEnd(10)} | Rendered URL: ${(res.renderedUrl || 'NULL').padEnd(10)} | Ziggy.location: ${(res.renderedZiggyLocation || 'NULL').padEnd(28)} | ${pass ? '✅ PASS' : '❌ RACE MISMATCH'}`)
  })

  console.log('--------------------------------------------------------------------------------------------------------')
  console.log(`Total Concurrent Requests: ${results.length}`)
  console.log(`Total Race Condition Mismatches: ${mismatches}`)
  if (mismatches === 0) {
    console.log('FINAL RESULT: ✅ PASSED — Every request received its exact matching Ziggy.location and URL with ZERO interleave/race condition!')
  } else {
    console.log('FINAL RESULT: ❌ FAILED — Race condition detected between concurrent SSR requests!')
  }
  console.log('========================================================================================================\n')
}

runLoadTest().catch(console.error)
