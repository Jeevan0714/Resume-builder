import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import GlassCard from '../ui/GlassCard'
import MatchScore from '../ui/MatchScore'
import { SkeletonJobCard } from '../ui/SkeletonLoader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const FILTER_TYPES = [
  { label: 'All', value: 'all' },
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const cardVariants = {
  hidden:  { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

function SkillPill({ skill, isMatch }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'inline-flex',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: isMatch ? 'var(--success-subtle)' : 'var(--primary-subtle)',
        color: isMatch ? 'var(--success)' : 'var(--text-muted)',
        border: `1px solid ${isMatch ? 'hsla(142, 71%, 50%, 0.2)' : 'var(--border)'}`,
      }}
    >
      {skill}
    </motion.span>
  )
}

export default function JobIntelligence() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [minScore, setMinScore] = useState(0)
  const [appliedJobs, setAppliedJobs] = useState(new Set())
  const [expandedJob, setExpandedJob] = useState(null)
  const [hasResume, setHasResume] = useState(false)
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [filterType, minScore])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterType !== 'all') params.set('type', filterType)
      if (minScore > 0) params.set('minScore', minScore)

      const res = await axios.get(`${API}/api/jobs/feed?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setJobs(res.data.jobs || [])
      setHasResume(res.data.hasResume || false)
      setFileName(res.data.fileName || '')
    } catch (err) {
      console.error('[Jobs]', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  const handleApply = (job) => {
    const jobId = typeof job === 'string' ? job : job.id
    setAppliedJobs(prev => new Set([...prev, jobId]))

    // Open real company application portal in a new tab if URL exists
    if (job && typeof job === 'object' && job.url) {
      window.open(job.url, '_blank', 'noopener,noreferrer')
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#a855f7', '#22d3ee', '#10b981', '#f472b6'],
    })
  }

  const handleStartInterview = (job, e) => {
    if (e) e.stopPropagation()
    navigate('/coach', {
      state: {
        selectedJob: {
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description,
          skills: job.skills,
        }
      }
    })
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '24px' }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '4px' }}>
          AI-Powered Matching
        </p>
        <h2 style={{ marginBottom: '6px' }}>
          Job <span className="gradient-text">Intelligence</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Roles scored and ranked directly against your uploaded resume profile.
        </p>
      </motion.div>

      {/* Resume Status Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '20px' }}>
        {hasResume ? (
          <GlassCard style={{ padding: '14px 20px', border: '1px solid var(--success-subtle)', background: 'rgba(16, 185, 129, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>📄</span>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>AI Resume Matching Active</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {fileName ? `Scored against ${fileName}` : 'Jobs are ranked and scored against your uploaded resume.'}
                </div>
              </div>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Customized Match</span>
          </GlassCard>
        ) : (
          <GlassCard style={{ padding: '14px 20px', border: '1px solid var(--warning-subtle)', background: 'rgba(245, 158, 11, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--warning)' }}>No Resume Uploaded Yet</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Upload your PDF resume to calculate personalized AI match scores for job openings.
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/tailor')}>
              📄 Upload Resume Now
            </button>
          </GlassCard>
        )}
      </motion.div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{ marginBottom: '24px' }}
      >
        <GlassCard style={{ padding: '16px 20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input
                className="form-input"
                placeholder="Search roles, companies, skills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ height: '40px', fontSize: '0.85rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              🔍 Search
            </button>
          </form>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            {FILTER_TYPES.map((ft) => (
              <button
                key={ft.value}
                className={filterType === ft.value ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                onClick={() => setFilterType(ft.value)}
                style={{ fontSize: '0.75rem', padding: '5px 14px' }}
              >
                {ft.label}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Min Score:</span>
              <input
                type="range" min="0" max="90" step="10" value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                style={{ width: 80, accentColor: 'var(--primary)' }}
              />
              <span style={{ color: 'var(--primary-light)', fontWeight: 700, minWidth: 30 }}>{minScore}%</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Results count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {loading ? 'Scoring jobs…' : `${jobs.length} role${jobs.length !== 1 ? 's' : ''} found`}
        </span>
        <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>
          ⚡ Powered by Gemma AI
        </span>
      </motion.div>

      {/* Job Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonJobCard key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
          <h4 style={{ marginBottom: '6px' }}>No jobs match your criteria</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Try adjusting your filters or search terms.</p>
        </GlassCard>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}
        >
          <AnimatePresence>
            {jobs.map((job) => (
              <motion.div key={job.id} variants={cardVariants} layout>
                <GlassCard
                  glow={job.matchScore >= 75}
                  style={{ cursor: 'pointer', padding: '22px', position: 'relative', overflow: 'hidden' }}
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                >
                  {/* Applied badge */}
                  {appliedJobs.has(job.id) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        position: 'absolute', top: 12, right: 12,
                        background: 'var(--success)', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      ✓ Applied
                    </motion.div>
                  )}

                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--radius-md)',
                        background: 'var(--primary-subtle)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem', flexShrink: 0,
                      }}>
                        {job.logo}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2, marginBottom: '3px' }}>{job.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{job.company} · {job.location}</div>
                      </div>
                    </div>
                    <MatchScore score={job.matchScore} size={56} strokeWidth={4} />
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--accent)' }}>💰 {job.salary}</span>
                    <span>📋 {job.type}</span>
                    <span className="badge badge-ghost" style={{ fontSize: '0.65rem', marginLeft: 'auto', border: '1px solid var(--border)' }}>
                      🌐 {job.source || 'Scraped Job'}
                    </span>
                  </div>

                  {/* Description (expandable) */}
                  <AnimatePresence>
                    {expandedJob === job.id && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.6, overflow: 'hidden' }}
                      >
                        {job.description}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Skills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: expandedJob === job.id ? '14px' : 0 }}>
                    {job.skills.slice(0, expandedJob === job.id ? 20 : 4).map((skill) => (
                      <SkillPill key={skill} skill={skill} isMatch={job.matchScore >= 60} />
                    ))}
                    {expandedJob !== job.id && job.skills.length > 4 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '3px 6px' }}>+{job.skills.length - 4}</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, fontSize: '0.78rem' }}
                      onClick={(e) => handleStartInterview(job, e)}
                    >
                      🎙️ Practice Interview
                    </button>
                    {!appliedJobs.has(job.id) ? (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.78rem' }}
                        onClick={(e) => { e.stopPropagation(); handleApply(job) }}
                      >
                        🚀 Apply
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                        ✓ Applied
                      </span>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
