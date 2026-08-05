const groq = require('../config/groq')

function extractFirstJson(s) {
  let cleaned = s.replace(/```json?/g, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (start !== -1 && last !== -1 && last > start) {
    try {
      return JSON.parse(cleaned.slice(start, last + 1))
    } catch (_) {}
  }
  return JSON.parse(cleaned)
}

exports.tailor = async (req, res) => {
  const { jobDescription, bullets, jobTitle = '', company = '' } = req.body
  if (!jobDescription || !Array.isArray(bullets) || bullets.length === 0) {
    return res.status(400).json({ error: 'jobDescription and bullets[] are required.' })
  }

  const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume optimizer and senior technical recruiter.

Your task: Rewrite the provided resume bullet points to maximize ATS compatibility and relevance for the specific target job.

Rules:
- Use strong technical action verbs (Engineered, Synthesized, Architected, Optimized, Implemented, Executed, etc.)
- Quantify achievements wherever possible (%, $, users, ms, nm nodes, etc.)
- Naturally incorporate relevant keywords from the job description
- CRITICAL: Provide explicit feedback in two categories:
  1. 'whatAiAdded': Bullet points describing the exact technical & metric enhancements injected into the resume.
  2. 'whatYouMustLearn': Concise actionable skill gap advice listing technical tools, concepts, or domain topics in the job description that the candidate should brush up on to interview successfully.

Return ONLY a valid JSON object matching this structure:
{
  "tailored": [
    { "original": "...", "rewritten": "...", "keywordsAdded": ["...", "..."] }
  ],
  "scoreImprovement": 25,
  "topKeywordsInjected": ["keyword1", "keyword2"],
  "whatAiAdded": [
    "Quantified physical layout and timing verification metrics",
    "Injected target ATS keywords matching ${jobTitle || 'target job'} requirements"
  ],
  "whatYouMustLearn": [
    "Study advanced ASIC timing closure and setup/hold analysis",
    "Review industry-standard verification methodologies"
  ]
}`

  const userPrompt = `Target Job Title: ${jobTitle} at ${company}

Job Description:
${jobDescription.slice(0, 2200)}

Original Resume Bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Rewrite all bullets, calculate score delta, and output the JSON object.`

  try {
    const completion = await groq.createWithFallback({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens:  2200,
    }, ['llama-3.1-8b-instant', 'gemma2-9b-it'])

    const raw = completion.choices[0].message.content.trim()
    const result = extractFirstJson(raw)
    res.json(result)
  } catch (err) {
    console.error('[Tailor Controller Error]', err)
    res.status(500).json({ error: `AI tailoring failed: ${err.message}` })
  }
}
