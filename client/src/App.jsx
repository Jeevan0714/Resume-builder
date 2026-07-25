import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import LoginPage    from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import AppShell     from './components/layout/AppShell'
import DashboardHome from './components/dashboard/DashboardHome'

/* ── Page transition wrapper ─────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -12 },
}
const pageTransition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] }

function PageWrap({ children }) {
  return (
    <motion.div
      initial="initial" animate="in" exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  )
}

/* ── Protected route ─────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/login" replace />
}

/* ── Public route (redirect if authed) ──────────────────── */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return !user ? children : <Navigate to="/dashboard" replace />
}

/* ── Loading screen ──────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', flexDirection: 'column', gap: '16px' }}>
      <motion.div
        style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}
        animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        ⚡
      </motion.div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading CareerAI…</div>
    </div>
  )
}

/* ── Placeholder pages ───────────────────────────────────── */
function ComingSoon({ title, icon, color }) {
  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '16px', filter: `drop-shadow(0 0 20px ${color})` }}>{icon}</div>
        <h2 style={{ marginBottom: '10px' }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)' }}>This module is being built. Coming in the next phase! 🚧</p>
        <div style={{ marginTop: '20px' }}>
          <span className="badge badge-primary">Phase 3-5</span>
        </div>
      </motion.div>
    </div>
  )
}

/* ── App Router ──────────────────────────────────────────── */
function AppRouter() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><PageWrap><LoginPage /></PageWrap></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><PageWrap><RegisterPage /></PageWrap></PublicRoute>} />

        {/* Protected – inside AppShell */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/dashboard" element={<PageWrap><DashboardHome /></PageWrap>} />
          <Route path="/jobs"   element={<PageWrap><ComingSoon title="Job Intelligence" icon="🔍" color="var(--accent)" /></PageWrap>} />
          <Route path="/tailor" element={<PageWrap><ComingSoon title="Resume Tailor" icon="✨" color="var(--primary)" /></PageWrap>} />
          <Route path="/coach"  element={<PageWrap><ComingSoon title="Interview Coach" icon="🎯" color="var(--accent-warm)" /></PageWrap>} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      {/* Global noise overlay */}
      <div className="noise-overlay" />
    </AuthProvider>
  )
}
