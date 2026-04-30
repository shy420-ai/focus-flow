import { useState, useEffect } from 'react'
import { todayStr } from '../../lib/date'

interface SprintGoal {
  id: string
  name: string
  target: number
  unit: string
  current: number
}

interface Sprint {
  startDate: string
  goals: SprintGoal[]
}

interface CompletedSprint {
  startDate: string
  endDate: string
  goals: SprintGoal[]
}

const KEY = 'ff_sprint'
const HISTORY_KEY = 'ff_sprint_history'
const SPRINT_DAYS = 14

function loadSprint(): Sprint | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Sprint
    s.goals = (s.goals || []).map((g) => ({
      id: g.id || String(Date.now() + Math.random()),
      name: g.name || '',
      target: typeof g.target === 'number' && g.target > 0 ? g.target : 10,
      unit: g.unit ?? '회',
      current: typeof g.current === 'number' ? g.current : 0,
    }))
    return s
  } catch {
    return null
  }
}

function saveSprint(s: Sprint | null): void {
  if (s) localStorage.setItem(KEY, JSON.stringify(s))
  else localStorage.removeItem(KEY)
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
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function pct(g: SprintGoal): number {
  if (!g.target) return 0
  return Math.min(Math.round((g.current / g.target) * 100), 100)
}

// Baseline lookup: most recent completed sprint with same goal name
function findBaseline(history: CompletedSprint[], goalName: string): SprintGoal | null {
  const trimmed = goalName.trim()
  if (!trimmed) return null
  for (let i = history.length - 1; i >= 0; i--) {
    const match = history[i].goals.find((g) => g.name.trim() === trimmed)
    if (match) return match
  }
  return null
}

export function SprintBoard() {
  const [sprint, setSprint] = useState<Sprint | null>(loadSprint())
  const [history, setHistory] = useState<CompletedSprint[]>(loadHistory())

  useEffect(() => { saveSprint(sprint) }, [sprint])
  useEffect(() => { saveHistory(history) }, [history])

  function startSprint() {
    setSprint({ startDate: todayStr(), goals: [{ id: String(Date.now()), name: '', target: 10, unit: '회', current: 0 }] })
  }

  function endSprint() {
    if (!sprint) return
    if (!confirm('스프린트를 끝낼까? 결과는 히스토리에 저장됨')) return
    const completed: CompletedSprint = { startDate: sprint.startDate, endDate: todayStr(), goals: sprint.goals }
    setHistory([...history, completed])
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
    const cur = typeof g.current === 'number' && !isNaN(g.current) ? g.current : 0
    const next = Math.max(0, cur + n)
    updateGoal(id, { current: next })
  }

  function addDemoHistory() {
    if (!sprint || sprint.goals.length === 0) {
      alert('먼저 목표를 1개 이상 입력해줘 (이름까지). 그 이름으로 가짜 저번 sprint 만들어줄게')
      return
    }
    const named = sprint.goals.filter((g) => g.name.trim())
    if (named.length === 0) {
      alert('목표 이름을 1개 이상 적어줘. Past Me가 같은 이름끼리 매칭함')
      return
    }
    const fake: CompletedSprint = {
      startDate: '2026-04-15',
      endDate: '2026-04-29',
      goals: named.map((g) => ({
        id: 'demo-' + g.id,
        name: g.name.trim(),
        target: g.target,
        unit: g.unit,
        current: Math.max(1, Math.round(g.target * 0.75)),
      })),
    }
    setHistory([...history, fake])
  }

  function clearHistory() {
    if (!confirm('히스토리 다 지울까? (Past Me 비교 사라짐)')) return
    setHistory([])
  }

  if (!sprint) {
    return (
      <div style={{ background: '#fff', border: '1.5px dashed var(--pink)', borderRadius: 14, padding: 18, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', marginBottom: 6, textAlign: 'center' }}>⚡ 2주 스프린트 (실험)</div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 14, lineHeight: 1.6, textAlign: 'center' }}>
          ADHD 뇌가 잡을 수 있는 시간 = 약 2주<br />
          작은 목표 1~3개로 시작해봐
        </div>

        <div style={{ background: 'var(--pl)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>🧠 목표 잘 세우는 법 (ADHD ver.)</div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.8 }}>
            <div>✅ <b>아주 구체적으로</b> — '운동' X, '운동 12회' O</div>
            <div>✅ <b>작게 쪼개기</b> — 한방에 X, 여러번 점진적</div>
            <div>✅ <b>% 보이게</b> — 끝 안 보이면 ADHD 뇌가 포기함</div>
            <div>✅ <b>1~3개만</b> — 더 많으면 인지부담 폭증</div>
            <div>✅ <b>완벽보다 점진</b> — 50%만 해도 OK, 0보다 1점</div>
          </div>
        </div>

        <button onClick={startSprint}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          🚀 스프린트 시작
        </button>
        {history.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 10, color: '#aaa', textAlign: 'center' }}>
            누적 스프린트 {history.length}개 완료
          </div>
        )}
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
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 8 }}>
        {sprint.startDate} 시작 · 평균 진행률 {avgGoal}%
      </div>
      <div style={{ fontSize: 10, color: '#666', background: 'var(--pl)', borderRadius: 8, padding: '6px 10px', marginBottom: 10, lineHeight: 1.5 }}>
        💡 행동 1번 = +1 탭. 작게 자주 쪼개서 % 채워가는 게 핵심
      </div>

      {sprint.goals.map((g) => {
        const p = pct(g)
        const baseline = findBaseline(history, g.name)
        const baselineCurrent = baseline?.current ?? 0
        const safe = baselineCurrent
        const stretch = Math.round(baselineCurrent * 1.22)
        const risk = Math.round(baselineCurrent * 1.55)
        const diff = baseline ? g.current - baselineCurrent : 0
        return (
          <div key={g.id} style={{ marginBottom: 10, padding: 12, background: 'var(--pl)', borderRadius: 10 }}>
            {/* Name + target + unit + delete (한 줄) */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
              <input
                value={g.name}
                onChange={(e) => updateGoal(g.id, { name: e.target.value })}
                placeholder="이름 (ex.운동)"
                style={{ flex: 1, minWidth: 0, padding: '6px 10px', border: '1.5px solid #fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              />
              <input
                type="number"
                value={g.target}
                onChange={(e) => updateGoal(g.id, { target: Math.max(1, parseInt(e.target.value) || 1) })}
                style={{ width: 50, padding: '6px 4px', border: '1.5px solid #fff', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', textAlign: 'center', flexShrink: 0 }}
              />
              <select
                value={g.unit}
                onChange={(e) => updateGoal(g.id, { unit: e.target.value })}
                style={{ padding: '6px 4px', border: '1.5px solid #fff', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff', flexShrink: 0 }}
              >
                <option value="회">회</option>
                <option value="시간">h</option>
                <option value="분">m</option>
                <option value="페이지">p</option>
                <option value="개">개</option>
                <option value=""></option>
              </select>
              <button onClick={() => { if (confirm('이 목표를 삭제할까?')) removeGoal(g.id) }}
                style={{ background: '#FFF0F0', border: 'none', color: '#E24B4A', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
            </div>

            {/* Big progress display */}
            <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--pd)' }}>
                  {g.current}<span style={{ fontSize: 14, color: '#aaa', fontWeight: 500 }}> / {g.target}{g.unit}</span>
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--pink)' }}>{p}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--pl)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--pink)', width: p + '%', transition: 'width .3s', borderRadius: 4 }} />
              </div>
            </div>

            {/* Increment buttons */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button onClick={() => increment(g.id, -1)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#fff', color: '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.2 }}>되돌리기 ↩️</button>
              <button onClick={() => increment(g.id, 1)}
                style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>내가 해냄 🙌</button>
              <button onClick={() => increment(g.id, 5)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--pd)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+5</button>
            </div>

            {/* Baseline (Past Me) - 동기부여 강화 */}
            {baseline && (() => {
              const maxVal = Math.max(g.target, baselineCurrent, g.current, 1)
              const pastBarPct = (baselineCurrent / maxVal) * 100
              const nowBarPct = (g.current / maxVal) * 100
              return (
                <div style={{ padding: 10, background: '#fff', borderRadius: 10 }}>
                  {/* Big motivating headline */}
                  {diff > 0 ? (
                    <div style={{ background: 'linear-gradient(135deg, #FFE0EC, #FFC8E0)', padding: '10px 12px', borderRadius: 10, marginBottom: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--pd)', marginBottom: 2 }}>🚀 자기 베스트 갱신중</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--pd)', lineHeight: 1.1 }}>+{diff}{g.unit}</div>
                      <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>저번의 너보다 빠름</div>
                    </div>
                  ) : diff < 0 ? (
                    <div style={{ background: '#FFF8E1', padding: '10px 12px', borderRadius: 10, marginBottom: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#8B6914' }}>🫂 {Math.abs(diff)}{g.unit} 뒤지는 중</div>
                      <div style={{ fontSize: 10, color: '#8B6914', marginTop: 2 }}>천천히 따라잡으면 돼</div>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--pl)', padding: '8px 12px', borderRadius: 10, marginBottom: 10, textAlign: 'center', fontSize: 11, color: 'var(--pd)' }}>
                      🤝 저번 sprint랑 동률 — 한 번만 더
                    </div>
                  )}

                  {/* Visual comparison bar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#888', marginBottom: 4 }}>
                      <span style={{ width: 32, flexShrink: 0 }}>저번</span>
                      <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#bbb', borderRadius: 4, width: pastBarPct + '%' }} />
                      </div>
                      <span style={{ width: 36, textAlign: 'right', flexShrink: 0 }}>{baselineCurrent}{baseline.unit}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--pd)' }}>
                      <span style={{ width: 32, fontWeight: 700, flexShrink: 0 }}>지금</span>
                      <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--pink)', borderRadius: 4, width: nowBarPct + '%', transition: 'width .3s' }} />
                      </div>
                      <span style={{ width: 36, textAlign: 'right', fontWeight: 700, flexShrink: 0 }}>{g.current}{g.unit}</span>
                    </div>
                  </div>

                  {/* Quick target picker */}
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>👇 다음 sprint 목표 한번에 정하기</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => updateGoal(g.id, { target: safe || 1, unit: baseline.unit })}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: 10, color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>안전 {safe}{baseline.unit}</button>
                    <button onClick={() => updateGoal(g.id, { target: stretch || 1, unit: baseline.unit })}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 6, border: '1px solid var(--pink)', background: 'var(--pink)', fontSize: 10, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>도전 {stretch}{baseline.unit}</button>
                    <button onClick={() => updateGoal(g.id, { target: risk || 1, unit: baseline.unit })}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 6, border: '1px solid #E24B4A', background: '#fff', fontSize: 10, color: '#E24B4A', cursor: 'pointer', fontFamily: 'inherit' }}>무리 {risk}{baseline.unit}</button>
                  </div>
                </div>
              )
            })()}
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
          🏁 스프린트 종료! 끝내기 누르면 히스토리 저장 + 다음 sprint 시작 가능
        </div>
      )}

      {/* Past Me 미리보기 도구 (개발자 전용) */}
      <div style={{ marginTop: 12, padding: 10, background: '#FAFAFA', borderRadius: 8, fontSize: 10, color: '#888', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>🔮 Past Me 미리보기 도구</div>
        <div style={{ marginBottom: 6 }}>실제 sprint 끝내지 않고도 Past Me가 어떻게 보이는지 확인 가능</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={addDemoHistory}
            style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#666', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            🎯 가짜 저번 sprint 추가
          </button>
          <button onClick={clearHistory}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            🗑 히스토리 초기화
          </button>
        </div>
        <div style={{ fontSize: 9, color: '#bbb', marginTop: 4 }}>현재 히스토리: {history.length}개</div>
      </div>
    </div>
  )
}
