import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import { Radar } from 'react-chartjs-2'
import confetti from 'canvas-confetti'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import GlassCard from '../ui/GlassCard'
import MatchScore from '../ui/MatchScore'
import { SkeletonChatBubble, SkeletonJobCard } from '../ui/SkeletonLoader'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const bubbleVariants = {
  initial: { opacity: 0, y: 16, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    { opacity: 0, y: -8, scale: 0.96 },
}

function ChatBubble({ message, isUser, isLatest }) {
  return (
    <motion.div
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '14px',
      }}
    >
      <div style={{
        maxWidth: '75%',
        padding: '14px 18px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser
          ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
          : 'var(--bg-elevated)',
        border: isUser ? 'none' : '1px solid var(--border)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: '0.88rem',
        lineHeight: 1.7,
        boxShadow: isUser ? '0 4px 16px var(--primary-glow)' : 'var(--shadow-sm)',
        whiteSpace: 'pre-wrap',
      }}>
        {!isUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.9rem' }}>🎯</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-warm)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              AI Coach
            </span>
          </div>
        )}
        {message}
      </div>
    </motion.div>
  )
}

function ScoreRadar({ scores }) {
  if (!scores || scores.length === 0) return null
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  const data = {
    labels: ['Clarity', 'Specificity', 'Impact', 'Relevance'],
    datasets: [{
      data: [
        Math.min(avg + 5, 100),
        Math.min(avg - 3, 100),
        Math.min(avg + 2, 100),
        Math.min(avg - 1, 100),
      ],
      backgroundColor: 'hsla(258, 89%, 66%, 0.15)',
      borderColor: 'var(--primary)',
      borderWidth: 2,
      pointBackgroundColor: 'var(--accent)',
      pointBorderColor: 'var(--primary)',
      pointRadius: 4,
    }],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { display: false, stepSize: 25 },
        pointLabels: { color: 'var(--text-muted)', font: { size: 11, family: 'Outfit' } },
        grid: { color: 'var(--border)' },
        angleLines: { color: 'var(--border)' },
      },
    },
  }
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
      <Radar data={data} options={options} />
    </motion.div>
  )
}

