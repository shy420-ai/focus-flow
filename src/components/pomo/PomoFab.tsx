import { useState, useEffect, useRef, useCallback } from 'react'
import { todayStr } from '../../lib/date'
import { addXp } from '../../lib/xp'
import { showMiniToast } from '../../lib/miniToast'
import { registerCollect, registerHydrate, queue } from '../../lib/syncManager'
import { useDraggableFab } from '../../hooks/useDraggableFab'
import type { UserDoc } from '../../lib/firestore'


interface PomoState {
  workMin: number
  breakMin: number
  seconds: number
  phase: 'work' | 'break'
  running: boolean
  todayCount: number
  countDate: string
  totalCount: number   // lifetime completed work pomos
  totalMinutes: number // lifetime total work time accumulated
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
      totalCount: saved.totalCount ?? 0,
      totalMinutes: saved.totalMinutes ?? 0,
    }
  } catch {
    return { workMin: 25, breakMin: 5, seconds: 25 * 60, phase: 'work', running: false, todayCount: 0, countDate: todayStr(), totalCount: 0, totalMinutes: 0 }
  }
}

function saveState(s: PomoState) {
  localStorage.setItem('ff_pomo_v2', JSON.stringify(s))
}

// Sync the lock-mode preference across devices so toggling it on phone
// also turns it on for desktop / iPad next time they open the app.
// Lifetime totals (totalCount / totalMinutes) also sync so accumulated
// stats follow the user across devices.
registerCollect(() => {
  const out: Partial<UserDoc> = {}
  const v = localStorage.getItem('ff_pomo_lock')
  if (v === '1' || v === '0') out.pomoLock = v === '1'
  try {
    const saved = JSON.parse(localStorage.getItem('ff_pomo_v2') || '{}') as Partial<{ totalCount: number; totalMinutes: number }>
    if (typeof saved.totalCount === 'number') out.pomoTotalCount = saved.totalCount
    if (typeof saved.totalMinutes === 'number') out.pomoTotalMinutes = saved.totalMinutes
  } catch { /* ignore */ }
  return out
})

