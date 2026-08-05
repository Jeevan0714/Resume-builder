import { useState, useRef, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import GlassCard from '../ui/GlassCard'
import MatchScore from '../ui/MatchScore'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function ResumeTailor() {
  const { getToken } = useAuth()
  const location = useLocation()

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadError, setUploadError] = useState('')

  // Tailor state
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [bullets, setBullets] = useState('')
  const [tailoring, setTailoring] = useState(false)
  const [result, setResult] = useState(null)
  const [accepted, setAccepted] = useState(new Set())
  const [error, setError] = useState('')
  const [step, setStep] = useState('upload') // 'upload' | 'tailor' | 'result'

  const resultRef = useRef(null)

  // Auto-load saved master resume & handle job navigation
  useEffect(() => {
    fetchExistingProfile()
    if (location.state?.selectedJob) {
      const sj = location.state.selectedJob
      setJobTitle(sj.jobTitle || '')
      setCompany(sj.company || '')
      setJobDescription(sj.jobDescription || '')
    }
  }, [location.state])

  const fetchExistingProfile = async () => {
    try {
      const token = await getToken()
      const res = await axios.get(`${API}/api/resume/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data && res.data.rawText) {
        setUploadResult({
          wordCount: res.data.wordCount || res.data.rawText.split(/\s+/).length,
          preview: res.data.rawText.slice(0, 300),
          fileName: res.data.fileName || 'Saved Resume.pdf',
          fullText: res.data.rawText,
          extractedBullets: res.data.bullets || [],
        })
        if (Array.isArray(res.data.bullets) && res.data.bullets.length > 0) {
          setBullets(res.data.bullets.join('\n'))
        }
        setStep('tailor')
      }
    } catch (_) {
      // Stay on upload step if no profile exists yet
    }
  }

  // PDF Upload
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const token = await getToken()
      const formData = new FormData()
      formData.append('pdfFile', file)
      const res = await axios.post(`${API}/api/resume/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 45000,
      })
      setUploadResult(res.data)

      // Use AI-extracted technical bullets if available, otherwise fallback line parser
      if (Array.isArray(res.data.extractedBullets) && res.data.extractedBullets.length > 0) {
        setBullets(res.data.extractedBullets.join('\n'))
      } else if (res.data.fullText) {
        const extractedBullets = res.data.fullText
          .split('\n')
          .map(l => l.trim().replace(/^[•\-\*\d+\.]\s*/, ''))
          .filter(l => l.length > 20 && !l.includes('@') && !l.toLowerCase().includes('phone') && !l.toLowerCase().includes('email') && !l.toLowerCase().includes('don bosco'))
        if (extractedBullets.length > 0) {
          setBullets(extractedBullets.slice(0, 10).join('\n'))
        }
      }

      setStep('tailor')
    } catch (err) {
      console.error('[Resume Upload Error]', err)
      const errMsg = err.response?.data?.error || (err.code === 'ECONNABORTED' ? 'Upload timed out. Please try uploading again.' : err.message || 'Upload failed.')
      setUploadError(errMsg)
    } finally {
      setUploading(false)
    }
  }, [getToken])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  // Tailor request
  const handleTailor = async () => {
    if (!jobDescription.trim() || !bullets.trim()) {
      setError('Please provide both a job description and resume bullets.')
      return
    }
    setTailoring(true)
    setError('')
    setResult(null)
    try {
      const token = await getToken()
      const bulletList = bullets.split('\n').map(b => b.trim()).filter(Boolean)
      const res = await axios.post(`${API}/api/resume/tailor`, {
        jobDescription, bullets: bulletList, jobTitle, company,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setResult(res.data)
      setStep('result')
      setAccepted(new Set())
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    } catch (err) {
      setError(err.response?.data?.error || 'Tailoring failed. Try again.')
    } finally {
      setTailoring(false)
    }
  }

  const toggleAccept = (idx) => {
    setAccepted(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const copyAccepted = () => {
    if (!result) return
    const lines = result.tailored
      .filter((_, i) => accepted.has(i))
      .map(b => `• ${b.rewritten}`)
      .join('\n')
    navigator.clipboard.writeText(lines)
  }

  const downloadTailoredResume = () => {
    if (!result) return
    const title = jobTitle || 'Tailored_Resume'
    const content = `=====================================================
TAILORED RESUME - ${title.toUpperCase()} ${company ? `AT ${company.toUpperCase()}` : ''}
=====================================================

TARGET ROLE: ${jobTitle}
COMPANY: ${company}
ATS MATCH IMPROVEMENT: +${result.scoreImprovement || 0}%

-----------------------------------------------------
OPTIMIZED RESUME BULLETS:
-----------------------------------------------------
${result.tailored.map((b, i) => `${i + 1}. ${b.rewritten}`).join('\n\n')}

-----------------------------------------------------
WHAT AI ADDED & ENHANCED:
-----------------------------------------------------
${(result.whatAiAdded || []).map(a => `• ${a}`).join('\n')}

-----------------------------------------------------
WHAT YOU MUST LEARN / SKILL GAP ADVICE:
-----------------------------------------------------
${(result.whatYouMustLearn || []).map(l => `• ${l}`).join('\n')}
`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.replace(/\s+/g, '_')}_Tailored_Resume.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '28px' }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '4px' }}>
          ATS Optimization Engine
        </p>
        <h2 style={{ marginBottom: '6px' }}>
          Resume <span className="gradient-text">Tailor</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          AI rewrites your bullets to maximize ATS compatibility for any role.
        </p>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}
      >
        {['upload', 'tailor', 'result'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700,
              background: step === s || (['tailor', 'result'].indexOf(step) >= i)
                ? 'var(--primary)' : 'var(--bg-elevated)',
              color: step === s || (['tailor', 'result'].indexOf(step) >= i)
                ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.3s ease',
            }}>
              {i + 1}
            </div>
            <span style={{
              fontSize: '0.8rem', fontWeight: step === s ? 700 : 500,
              color: step === s ? 'var(--text-primary)' : 'var(--text-muted)',
              textTransform: 'capitalize',
            }}>
              {s}
            </span>
            {i < 2 && <div style={{ width: 40, height: 1, background: 'var(--border)', margin: '0 4px' }} />}
          </div>
        ))}
      </motion.div>

      {/* Upload Step */}
      {step === 'upload' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard style={{ padding: '32px', marginBottom: '20px' }}>
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: isDragActive ? 'var(--primary-subtle)' : 'transparent',
              }}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                style={{ fontSize: '3rem', marginBottom: '12px' }}
              >
                {uploading ? '⏳' : '📄'}
              </motion.div>
              <h4 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>
                {uploading ? 'Parsing your resume…' : isDragActive ? 'Drop your PDF here!' : 'Upload Your Master Resume'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
                Drag and drop your PDF, or click to browse. Max 10MB.
              </p>
              {uploadError && <p style={{ color: 'var(--danger)', marginTop: '12px', fontSize: '0.85rem' }}>{uploadError}</p>}
            </div>
          </GlassCard>

          {/* Skip upload */}
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep('tailor')}>
              Skip — I'll paste my bullets manually →
            </button>
          </div>
        </motion.div>
      )}

      {/* Tailor Step */}
      {step === 'tailor' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Upload success banner */}
          {uploadResult && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '20px' }}>
              <GlassCard glow style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.3rem' }}>📄</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      Master Resume Active: {uploadResult.fileName || 'Saved Resume.pdf'} ({uploadResult.wordCount} words)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Technical project bullets automatically extracted for AI tailoring.
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep('upload')} style={{ fontSize: '0.75rem' }}>
                  🔄 Re-upload Different Resume
                </button>
              </GlassCard>
            </motion.div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Left: Job info */}
            <GlassCard style={{ padding: '24px' }}>
              <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🎯</span> Target Job
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input className="form-input" placeholder="e.g. Senior Frontend Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-input" placeholder="e.g. Vercel" value={company} onChange={e => setCompany(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea
                  className="form-input"
                  placeholder="Paste the full job description here…"
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  rows={8}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </GlassCard>

            {/* Right: Bullets */}
            <GlassCard style={{ padding: '24px' }}>
              <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>📝</span> Your Resume Bullets
              </h4>
              <div className="form-group">
                <label className="form-label">Bullet Points (one per line)</label>
                <textarea
                  className="form-input"
                  placeholder={"Built responsive dashboards using React and TypeScript\nReduced API latency by 40% through caching\nLed a team of 4 engineers on the migration project"}
                  value={bullets}
                  onChange={e => setBullets(e.target.value)}
                  rows={12}
                  style={{ resize: 'vertical', lineHeight: 1.8 }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {bullets.split('\n').filter(b => b.trim()).length} bullet{bullets.split('\n').filter(b => b.trim()).length !== 1 ? 's' : ''} entered
              </div>
            </GlassCard>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '12px', textAlign: 'center' }}>
              {error}
            </motion.p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
            <button className="btn btn-ghost" onClick={() => setStep('upload')}>← Back</button>
            <button
              className={`btn btn-primary btn-lg ${tailoring ? 'btn-loading' : ''}`}
              onClick={handleTailor}
              disabled={tailoring}
            >
              {tailoring ? '✨ AI is rewriting…' : '✨ Tailor with AI'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Result Step */}
      {step === 'result' && result && (
        <motion.div ref={resultRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Score improvement banner */}
          <GlassCard glow style={{ padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <MatchScore score={Math.min(100, 70 + (result.scoreImprovement || 0))} size={64} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  ATS Score Improved by{' '}
                  <span style={{ color: 'var(--success)' }}>+{result.scoreImprovement || 0}%</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {result.tailored?.length} bullet{result.tailored?.length !== 1 ? 's' : ''} optimized
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(result.topKeywordsInjected || []).map(kw => (
                <motion.span
                  key={kw}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="badge badge-success"
                >
                  + {kw}
                </motion.span>
              ))}
            </div>
          </GlassCard>

          {/* ATS Advice Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* What AI Added */}
            <GlassCard style={{ padding: '20px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.04)' }}>
              <h4 style={{ color: 'var(--success)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                <span>🟢</span> What AI Added & Enhanced
              </h4>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {(result.whatAiAdded && result.whatAiAdded.length > 0 ? result.whatAiAdded : [
                  'Quantified hardware & physical design metrics',
                  'Injected target ATS keywords for target role',
                  'Strengthened technical action verbs',
                ]).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                ))}
              </ul>
            </GlassCard>

            {/* What You Must Learn */}
            <GlassCard style={{ padding: '20px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.04)' }}>
              <h4 style={{ color: 'var(--warning)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                <span>💡</span> What You Must Learn (Skill Gap Advice)
              </h4>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {(result.whatYouMustLearn && result.whatYouMustLearn.length > 0 ? result.whatYouMustLearn : [
                  'Review specialized domain concepts in the job description',
                  'Study company specific interview methodologies',
                ]).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                ))}
              </ul>
            </GlassCard>
          </div>

          {/* Side-by-side diff */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {(result.tailored || []).map((item, i) => (
              <motion.div key={i} variants={itemVariants} style={{ marginBottom: '12px' }}>
                <GlassCard style={{
                  padding: '18px',
                  borderLeft: `3px solid ${accepted.has(i) ? 'var(--success)' : 'var(--primary)'}`,
                  transition: 'border-color 0.3s ease',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Original */}
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-disabled)', marginBottom: '6px', letterSpacing: '0.1em' }}>
                        Original
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {item.original}
                      </p>
                    </div>

                    {/* Rewritten */}
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px', letterSpacing: '0.1em' }}>
                        AI Optimized ✨
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>
                        {item.rewritten}
                      </p>
                      {item.keywordsAdded && item.keywordsAdded.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {item.keywordsAdded.map(kw => (
                            <span key={kw} className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accept button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      className={`btn btn-sm ${accepted.has(i) ? 'btn-accent' : 'btn-ghost'}`}
                      onClick={() => toggleAccept(i)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {accepted.has(i) ? '✓ Accepted' : 'Accept'}
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => { setStep('tailor'); setResult(null) }}>
              ← Edit & Re-Tailor
            </button>
            <button
              className="btn btn-secondary"
              onClick={downloadTailoredResume}
            >
              📥 Download Tailored Resume
            </button>
            <button
              className="btn btn-primary"
              disabled={accepted.size === 0}
              onClick={copyAccepted}
            >
              📋 Copy {accepted.size} Accepted Bullet{accepted.size !== 1 ? 's' : ''}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
