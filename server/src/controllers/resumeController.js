const multer = require('multer')
const pdfParse = require('pdf-parse')
const { db } = require('../config/firebase')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

exports.upload = [
  upload.single('pdfFile'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' })

      const data = await pdfParse(req.file.buffer)
      const text = data.text.trim()

      if (!text) return res.status(422).json({ error: 'Could not extract text from PDF. Ensure it is text-based.' })

      const wordCount = text.split(/\s+/).length
      const preview   = text.slice(0, 400)

      // Save to Firestore
      const ref = db.collection('users').doc(req.user.uid)
        .collection('master_profiles').doc('latest')
      await ref.set({
        rawText:   text,
        wordCount,
        fileName:  req.file.originalname,
        updatedAt: new Date().toISOString(),
      })

      res.json({ message: 'Resume parsed and saved.', wordCount, preview })
    } catch (err) {
      console.error('[Resume Upload]', err)
      res.status(500).json({ error: 'Failed to parse resume.' })
    }
  },
]

exports.getProfile = async (req, res) => {
  try {
    const snap = await db.collection('users').doc(req.user.uid)
      .collection('master_profiles').doc('latest').get()

    if (!snap.exists) return res.status(404).json({ error: 'No resume profile found.' })
    res.json(snap.data())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
