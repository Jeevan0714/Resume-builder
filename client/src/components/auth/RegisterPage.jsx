import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import ParticleField from '../three/ParticleField'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function RegisterPage() {
  const { registerWithEmail, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name)                          e.name     = 'Full name is required'
    if (!form.email)                         e.email    = 'Email is required'
    if (form.password.length < 6)            e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm)      e.confirm  = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await registerWithEmail(form.email, form.password, form.name)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Try signing in.'
        : 'Registration failed. Please try again.'
      setErrors({ submit: msg })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGLoading(true)
    setErrors({})
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      console.error('[Google Sign-In Error]', err)
      let msg = 'Google sign-in failed. Please try again.'
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Google Sign-In is not enabled in Firebase. Enable it in Firebase Console → Authentication → Sign-in method.'
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'Domain not authorized. Add localhost in Firebase Console → Authentication → Settings → Authorized domains.'
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before finishing.'
      } else if (err.code === 'auth/invalid-api-key' || err.code === 'auth/api-key-not-valid') {
        msg = 'Invalid Firebase API Key in client/.env. Please check VITE_FIREBASE_API_KEY.'
      } else if (err.message) {
        msg = `Google sign-in failed: ${err.message}`
      }
      setErrors({ submit: msg })
    } finally {
      setGLoading(false)
    }
  }

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors({ ...errors, [field]: '' })
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <ParticleField variant="auth" />
        <motion.div
          className="auth-hero-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✨</div>
          <p className="auth-hero-tagline">Join 10,000+ Job Seekers</p>
          <h1 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', marginBottom: '20px' }}>
            Your Dream Job<br />
            <span className="gradient-text-warm">Starts Here</span>
          </h1>
          <p style={{ maxWidth: '380px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Upload your resume once. Let AI tailor it for every job, prepare you for every interview, and track every opportunity.
          </p>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '36px' }}>
            {[['3x', 'More Interviews'], ['87%', 'ATS Pass Rate'], ['2hrs', 'Saved Daily']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>{val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
        <div style={{ position: 'absolute', top: '20%', right: '5%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-warm-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </div>

      {/* Right – form */}
      <div className="auth-right">
        <div className="auth-card">
          <motion.div
            className="auth-card-inner"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 4px 14px var(--primary-glow)' }}>⚡</div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>CareerAI</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Create your account</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Free forever. No credit card needed.</p>
            </motion.div>

            {/* Google */}
            <motion.div variants={itemVariants}>
              <button className="btn-google" onClick={handleGoogle} disabled={gLoading} style={{ marginBottom: '18px', opacity: gLoading ? 0.7 : 1 }}>
                {gLoading
                  ? <span style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  : <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                }
                Continue with Google
              </button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="divider" style={{ marginBottom: '18px' }}>or register with email</div>
            </motion.div>

            <form onSubmit={handleSubmit}>
              <motion.div variants={itemVariants} className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Full Name</label>
                <input className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Jane Smith" value={form.name} onChange={update('name')} />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </motion.div>

              <motion.div variants={itemVariants} className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Email</label>
                <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </motion.div>

              <motion.div variants={itemVariants} className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Password</label>
                <input className={`form-input ${errors.password ? 'error' : ''}`} type="password" placeholder="Min. 6 characters" value={form.password} onChange={update('password')} />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </motion.div>

              <motion.div variants={itemVariants} className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label">Confirm Password</label>
                <input className={`form-input ${errors.confirm ? 'error' : ''}`} type="password" placeholder="Re-enter password" value={form.confirm} onChange={update('confirm')} />
                {errors.confirm && <span className="form-error">{errors.confirm}</span>}
              </motion.div>

              <AnimatePresence>
                {errors.submit && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ background: 'var(--danger-subtle)', border: '1px solid hsla(0,84%,62%,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '14px', color: 'var(--danger)', fontSize: '0.85rem' }}
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
                  {loading
                    ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Creating account…</>
                    : 'Create Free Account →'}
                </motion.button>
              </motion.div>
            </form>

            <motion.p variants={itemVariants} style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in</Link>
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="noise-overlay" />
    </div>
  )
}
