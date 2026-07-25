import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import ParticleField from '../three/ParticleField'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden:   { opacity: 0, y: 20 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await loginWithEmail(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setErrors({ submit: 'Invalid email or password. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setErrors({ submit: 'Google sign-in failed. Please try again.' })
    } finally {
      setGLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Left – visual panel */}
      <div className="auth-left">
        <ParticleField variant="auth" />
        <motion.div
          className="auth-hero-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
          <p className="auth-hero-tagline">AI-Powered Career Platform</p>
          <h1 style={{ fontSize: 'clamp(1.8rem,3vw,2.8rem)', marginBottom: '20px' }}>
            Accelerate Your<br />
            <span className="gradient-text">Career Journey</span>
          </h1>
          <p style={{ maxWidth: '380px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Smart resume tailoring, AI-powered job matching, and real-time interview coaching — all in one platform.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
            {['Resume Tailor', 'Job Intelligence', 'Interview Coach'].map((f) => (
              <span key={f} className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{f}</span>
            ))}
          </div>
        </motion.div>

        {/* Floating glowing orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '8%', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </div>

      {/* Right – auth form */}
      <div className="auth-right">
        <div className="auth-card">
          <motion.div
            className="auth-card-inner"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants} style={{ marginBottom: '28px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 4px 14px var(--primary-glow)' }}>⚡</div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>CareerAI</span>
              </div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Welcome back</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to continue your journey</p>
            </motion.div>

            {/* Google button */}
            <motion.div variants={itemVariants}>
              <button
                className="btn-google"
                onClick={handleGoogle}
                disabled={gLoading}
                style={{ marginBottom: '20px', opacity: gLoading ? 0.7 : 1 }}
              >
                {gLoading ? (
                  <span style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                )}
                Continue with Google
              </button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="divider" style={{ marginBottom: '20px' }}>or sign in with email</div>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <motion.div variants={itemVariants} className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Email</label>
                <input
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </motion.div>

              <motion.div variants={itemVariants} className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Password</label>
                <input
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }) }}
                />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </motion.div>

              <AnimatePresence>
                {errors.submit && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ background: 'var(--danger-subtle)', border: '1px solid hsla(0,84%,62%,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', color: 'var(--danger)', fontSize: '0.85rem' }}
                  >
                    {errors.submit}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  className={`btn btn-primary btn-lg btn-full ${loading ? 'btn-loading' : ''}`}
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? (
                    <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Signing in…</>
                  ) : 'Sign In →'}
                </motion.button>
              </motion.div>
            </form>

            <motion.p variants={itemVariants} style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                Create one free
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Noise overlay */}
      <div className="noise-overlay" />
    </div>
  )
}
