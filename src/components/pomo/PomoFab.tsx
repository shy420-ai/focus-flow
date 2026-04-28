import { useState, useEffect, useRef, useCallback } from 'react'
import { todayStr } from '../../lib/date'


interface PomoState {
  workMin: number
  breakMin: number
  seconds: number
  phase: 'work' | 'break'
  running: boolean
  todayCount: number
  countDate: string
}

function loadState(): PomoState {
  try {
    const saved = JSON.parse(localStorage.getItem('ff_pomo_v2') || '{}')
    const today = todayStr()
    const rawPhase = saved.phase ?? 'work'
    return {
      workMin: saved.workMin ?? 25,
      breakMin: saved.breakMin ?? 5,
      seconds: saved.seconds ?? (saved.workMin ?? 25) * 60,
      phase: (rawPhase === 'break' ? 'break' : 'work') as 'work' | 'break',
      running: false, // never restore running state
      todayCount: saved.countDate === today ? (saved.todayCount ?? 0) : 0,
      countDate: today,
    }
  } catch {
    return { workMin: 25, breakMin: 5, seconds: 25 * 60, phase: 'work', running: false, todayCount: 0, countDate: todayStr() }
  }
}

function saveState(s: PomoState) {
  localStorage.setItem('ff_pomo_v2', JSON.stringify(s))
}

function playChime() {
  try {
    const actx = new AudioContext()
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = actx.createOscillator()
      const gain = actx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, actx.currentTime + i * 0.2)
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + i * 0.2 + 0.5)
      osc.connect(gain)
      gain.connect(actx.destination)
      osc.start(actx.currentTime + i * 0.2)
      osc.stop(actx.currentTime + i * 0.2 + 0.5)
    })
  } catch { /* ignore */ }
}

export function PomoFab() {
  const [open, setOpen] = useState(false)
  const [pomo, setPomo] = useState<PomoState>(loadState)
  const [customMin, setCustomMin] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(() => {
    setPomo((prev) => {
      if (prev.seconds <= 0) return prev // handled in effect
      const next: PomoState = { ...prev, seconds: prev.seconds - 1 }
      saveState(next)
      return next
    })
  }, [])

  // Handle completion
  useEffect(() => {
    if (!pomo.running) return
    if (pomo.seconds <= 0) {
      playChime()
      if (intervalRef.current) clearInterval(intervalRef.current)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPomo((prev) => {
        const today = todayStr()
        const newCount = prev.phase === 'work' ? (prev.countDate === today ? prev.todayCount + 1 : 1) : prev.todayCount
        const newPhase = prev.phase === 'work' ? 'break' : 'work'
        const newSec = newPhase === 'work' ? prev.workMin * 60 : prev.breakMin * 60
        const next: PomoState = { ...prev, running: false, phase: newPhase as 'work' | 'break', seconds: newSec, todayCount: newCount, countDate: today }
        saveState(next)
        return next
      })
    }
  }, [pomo.seconds, pomo.running])

  // Interval management
  useEffect(() => {
    if (pomo.running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [pomo.running, tick])

  function startPause() {
    setPomo((prev) => {
      const next: PomoState = { ...prev, running: !prev.running }
      saveState(next)
      return next
    })
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPomo((prev) => {
      const next: PomoState = { ...prev, running: false, phase: 'work', seconds: prev.workMin * 60 }
      saveState(next)
      return next
    })
  }

  function setWorkMin(min: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPomo((prev) => {
      const next: PomoState = { ...prev, workMin: min, running: false, phase: 'work', seconds: min * 60 }
      saveState(next)
      return next
    })
  }

  const total = pomo.phase === 'work' ? pomo.workMin * 60 : pomo.breakMin * 60
  const pct = total > 0 ? (total - pomo.seconds) / total : 0
  const mins = Math.floor(pomo.seconds / 60)
  const secs = pomo.seconds % 60
  const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0')

  return (
    <>
      {/* FAB */}
      <button
        className="pomo-fab"
        onClick={() => setOpen((o) => !o)}
        style={pomo.running ? { background: 'var(--pd)', fontSize: 13, fontWeight: 700, letterSpacing: '-.5px' } : {}}
      >
        {pomo.running ? timeStr : '🍅'}
      </button>

      {/* Panel — 원본 모바일 UI: 텍스트 시간 + 프로그레스바 */}
      {open && (
        <div className="pomo-panel show">
          <div className="pomo-title">🍅 뽀모도로 타이머</div>

          {/* Text display */}
          <div className="pomo-display">
            <div className="pomo-time">{timeStr}</div>
            <div className="pomo-phase">{pomo.phase === 'work' ? '집중 시간' : '쉬는 시간'}</div>
          </div>

          {/* Linear progress bar */}
          <div className="pomo-progress">
            <div className="pomo-progress-bar" style={{ width: Math.round(pct * 100) + '%' }} />
          </div>

          {/* Preset buttons */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
            {[5, 10, 15, 25, 30, 60].map((m) => (
              <button key={m} className="pomo-btn" style={{ padding: '3px 7px', fontSize: 10 }} onClick={() => setWorkMin(m)}>{m}</button>
            ))}
          </div>

          {/* Custom input */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 10, alignItems: 'center' }}>
            <input
              type="number"
              min={1}
              max={180}
              placeholder="분"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              style={{ width: 55, padding: '3px 6px', borderRadius: 8, border: '1.5px solid var(--pl)', fontSize: 11, textAlign: 'center', fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              className="pomo-btn"
              style={{ padding: '3px 8px', fontSize: 10 }}
              onClick={() => {
                const v = parseInt(customMin)
                if (v > 0) { setWorkMin(v); setCustomMin('') }
              }}
            >설정</button>
          </div>

          {/* Control buttons */}
          <div className="pomo-btns">
            <button className="pomo-btn primary" id="pomo-start-btn" onClick={startPause}>
              {pomo.running ? '일시정지' : '시작'}
            </button>
            <button className="pomo-btn" onClick={reset}>리셋</button>
          </div>

          {/* Today count */}
          <div className="pomo-count">
            오늘 뽀모도로 {pomo.todayCount}회 완료 🍅
          </div>
        </div>
      )}
    </>
  )
}
