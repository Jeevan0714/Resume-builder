import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { id: 'dashboard',  icon: '⚡', label: 'Dashboard',       path: '/dashboard' },
  { id: 'jobs',       icon: '🔍', label: 'Job Intelligence', path: '/jobs' },
  { id: 'tailor',     icon: '✨', label: 'Resume Tailor',    path: '/tailor' },
  { id: 'coach',      icon: '🎯', label: 'Interview Coach',  path: '/coach' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout }  = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleNav = (path) => navigate(path)

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <motion.div className="sidebar-logo-icon" whileHover={{ scale: 1.08, rotate: 5 }}>
          ⚡
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="sidebar-logo-text"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.25 }}
            >
              <span className="gradient-text">CareerAI</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          style={{
            marginLeft: 'auto', background: 'var(--primary-subtle)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', width: 28, height: 28, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem',
            flexShrink: 0,
          }}
        >
          {collapsed ? '›' : '‹'}
        </motion.button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          const active = location.pathname.startsWith(item.path)
          return (
            <motion.div
              key={item.id}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="nav-icon">{item.icon}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden' }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && (
                <motion.div
                  layoutId="active-indicator"
                  style={{
                    position: 'absolute', right: 10, width: 6, height: 6,
                    borderRadius: '50%', background: 'var(--primary-light)',
                    boxShadow: '0 0 8px var(--primary-glow)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', borderRadius: 'var(--radius-md)', transition: 'background 0.2s', cursor: 'pointer' }}
          onClick={() => { if (window.confirm('Sign out?')) logout().then(() => navigate('/login')) }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: 'white',
          }}>
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ overflow: 'hidden', minWidth: 0 }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.displayName || 'User'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
