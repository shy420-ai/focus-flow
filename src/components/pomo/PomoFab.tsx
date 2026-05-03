import { useState, useEffect, useRef, useCallback } from 'react'
import { todayStr } from '../../lib/date'
import { registerCollect, registerHydrate, queue } from '../../lib/syncManager'
import { useDraggableFab } from '../../hooks/useDraggableFab'
import { ADHD_TIPS } from '../../data/adhdTips'
import { TipDetailModal } from '../tips/TipDetailModal'
import type { AdhdTip } from '../../types/adhdTip'
import type { UserDoc } from '../../lib/firestore'

// Compact technique presets surfaced inside the pomo popup so users discover
// the variants beyond the default 25/5. Tap = apply work/break minutes.
// `tipId` opens the matching detail card from the info tab.
interface PomoTechnique {
  id: string
  label: string       // shown big (e.g. "50/10")
  desc: string        // shown small (e.g. "데일리")
  workMin: number
  breakMin: number
  tipId: string
}
// Compact 분 input used in the timer settings row.
function DurationField({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div style={{ flex: 1, background: '#fafafa', borderRadius: 10, padding: '6px 8px', border: '1px solid #f0f0f0' }}>
      <div style={{ fontSize: 9, color: '#888', fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value)
          if (v > 0 && v <= max) onChange(v)
        }}
        style={{
          width: '100%', border: 'none', outline: 'none', background: 'transparent',
          textAlign: 'left', fontSize: 16, fontWeight: 800, color: 'var(--pd)',
          fontFamily: 'inherit', padding: 0, fontFeatureSettings: '"tnum"',
        }}
      />
    </div>
  )
}

const TECHNIQUES: PomoTechnique[] = [
  { id: 'micro-5-1', label: '5/1',   desc: '응급',     workMin: 5,  breakMin: 1,  tipId: 'pomo-micro-5-1' },
  { id: 'animedoro', label: '22/22', desc: '시동',     workMin: 22, breakMin: 22, tipId: 'pomo-animedoro' },
  { id: 'classic',   label: '25/5',  desc: '기본',     workMin: 25, breakMin: 5,  tipId: 'pomodoro-short' },
  { id: 'daily',     label: '50/10', desc: '데일리',   workMin: 50, breakMin: 10, tipId: 'pomo-50-10' },
  { id: 'desktime',  label: '52/17', desc: '직장인',   workMin: 52, breakMin: 17, tipId: 'pomo-52-17' },
  { id: 'deep',      label: '90/20', desc: '깊은작업', workMin: 90, breakMin: 20, tipId: 'pomo-90-20' },
]


