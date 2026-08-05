/**
 * Reusable skeleton loading components that match the design system.
 */

export function SkeletonText({ width = '100%', height = 14, style = {} }) {
  return (
    <div
      className="skeleton skeleton-text"
      style={{ width, height, ...style }}
    />
  )
}

export function SkeletonTitle({ width = '60%', style = {} }) {
  return (
    <div
      className="skeleton skeleton-title"
      style={{ width, ...style }}
    />
  )
}

export function SkeletonCard({ height = 120, style = {} }) {
  return (
    <div
      className="skeleton skeleton-card"
      style={{ height, ...style }}
    />
  )
}

export function SkeletonJobCard() {
  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SkeletonText width={160} />
            <SkeletonText width={100} height={12} />
          </div>
        </div>
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
      </div>
      <SkeletonText width="90%" style={{ marginBottom: '8px' }} />
      <SkeletonText width="75%" style={{ marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[80, 60, 90, 50].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 24, borderRadius: 'var(--radius-full)' }} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonChatBubble({ align = 'left' }) {
  return (
    <div style={{ display: 'flex', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
      <div className="glass-card" style={{ padding: '16px', maxWidth: '70%' }}>
        <SkeletonText width="100%" style={{ marginBottom: '6px' }} />
        <SkeletonText width="80%" style={{ marginBottom: '6px' }} />
        <SkeletonText width="60%" />
      </div>
    </div>
  )
}