registerHydrate((d: UserDoc) => {
  if (typeof d.pomoLock === 'boolean') {
    const want = d.pomoLock ? '1' : '0'
    if (localStorage.getItem('ff_pomo_lock') !== want) {
      localStorage.setItem('ff_pomo_lock', want)
      window.dispatchEvent(new CustomEvent('ff-pomo-lock-changed'))
    }
  }
  // Merge lifetime totals: keep the larger value across devices.
  if (typeof d.pomoTotalCount === 'number' || typeof d.pomoTotalMinutes === 'number') {
    try {
      const saved = JSON.parse(localStorage.getItem('ff_pomo_v2') || '{}')
      const localCount = typeof saved.totalCount === 'number' ? saved.totalCount : 0
      const localMins = typeof saved.totalMinutes === 'number' ? saved.totalMinutes : 0
      const remoteCount = typeof d.pomoTotalCount === 'number' ? d.pomoTotalCount : 0
      const remoteMins = typeof d.pomoTotalMinutes === 'number' ? d.pomoTotalMinutes : 0
      let changed = false
      if (remoteCount > localCount) { saved.totalCount = remoteCount; changed = true }
      if (remoteMins > localMins) { saved.totalMinutes = remoteMins; changed = true }
      if (changed) {
        localStorage.setItem('ff_pomo_v2', JSON.stringify(saved))
        window.dispatchEvent(new CustomEvent('ff-pomo-total-changed'))
      }
    } catch { /* ignore */ }
  }
})

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
  // Pick up cross-device toggle / total-count changes.
  useEffect(() => {
    function refreshLock() { setLockMode(localStorage.getItem('ff_pomo_lock') === '1') }
    function refreshTotal() { setPomo(loadState()) }
    window.addEventListener('ff-pomo-lock-changed', refreshLock)
    window.addEventListener('ff-pomo-total-changed', refreshTotal)
    return () => {
      window.removeEventListener('ff-pomo-lock-changed', refreshLock)
      window.removeEventListener('ff-pomo-total-changed', refreshTotal)
    }
  }, [])
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
      queue()
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
        const isWorkDone = prev.phase === 'work'
        const newCount = isWorkDone
          ? (prev.countDate === today ? prev.todayCount + 1 : 1)
          : prev.todayCount
        const newTotalCount = isWorkDone ? prev.totalCount + 1 : prev.totalCount
        const newTotalMinutes = isWorkDone ? prev.totalMinutes + prev.workMin : prev.totalMinutes
        const newPhase: 'work' | 'break' = isWorkDone ? 'break' : 'work'
        const nextSeconds = newPhase === 'work' ? prev.workMin * 60 : prev.breakMin * 60
        const next: PomoState = {
          ...prev,
          running: false,
          phase: newPhase,
          seconds: nextSeconds,
          todayCount: newCount,
          countDate: today,
          totalCount: newTotalCount,
          totalMinutes: newTotalMinutes,
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
  const { bind: bindFab, fabStyle: pomoFabStyle, isDragging: pomoFabDragging } = useDraggableFab('ff_pomo_fab_pos', { x: window.innerWidth - 80, y: window.innerHeight - 160 })

  return (
    <>
      {/* Fullscreen lock overlay — cute tomato 🍅 hero */}
      {lockActive && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: exitedFlash
            ? 'linear-gradient(135deg, #FFE4E4, #FFB8B8)'
            : pomo.phase === 'work'
              ? 'linear-gradient(135deg, color-mix(in srgb, var(--pl) 60%, #fff), var(--pl))'
              : 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pink) 30%, #fff))',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'var(--pd)', userSelect: 'none', transition: 'background .3s',
          overflow: 'hidden',
        }}>
          <style>{`
            @keyframes pomo-bob { 0%, 100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-12px) rotate(2deg) } }
            @keyframes pomo-pulse { 0%, 100% { opacity: .35; transform: scale(.98) } 50% { opacity: .55; transform: scale(1.04) } }
            @keyframes pomo-shake { 0%, 100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 75% { transform: translateX(8px) } }
          `}</style>

          {exitedFlash && (
            <div style={{ position: 'absolute', top: 40, padding: '10px 22px', borderRadius: 99, background: '#E24B4A', color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 1, boxShadow: '0 6px 20px rgba(226,75,74,.4)', animation: 'pomo-shake .3s ease-in-out 3' }}>
              ❌ 이탈 감지 · XP -10
            </div>
          )}

          {/* Phase chip */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,.6)', backdropFilter: 'blur(4px)', fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 24 }}>
            {pomo.phase === 'work' ? '🎯 집중 시간' : '☕ 쉬는 시간'}
          </div>

          {/* Big tomato hero with pulsing halo */}
          <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(255,255,255,.6)',
              animation: 'pomo-pulse 2.4s ease-in-out infinite',
            }} />
            <div style={{
              fontSize: 160, lineHeight: 1, position: 'relative',
              animation: 'pomo-bob 3.2s ease-in-out infinite',
              filter: 'drop-shadow(0 8px 16px rgba(229,90,99,.25))',
            }}>🍅</div>
          </div>

          {/* Time */}
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -3, lineHeight: 1, fontFeatureSettings: '"tnum"', color: 'var(--pd)' }}>
            {timeStr}
          </div>

          {/* Cute hint */}
          <div style={{ marginTop: 18, fontSize: 12, color: '#666', padding: '0 28px', textAlign: 'center', lineHeight: 1.7 }}>
            🍅 토마토 익을 때까지 옆에 있어줘<br />
            <span style={{ fontSize: 10, color: '#aaa' }}>다른 앱 / 탭으로 가면 XP -10</span>
          </div>

          {/* Unlock pad */}
          <button
            onPointerDown={startUnlockHold}
            onPointerUp={cancelUnlockHold}
            onPointerCancel={cancelUnlockHold}
            onPointerLeave={cancelUnlockHold}
            style={{
              marginTop: 28, position: 'relative',
              padding: '14px 32px', borderRadius: 99,
              border: '2px solid rgba(0,0,0,.08)',
              background: '#fff',
              color: 'var(--pd)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', overflow: 'hidden',
              touchAction: 'manipulation',
              boxShadow: '0 4px 14px rgba(0,0,0,.08)',
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>
              {unlockProgress > 0 ? `🔓 ${Math.round(unlockProgress * 100)}%` : '🔓 잠금 해제 (3초 꾹)'}
            </span>
            {unlockProgress > 0 && (
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${unlockProgress * 100}%`,
                background: 'var(--pl)',
                transition: 'width 50ms linear',
                zIndex: 0,
              }} />
            )}
          </button>
          <div style={{ marginTop: 14, fontSize: 10, color: '#aaa' }}>
            해제하면 타이머 일시정지 · 다시 시작 가능
          </div>
        </div>
      )}

      {/* FAB — draggable on long press */}
      <button
        ref={bindFab as React.RefCallback<HTMLButtonElement>}
        className="pomo-fab"
        onClick={() => { if (!pomoFabDragging) setOpen((o) => !o) }}
        style={{
          ...(pomo.running ? { background: 'var(--pd)', fontSize: 13, fontWeight: 700, letterSpacing: '-.5px' } : {}),
          ...pomoFabStyle,
        }}
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
              width: '100%', padding: '10px 12px', marginTop: 8, borderRadius: 10,
              border: '1.5px dashed ' + (lockMode ? 'var(--pink)' : '#ddd'),
              background: lockMode ? 'var(--pl)' : '#fff',
              color: lockMode ? 'var(--pd)' : '#888',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 4,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔒 집중 잠금 모드</span>
              <span style={{
                width: 32, height: 16, borderRadius: 8,
                background: lockMode ? 'var(--pink)' : '#ddd',
                position: 'relative', transition: 'background .2s', flexShrink: 0,
              }}>
                <span style={{
                  position: 'absolute', top: 2, ...(lockMode ? { right: 2 } : { left: 2 }),
                  width: 12, height: 12, borderRadius: 6, background: '#fff',
                  transition: 'all .2s',
                }} />
              </span>
            </div>
            <div style={{ fontSize: 10, opacity: .7, fontWeight: 500 }}>
              {lockMode ? '시작하면 풀스크린 + 이탈 감지' : '시작 전에 켜야 작동해'}
            </div>
          </button>

          {/* Today count + lifetime total */}
          <div className="pomo-count" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span>오늘 {pomo.todayCount}회 🍅</span>
            <span style={{ fontSize: 10, color: '#888' }}>
              누적 {pomo.totalCount}회 · {(pomo.totalMinutes / 60).toFixed(1)}h
            </span>
          </div>
        </div>
      )}
    </>
  )
}
