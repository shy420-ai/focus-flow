import { useState, useEffect } from 'react'
import { todayStr } from '../../lib/date'
import { getXp, addXp, getLevel, xpInLevel } from '../../lib/xp'
import { showMiniToast } from '../../lib/miniToast'

interface SprintGoal {
  id: string
  name: string
  progress: number  // 0-100
  // legacy fields kept for migration
  target?: number
  unit?: string
  current?: number
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
const SPRINT_DAYS = 14

function loadSprint(): Sprint | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Sprint
    s.goals = (s.goals || []).map((g) => {
      // Migrate legacy goals (target/current) → progress
      let progress = typeof g.progress === 'number' ? g.progress : 0
      if (typeof g.progress !== 'number' && typeof g.current === 'number' && typeof g.target === 'number' && g.target > 0) {
        progress = Math.min(100, Math.round((g.current / g.target) * 100))
      }
      return {
        id: g.id || String(Date.now() + Math.random()),
        name: g.name || '',
        progress,
      }
    })
    if (typeof s.overall !== 'number') delete s.overall
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

function sprintOverall(s: { overall?: number; goals: SprintGoal[] }): number {
  if (typeof s.overall === 'number') return s.overall
  if (!s.goals.length) return 0
  const avg = s.goals.reduce((sum, g) => sum + (typeof g.progress === 'number' ? g.progress : 0), 0) / s.goals.length
  return Math.round(avg)
}

export function SprintBoard() {
  const [sprint, setSprint] = useState<Sprint | null>(loadSprint())
  const [history, setHistory] = useState<CompletedSprint[]>(loadHistory())
  const [xp, setXp] = useState<number>(getXp())

  useEffect(() => { saveSprint(sprint) }, [sprint])
  useEffect(() => { saveHistory(history) }, [history])

  function startSprint() {
    setSprint({ startDate: todayStr(), goals: [{ id: String(Date.now()), name: '', progress: 0 }] })
  }

  function endSprint() {
    if (!sprint) return
    if (!confirm('이번 챌린지 끝낼까? 결과는 히스토리에 저장됨')) return
    const completed: CompletedSprint = { startDate: sprint.startDate, endDate: todayStr(), goals: sprint.goals, overall: sprintOverall(sprint) }
    setHistory([...history, completed])
    setSprint(null)
    const result = addXp(100)
    setXp(result.newXp)
    if (result.leveledUp) showMiniToast('🎉 Lv.' + result.newLevel + ' 달성!')
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


  function addDemoHistory() {
    if (!sprint || sprint.goals.length === 0) {
      alert('먼저 목표를 1개 이상 입력해줘 (이름까지). 그 이름으로 가짜 저번 챌린지 만들어줄게')
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
        progress: 60,
      })),
      overall: 60,
    }
    setHistory([...history, fake])
  }

  function clearHistory() {
    if (!confirm('히스토리 다 지울까? (Past Me 비교 사라짐)')) return
    setHistory([])
  }

  const lv = getLevel(xp)
  const xpProg = xpInLevel(xp)
  const levelHeader = (
    <div style={{ background: 'linear-gradient(135deg, var(--pink), var(--pd))', borderRadius: 14, padding: 14, marginBottom: 12, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 11, opacity: 0.85, marginRight: 6 }}>나의 레벨</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>Lv.{lv}</span>
        </div>
        <span style={{ fontSize: 11, opacity: 0.9 }}>{xpProg.current}/{xpProg.needed} XP</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,.2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#fff', width: xpProg.pct + '%', borderRadius: 4, transition: 'width .3s' }} />
      </div>
      <div style={{ fontSize: 9, marginTop: 6, opacity: 0.85 }}>
        +5 XP per 행동 · +100 XP per 챌린지 완료
      </div>
    </div>
  )

  if (!sprint) {
    return (
      <>
      {levelHeader}
      <div style={{ background: '#fff', border: '1.5px dashed var(--pink)', borderRadius: 14, padding: 18, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', marginBottom: 6, textAlign: 'center' }}>⚡ 2주 챌린지 (실험)</div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 14, lineHeight: 1.6, textAlign: 'center' }}>
          ADHD 뇌가 잡을 수 있는 시간 = 약 2주<br />
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
      </>
    )
  }

  const elapsed = daysBetween(sprint.startDate, todayStr())
  const daysLeft = Math.max(SPRINT_DAYS - elapsed, 0)
  const sprintProgress = Math.min((elapsed / SPRINT_DAYS) * 100, 100)
  const overall = sprintOverall(sprint)
  const lastSprint = history.length ? history[history.length - 1] : null
  const lastOverall = lastSprint ? sprintOverall(lastSprint) : null
  const diff = lastOverall != null ? overall - lastOverall : null

  function bumpGoal(id: string, delta: number) {
    if (!sprint) return
    const g = sprint.goals.find((x) => x.id === id)
    if (!g) return
    const cur = typeof g.progress === 'number' ? g.progress : 0
    const next = Math.max(0, Math.min(100, cur + delta))
    updateGoal(id, { progress: next })
    if (next > cur) {
      const result = addXp(next - cur)
      setXp(result.newXp)
      if (result.leveledUp) showMiniToast('🎉 Lv.' + result.newLevel + ' 달성!')
    }
  }

  return (
    <>
    {levelHeader}
    <div style={{ background: '#fff', border: '1.5px solid var(--pink)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>⚡ 챌린지 D-{daysLeft}</div>
        <button onClick={endSprint}
          style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          끝내기
        </button>
      </div>

      <div style={{ height: 4, background: 'var(--pl)', borderRadius: 2, marginBottom: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#ddd', width: sprintProgress + '%', transition: 'width .3s' }} />
      </div>
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 12 }}>
        {sprint.startDate} 시작 · 시간 {Math.round(sprintProgress)}% 경과
      </div>

      {/* 전체 진행률 (큰 카드 - hero) */}
      <div style={{ background: 'linear-gradient(135deg, #FFE0EC, #FFF8FA)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1.5px solid var(--pink)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 6 }}>🎯 챌린지 전체 진행률</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--pd)', lineHeight: 1 }}>{overall}<span style={{ fontSize: 18, color: 'var(--pink)' }}>%</span></span>
          {diff != null && lastOverall != null && (
            diff > 0 ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1FA176' }}>↑ +{diff}% (저번 {lastOverall}%)</span>
            ) : diff < 0 ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#EF9F27' }}>↓ {diff}% (저번 {lastOverall}%)</span>
            ) : (
              <span style={{ fontSize: 12, color: '#888' }}>= 저번이랑 동률</span>
            )
          )}
        </div>
        <div style={{ height: 12, background: '#fff', borderRadius: 6, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--pink)', width: overall + '%', transition: 'width .3s', borderRadius: 6 }} />
        </div>
        <div style={{ fontSize: 10, color: '#888', textAlign: 'center' }}>
          전체 진행률 = 목표들 평균 (자동) · 아래 목표마다 ± 버튼으로 조정
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>📋 이번 챌린지 목표 (최대 3개)</div>
      {sprint.goals.map((g) => {
        const p = typeof g.progress === 'number' ? g.progress : 0
        return (
          <div key={g.id} style={{ marginBottom: 10, padding: 12, background: 'var(--pl)', borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <input
                value={g.name}
                onChange={(e) => updateGoal(g.id, { name: e.target.value })}
                placeholder="이름 (ex.운동)"
                style={{ flex: 1, minWidth: 0, padding: '6px 10px', border: '1.5px solid #fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', minWidth: 40, textAlign: 'right' }}>{p}%</span>
              <button onClick={() => { if (confirm('이 목표를 삭제할까?')) removeGoal(g.id) }}
                style={{ background: '#FFF0F0', border: 'none', color: '#E24B4A', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ height: 8, background: '#fff', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--pink)', width: p + '%', transition: 'width .3s', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => bumpGoal(g.id, -1)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', background: '#fff', color: '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>앗 -1% 🫣</button>
              <button onClick={() => bumpGoal(g.id, 1)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+1%</button>
              <button onClick={() => bumpGoal(g.id, 5)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', background: 'var(--pd)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+5%</button>
              <button onClick={() => bumpGoal(g.id, 10)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, var(--pink), var(--pd))', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+10% 🚀</button>
            </div>
          </div>
        )
      })}

      {sprint.goals.length < 3 && (
        <button onClick={addGoal}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1.5px dashed var(--pl)', background: '#fff', color: 'var(--pd)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 }}>
          + 목표 추가 ({sprint.goals.length}/3)
        </button>
      )}

      {daysLeft === 0 && (
        <div style={{ marginTop: 10, padding: 10, background: '#FFF8E1', borderRadius: 8, fontSize: 11, color: '#8B6914', textAlign: 'center' }}>
          🏁 챌린지 종료! 끝내기 누르면 히스토리 저장 + 다음 챌린지 시작 가능
        </div>
      )}

      {/* Past Me 미리보기 도구 (개발자 전용) */}
      <div style={{ marginTop: 12, padding: 10, background: '#FAFAFA', borderRadius: 8, fontSize: 10, color: '#888', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>🔮 Past Me 미리보기 도구</div>
        <div style={{ marginBottom: 6 }}>실제 챌린지 끝내지 않고도 Past Me가 어떻게 보이는지 확인 가능</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={addDemoHistory}
            style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#666', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            🎯 가짜 저번 챌린지 추가
          </button>
          <button onClick={clearHistory}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            🗑 히스토리 초기화
          </button>
        </div>
        <div style={{ fontSize: 9, color: '#bbb', marginTop: 4 }}>현재 히스토리: {history.length}개</div>
      </div>
    </div>
    </>
  )
}
