import { useState, useEffect, useRef } from 'react'
import { todayStr } from '../../lib/date'
import { getXp, addXp, getLevel, xpInLevel } from '../../lib/xp'
import { showMiniToast } from '../../lib/miniToast'
import { showConfirm } from '../../lib/showConfirm'
import { LeaderboardModal } from './Leaderboard'
import { UnitPickerModal } from './UnitPickerModal'
import { SprintGoalEditModal } from './SprintGoalEditModal'
import { isLeaderboardOn } from '../../lib/leaderboardPref'
import { queue, flushSync, registerCollect, registerHydrate } from '../../lib/syncManager'
import type { UserDoc } from '../../lib/firestore'

interface SubStep {
  id: string
  name: string
  done: boolean
}

interface SprintGoal {
  id: string
  name: string
  target: number   // 목표 (10회, 10분, ...)
  unit: string     // 회 / 시간 / 분 / 페이지 / 개 / ''
  current: number  // 현재 누적
  smallStep?: number  // +버튼 작은 단위 (default 1)
  bigStep?: number    // +버튼 큰 단위 (default 5)
  // 잘게 쪼갠 step. 있으면 진행률 = 완료된 step / 전체 step.
  // 카운트 모드(+N)와 step 모드는 같은 카드에서 공존 — step 0개면 카운트만 표시.
  steps?: SubStep[]
}

interface Sprint {
  startDate: string
  goals: SprintGoal[]
  overall?: number  // optional manual override (0-100). undefined = auto from goals
}

interface CompletedSprint {
  startDate: string
  endDate: string
  goals: SprintGoal[]
  overall?: number
}

const KEY = 'ff_sprint'
const HISTORY_KEY = 'ff_sprint_history'
const SPRINT_DAYS = 7

function loadSprint(): Sprint | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Sprint
    s.goals = (s.goals || []).map((g: { id?: string; name?: string; target?: number; unit?: string; current?: number; progress?: number; smallStep?: number; bigStep?: number; steps?: unknown }) => {
      // Migrate either shape to current target/unit/current model
      const target = typeof g.target === 'number' && g.target > 0 ? g.target : 10
      const unit = typeof g.unit === 'string' ? g.unit : '회'
      let current = typeof g.current === 'number' ? g.current : 0
      if (typeof g.current !== 'number' && typeof g.progress === 'number') {
        current = Math.round((g.progress / 100) * target)
      }
      const out: SprintGoal = {
        id: g.id || String(Date.now() + Math.random()),
        name: g.name || '',
        target,
        unit,
        current,
      }
      if (typeof g.smallStep === 'number' && g.smallStep > 0) out.smallStep = g.smallStep
      if (typeof g.bigStep === 'number' && g.bigStep > 0) out.bigStep = g.bigStep
      if (Array.isArray(g.steps)) {
        const steps: SubStep[] = []
        for (const raw of g.steps) {
          if (!raw || typeof raw !== 'object') continue
          const s = raw as { id?: string; name?: string; done?: unknown }
          steps.push({
            id: typeof s.id === 'string' ? s.id : String(Date.now() + Math.random()),
            name: typeof s.name === 'string' ? s.name : '',
            done: !!s.done,
          })
        }
        if (steps.length) out.steps = steps
      }
      return out
    })
    delete s.overall  // overall is always auto-computed from goals now
    return s
  } catch {
    return null
  }
}

function saveSprint(s: Sprint | null): void {
  if (s) localStorage.setItem(KEY, JSON.stringify(s))
  else localStorage.removeItem(KEY)
  queue()
  // Notify other surfaces (FriendsPanel) so they can flushSync immediately
  // — without this, a freshly-edited sprint takes up to 1.5s to land in
  // Firestore and won't show in the self-preview that fast.
  window.dispatchEvent(new CustomEvent('ff-sprint-local-changed'))
}

function loadHistory(): CompletedSprint[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as CompletedSprint[]) : []
  } catch {
    return []
  }
}

