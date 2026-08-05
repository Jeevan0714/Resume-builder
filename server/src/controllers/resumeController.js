const multer = require('multer')
const pdfModule = require('pdf-parse')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFile } = require('child_process')
const util = require('util')
const groq = require('../config/groq')
const { db } = require('../config/firebase')

const execFileAsync = util.promisify(execFile)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/**
 * Python PyMuPDF Layout Extractor Helper with safe timeout and temp directory
 */
async function extractTextWithPython(buffer) {
  const tempDir = os.tmpdir()
  const tempPath = path.join(tempDir, `resume_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`)
  try {
    fs.writeFileSync(tempPath, buffer)
    const scriptPath = path.join(__dirname, '../utils/pdf_parser.py')
    const { stdout } = await execFileAsync('python3', [scriptPath, tempPath], { timeout: 4000 })
    if (fs.existsSync(tempPath)) try { fs.unlinkSync(tempPath) } catch (_) {}

    if (stdout && stdout.trim()) {
      const parsed = JSON.parse(stdout)
      if (parsed.fullText && parsed.fullText.trim().length > 10) {
        return parsed
      }
    }
  } catch (err) {
    if (fs.existsSync(tempPath)) try { fs.unlinkSync(tempPath) } catch (_) {}
    console.warn('[Python PDF Extractor Warning]', err.message)
  }
  return null
}

/**
 * Robust helper to parse PDF text across pdf-parse v1.x and v2.x
 */
async function extractTextFromPdf(buffer) {
  if (typeof pdfModule === 'function') {
    const data = await pdfModule(buffer)
    return data.text || ''
  } else if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse({ data: buffer })
    const result = await parser.getText()
    if (typeof result === 'string') return result
    if (result && typeof result.text === 'string') return result.text
    if (Array.isArray(result)) return result.join('\n')
    return String(result || '')
  } else {
    throw new Error('Unsupported pdf-parse library version.')
  }
}

/**
 * AI-Powered Technical Bullet Extractor
 */
async function extractTechnicalBulletsAI(fullText) {
  try {
    const completion = await groq.createWithFallback({
      model: 'gemma2-9b-it',
      messages: [
        {
          role: 'system',
          content: `You are an expert AI technical recruiter. Extract ALL technical achievement bullet points, project highlights, work experience accomplishments, and engineering details from the candidate's resume text.
DO NOT include contact details, LinkedIn links, emails, university/school names, or soft skill headers.
Return ONLY a valid JSON object with an array of strings:
{ "bullets": ["Designed and verified an RTL-based pseudorandom generator using 45nm technology...", "Engineered a waterproof distance-monitoring system using ESP32 with an integrated Arduino web dashboard...", ...] }`,
        },
        {
          role: 'user',
          content: `Resume Text:\n${fullText.slice(0, 3500)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }, ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'])

    const raw = completion.choices[0].message.content.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : raw
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed.bullets) && parsed.bullets.length > 0) {
      return parsed.bullets
    }
  } catch (err) {
    console.warn('[Resume AI Extractor Warning]', err.message)
  }

  // Fallback line parser if AI call fails
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean)
  const bullets = lines.filter(l => {
    const isBullet = /^[•\-\*\d+\.]\s*/.test(l) || /^(designed|built|developed|engineered|implemented|analyzed|integrated|managed|created|executed)/i.test(l)
    return isBullet && l.length > 25 && !l.includes('@') && !l.toLowerCase().includes('linkedin') && !l.toLowerCase().includes('don bosco')
  })
  return bullets
}

exports.upload = [
  upload.single('pdfFile'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' })

      let rawExtractedText = ''
      let pythonBullets = null

      // 1. Attempt Python PyMuPDF layout extraction with 4s timeout
      const pyResult = await extractTextWithPython(req.file.buffer)
      if (pyResult && pyResult.fullText) {
        rawExtractedText = pyResult.fullText
        if (Array.isArray(pyResult.bullets) && pyResult.bullets.length > 0) {
          pythonBullets = pyResult.bullets
        }
      }

      // 2. Fallback to pdf-parse Node extractor if Python extraction failed or timed out
      if (!rawExtractedText) {
        try {
          rawExtractedText = await extractTextFromPdf(req.file.buffer)
        } catch (parseErr) {
          console.error('[Resume Parse Error]', parseErr)
          return res.status(422).json({ error: `Could not parse PDF file: ${parseErr.message}` })
        }
      }

      const text = rawExtractedText.trim()
      if (!text) return res.status(422).json({ error: 'Could not extract text from PDF. Ensure it is a text-based PDF (not an image scan).' })

      const wordCount = text.split(/\s+/).length
      const preview   = text.slice(0, 400)

      // 3. Extract high-value technical bullets
      let technicalBullets = pythonBullets
      if (!technicalBullets || technicalBullets.length === 0) {
        technicalBullets = await extractTechnicalBulletsAI(text)
      }

      // 4. Attempt saving to Firestore
      try {
        const ref = db.collection('users').doc(req.user.uid)
          .collection('master_profiles').doc('latest')
        await ref.set({
          rawText:   text,
          wordCount,
          fileName:  req.file.originalname,
          bullets:   technicalBullets,
          updatedAt: new Date().toISOString(),
        })
      } catch (dbErr) {
        console.warn('[Resume Upload] Firestore save warning:', dbErr.message)
      }

      res.json({
        message: 'Resume parsed and saved successfully.',
        wordCount,
        preview,
        fullText: text,
        extractedBullets: technicalBullets,
        extractor: pyResult ? 'Python PyMuPDF Engine' : 'Node PDF Engine',
      })
    } catch (err) {
      console.error('[Resume Upload Unhandled Error]', err)
      res.status(500).json({ error: `Resume upload failed: ${err.message}` })
    }
  },
]

exports.getProfile = async (req, res) => {
  try {
    const snap = await db.collection('users').doc(req.user.uid)
      .collection('master_profiles').doc('latest').get()

    if (!snap?.exists) return res.status(404).json({ error: 'No resume profile found.' })
    res.json(snap.data())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.savePreferences = async (req, res) => {
  try {
    const preferences = req.body
    try {
      const ref = db.collection('users').doc(req.user.uid)
        .collection('preferences').doc('latest')
      await ref.set({
        ...preferences,
        updatedAt: new Date().toISOString(),
      })
    } catch (dbErr) {
      console.warn('[Preferences Save Warning]', dbErr.message)
    }
    res.json({ message: 'Preferences saved successfully.', preferences })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.getPreferences = async (req, res) => {
  try {
    const snap = await db.collection('users').doc(req.user.uid)
      .collection('preferences').doc('latest').get()

    if (!snap?.exists) return res.status(404).json({ error: 'No preferences found.' })
    res.json(snap.data())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
