import { useEffect, useState } from 'react'
import { Particles, ParticlesProvider, useParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

// The v4 API uses tsParticles singleton from @tsparticles/engine
// We initialize once using the engine directly
let engineReady = false
let engineReadyPromise = null

async function ensureEngine() {
  if (engineReady) return
  if (!engineReadyPromise) {
    engineReadyPromise = import('@tsparticles/engine').then(async ({ tsParticles }) => {
      await loadSlim(tsParticles)
      engineReady = true
    })
  }
  return engineReadyPromise
}

function ParticlesInner({ variant }) {
  const options = variant === 'auth'
    ? {
        background:   { color: { value: 'transparent' } },
        fpsLimit:     60,
        particles: {
          number:  { value: 40, density: { enable: true } },
          color:   { value: ['#7c3aed', '#06b6d4', '#ec4899'] },
          shape:   { type: 'circle' },
          opacity: { value: { min: 0.05, max: 0.3 }, animation: { enable: true, speed: 0.5 } },
          size:    { value: { min: 1, max: 3 } },
          move:    { enable: true, speed: 0.4, direction: 'none', random: true, outModes: 'out' },
          links:   { enable: true, color: '#7c3aed', opacity: 0.08, distance: 140 },
        },
        interactivity: {
          events: { onHover: { enable: true, mode: 'grab' } },
          modes:  { grab: { distance: 160, links: { opacity: 0.15 } } },
        },
      }
    : {
        background:   { color: { value: 'transparent' } },
        fpsLimit:     90,
        particles: {
          number:  { value: 70, density: { enable: true } },
          color:   { value: ['#8b5cf6', '#06b6d4', '#ec4899', '#a78bfa'] },
          shape:   { type: 'circle' },
          opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: 0.8 } },
          size:    { value: { min: 1, max: 4 } },
          move:    { enable: true, speed: 0.6, direction: 'none', random: true, outModes: 'out' },
          links:   { enable: true, color: '#7c3aed', opacity: 0.12, distance: 150 },
        },
        interactivity: {
          detectsOn: 'canvas',
          events: {
            onClick: { enable: true, mode: 'push' },
            onHover: { enable: true, mode: 'repulse' },
            resize:  { enable: true },
          },
          modes: {
            push:    { quantity: 3 },
            repulse: { distance: 120, duration: 0.4 },
          },
        },
      }

  return (
    <Particles
      id={`particles-${variant}`}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      options={options}
    />
  )
}

export default function ParticleField({ variant = 'hero' }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureEngine().then(() => setReady(true)).catch(console.error)
  }, [])

  if (!ready) return null

  return (
    <ParticlesProvider engine={async () => {
      const { tsParticles } = await import('@tsparticles/engine')
      return tsParticles
    }}>
      <ParticlesInner variant={variant} />
    </ParticlesProvider>
  )
}
