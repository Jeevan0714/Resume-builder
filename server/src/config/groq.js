const Groq = require('groq-sdk')

let groq = null

function getGroqClient() {
  if (groq) return groq
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn('[Groq] ⚠ GROQ_API_KEY is not set. AI features (tailor, coach) will be unavailable.')
    return null
  }
  groq = new Groq({ apiKey })
  return groq
}

/**
 * Creates a chat completion with automatic fallback to secondary models if a 429 Rate Limit or 5xx error occurs.
 */
async function createWithFallback(params, fallbackModels = ['llama-3.1-8b-instant', 'gemma2-9b-it', 'llama-3.3-70b-versatile']) {
  const client = getGroqClient()
  if (!client) {
    throw new Error('GROQ_API_KEY is not configured. Please add it to your server/.env file.')
  }

  const primaryModel = params.model
  const modelsToTry = [primaryModel, ...fallbackModels.filter(m => m !== primaryModel)]

  let lastError = null
  for (const model of modelsToTry) {
    try {
      const completion = await client.chat.completions.create({
        ...params,
        model,
      })
      if (model !== primaryModel) {
        console.warn(`[Groq Fallback] ⚠️ Primary model '${primaryModel}' hit rate limit. Fallback model '${model}' succeeded!`)
      }
      return completion
    } catch (err) {
      lastError = err
      const status = err.status || err.statusCode || (err.error && err.error.status)
      const isRateLimitOrServerErr = status === 429 || (status >= 500 && status < 600) || (err.message && (err.message.includes('429') || err.message.toLowerCase().includes('rate limit')))

      if (isRateLimitOrServerErr) {
        console.warn(`[Groq Fallback] ⚠️ Model '${model}' failed with status ${status || '429 Rate Limit'}. Switching to fallback model...`)
        continue
      }
      throw err
    }
  }
  throw lastError
}

// Proxy that lazily initializes the client on first use
module.exports = new Proxy({}, {
  get(_, prop) {
    if (prop === 'createWithFallback') {
      return createWithFallback
    }
    const client = getGroqClient()
    if (!client) {
      throw new Error('GROQ_API_KEY is not configured. Please add it to your server/.env file.')
    }
    return client[prop]
  },
})
