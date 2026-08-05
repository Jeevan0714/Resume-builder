const groq = require('../config/groq')
const { db } = require('../config/firebase')

// In-memory cache for pre-rendered interview questions per job ID
const preRenderedCache = new Map()

/**
 * Background pre-rendering engine that pre-generates top critical interview questions
 * for scraped jobs so the candidate experiences 0ms latency when opening Interview Coach.
 */
async function preRenderInterviewQuestions(job) {
  if (!job || !job.id) return null

  // Return cached version if already pre-rendered
  if (preRenderedCache.has(job.id)) {
    return preRenderedCache.get(job.id)
  }

  try {
    const prompt = `You are a Principal Engineer and Lead Technical Interviewer at ${job.company || 'a top tech company'}.
Generate the 3 most critical, high-probability technical and behavioral interview questions for a candidate applying for the ${job.title} role.

Job Description & Requirements:
${job.description || ''}
Key Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : ''}

Rules:
- Questions must be highly specific to the domain (${job.title}).
- For VLSI/Hardware: ask about RTL layout, timing analysis, synthesis, or verification.
- For Software/Mobile: ask about architecture, performance, API integration, or data structures.
- For Embedded: ask about microcontrollers, firmware, memory, or sensor protocols.

Return ONLY a valid JSON object:
{
  "openingWelcome": "Welcome! Today we will evaluate your technical background for the ${job.title} role at ${job.company}...",
  "firstQuestion": "...",
  "preRenderedQuestions": [
    { "q": "...", "focus": "Technical Architecture", "starTip": "..." },
    { "q": "...", "focus": "Problem Solving & Verification", "starTip": "..." },
    { "q": "...", "focus": "System Design & Optimization", "starTip": "..." }
  ]
}`

    const completion = await groq.createWithFallback({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user',   content: 'Pre-render technical interview questions for this job.' },
      ],
      temperature: 0.4,
      max_tokens: 1000,
    }, ['llama-3.1-8b-instant', 'gemma2-9b-it'])

    const raw = completion.choices[0].message.content.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : raw
    const data = JSON.parse(jsonStr)

    // Store in cache
    preRenderedCache.set(job.id, data)

    // Persist to Firestore if available
    try {
      await db.collection('jobs').doc(job.id).collection('interviews').doc('prerendered').set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
    } catch (_) {}

    return data
  } catch (err) {
    console.warn(`[PreRender Warning] Failed to pre-render for job ${job.id}:`, err.message)
    const fallback = {
      openingWelcome: `Welcome! Let's begin your interview for the ${job.title} position at ${job.company || 'your target company'}.`,
      firstQuestion: `Can you walk me through a technical project where you applied ${job.skills?.[0] || 'core engineering principles'}?`,
      preRenderedQuestions: [],
    }
    preRenderedCache.set(job.id, fallback)
    return fallback
  }
}

function getPreRendered(jobId) {
  return preRenderedCache.get(jobId) || null
}

module.exports = {
  preRenderInterviewQuestions,
  getPreRendered,
}
