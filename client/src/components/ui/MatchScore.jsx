import { motion } from 'framer-motion'

/**
 * SVG circular progress ring with animated stroke + color coding.
 * score: 0–100 integer
 * size: pixel diameter (default 64)
 */
export default function MatchScore({ score = 0, size = 64, strokeWidth = 5 }) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 75 ? 'var(--success)' :
    score >= 50 ? 'var(--warning)' :
    'var(--danger)'

  const glowColor =
    score >= 75 ? 'hsla(142, 71%, 50%, 0.35)' :
    score >= 50 ? 'hsla(38, 92%, 60%, 0.35)' :
    'hsla(0, 84%, 62%, 0.35)'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
      </svg>
      {/* Center text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <span style={{ fontSize: size * 0.28, fontWeight: 800, color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: size * 0.14, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1 }}>
          %
        </span>
      </motion.div>
    </div>
  )
}
