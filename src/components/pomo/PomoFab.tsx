import { useState, useEffect, useRef, useCallback } from 'react'
import { todayStr } from '../../lib/date'
import { addXp } from '../../lib/xp'
import { showMiniToast } from '../../lib/miniToast'


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
  // Lock mode: fullscreen overlay + leave-detection penalty.
  const [lockMode, setLockMode] = useState<boolean>(() => localStorage.getItem('ff_pomo_lock') === '1')
  const [exitedFlash, setExitedFlash] = useState(false)
  const unlockHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [unlockProgress, setUnlockProgress] = useState(0)

  // Detect tab/app exit while running in lock mode → penalty + alert
  useEffect(() => {
    if (!pomo.running || !lockMode) return
    function onVisibility() {
      if (document.hidden) {
        // user left — record so we punish on return
        ;(window as unknown as { __pomoLeftAt?: number }).__pomoLeftAt = Date.now()
      } else {
        const w = window as unknown as { __pomoLeftAt?: number }
        if (w.__pomoLeftAt) {
          const gone = Date.now() - w.__pomoLeftAt
          w.__pomoLeftAt = undefined
          if (gone > 2000) {
            // Punish: -10 XP, flash red banner
            addXp(-10)
            setExitedFlash(true)
            showMiniToast('❌ 이탈 감지! XP -10')
            playChime()
            setTimeout(() => setExitedFlash(false), 4000)
          }
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [pomo.running, lockMode])

  function toggleLockMode() {
    setLockMode((prev) => {
      const next = !prev
      localStorage.setItem('ff_pomo_lock', next ? '1' : '0')
      return next
    })
  }

  function startUnlockHold() {
    setUnlockProgress(0)
    const start = Date.now()
    const tick = () => {
      const pct = Math.min(1, (Date.now() - start) / 3000)
      setUnlockProgress(pct)
      if (pct >= 1) {
        // Unlock — pause the timer and exit lock view
        setPomo((prev) => {
          const n: PomoState = { ...prev, running: false }
          saveState(n)
          return n
        })
        setUnlockProgress(0)
        return
      }
      unlockHoldRef.current = setTimeout(tick, 50)
    }
    unlockHoldRef.current = setTimeout(tick, 50)
  }
  function cancelUnlockHold() {
    if (unlockHoldRef.current) clearTimeout(unlockHoldRef.current)
    unlockHoldRef.current = null
    setUnlockProgress(0)
  }

  const tick = useCallback(() => {
    setPomo((prev) => {
      if (prev.seconds <= 0) return prev
      const newSec = prev.seconds - 1
      // Handle completion atomically inside the same state update so the
      // count can't be missed by a re-render race against a separate effect.
      if (newSec === 0) {
        playChime()
        const today = todayStr()
        const newCount = prev.phase === 'work'
          ? (prev.countDate === today ? prev.todayCount + 1 : 1)
          : prev.todayCount
        const newPhase: 'work' | 'break' = prev.phase === 'work' ? 'break' : 'work'
        const nextSeconds = newPhase === 'work' ? prev.workMin * 60 : prev.breakMin * 60
        const next: PomoState = {
          ...prev,
          running: false,
          phase: newPhase,
          seconds: nextSeconds,
          todayCount: newCount,
          countDate: today,
        }
        saveState(next)
        return next
      }
      const next: PomoState = { ...prev, seconds: newSec }
      saveState(next)
      return next
    })
  }, [])

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

  const lockActive = pomo.running && lockMode

  return (
    <>
      {/* Fullscreen lock overlay */}
      {lockActive && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: exitedFlash
            ? 'linear-gradient(135deg, #E24B4A, #B22222)'
            : pomo.phase === 'work'
              ? 'linear-gradient(135deg, var(--pd), var(--pink))'
              : 'linear-gradient(135deg, #56C6A0, #4DA688)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', userSelect: 'none', transition: 'background .3s',
        }}>
          {exitedFlash && (
            <div style={{ position: 'absolute', top: 40, fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>
              ❌ 이탈 감지 · XP -10
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 600, opacity: .8, marginBottom: 8 }}>
            {pomo.phase === 'work' ? '🎯 집중 시간' : '☕ 쉬는 시간'}
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -4, lineHeight: 1, fontFeatureSettings: '"tnum"' }}>
            {timeStr}
          </div>
          <div style={{ marginTop: 16, fontSize: 12, opacity: .9, padding: '0 32px', textAlign: 'center', lineHeight: 1.7 }}>
            📵 다른 앱/탭으로 가면 XP -10<br />
            🔒 해제하려면 아래 버튼 3초 길게 눌러
          </div>
          <button
            onPointerDown={startUnlockHold}
            onPointerUp={cancelUnlockHold}
            onPointerCancel={cancelUnlockHold}
            onPointerLeave={cancelUnlockHold}
            style={{
              marginTop: 32, position: 'relative',
              padding: '14px 32px', borderRadius: 16,
              border: '2px solid rgba(255,255,255,.5)',
              background: 'rgba(255,255,255,.1)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', overflow: 'hidden',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>
              {unlockProgress > 0 ? `잠금 해제 ${Math.round(unlockProgress * 100)}%` : '🔓 잠금 해제 (3초 길게 누르기)'}
            </span>
            {unlockProgress > 0 && (
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${unlockProgress * 100}%`,
                background: 'rgba(255,255,255,.3)',
                transition: 'width 50ms linear',
              }} />
            )}
          </button>
          <div style={{ marginTop: 24, fontSize: 10, opacity: .7 }}>
            💡 잠금 해제하면 타이머 일시정지돼
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className="pomo-fab"
        onClick={() => setOpen((o) => !o)}
        style={pomo.running ? { background: 'var(--pd)', fontSize: 13, fontWeight: 700, letterSpacing: '-.5px' } : {}}
      >
        {pomo.running ? timeStr : (
          <span style={{ display: 'inline-block', lineHeight: 1, transform: 'translateY(-2px)' }}>🍅</span>
        )}
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

          {/* Lock mode toggle */}
          <button
            onClick={toggleLockMode}
            style={{
              width: '100%', padding: '8px 10px', marginTop: 8, borderRadius: 10,
              border: '1.5px dashed ' + (lockMode ? 'var(--pink)' : '#ddd'),
              background: lockMode ? 'var(--pl)' : '#fff',
              color: lockMode ? 'var(--pd)' : '#888',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span>🔒 집중 잠금 모드 {lockMode ? 'ON' : 'OFF'}</span>
            <span style={{ fontSize: 9, opacity: .7 }}>
              {lockMode ? '시작하면 풀스크린 + 이탈 감지' : '시작 전에 켜야 작동'}
            </span>
          </button>

          {/* Today count */}
          <div className="pomo-count">
            오늘 뽀모도로 {pomo.todayCount}회 완료 🍅
          </div>
        </div>
      )}
    </>
  )
}
