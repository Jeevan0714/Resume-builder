import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', style = {}, glow = false, onClick }) {
  return (
    <motion.div
      className={`glass-card ${glow ? 'glow-border' : ''} ${className}`}
      style={{ padding: '24px', ...style }}
      whileHover={{ y: -3, boxShadow: glow ? '0 0 40px var(--primary-glow), var(--shadow-lg)' : 'var(--shadow-glow)' }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
