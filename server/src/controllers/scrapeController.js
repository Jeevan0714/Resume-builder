const groq = require('../config/groq')
const { fetchMultiSourceJobs } = require('../services/scraperService')

// Fallback keyword matcher if AI inference fails
function computeMatchScoreFallback(job, resumeText) {
  if (!resumeText) return 0
  const lower = resumeText.toLowerCase()
  const matched = job.skills.filter(s => lower.includes(s.toLowerCase()))
  const skillRatio = job.skills.length > 0 ? (matched.length / job.skills.length) : 0
  const titleWords = job.title.toLowerCase().split(/\s+/)
  const titleMatches = titleWords.filter(w => w.length > 3 && lower.includes(w))
  const titleBoost = titleMatches.length > 0 ? 20 : 0
  return Math.max(10, Math.min(100, Math.round((skillRatio * 80) + titleBoost)))
}

/**
 * AI-powered job scoring using Groq (gemma2-9b-it) to score candidates against resume text.
 */
async function computeMatchScoreAI(jobs, resumeText) {
  if (!resumeText || resumeText.trim().length < 20) {
    return jobs.map(job => ({
      ...job,
      matchScore: 0,
      matchedSkills: [],
    }))
  }

  const lowerResume = resumeText.toLowerCase()

  try {
    const jobSummaries = jobs.map((j, i) =>
      `Job #${i + 1}: ${j.title} at ${j.company} (Skills required: ${j.skills.join(', ')})`
    ).join('\n')

    const completion = await groq.createWithFallback({
      model: 'gemma2-9b-it',
      messages: [
        {
          role: 'system',
          content: `You are an expert AI recruiter matching a candidate's resume against job descriptions. Score each job from 0 to 100 based strictly on how well the candidate's actual skills and background match the job requirements. Return ONLY a valid JSON array of numbers, e.g. [85, 40, 92]. No text, no markdown.`,
        },
        {
          role: 'user',
          content: `Candidate Resume:\n${resumeText.slice(0, 1500)}\n\nJobs List:\n${jobSummaries}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }, ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'])

    const raw = completion.choices[0].message.content.trim()
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    const scores = JSON.parse(jsonStr)

    if (Array.isArray(scores) && scores.length === jobs.length) {
      return jobs.map((job, i) => {
        const matchedSkills = job.skills.filter(s => lowerResume.includes(s.toLowerCase()))
        return {
          ...job,
          matchScore: Math.max(0, Math.min(100, parseInt(scores[i], 10) || 0)),
          matchedSkills,
        }
      })
    }
  } catch (err) {
    console.warn('[Jobs Feed] AI scoring failed, falling back to keyword matching:', err.message)
  }

  // Fallback to keyword matching if AI fails
  return jobs.map(job => {
    const matchedSkills = job.skills.filter(s => lowerResume.includes(s.toLowerCase()))
    return {
      ...job,
      matchScore: computeMatchScoreFallback(job, resumeText),
      matchedSkills,
    }
  })
}

exports.getFeed = async (req, res) => {
  try {
    const { search = '', type = 'all', minScore = 0 } = req.query
    let resumeText = req.query.resumeText || ''
    let fileName = ''
    let userPreferences = null

    if (req.user?.uid) {
      try {
        const { db } = require('../config/firebase')
        // Fetch Master Resume Profile
        const snap = await db.collection('users').doc(req.user.uid)
          .collection('master_profiles').doc('latest').get()
        if (snap.exists) {
          const data = snap.data()
          resumeText = data.rawText || ''
          fileName = data.fileName || ''
        }

        // Fetch User Target Preferences
        const prefSnap = await db.collection('users').doc(req.user.uid)
          .collection('preferences').doc('latest').get()
        if (prefSnap.exists) {
          userPreferences = prefSnap.data()
        }
      } catch (_) {}
    }

    // Extract candidate skills array from resume text
    let candidateSkills = []
    if (resumeText) {
      const knownSkills = ['ESP32', 'LoRa', 'React Native', 'RTL Design', 'VLSI', 'Verilog', 'OpenCV', 'Python', 'Flask', 'C/C++', 'Embedded', 'IoT', 'TypeScript', 'Node.js', 'Firebase', 'CUDA', 'PyTorch']
      candidateSkills = knownSkills.filter(s => resumeText.toLowerCase().includes(s.toLowerCase()))
    }

    // Get jobs from Multi-Source Scraper Service
    const rawJobs = await fetchMultiSourceJobs({
      targetRoles: userPreferences?.targetRoles || [],
      domain: userPreferences?.domain || '',
      search,
      type,
      skills: candidateSkills,
    })

    // AI-powered match scoring against Master Resume
    let jobs = await computeMatchScoreAI(rawJobs, resumeText)

    if (parseInt(minScore, 10) > 0) {
      jobs = jobs.filter(j => j.matchScore >= parseInt(minScore, 10))
    }

    // Sort by match score descending
    jobs.sort((a, b) => b.matchScore - a.matchScore)

    res.json({
      jobs,
      total: jobs.length,
      hasResume: Boolean(resumeText && resumeText.trim().length > 10),
      fileName: fileName || (resumeText ? 'Uploaded Resume' : null),
      preferences: userPreferences,
    })
  } catch (err) {
    console.error('[Jobs Feed]', err)
    res.status(500).json({ error: err.message })
  }
}