interface PomoState {
  workMin: number
  breakMin: number
  longBreakMin: number       // 큰 휴식 (마지막 세트 후)
  sessionsTarget: number     // 한 사이클 = 몇 세트 (기본 4)
  sessionsCompleted: number  // 현재 사이클에서 완료한 세트 수
  autoStart: boolean         // 한 페이즈 끝나면 자동으로 다음 시작
  seconds: number
  phase: 'work' | 'break' | 'longBreak'
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
    const phase: 'work' | 'break' | 'longBreak' =
      rawPhase === 'break' ? 'break' : rawPhase === 'longBreak' ? 'longBreak' : 'work'
    return {
      workMin: saved.workMin ?? 25,
      breakMin: saved.breakMin ?? 5,
      longBreakMin: saved.longBreakMin ?? 30,
      sessionsTarget: saved.sessionsTarget ?? 4,
      sessionsCompleted: saved.sessionsCompleted ?? 0,
      autoStart: saved.autoStart ?? false,
      seconds: saved.seconds ?? (saved.workMin ?? 25) * 60,
      phase,
      running: false, // never restore running state
      todayCount: saved.countDate === today ? (saved.todayCount ?? 0) : 0,
      countDate: today,
      totalCount: saved.totalCount ?? 0,
      totalMinutes: saved.totalMinutes ?? 0,
    }
  } catch {
    return {
      workMin: 25, breakMin: 5, longBreakMin: 30,
      sessionsTarget: 4, sessionsCompleted: 0, autoStart: false,
      seconds: 25 * 60, phase: 'work', running: false,
      todayCount: 0, countDate: todayStr(), totalCount: 0, totalMinutes: 0,
    }
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
  const unlockHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [unlockProgress, setUnlockProgress] = useState(0)

  // Keep the screen awake during pomo lock so auto-dim doesn't fire
  // visibilitychange and look like an "exit". Best-effort — Wake Lock
  // API is supported in most modern mobile browsers but may be denied.
  useEffect(() => {
    if (!pomo.running || !lockMode) return
    type WakeLockSentinel = { release: () => Promise<void> }
    type WakeLock = { request: (type: 'screen') => Promise<WakeLockSentinel> }
    const nav = navigator as Navigator & { wakeLock?: WakeLock }
    if (!nav.wakeLock) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false
    nav.wakeLock.request('screen').then((s) => {
      if (cancelled) { s.release().catch(() => { /* ignore */ }); return }
      sentinel = s
    }).catch(() => { /* not granted, fall back to grace period */ })
    return () => {
      cancelled = true
      if (sentinel) sentinel.release().catch(() => { /* ignore */ })
    }
  }, [pomo.running, lockMode])

  // 이탈 감지 페널티 — 비활성. 사용자가 화면을 안 만졌을 뿐인데
  // OS 가 자동으로 화면을 끄는 경우(passive screen lock)와 진짜 다른
  // 앱으로 빠져나간 경우를 웹에서 구분할 방법이 없어서, 잘못된 경고로
  // 신뢰만 잃는 부작용이 컸음. 잠금 모드는 = 풀스크린 시각 효과만
  // 유지하고 XP 페널티는 제거함.

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
        // Session series logic:
        // • work done → break (or longBreak if just hit sessionsTarget)
        // • break or longBreak done → work; longBreak also resets the cycle
        let newPhase: 'work' | 'break' | 'longBreak'
        let newSessionsCompleted = prev.sessionsCompleted
        if (isWorkDone) {
          newSessionsCompleted = prev.sessionsCompleted + 1
          newPhase = newSessionsCompleted >= prev.sessionsTarget ? 'longBreak' : 'break'
        } else {
          newPhase = 'work'
          if (prev.phase === 'longBreak') newSessionsCompleted = 0  // cycle restart
        }
        const nextSeconds =
          newPhase === 'work' ? prev.workMin * 60 :
          newPhase === 'longBreak' ? prev.longBreakMin * 60 :
          prev.breakMin * 60
        const next: PomoState = {
          ...prev,
          running: prev.autoStart,  // auto-continue if user opted in
          phase: newPhase,
          seconds: nextSeconds,
          sessionsCompleted: newSessionsCompleted,
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
      const next: PomoState = { ...prev, running: false, phase: 'work', seconds: prev.workMin * 60, sessionsCompleted: 0 }
      saveState(next)
      return next
    })
  }

  function setSessionsTarget(n: number) {
    setPomo((prev) => {
      const next: PomoState = { ...prev, sessionsTarget: Math.max(1, Math.min(8, n)) }
      saveState(next)
      return next
    })
  }
  function setLongBreakMin(m: number) {
    setPomo((prev) => {
      const isLong = prev.phase === 'longBreak'
      const next: PomoState = { ...prev, longBreakMin: m, seconds: isLong ? m * 60 : prev.seconds }
      saveState(next)
      return next
    })
  }
  function setBreakMin(m: number) {
    setPomo((prev) => {
      const isBreak = prev.phase === 'break'
      const next: PomoState = { ...prev, breakMin: m, seconds: isBreak ? m * 60 : prev.seconds }
      saveState(next)
      return next
    })
  }
  function toggleAutoStart() {
    setPomo((prev) => {
      const next: PomoState = { ...prev, autoStart: !prev.autoStart }
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

  function applyTechnique(t: PomoTechnique) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPomo((prev) => {
      const next: PomoState = {
        ...prev,
        workMin: t.workMin,
        breakMin: t.breakMin,
        running: false,
        phase: 'work',
        seconds: t.workMin * 60,
        sessionsCompleted: 0,
      }
      saveState(next)
      return next
    })
  }

  // Tip detail modal opened from technique chip ℹ or "전체 가이드" link.
  const [guideTip, setGuideTip] = useState<AdhdTip | null>(null)
  function openTip(tipId: string) {
    const tip = ADHD_TIPS.find((t) => t.id === tipId)
    if (tip) setGuideTip(tip)
  }

  // Match the active preset by current work/break to highlight the chip.
  const activeTechId = TECHNIQUES.find(
    (t) => t.workMin === pomo.workMin && t.breakMin === pomo.breakMin,
  )?.id ?? null

  const total =
    pomo.phase === 'work' ? pomo.workMin * 60 :
    pomo.phase === 'longBreak' ? pomo.longBreakMin * 60 :
    pomo.breakMin * 60
  const pct = total > 0 ? (total - pomo.seconds) / total : 0
  const mins = Math.floor(pomo.seconds / 60)
  const secs = pomo.seconds % 60
  const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0')

  const lockActive = pomo.running && lockMode
  const { bind: bindFab, fabStyle: pomoFabStyle, isDragging: pomoFabDragging } = useDraggableFab('ff_pomo_fab_pos', { x: window.innerWidth - 80, y: window.innerHeight - 160 })

  return (
    <>
      {/* Fullscreen lock overlay — work=tomato hero, break=coffee/leaf hero
          with softer mint/sky background so user instantly knows the phase */}
      {lockActive && (() => {
        const isWork = pomo.phase === 'work'
        const isLong = pomo.phase === 'longBreak'
        // Distinct backgrounds per phase: warm pink for work, sky for short break,
        // sage green for long break — palette signals "쉬는 시간" without reading.
        const bgGradient = isWork
          ? 'linear-gradient(135deg, color-mix(in srgb, var(--pl) 60%, #fff), var(--pl))'
          : isLong
          ? 'linear-gradient(135deg, #d8efe1, #aee0c5)'
          : 'linear-gradient(135deg, #e6f3fa, #bee0ee)'
        const heroEmoji = isWork ? '🍅' : isLong ? '🌿' : '☕'
        const hintText = isWork
          ? '🍅 토마토 익을 때까지 옆에 있어줘'
          : isLong
          ? '🌿 길게 쉬어 · 산책·식사·낮잠 추천'
          : '☕ 잠깐 한숨 돌려 · 물 한 잔 · 스트레칭'
        const phaseBadgeBg = isWork
          ? 'rgba(255,255,255,.6)'
          : 'rgba(255,255,255,.85)'
        return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: bgGradient,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'var(--pd)', userSelect: 'none', transition: 'background .6s',
          overflow: 'hidden',
        }}>
          <style>{`
            @keyframes pomo-bob { 0%, 100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-12px) rotate(2deg) } }
            @keyframes pomo-pulse { 0%, 100% { opacity: .35; transform: scale(.98) } 50% { opacity: .55; transform: scale(1.04) } }
            @keyframes pomo-breath { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-6px) scale(1.04) } }
            @keyframes pomo-shake { 0%, 100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 75% { transform: translateX(8px) } }
          `}</style>


          {/* Phase chip + session counter */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: phaseBadgeBg, backdropFilter: 'blur(4px)', fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>
            {isWork ? '🎯 집중 시간' : isLong ? '🌿 큰 휴식 — 길게 쉬어' : '☕ 쉬는 시간 — 잠깐 멈춰'}
          </div>
          {pomo.sessionsTarget > 1 && (
            <div style={{ fontSize: 11, color: 'var(--pd)', marginBottom: 16, opacity: 0.75, fontWeight: 600 }}>
              {isWork
                ? `${pomo.sessionsCompleted + 1} / ${pomo.sessionsTarget} 세트`
                : `${pomo.sessionsCompleted} / ${pomo.sessionsTarget} 완료`}
            </div>
          )}

          {/* Hero — work=ripening tomato, break=coffee/leaf with breath animation */}
          {(() => {
            const ripeness = isWork ? pct : 1
            const hue = 120 * (1 - ripeness)
            const sat = 0.6 + 0.4 * ripeness
            const bright = 0.92 + 0.08 * ripeness
            const heroFilter = isWork
              ? `hue-rotate(${hue}deg) saturate(${sat}) brightness(${bright}) drop-shadow(0 8px 16px rgba(229,90,99,.25))`
              : 'drop-shadow(0 8px 16px rgba(0,0,0,.12))'
            const heroAnim = isWork ? 'pomo-bob 3.2s ease-in-out infinite' : 'pomo-breath 4.2s ease-in-out infinite'
            const haloBg = isWork ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.7)'
            return (
              <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: haloBg,
                  animation: 'pomo-pulse 2.4s ease-in-out infinite',
                }} />
                <div style={{
                  fontSize: 160, lineHeight: 1, position: 'relative',
                  animation: heroAnim,
                  filter: heroFilter,
                  transition: 'filter 1s linear',
                }}>{heroEmoji}</div>
              </div>
            )
          })()}

          {/* Time */}
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -3, lineHeight: 1, fontFeatureSettings: '"tnum"', color: 'var(--pd)' }}>
            {timeStr}
          </div>

          {/* Phase-specific hint */}
          <div style={{ marginTop: 18, fontSize: 12, color: '#666', padding: '0 28px', textAlign: 'center', lineHeight: 1.7 }}>
            {hintText}
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
        )
      })()}

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
        <>
          {/* Tap-outside-to-close backdrop. z=199 sits below the FAB (200) so the
              FAB still receives clicks (which already toggle), and below the
              panel (201) so panel clicks don't bubble to the backdrop. */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'transparent' }}
          />
        <div className="pomo-panel show">
          <div className="pomo-title">🍅 뽀모도로 타이머</div>

          {/* Text display */}
          <div className="pomo-display">
            <div className="pomo-time">{timeStr}</div>
            <div className="pomo-phase">
              {pomo.phase === 'work' ? '🎯 집중 시간' : pomo.phase === 'longBreak' ? '🌿 큰 휴식 — 길게 쉬어' : '☕ 쉬는 시간 — 잠깐 멈춰'}
              {pomo.sessionsTarget > 1 && (
                <span style={{ marginLeft: 6, fontSize: 10, color: '#888', fontWeight: 600 }}>
                  ({pomo.phase === 'work' ? pomo.sessionsCompleted + 1 : pomo.sessionsCompleted}/{pomo.sessionsTarget})
                </span>
              )}
            </div>
          </div>

          {/* Linear progress bar */}
          <div className="pomo-progress">
            <div className="pomo-progress-bar" style={{ width: Math.round(pct * 100) + '%' }} />
          </div>

          {/* ── Section: 뽀모 기법 ─────────────────────────────── */}
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: -0.2 }}>📚 뽀모 기법</span>
              <button
                onClick={() => openTip('pomo-choose')}
                style={{ background: 'none', border: 'none', color: 'var(--pink)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
              >전체 가이드 ›</button>
            </div>
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {TECHNIQUES.map((t) => {
                const on = activeTechId === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => applyTechnique(t)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid ' + (on ? 'var(--pink)' : '#eee'),
                      background: on ? 'var(--pink)' : '#fff',
                      color: on ? '#fff' : 'var(--pd)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.1 }}>{t.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, opacity: on ? 0.9 : 0.55 }}>{t.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Section: 시간 설정 — 3-input row ───────────────── */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 6, letterSpacing: -0.2 }}>⏱ 시간 (분)</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <DurationField label="작업"   value={pomo.workMin}      onChange={setWorkMin}      max={180} />
              <DurationField label="휴식"   value={pomo.breakMin}     onChange={setBreakMin}     max={60} />
              <DurationField label="큰 휴식" value={pomo.longBreakMin} onChange={setLongBreakMin} max={120} />
            </div>
          </div>

          {/* ── Section: 세트 (큰 휴식 주기) — 6 buttons full row ── */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 6, letterSpacing: -0.2 }}>
              🍅 세트 — {pomo.sessionsTarget}번 작업 후 큰 휴식
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const on = pomo.sessionsTarget === n
                return (
                  <button key={n}
                    onClick={() => setSessionsTarget(n)}
                    style={{
                      flex: 1, height: 32, borderRadius: 8,
                      border: '1px solid ' + (on ? 'var(--pink)' : '#eee'),
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: on ? 'var(--pink)' : '#fff',
                      color: on ? '#fff' : 'var(--pd)',
                      fontSize: 12, fontWeight: 700, padding: 0,
                    }}>{n}</button>
                )
              })}
            </div>
          </div>

          {/* ── 자동 시작 — clean toggle row (same shape as lock) ── */}
          <button
            onClick={toggleAutoStart}
            style={{
              width: '100%', padding: '8px 12px', marginTop: 10, borderRadius: 10,
              border: '1px solid ' + (pomo.autoStart ? 'var(--pink)' : '#eee'),
              background: pomo.autoStart ? 'color-mix(in srgb, var(--pl) 60%, #fff)' : '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--pd)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              ⏯ 자동 시작
              <span style={{ fontSize: 9, color: '#999', fontWeight: 500 }}>
                {pomo.autoStart ? '페이즈 끝나면 자동 진행' : '꺼짐'}
              </span>
            </span>
            <span style={{
              width: 32, height: 18, borderRadius: 99,
              background: pomo.autoStart ? 'var(--pink)' : '#ddd',
              position: 'relative', transition: 'background .2s', flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute', top: 2, ...(pomo.autoStart ? { right: 2 } : { left: 2 }),
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'all .2s',
              }} />
            </span>
          </button>

          {/* ── Section: 시작/리셋 ──────────────────────────── */}
          <div className="pomo-btns" style={{ marginTop: 14 }}>
            <button className="pomo-btn primary" id="pomo-start-btn" onClick={startPause}>
              {pomo.running ? '일시정지' : '시작'}
            </button>
            <button className="pomo-btn" onClick={reset}>리셋</button>
          </div>

          {/* ── Lock mode — minimal toggle row ───────────────── */}
          <button
            onClick={toggleLockMode}
            style={{
              width: '100%', padding: '8px 12px', marginTop: 10, borderRadius: 10,
              border: '1px solid ' + (lockMode ? 'var(--pink)' : '#eee'),
              background: lockMode ? 'color-mix(in srgb, var(--pl) 60%, #fff)' : '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--pd)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              🔒 집중 잠금 모드
              <span style={{ fontSize: 9, color: '#999', fontWeight: 500 }}>
                {lockMode ? '시작 시 풀스크린' : '꺼짐'}
              </span>
            </span>
            <span style={{
              width: 32, height: 18, borderRadius: 99,
              background: lockMode ? 'var(--pink)' : '#ddd',
              position: 'relative', transition: 'background .2s', flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute', top: 2, ...(lockMode ? { right: 2 } : { left: 2 }),
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'all .2s',
              }} />
            </span>
          </button>

          {/* Today count + lifetime total */}
          <div className="pomo-count" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: 22 }}>
            <span>오늘 {pomo.todayCount}회 🍅</span>
            <span style={{ fontSize: 10, color: '#888' }}>
              누적 {pomo.totalCount}회 · {pomo.totalMinutes}m
            </span>
          </div>
        </div>
        </>
      )}

      {guideTip && <TipDetailModal tip={guideTip} onClose={() => setGuideTip(null)} />}
    </>
  )
}
