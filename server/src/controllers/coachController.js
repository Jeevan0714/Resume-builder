const groq = require('../config/groq')
const { preRenderInterviewQuestions } = require('../services/preRenderService')

const sessions = new Map()
const MAX_SESSIONS = 100
function setSession(uid, data) {
  if (sessions.size >= MAX_SESSIONS) {
    const oldestKey = sessions.keys().next().value
    if (oldestKey) sessions.delete(oldestKey)
  }
  sessions.set(uid, { ...data, updatedAt: Date.now() })
}

exports.startSession = async (req, res) => {
  const { jobId, jobTitle = '', company = '', jobDescription = '', resumeText = '' } = req.body
  const uid = req.user.uid

  // Attempt pre-rendering / fetching pre-rendered questions for 0ms delay
  let preRendered = null
  if (jobId || jobTitle) {
    preRendered = await preRenderInterviewQuestions({ id: jobId || 'job-custom', title: jobTitle, company, description: jobDescription })
  }

  const systemPrompt = `You are an expert technical and behavioral interview coach helping candidates prepare for a ${jobTitle} role at ${company}.

Context:
Job Description: ${jobDescription.slice(0, 800)}
Candidate Resume Summary: ${resumeText.slice(0, 800)}

Your role:
1. Ask one behavioral or domain technical interview question at a time.
2. After the candidate responds, provide structured feedback using STAR (Situation, Task, Action, Result) criteria.
3. Score each response out of 100 across: Clarity (25pts), Specificity (25pts), Impact (25pts), Relevance (25pts).
4. Then ask the next question.

Keep responses encouraging, professional, and precise.`

  setSession(uid, {
    systemPrompt,
    messages: [],
    jobTitle,
    company,
    questionCount: 0,
    scores: [],
  })

  try {
    let firstMessage = ''
    if (preRendered && preRendered.firstQuestion) {
      firstMessage = `${preRendered.openingWelcome || `Welcome! Ready for your interview for ${jobTitle} at ${company}?`}\n\nQuestion 1: ${preRendered.firstQuestion}`
    } else {
      const response = await groq.createWithFallback({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: 'Start the interview session.' },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }, ['llama-3.1-8b-instant', 'gemma2-9b-it'])
      firstMessage = response.choices[0].message.content
    }

    sessions.get(uid).messages.push(
      { role: 'user',      content: 'Start the interview session.' },
      { role: 'assistant', content: firstMessage },
    )
    sessions.get(uid).questionCount += 1

    res.json({ message: firstMessage, questionCount: 1, preRendered })
  } catch (err) {
    console.error('[Coach Start]', err)
    res.status(500).json({ error: 'Failed to start session.' })
  }
}

exports.respond = async (req, res) => {
  const { answer } = req.body
  const uid = req.user.uid

  const session = sessions.get(uid)
  if (!session) return res.status(404).json({ error: 'No active session. Call /session first.' })

  session.messages.push({ role: 'user', content: answer })

  try {
    const response = await groq.createWithFallback({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: session.systemPrompt },
        ...session.messages,
      ],
      temperature: 0.65,
      max_tokens:  800,
    }, ['llama-3.1-8b-instant', 'gemma2-9b-it'])

    const coachReply = response.choices[0].message.content
    session.messages.push({ role: 'assistant', content: coachReply })
    session.questionCount += 1

    // Try to extract score from reply (simple heuristic)
    const scoreMatch = coachReply.match(/(\d+)\s*\/\s*100/)
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null
    if (score) session.scores.push(score)

    const avgScore = session.scores.length
      ? Math.round(session.scores.reduce((a, b) => a + b, 0) / session.scores.length)
      : null

    res.json({ message: coachReply, questionCount: session.questionCount, lastScore: score, avgScore })
  } catch (err) {
    console.error('[Coach Respond]', err)
    res.status(500).json({ error: 'AI coaching failed.' })
  }
}
