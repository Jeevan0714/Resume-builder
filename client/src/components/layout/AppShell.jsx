import { useState } from 'react'
import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
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
          <Outlet />
        </div>
      </motion.main>
    </div>
  )
}
