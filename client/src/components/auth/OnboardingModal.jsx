import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassCard from '../ui/GlassCard'

const DOMAINS = [
  { id: 'hardware', label: 'VLSI & Digital Electronics', icon: '🔌' },
  { id: 'embedded', label: 'Embedded Systems & IoT', icon: '🤖' },
  { id: 'web', label: 'Full Stack & Web Development', icon: '🌐' },
  { id: 'ai', label: 'AI, Machine Learning & Data', icon: '⚡' },
]

const WORK_TYPES = ['Full-time', 'Internship', 'Contract', 'Remote Only']

const POPULAR_ROLES = [
  'VLSI / Physical Design Engineer',
  'Embedded Systems / IoT Developer',
  'Frontend / React Engineer',
  'Full Stack Software Engineer',
  'AI / ML Engineer',
  'DevOps / Systems Engineer',
]

export default function OnboardingModal({ isOpen, onClose, onSave, initialData }) {
  const [step, setStep] = useState(1)
  const [targetRoles, setTargetRoles] = useState(initialData?.targetRoles || ['VLSI / Physical Design Engineer'])
  const [locations, setLocations] = useState(initialData?.locations || 'Bangalore, India / Remote')
  const [selectedDomain, setSelectedDomain] = useState(initialData?.domain || 'hardware')
  const [selectedWorkTypes, setSelectedWorkTypes] = useState(initialData?.workTypes || ['Full-time', 'Remote Only'])
  const [customRoleInput, setCustomRoleInput] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const toggleRole = (role) => {
    setTargetRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const addCustomRole = (e) => {
    e.preventDefault()
    if (customRoleInput.trim() && !targetRoles.includes(customRoleInput.trim())) {
      setTargetRoles([...targetRoles, customRoleInput.trim()])
      setCustomRoleInput('')
    }
  }

  const toggleWorkType = (wt) => {
    setSelectedWorkTypes(prev =>
      prev.includes(wt) ? prev.filter(t => t !== wt) : [...prev, wt]
    )
  }

  const handleFinish = async () => {
    setSaving(true)
    const preferences = {
      targetRoles,
      locations,
      domain: selectedDomain,
      workTypes: selectedWorkTypes,
      updatedAt: new Date().toISOString(),
    }
    await onSave(preferences)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(5, 5, 12, 0.82)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{ width: '100%', maxWidth: 560 }}
      >
        <GlassCard glow style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 16,
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              borderRadius: '50%', width: 28, height: 28,
              color: 'var(--text-muted)', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10, transition: 'all 0.2s ease',
            }}
            title="Close Setup"
          >
            ✕
          </button>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className="badge badge-accent" style={{ fontSize: '0.7rem', marginBottom: '6px', display: 'inline-block' }}>
                Step {step} of 3
              </span>
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>
                {step === 1 && 'What domain are you targeting?'}
                {step === 2 && 'Select your target job roles'}
                {step === 3 && 'Location & Work Preferences'}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 24, height: 4, borderRadius: 2,
                  background: step >= i ? 'var(--primary)' : 'var(--border)',
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>
          </div>

          {/* Step 1: Domain Focus */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                This helps Job Intelligence scrape and match the most relevant companies and listings.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {DOMAINS.map((d) => (
                  <GlassCard
                    key={d.id}
                    style={{
                      padding: '16px', cursor: 'pointer',
                      border: selectedDomain === d.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selectedDomain === d.id ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                    }}
                    onClick={() => setSelectedDomain(d.id)}
                  >
                    <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{d.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{d.label}</div>
                  </GlassCard>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => setStep(2)}>Next →</button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Target Roles */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '14px' }}>
                Choose or add the job titles you want to search and prepare for:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {POPULAR_ROLES.map((role) => (
                  <button
                    key={role}
                    className={`btn btn-sm ${targetRoles.includes(role) ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => toggleRole(role)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {targetRoles.includes(role) ? '✓ ' : '+ '} {role}
                  </button>
                ))}
              </div>

              {/* Add custom role */}
              <form onSubmit={addCustomRole} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <input
                  className="form-input"
                  placeholder="Add custom role (e.g. Physical Design Engineer)…"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  style={{ fontSize: '0.82rem', height: 38 }}
                />
                <button type="submit" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>Add</button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)} disabled={targetRoles.length === 0}>Next →</button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Location & Preferences */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Target Locations</label>
                <input
                  className="form-input"
                  placeholder="e.g. Bangalore, Remote, India, US"
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>Work Types</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {WORK_TYPES.map(wt => (
                    <button
                      key={wt}
                      className={`btn btn-sm ${selectedWorkTypes.includes(wt) ? 'btn-accent' : 'btn-ghost'}`}
                      onClick={() => toggleWorkType(wt)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {selectedWorkTypes.includes(wt) ? '✓ ' : ''}{wt}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button
                  className={`btn btn-primary btn-lg ${saving ? 'btn-loading' : ''}`}
                  onClick={handleFinish}
                  disabled={saving}
                >
                  {saving ? 'Saving preferences…' : '🚀 Save & Find Jobs'}
                </button>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}