function saveHistory(h: CompletedSprint[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
  queue()
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function goalPct(g: SprintGoal): number {
  // step 모드 (steps 1개 이상) = 완료된 step / 전체 step. step 0개면 카운트 모드 사용.
  if (g.steps && g.steps.length > 0) {
    const done = g.steps.filter((s) => s.done).length
    return Math.round((done / g.steps.length) * 100)
  }
  if (!g.target || g.target <= 0) return 0
  return Math.min(100, Math.round((g.current / g.target) * 100))
}

// A goal is "completed" once current ≥ target (count mode) OR all steps
// are checked (step mode). Completed goals archive to 🏆 완료.
function isCompleted(g: SprintGoal): boolean {
  if (g.steps && g.steps.length > 0) {
    return g.steps.every((s) => s.done)
  }
  return g.target > 0 && g.current >= g.target
}

function sprintOverall(s: { overall?: number; goals: SprintGoal[] }): number {
  // Always compute from goals so per-goal taps stay in sync with the overall %.
  // For completed sprints (in history), use the stored snapshot if goals are empty.
  if (!s.goals.length) return typeof s.overall === 'number' ? s.overall : 0
  const avg = s.goals.reduce((sum, g) => sum + goalPct(g), 0) / s.goals.length
  return Math.round(avg)
}

export function SprintBoard() {
  const [sprint, setSprint] = useState<Sprint | null>(loadSprint())
  const [history, setHistory] = useState<CompletedSprint[]>(loadHistory())
  const [xp, setXp] = useState<number>(getXp())
  const [leaderboardOn, setLeaderboardOnState] = useState<boolean>(isLeaderboardOn())
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(() => sessionStorage.getItem('ff_modal_leaderboard') === '1')
  const [unitPickerForId, setUnitPickerForId] = useState<string | null>(null)
  const [editGoalId, setEditGoalId] = useState<string | null>(null)
  // Drag-to-reorder state (pointer events; works on touch + mouse).
  const [dragGoalId, setDragGoalId] = useState<string | null>(null)
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null)
  const [introDismissed, setIntroDismissed] = useState(() => localStorage.getItem('ff_sprint_intro_dismissed') === '1')
  useEffect(() => {
    function onChange() { setLeaderboardOnState(isLeaderboardOn()) }
    window.addEventListener('ff-leaderboard-changed', onChange)
    return () => window.removeEventListener('ff-leaderboard-changed', onChange)
  }, [])
  // Keep XP in sync with local edits, remote sync, and periodic re-read.
  useEffect(() => {
    function refreshXp() { setXp(getXp()) }
    window.addEventListener('ff-xp-changed', refreshXp)
    const id = setInterval(refreshXp, 60_000)
    return () => {
      window.removeEventListener('ff-xp-changed', refreshXp)
      clearInterval(id)
    }
  }, [])
  useEffect(() => {
    function onSprintChanged() {
      setSprint(loadSprint())
      setHistory(loadHistory())
    }
    window.addEventListener('ff-sprint-changed', onSprintChanged)
    return () => window.removeEventListener('ff-sprint-changed', onSprintChanged)
  }, [])
  useEffect(() => {
    if (leaderboardModalOpen) sessionStorage.setItem('ff_modal_leaderboard', '1')
    else sessionStorage.removeItem('ff_modal_leaderboard')
  }, [leaderboardModalOpen])

  // Skip the initial mount so stale local data doesn't overwrite fresher
  // Firestore data before the listener has a chance to hydrate.
  const sprintMountedRef = useRef(false)
  const historyMountedRef = useRef(false)
  useEffect(() => {
    if (!sprintMountedRef.current) { sprintMountedRef.current = true; return }
    saveSprint(sprint)
  }, [sprint])
  useEffect(() => {
    if (!historyMountedRef.current) { historyMountedRef.current = true; return }
    saveHistory(history)
  }, [history])

  // On first mount, if we already have a sprint locally, force-publish it
  // to Firestore. The mountedRef guards above suppress the auto-save, so
  // without this an existing sprint can stay invisible to the friend
  // self-preview until the user clicks +/- once.
  useEffect(() => {
    if (loadSprint()) flushSync().catch(() => { /* offline ok */ })
     
  }, [])

  function startSprint() {
    setSprint({ startDate: todayStr(), goals: [{ id: String(Date.now()), name: '', target: 10, unit: '회', current: 0 }] })
  }

  async function endSprint() {
    if (!sprint) return
    const ok = await showConfirm('이번 챌린지 끝낼까? 결과는 히스토리에 저장됨')
    if (!ok) return
    const completed: CompletedSprint = { startDate: sprint.startDate, endDate: todayStr(), goals: sprint.goals, overall: sprintOverall(sprint) }
    setHistory([...history, completed])
    setSprint(null)
    const result = addXp(50)
    setXp(result.newXp)
    if (result.leveledUp) showMiniToast('🎉 Lv.' + result.newLevel + ' 달성!')
  }

  function addGoal() {
    if (!sprint) return
    // Only active (uncompleted) goals count against the 3-goal slot
    // limit. Completed goals get archived into the 🏆 완료 section so
    // they keep contributing 100% to the sprint average without taking
    // up a slot.
    const activeCount = sprint.goals.filter((g) => !isCompleted(g)).length
    if (activeCount >= 3) return
    setSprint({ ...sprint, goals: [...sprint.goals, { id: String(Date.now()), name: '', target: 10, unit: '회', current: 0 }] })
  }

  function updateGoal(id: string, patch: Partial<SprintGoal>) {
    if (!sprint) return
    setSprint({ ...sprint, goals: sprint.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
  }

  function removeGoal(id: string) {
    if (!sprint) return
    setSprint({ ...sprint, goals: sprint.goals.filter((g) => g.id !== id) })
  }


  // ── Step (subtask) CRUD ──────────────────────────────────────────
  function addStep(goalId: string, name: string) {
    if (!sprint || !name.trim()) return
    const step: SubStep = { id: String(Date.now() + Math.random()), name: name.trim(), done: false }
    setSprint({
      ...sprint,
      goals: sprint.goals.map((g) => g.id === goalId ? { ...g, steps: [...(g.steps || []), step] } : g),
    })
  }
  function toggleStep(goalId: string, stepId: string) {
    if (!sprint) return
    let nowDone = false
    setSprint({
      ...sprint,
      goals: sprint.goals.map((g) => {
        if (g.id !== goalId || !g.steps) return g
        return {
          ...g,
          steps: g.steps.map((s) => {
            if (s.id !== stepId) return s
            nowDone = !s.done
            return { ...s, done: nowDone }
          }),
        }
      }),
    })
    // 작은 도파민 hit — step 1개 체크 = +2 XP, 해제 = -2.
    const result = addXp(nowDone ? 2 : -2)
    setXp(result.newXp)
    if (result.leveledUp) showMiniToast('🎉 Lv.' + result.newLevel + ' 달성!')
    if (nowDone) {
      window.dispatchEvent(new CustomEvent('ff-block-done', { detail: 'step:' + stepId }))
    }
  }
  function removeStep(goalId: string, stepId: string) {
    if (!sprint) return
    setSprint({
      ...sprint,
      goals: sprint.goals.map((g) => {
        if (g.id !== goalId || !g.steps) return g
        const next = g.steps.filter((s) => s.id !== stepId)
        return { ...g, steps: next.length ? next : undefined }
      }),
    })
  }


  const lv = getLevel(xp)
  const xpProg = xpInLevel(xp)

  const introBanner = !introDismissed && (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 50%, #fff))',
      border: '1.5px solid var(--pink)',
      borderRadius: 14, padding: '14px 38px 14px 14px',
      marginBottom: 12, fontSize: 12, lineHeight: 1.6, color: 'var(--pd)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>🎯 1주 챌린지 안내</div>
      <div style={{ color: '#666' }}>
        여기는 <b style={{ color: 'var(--pd)' }}>일주일 단위 목표</b>를 정해두는 곳이야.
        한 번에 1~3개. 매일 +1 누르면서 채워가면 돼.
        <br />
        예: "운동 10회", "책 3권", "인스타 7개"
      </div>
      <button
        onClick={() => {
          localStorage.setItem('ff_sprint_intro_dismissed', '1')
          setIntroDismissed(true)
        }}
        aria-label="공지 닫기"
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 24, height: 24, borderRadius: 12,
          border: 'none', background: 'rgba(0,0,0,.05)',
          color: '#888', fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit',
        }}
      >✕</button>
    </div>
  )

  const levelHeader = (
    <div style={{ background: 'linear-gradient(135deg, var(--pink), var(--pd))', borderRadius: 14, padding: 14, marginBottom: 12, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 11, opacity: 0.85, marginRight: 6 }}>나의 레벨</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>Lv.{lv}</span>
          <span style={{ fontSize: 11, opacity: 0.9, marginLeft: 8 }}>{xpProg.current}/{xpProg.needed} XP</span>
        </div>
        {leaderboardOn && (
          <button onClick={() => setLeaderboardModalOpen(true)}
            style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🏆 순위
          </button>
        )}
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,.2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#fff', width: xpProg.pct + '%', borderRadius: 4, transition: 'width .3s' }} />
      </div>
      <div style={{ fontSize: 9, marginTop: 6, opacity: 0.85 }}>
        +N XP per 행동 · +100 XP per 챌린지 완료
      </div>
    </div>
  )

  if (!sprint) {
    return (
      <>
      {introBanner}
      {levelHeader}
      <div style={{ background: '#fff', border: '1.5px dashed var(--pink)', borderRadius: 14, padding: 18, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', marginBottom: 6, textAlign: 'center' }}>⚡ 1주 챌린지 (실험)</div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 14, lineHeight: 1.6, textAlign: 'center' }}>
          ADHD엔 1주가 딱 잡힘<br />
          작은 목표 1~3개로 시작해봐
        </div>

        <div style={{ background: 'var(--pl)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>🧠 ADHD 친화 목표 세팅</div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.8 }}>
            <div>✅ <b>구체적으로</b> — '잘하기' X, '운동/글쓰기' O</div>
            <div>✅ <b>1~3개만</b> — 더 많으면 인지부담 폭증</div>
            <div>✅ <b>전체 % 슬라이더</b>로 진척 직관화</div>
            <div>✅ <b>저번 챌린지와 비교</b>로 성장 시각화</div>
            <div>✅ <b>완벽보다 점진</b> — 50%만 해도 OK</div>
          </div>
        </div>

        <button onClick={startSprint}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          🚀 챌린지 시작
        </button>
        {history.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 10, color: '#aaa', textAlign: 'center' }}>
            누적 챌린지 {history.length}개 완료
          </div>
        )}
      </div>
      {leaderboardModalOpen && <LeaderboardModal onClose={() => setLeaderboardModalOpen(false)} />}
      </>
    )
  }

  const elapsed = daysBetween(sprint.startDate, todayStr())
  const daysLeft = Math.max(SPRINT_DAYS - elapsed, 0)
  const overall = sprintOverall(sprint)

  // ── Goal drag-to-reorder (pointer events on the ☰ handle) ─────
  // Subtle haptics on Android/Chrome (iOS Safari ignores .vibrate by design).
  function buzz(ms: number | number[]) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(ms) } catch { /* ignore */ }
    }
  }
  function onGoalDragDown(e: React.PointerEvent, id: string) {
    setDragGoalId(id)
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    buzz(8)  // pickup tick
  }
  function onGoalDragMove(e: React.PointerEvent) {
    if (!dragGoalId) return
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-goal-id]') as HTMLElement | null
    const gid = el?.dataset.goalId
    if (gid && gid !== dragOverGoalId) {
      setDragOverGoalId(gid)
      buzz(5)  // hover-over-target tick
    }
  }
  function onGoalDragUp(e: React.PointerEvent) {
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    if (sprint && dragGoalId && dragOverGoalId && dragGoalId !== dragOverGoalId) {
      const next = [...sprint.goals]
      const fromIdx = next.findIndex((g) => g.id === dragGoalId)
      const toIdx = next.findIndex((g) => g.id === dragOverGoalId)
      if (fromIdx !== -1 && toIdx !== -1) {
        const [m] = next.splice(fromIdx, 1)
        next.splice(toIdx, 0, m)
        setSprint({ ...sprint, goals: next })
        buzz([10, 30, 10])  // commit confirmation
      }
    }
    setDragGoalId(null)
    setDragOverGoalId(null)
  }

  function bumpGoal(id: string, delta: number) {
    if (!sprint) return
    const g = sprint.goals.find((x) => x.id === id)
    if (!g) return
    const cur = typeof g.current === 'number' ? g.current : 0
    const next = Math.max(0, cur + delta)
    if (next === cur) return
    updateGoal(id, { current: next })
    // Trigger the timeline-style celebration (random message + confetti)
    // for positive bumps. Negative undo doesn't celebrate.
    if (delta > 0) {
      window.dispatchEvent(new CustomEvent('ff-block-done', { detail: 'sprint:' + id }))
    }
    // Progress-normalized XP so % and page goals reward the same total.
    // Total XP earned at progress P = floor(P * 30). Per-click XP is the
    // delta between totals at cur vs next, which means tiny clicks on
    // %-goals correctly accumulate fractional XP without inflating it
    // past 30 per goal (plus the 30-XP completion bonus = 60 max).
    const PROGRESS_XP = 30
    const COMPLETE_BONUS = 30
    let xpDelta = 0
    if (g.target > 0) {
      const capNext = Math.min(g.target, Math.max(0, next))
      const capCur = Math.min(g.target, Math.max(0, cur))
      const totalAtNext = Math.floor((capNext / g.target) * PROGRESS_XP)
      const totalAtCur = Math.floor((capCur / g.target) * PROGRESS_XP)
      xpDelta = totalAtNext - totalAtCur
      // Milestone bonus when crossing target (only the actual crossing earns/refunds)
      if (cur < g.target && next >= g.target) {
        xpDelta += COMPLETE_BONUS
        showMiniToast('🏆 목표 달성! +' + COMPLETE_BONUS + ' XP 보너스')
      } else if (cur >= g.target && next < g.target) {
        xpDelta -= COMPLETE_BONUS
      }
    }
    if (xpDelta === 0) return
    const result = addXp(xpDelta)
    setXp(result.newXp)
    if (result.leveledUp) showMiniToast('🎉 Lv.' + result.newLevel + ' 달성!')
  }

  return (
    <>
    {/* Top: 1-line summary + Lv badge */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--pd)' }}>
        ⚡ 1주 챌린지 D-{daysLeft} <span style={{ color: 'var(--pink)' }}>· {overall}%</span>
      </span>
      <button onClick={() => leaderboardOn && setLeaderboardModalOpen(true)}
        style={{ background: 'var(--pl)', border: 'none', color: 'var(--pd)', borderRadius: 99, padding: '3px 10px', fontSize: 10, fontWeight: 700, cursor: leaderboardOn ? 'pointer' : 'default', fontFamily: 'inherit' }}>
        Lv.{lv} {leaderboardOn ? '🏆' : ''}
      </button>
    </div>
    {/* Slim progress bar */}
    <div style={{ height: 4, background: 'var(--pl)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ height: '100%', background: 'var(--pink)', width: overall + '%', transition: 'width .3s' }} />
    </div>
    {/* Goals as a flat list (drops-style) */}
    {sprint.goals.filter((g) => !isCompleted(g)).map((g) => {
      const p = goalPct(g)
      const hasSteps = !!(g.steps && g.steps.length > 0)
      const step = g.smallStep && g.smallStep > 0 ? g.smallStep : 1
      const isDragOver = dragOverGoalId === g.id && dragGoalId !== g.id
      return (
        <div key={g.id}
          data-goal-id={g.id}
          style={{
            marginBottom: 8, padding: '10px 12px', background: '#fff', borderRadius: 10,
            border: '1px solid ' + (isDragOver ? 'var(--pink)' : 'var(--pl)'),
            opacity: dragGoalId === g.id ? 0.5 : 1,
            transition: 'border-color .15s, opacity .15s',
          }}
        >
          {/* Title row */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <button
              onPointerDown={(e) => onGoalDragDown(e, g.id)}
              onPointerMove={onGoalDragMove}
              onPointerUp={onGoalDragUp}
              onPointerCancel={onGoalDragUp}
              aria-label="순서 바꾸기"
              style={{ background: 'transparent', border: 'none', color: '#bbb', cursor: 'grab', touchAction: 'none', padding: '0 4px', fontSize: 14, lineHeight: 1, flexShrink: 0 }}
            >☰</button>
            <input
              value={g.name}
              onChange={(e) => updateGoal(g.id, { name: e.target.value })}
              placeholder="목표 이름"
              style={{ flex: 1, minWidth: 0, padding: '2px 0', border: 'none', fontSize: 13, fontWeight: 700, color: 'var(--pd)', fontFamily: 'inherit', outline: 'none', background: 'transparent' }}
            />
            <button onClick={() => setEditGoalId(g.id)} aria-label="수정"
              style={{ background: 'transparent', border: 'none', color: '#bbb', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>✏️</button>
            {!hasSteps && (
              <button onClick={() => bumpGoal(g.id, step)}
                style={{ padding: '5px 12px', borderRadius: 99, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, boxShadow: '0 2px 6px color-mix(in srgb, var(--pink) 30%, transparent)' }}>
                🙌 내가 해냄
              </button>
            )}
            <button onClick={async () => { if (await showConfirm('이 목표를 삭제할까?')) removeGoal(g.id) }} aria-label="삭제"
              style={{ background: 'transparent', border: 'none', color: '#bbb', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>✕</button>
          </div>
          {/* Progress row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, height: 4, background: 'var(--pl)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--pink)', width: p + '%', transition: 'width .3s' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--pd)', minWidth: 70, textAlign: 'right' }}>
              {g.current}<span style={{ color: '#aaa', fontWeight: 500 }}>/{g.target}{g.unit}</span>
            </span>
          </div>
          {/* Steps */}
          {hasSteps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
              {g.steps!.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <button
                    onClick={() => toggleStep(g.id, s.id)}
                    aria-label={s.done ? '완료 해제' : '완료'}
                    style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: '1.5px solid ' + (s.done ? 'var(--pink)' : '#ccc'),
                      background: s.done ? 'var(--pink)' : '#fff',
                      color: '#fff', fontSize: 10, fontWeight: 800,
                      cursor: 'pointer', padding: 0, lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >{s.done ? '✓' : ''}</button>
                  <span style={{ flex: 1, fontSize: 12, color: s.done ? '#aaa' : '#444', textDecoration: s.done ? 'line-through' : 'none' }}>{s.name}</span>
                  <button onClick={() => removeStep(g.id, s.id)} aria-label="삭제"
                    style={{ background: 'transparent', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 10, padding: 2, flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <StepAddRow onAdd={(name) => addStep(g.id, name)} />
        </div>
      )
    })}

    {(() => {
      const activeCount = sprint.goals.filter((g) => !isCompleted(g)).length
      if (activeCount >= 3) return null
      return (
        <button onClick={addGoal}
          style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px dashed var(--pl)', background: 'transparent', color: 'var(--pd)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, marginBottom: 8 }}>
          + 새 목표 ({activeCount}/3)
        </button>
      )
    })()}

    {/* 🏆 완료 — compact one-liner per goal with ↩️ undo + ✕ remove */}
    {(() => {
      const done = sprint.goals.filter(isCompleted)
      if (done.length === 0) return null
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8B6914', marginBottom: 4 }}>🏆 완료 {done.length}</div>
          {done.map((g) => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', fontSize: 11, color: '#888' }}>
              <span>✅</span>
              <span style={{ flex: 1, textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name || '(이름 없음)'}</span>
              <button
                onClick={() => {
                  if (g.steps && g.steps.length > 0) {
                    for (let i = g.steps.length - 1; i >= 0; i--) {
                      if (g.steps[i].done) { toggleStep(g.id, g.steps[i].id); return }
                    }
                  } else {
                    const step = g.smallStep && g.smallStep > 0 ? g.smallStep : 1
                    bumpGoal(g.id, -step)
                  }
                }}
                aria-label="되돌리기"
                title="되돌리기"
                style={{ background: 'transparent', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontSize: 14, padding: 2, flexShrink: 0, lineHeight: 1 }}
              >↺</button>
              <button onClick={async () => { if (await showConfirm('완료한 목표를 챌린지에서 빼기?\n\n평균에서도 빠져')) removeGoal(g.id) }}
                aria-label="삭제"
                title="삭제"
                style={{ background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 13, padding: 2, flexShrink: 0, lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>
      )
    })()}

    {daysLeft === 0 && (
      <div style={{ marginTop: 10, padding: 10, background: '#FFF8E1', borderRadius: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#8B6914', marginBottom: 8 }}>🏁 챌린지 종료!</div>
        <button onClick={endSprint}
          style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#8B6914', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          마무리하기
        </button>
      </div>
    )}
    {leaderboardModalOpen && <LeaderboardModal onClose={() => setLeaderboardModalOpen(false)} />}
    {unitPickerForId && sprint && (() => {
      const goal = sprint.goals.find((g) => g.id === unitPickerForId)
      if (!goal) return null
      return (
        <UnitPickerModal
          current={goal.unit}
          onPick={(unit) => updateGoal(goal.id, { unit })}
          onClose={() => setUnitPickerForId(null)}
        />
      )
    })()}
    {editGoalId && sprint && (() => {
      const goal = sprint.goals.find((g) => g.id === editGoalId)
      if (!goal) return null
      const cur = typeof goal.current === 'number' ? goal.current : 0
      const step = goal.smallStep && goal.smallStep > 0 ? goal.smallStep : 1
      return (
        <SprintGoalEditModal
          current={cur}
          step={step}
          target={goal.target}
          unit={goal.unit}
          onSave={(newCur, newStep) => {
            updateGoal(goal.id, { current: newCur, smallStep: newStep })
          }}
          onClose={() => setEditGoalId(null)}
        />
      )
    })()}
    </>
  )
}

// 작은 + step 추가 입력 줄. 빈 카드는 [+ 작게 쪼개기] 버튼 1개로 보이고,
// 누르면 인풋이 펼쳐짐. 입력 후 Enter 또는 ➤ = 추가, 빈 입력으로 다시
// blur 하면 자동 닫힘.
function StepAddRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  function commit() {
    const t = text.trim()
    if (!t) return
    onAdd(t)
    setText('')
    // 인풋 유지 — 연속 입력 편하게
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0) }}
        style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px dashed #d8d8d8', background: 'transparent', color: '#aaa', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}
      >+ 작게 쪼개기</button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          if (e.key === 'Escape') { setOpen(false); setText('') }
        }}
        onBlur={() => { if (!text.trim()) setOpen(false) }}
        placeholder="ex. 컴퓨터 켜서 한문장 쓰기"
        style={{ flex: 1, minWidth: 0, padding: '8px 10px', border: '1.5px solid #fff', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
      />
      <button
        onClick={commit}
        disabled={!text.trim()}
        style={{ width: 36, padding: 0, borderRadius: 8, border: 'none', background: text.trim() ? 'var(--pink)' : '#ddd', color: '#fff', fontSize: 13, cursor: text.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', flexShrink: 0 }}
      >➤</button>
    </div>
  )
}

// ── Firestore sync registration ──────────────────────────────────────────────

// Only push fields when this device has actual data. Otherwise a fresh device
// would silently overwrite the other device's saved sprint/history with
// null/empty on the next queue() — that's the data-loss path users hit.
// Trade-off: explicit deletion (sprint ended) won't propagate via this path,
// since we omit the field. Acceptable until we add tombstones.
registerCollect(() => {
  const out: Partial<UserDoc> = {}
  const sprint = loadSprint()
  const history = loadHistory()
  if (sprint) out.sprint = sprint as unknown
  if (history.length > 0) out.sprintHistory = history as unknown[]
  return out
})

registerHydrate((d: UserDoc) => {
  let changed = false
  // Only adopt remote sprint if remote actually has data. A null/missing
  // sprint on Firestore could be a stale write from another device that
  // never actually had a sprint — don't let it erase local data.
  if (d.sprint) {
    const remote = JSON.stringify(d.sprint)
    const local = localStorage.getItem(KEY) || 'null'
    if (remote !== local) {
      localStorage.setItem(KEY, remote)
      changed = true
    }
  }
  if (Array.isArray(d.sprintHistory) && d.sprintHistory.length > 0) {
    const remote = JSON.stringify(d.sprintHistory)
    const local = localStorage.getItem(HISTORY_KEY) || '[]'
    if (remote !== local) {
      localStorage.setItem(HISTORY_KEY, remote)
      changed = true
    }
  }
  if (changed) window.dispatchEvent(new CustomEvent('ff-sprint-changed'))
})
