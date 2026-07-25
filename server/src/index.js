require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const helmet  = require('helmet')

const authenticateUser = require('./middleware/authMiddleware')
const resumeController = require('./controllers/resumeController')
const scrapeController = require('./controllers/scrapeController')
const tailorController = require('./controllers/tailorController')
const coachController  = require('./controllers/coachController')

const app  = express()
const PORT = process.env.PORT || 5000

/* ── Global Middleware ─────────────────────────────────── */
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))

/* ── Health check ──────────────────────────────────────── */
app.get('/health', (_, res) => res.json({ status: 'OK', ts: new Date().toISOString() }))

/* ── Protected Routes ──────────────────────────────────── */
app.use('/api', authenticateUser)

// Resume
app.post('/api/resume/upload', resumeController.upload)
app.get( '/api/resume/profile', resumeController.getProfile)

// Jobs
app.get('/api/jobs/feed', scrapeController.getFeed)

// Tailor
app.post('/api/resume/tailor', tailorController.tailor)

// Coach
app.post('/api/coach/session',  coachController.startSession)
app.post('/api/coach/respond',  coachController.respond)

/* ── Error handler ─────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('[Server Error]', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => console.log(`🚀 CareerAI Server running on http://localhost:${PORT}`))
