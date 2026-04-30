import { useState, useEffect } from 'react'
import { todayStr } from '../../lib/date'

interface SprintGoal {
  id: string
  name: string
  target: number      // 목표 횟수/시간
  unit: string        // 회 / 시간 / 페이지 / etc.
  current: number     // 현재 진척
}

interface Sprint {
  startDate: string
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

function pct(g: SprintGoal): number {
  if (!g.target) return 0
  return Math.min(Math.round((g.current / g.target) * 100), 100)
}

export function SprintBoard() {
  const [sprint, setSprint] = useState<Sprint | null>(loadSprint())

  useEffect(() => { saveSprint(sprint) }, [sprint])

  function startSprint() {
    setSprint({ startDate: todayStr(), goals: [{ id: String(Date.now()), name: '', target: 10, unit: '회', current: 0 }] })
  }

  function endSprint() {
    if (!confirm('스프린트를 끝낼까? 다음 스프린트를 새로 시작할 수 있어')) return
    setSprint(null)
  }

  function addGoal() {
    if (!sprint || sprint.goals.length >= 3) return
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

  function increment(id: string, n: number) {
    if (!sprint) return
    const g = sprint.goals.find((x) => x.id === id)
    if (!g) return
    const next = Math.max(0, g.current + n)
    updateGoal(id, { current: next })
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
    ? Math.round(sprint.goals.reduce((s, g) => s + pct(g), 0) / sprint.goals.length)
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
        {sprint.startDate} 시작 · 평균 진행률 {avgGoal}%
      </div>

      {sprint.goals.map((g) => {
        const p = pct(g)
        return (
          <div key={g.id} style={{ marginBottom: 10, padding: 12, background: 'var(--pl)', borderRadius: 10 }}>
            {/* Name + delete */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
              <input
                value={g.name}
                onChange={(e) => updateGoal(g.id, { name: e.target.value })}
                placeholder="목표 이름 (ex. 운동)"
                style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #fff', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              />
              <button onClick={() => removeGoal(g.id)}
                style={{ background: '#FFF0F0', border: 'none', color: '#E24B4A', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', fontSize: 11 }}>✕</button>
            </div>

            {/* Target + unit */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#666' }}>목표</span>
              <input
                type="number"
                value={g.target}
                onChange={(e) => updateGoal(g.id, { target: Math.max(1, parseInt(e.target.value) || 1) })}
                style={{ width: 60, padding: '4px 8px', border: '1.5px solid #fff', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff', textAlign: 'center' }}
              />
              <select
                value={g.unit}
                onChange={(e) => updateGoal(g.id, { unit: e.target.value })}
                style={{ padding: '4px 6px', border: '1.5px solid #fff', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              >
                <option value="회">회</option>
                <option value="시간">시간</option>
                <option value="분">분</option>
                <option value="페이지">페이지</option>
                <option value="개">개</option>
                <option value="">단위 X</option>
              </select>
              <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>
                {g.current}{g.unit && '/' + g.target + g.unit} ({p}%)
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 8, background: '#fff', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--pink)', width: p + '%', transition: 'width .3s', borderRadius: 4 }} />
            </div>

            {/* Increment buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => increment(g.id, -1)}
                style={{ flex: 1, padding: 6, borderRadius: 6, border: 'none', background: '#fff', color: '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>−1</button>
              <button onClick={() => increment(g.id, 1)}
                style={{ flex: 2, padding: 6, borderRadius: 6, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+1</button>
              <button onClick={() => increment(g.id, 5)}
                style={{ flex: 1, padding: 6, borderRadius: 6, border: 'none', background: 'var(--pd)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+5</button>
            </div>
          </div>
        )
      })}

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
