import { useState, useEffect } from 'react'
import { todayStr } from '../../lib/date'

interface SprintGoal {
  id: string
  name: string
  progress: number  // 0-100
}

interface Sprint {
  startDate: string  // YYYY-MM-DD
  goals: SprintGoal[]
}

const KEY = 'ff_sprint'
const SPRINT_DAYS = 14

function loadSprint(): Sprint | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Sprint) : null
  } catch {
    return null
  }
}

function saveSprint(s: Sprint | null): void {
  if (s) localStorage.setItem(KEY, JSON.stringify(s))
  else localStorage.removeItem(KEY)
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function SprintBoard() {
  const [sprint, setSprint] = useState<Sprint | null>(loadSprint())

  useEffect(() => { saveSprint(sprint) }, [sprint])

  function startSprint() {
    setSprint({ startDate: todayStr(), goals: [{ id: String(Date.now()), name: '', progress: 0 }] })
  }

  function endSprint() {
    if (!confirm('스프린트를 끝낼까? 다음 스프린트를 새로 시작할 수 있어')) return
    setSprint(null)
  }

  function addGoal() {
    if (!sprint || sprint.goals.length >= 3) return
    setSprint({ ...sprint, goals: [...sprint.goals, { id: String(Date.now()), name: '', progress: 0 }] })
  }

  function updateGoal(id: string, patch: Partial<SprintGoal>) {
    if (!sprint) return
    setSprint({ ...sprint, goals: sprint.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
  }

  function removeGoal(id: string) {
    if (!sprint) return
    setSprint({ ...sprint, goals: sprint.goals.filter((g) => g.id !== id) })
  }

  if (!sprint) {
    return (
      <div style={{ background: '#fff', border: '1.5px dashed var(--pink)', borderRadius: 14, padding: 18, marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 4 }}>⚡ 2주 스프린트 (실험)</div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 12, lineHeight: 1.5 }}>
          ADHD 뇌가 잡을 수 있는 시간 = 약 2주<br />
          작은 목표 1~3개로 시작해봐
        </div>
        <button onClick={startSprint}
          style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          🚀 스프린트 시작
        </button>
      </div>
    )
  }

  const elapsed = daysBetween(sprint.startDate, todayStr())
  const daysLeft = Math.max(SPRINT_DAYS - elapsed, 0)
  const sprintProgress = Math.min((elapsed / SPRINT_DAYS) * 100, 100)
  const avgGoal = sprint.goals.length
    ? Math.round(sprint.goals.reduce((s, g) => s + g.progress, 0) / sprint.goals.length)
    : 0

  return (
    <div style={{ background: '#fff', border: '1.5px solid var(--pink)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>⚡ 스프린트 D-{daysLeft}</div>
        <button onClick={endSprint}
          style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          끝내기
        </button>
      </div>

      <div style={{ height: 6, background: 'var(--pl)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--pink)', width: sprintProgress + '%', transition: 'width .3s' }} />
      </div>
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 12 }}>
        {sprint.startDate} 시작 · 평균 목표 진행률 {avgGoal}%
      </div>

      {sprint.goals.map((g) => (
        <div key={g.id} style={{ marginBottom: 10, padding: 10, background: 'var(--pl)', borderRadius: 10 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            <input
              value={g.name}
              onChange={(e) => updateGoal(g.id, { name: e.target.value })}
              placeholder="목표 (ex. 운동 12회)"
              style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #fff', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
            />
            <button onClick={() => removeGoal(g.id)}
              style={{ background: '#FFF0F0', border: 'none', color: '#E24B4A', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min={0} max={100} value={g.progress}
              onChange={(e) => updateGoal(g.id, { progress: parseInt(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', minWidth: 36, textAlign: 'right' }}>{g.progress}%</span>
          </div>
        </div>
      ))}

      {sprint.goals.length < 3 && (
        <button onClick={addGoal}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1.5px dashed var(--pl)', background: '#fff', color: 'var(--pd)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          + 목표 추가 ({sprint.goals.length}/3)
        </button>
      )}

      {daysLeft === 0 && (
        <div style={{ marginTop: 10, padding: 10, background: '#FFF8E1', borderRadius: 8, fontSize: 11, color: '#8B6914', textAlign: 'center' }}>
          🏁 스프린트 종료! 회고하고 새 스프린트 시작해볼까?
        </div>
      )}
    </div>
  )
}
