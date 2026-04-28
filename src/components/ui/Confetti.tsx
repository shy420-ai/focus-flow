import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; color: string
  rot: number; rotV: number
  life: number; decay: number
  shape: 'rect' | 'circle'
}

export function Confetti({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Theme colors from CSS vars
    const style = getComputedStyle(document.documentElement)
    const pink = style.getPropertyValue('--pink').trim() || '#E8849D'
    const pl = style.getPropertyValue('--pl').trim() || '#FDE8EF'
    const pd = style.getPropertyValue('--pd').trim() || '#C45A78'
    const colors = [pink, pl, pd, '#fff', '#FFD6E0']

    const particles: Particle[] = []
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 2 + Math.random() * 6
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.4,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 4,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        rotV: (Math.random() - .5) * 8,
        life: 1,
        decay: .013 + Math.random() * .01,
        shape: Math.random() > .5 ? 'rect' : 'circle',
      })
    }

    let raf: number
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        p.vy += .18; p.vx *= .99
        p.rot += p.rotV; p.life -= p.decay
        ctx!.save()
        ctx!.globalAlpha = Math.max(0, p.life)
        ctx!.fillStyle = p.color
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.rot * Math.PI / 180)
        if (p.shape === 'rect') {
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx!.beginPath()
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx!.fill()
        }
        ctx!.restore()
      }
      const alive = particles.filter((p) => p.life > 0)
      if (alive.length) {
        raf = requestAnimationFrame(animate)
      } else {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
        onDoneRef.current()
      }
    }
    raf = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 998 }}
    />
  )
}
