import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import GlassCard from '../ui/GlassCard'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const cardVariants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const STATS = [
  { label: 'Jobs Matched',     value: '24',   sub: '+3 today',     color: 'var(--primary)', icon: '🔍' },
  { label: 'Resume Score',     value: '87%',  sub: 'ATS optimized', color: 'var(--success)',  icon: '📄' },
  { label: 'Interview Readiness', value: '72%', sub: '2 sessions done', color: 'var(--accent)', icon: '🎯' },
  { label: 'Applications',     value: '6',    sub: '2 in review',   color: 'var(--accent-warm)', icon: '📬' },
]

const QUICK_ACTIONS = [
  { title: 'Tailor Your Resume',   desc: 'AI rewrites bullets to match a job',   icon: '✨', path: '/tailor',    color: 'var(--primary)' },
  { title: 'Browse Jobs',          desc: 'Discover roles scored for your profile', icon: '🔍', path: '/jobs',      color: 'var(--accent)' },
  { title: 'Practice Interview',   desc: 'Get graded on STAR responses',          icon: '🎯', path: '/coach',     color: 'var(--accent-warm)' },
]

export default function DashboardHome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.displayName?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-wrapper">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '36px' }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px', letterSpacing: '0.04em' }}>
          {greeting} 👋
        </p>
        <h1 style={{ marginBottom: '8px' }}>
          Welcome back, <span className="gradient-text">{displayName}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Here's your career acceleration overview.
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}
      >
        {STATS.map((stat) => (
          <motion.div key={stat.label} variants={cardVariants}>
            <GlassCard style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>{stat.icon}</span>
                <span style={{
                  background: `${stat.color}18`, color: stat.color, fontSize: '0.7rem',
                  padding: '3px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600,
                }}>
                  {stat.sub}
                </span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ marginBottom: '12px' }}
      >
        <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
          Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.5 }}
            >
              <GlassCard glow style={{ cursor: 'pointer', padding: '22px' }} onClick={() => navigate(action.path)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: `${action.color}18`, border: `1px solid ${action.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                  }}>
                    {action.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '3px' }}>{action.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{action.desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: action.color, fontSize: '1.1rem' }}>→</div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Upload prompt if no resume */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ marginTop: '24px' }}
      >
        <GlassCard style={{
          background: 'linear-gradient(135deg, var(--primary-subtle), var(--accent-subtle))',
          border: '1px dashed var(--border-hover)',
          textAlign: 'center', cursor: 'pointer', padding: '32px',
        }} onClick={() => navigate('/tailor')}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📄</div>
          <h4 style={{ marginBottom: '6px', color: 'var(--primary-light)' }}>Upload Your Master Resume</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 16px' }}>
            Drag and drop your PDF resume to unlock AI-powered tailoring and interview coaching.
          </p>
          <span className="badge badge-primary">Get Started →</span>
        </GlassCard>
      </motion.div>
    </div>
  )
}
