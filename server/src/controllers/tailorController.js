const groq = require('../config/groq')

exports.tailor = async (req, res) => {
  const { jobDescription, bullets, jobTitle = '', company = '' } = req.body
  if (!jobDescription || !Array.isArray(bullets) || bullets.length === 0) {
    return res.status(400).json({ error: 'jobDescription and bullets[] are required.' })
  }

  const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume optimizer with 15 years of experience in technical recruiting and career coaching.

Your task: Rewrite the provided resume bullet points to maximize ATS compatibility and relevance for the specific job description.

Rules:
- Use strong action verbs (Engineered, Designed, Led, Delivered, Optimized, etc.)
- Quantify achievements wherever possible (%, $, users, ms, etc.)
- Naturally incorporate relevant keywords from the job description
- Keep bullets concise: 1–2 lines max
- Maintain truthfulness — do not fabricate numbers
- Return ONLY a valid JSON object, no markdown, no explanation

Output format:
{
  "tailored": [
    { "original": "...", "rewritten": "...", "keywordsAdded": ["...", "..."] }
  ],
  "scoreImprovement": <estimated % ATS score delta, integer>,
  "topKeywordsInjected": ["keyword1", "keyword2", ...]
}`

  const userPrompt = `Job Title: ${jobTitle} at ${company}

Job Description:
${jobDescription.slice(0, 2000)}

Original Resume Bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Rewrite all bullets and return the JSON object.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens:  2000,
    })

    const raw = completion.choices[0].message.content.trim()
    // Strip markdown fences if present
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    const result = JSON.parse(jsonStr)
    res.json(result)
  } catch (err) {
    console.error('[Tailor]', err)
    res.status(500).json({ error: 'AI tailoring failed. Please try again.' })
  }
}