export default function InterviewCoach() {
  const { getToken } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('setup') // 'setup' | 'session' | 'summary'
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState('')

  const [availableJobs, setAvailableJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState(null)

  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [sending, setSending] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [scores, setScores] = useState([])
  const [avgScore, setAvgScore] = useState(null)
  const [error, setError] = useState('')

  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    fetchUserResume()
    if (location.state?.selectedJob) {
      const sj = location.state.selectedJob
      setJobTitle(sj.jobTitle || '')
      setCompany(sj.company || '')
      setJobDescription(sj.jobDescription || '')
    } else {
      fetchJobsFeed()
    }
  }, [location.state])

  const fetchUserResume = async () => {
    try {
      const token = await getToken()
      const res = await axios.get(`${API}/api/resume/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.data?.rawText) {
        setResumeText(res.data.rawText)
      }
    } catch (_) {}
  }

  const fetchJobsFeed = async () => {
    setLoadingJobs(true)
    try {
      const token = await getToken()
      const res = await axios.get(`${API}/api/jobs/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const list = res.data.jobs || []
      setAvailableJobs(list)
      if (list.length > 0 && !jobTitle) {
        selectJob(list[0])
      }
    } catch (err) {
      console.error('[Coach Jobs Feed]', err)
    } finally {
      setLoadingJobs(false)
    }
  }

  const selectJob = (job) => {
    setSelectedJobId(job.id)
    setJobTitle(job.title)
    setCompany(job.company)
    setJobDescription(job.description)
    setError('')
  }

  const startSession = async () => {
    if (!jobTitle.trim()) {
      setError('Please select a job from Job Intelligence.')
      return
    }
    setSending(true)
    setError('')
    try {
      const token = await getToken()
      const res = await axios.post(`${API}/api/coach/session`, {
        jobTitle, company, jobDescription, resumeText,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages([{ role: 'assistant', content: res.data.message }])
      setQuestionCount(res.data.questionCount || 1)
      setPhase('session')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session.')
    } finally {
      setSending(false)
    }
  }

  const sendAnswer = async () => {
    if (!userInput.trim() || sending) return
    const answer = userInput.trim()
    setUserInput('')
    setMessages(prev => [...prev, { role: 'user', content: answer }])
    setSending(true)
    try {
      const token = await getToken()
      const res = await axios.post(`${API}/api/coach/respond`, { answer }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message }])
      setQuestionCount(res.data.questionCount || questionCount + 1)
      if (res.data.lastScore) {
        setScores(prev => [...prev, res.data.lastScore])
        if (res.data.lastScore >= 80) {
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 }, colors: ['#a855f7', '#22d3ee', '#10b981'] })
        }
      }
      if (res.data.avgScore) setAvgScore(res.data.avgScore)
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Try again.' }])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendAnswer()
    }
  }

  const endSession = () => {
    setPhase('summary')
  }

  const resetSession = () => {
    setPhase('setup')
    setMessages([])
    setScores([])
    setAvgScore(null)
    setQuestionCount(0)
    setUserInput('')
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
          Job Intelligence AI Practice
        </p>
        <h2 style={{ marginBottom: '6px' }}>
          Interview <span className="gradient-text-warm">Coach</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Practice interactive mock interviews for roles matched by Job Intelligence.
        </p>
      </motion.div>

      {/* Setup Phase */}
      {phase === 'setup' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Selected Job Banner */}
          {jobTitle && (
            <GlassCard glow style={{ padding: '20px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(34,211,238,0.05))', border: '1px solid var(--primary-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>
                    🎯 Selected Target Role
                  </div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '2px' }}>
                    {jobTitle} {company ? <span style={{ color: 'var(--text-muted)' }}>at {company}</span> : ''}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 650, margin: 0 }}>
                    {jobDescription ? `${jobDescription.slice(0, 160)}…` : 'AI will generate questions tailored to this role.'}
                  </p>
                </div>
                <button
                  className={`btn btn-primary btn-lg ${sending ? 'btn-loading' : ''}`}
                  onClick={startSession}
                  disabled={sending}
                  style={{ minWidth: 200 }}
                >
                  {sending ? '🎯 Starting Session…' : '🚀 Start Mock Interview →'}
                </button>
              </div>
            </GlassCard>
          )}

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </motion.p>
          )}

          {/* Job Selector Grid from Job Intelligence */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span>💼</span> Pick a Role from Job Intelligence
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/jobs')}>
                View All Jobs in Intelligence →
              </button>
            </div>

            {loadingJobs ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {[1, 2, 3].map(i => <SkeletonJobCard key={i} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {availableJobs.map((job) => (
                  <GlassCard
                    key={job.id}
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      border: selectedJobId === job.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selectedJobId === job.id ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
                    }}
                    onClick={() => selectJob(job)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{job.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{job.company}</div>
                      </div>
                      <MatchScore score={job.matchScore} size={42} strokeWidth={3} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {job.description}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Info cards */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '32px' }}>
            {[
              { icon: '💬', title: 'Natural Chat', desc: 'AI asks one question at a time, tailored to your job choice', color: 'var(--primary)' },
              { icon: '📊', title: 'STAR Scoring', desc: 'Each answer scored on Clarity, Specificity, Impact, Relevance', color: 'var(--accent)' },
              { icon: '🎯', title: 'Real-time Coaching', desc: 'Instant feedback on how to sharpen your response', color: 'var(--accent-warm)' },
            ].map((item) => (
              <GlassCard key={item.title} style={{ padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px', filter: `drop-shadow(0 0 8px ${item.color})` }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </GlassCard>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Session Phase - Chat UI */}
      {phase === 'session' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', height: 'calc(100vh - 240px)', minHeight: 500 }}>
            {/* Chat area */}
            <GlassCard style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Chat header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {jobTitle} {company ? `at ${company}` : ''}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Question {questionCount} · {scores.length} scored
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={endSession} style={{ fontSize: '0.75rem' }}>
                  End Session
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <ChatBubble
                      key={i}
                      message={msg.content}
                      isUser={msg.role === 'user'}
                      isLatest={i === messages.length - 1}
                    />
                  ))}
                </AnimatePresence>
                {sending && <SkeletonChatBubble />}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex', gap: '10px', alignItems: 'flex-end',
              }}>
                <textarea
                  ref={textareaRef}
                  className="form-input"
                  placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  style={{ resize: 'none', flex: 1 }}
                  disabled={sending}
                />
                <button
                  className="btn btn-primary"
                  onClick={sendAnswer}
                  disabled={!userInput.trim() || sending}
                  style={{ height: 48, flexShrink: 0 }}
                >
                  {sending ? '…' : '→'}
                </button>
              </div>
            </GlassCard>

            {/* Sidebar: Scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <GlassCard style={{ padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  Average Score
                </div>
                <div style={{
                  fontSize: '2.5rem', fontWeight: 900, lineHeight: 1,
                  color: avgScore !== null
                    ? avgScore >= 75 ? 'var(--success)' : avgScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                    : 'var(--text-disabled)',
                }}>
                  {avgScore !== null ? avgScore : '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {scores.length > 0 ? `from ${scores.length} answer${scores.length !== 1 ? 's' : ''}` : 'awaiting scores'}
                </div>
              </GlassCard>

              {/* Radar chart */}
              {scores.length > 0 && (
                <GlassCard style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px', textAlign: 'center' }}>
                    Performance Radar
                  </div>
                  <ScoreRadar scores={scores} />
                </GlassCard>
              )}

              {/* Recent scores */}
              {scores.length > 0 && (
                <GlassCard style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '10px' }}>
                    Recent Scores
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {scores.slice(-5).map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          fontSize: '0.8rem', padding: '6px 10px',
                          background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>Q{scores.indexOf(s) + 1}</span>
                        <span style={{
                          fontWeight: 800,
                          color: s >= 75 ? 'var(--success)' : s >= 50 ? 'var(--warning)' : 'var(--danger)',
                        }}>
                          {s}/100
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Phase */}
      {phase === 'summary' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <GlassCard glow style={{ padding: '40px' }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: '4rem', marginBottom: '16px' }}
            >
              {avgScore && avgScore >= 75 ? '🏆' : avgScore && avgScore >= 50 ? '👏' : '💪'}
            </motion.div>
            <h3 style={{ marginBottom: '8px' }}>Session Complete!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
              You answered {scores.length} question{scores.length !== 1 ? 's' : ''} for {jobTitle} {company ? `at ${company}` : ''}
            </p>

            <div style={{
              fontSize: '3rem', fontWeight: 900, lineHeight: 1, marginBottom: '8px',
              color: avgScore !== null
                ? avgScore >= 75 ? 'var(--success)' : avgScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                : 'var(--text-disabled)',
            }}>
              {avgScore !== null ? `${avgScore}%` : '—'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Overall Score</div>

            {scores.length > 0 && (
              <div style={{ maxWidth: 250, margin: '0 auto 24px' }}>
                <ScoreRadar scores={scores} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={resetSession}>
                🔄 New Session
              </button>
              <button className="btn btn-primary" onClick={() => { resetSession(); window.scrollTo(0, 0) }}>
                🎯 Practice Again
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}
