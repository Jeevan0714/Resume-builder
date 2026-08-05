import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'
import axios from 'axios'
import Sidebar from './Sidebar'
import OnboardingModal from '../auth/OnboardingModal'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function AppShell() {
  const { getToken } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [userPreferences, setUserPreferences] = useState(null)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    const hasSeenOnboarding = localStorage.getItem('career_setup_completed')
    try {
      const token = await getToken()
      const res = await axios.get(`${API}/api/user/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data && res.data.targetRoles) {
        setUserPreferences(res.data)
        localStorage.setItem('career_setup_completed', 'true')
      } else if (!hasSeenOnboarding) {
        setShowSetup(true)
      }
    } catch (_) {
      if (!hasSeenOnboarding) {
        setShowSetup(true)
      }
    }
  }

  const handleCloseSetup = () => {
    localStorage.setItem('career_setup_completed', 'true')
    setShowSetup(false)
  }

  const handleSavePreferences = async (preferences) => {
    localStorage.setItem('career_setup_completed', 'true')
    try {
      const token = await getToken()
      await axios.post(`${API}/api/user/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUserPreferences(preferences)
    } catch (err) {
      console.error('[Save Preferences]', err)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onOpenSetup={() => setShowSetup(true)}
      />
      <motion.main
        className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', minHeight: '100vh' }}
      >
        {/* Ambient background gradient */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '60vh',
          background: 'radial-gradient(ellipse at 60% 0%, hsla(258,89%,66%,0.07) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'fixed', bottom: 0, right: 0, width: '50vw', height: '50vh',
          background: 'radial-gradient(ellipse at 100% 100%, hsla(187,96%,55%,0.04) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Outlet context={{ userPreferences, openSetup: () => setShowSetup(true) }} />
        </div>
      </motion.main>

      <OnboardingModal
        isOpen={showSetup}
        onClose={handleCloseSetup}
        onSave={handleSavePreferences}
        initialData={userPreferences}
      />
    </div>
  )
}
