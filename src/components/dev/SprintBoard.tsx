import { useState, useEffect } from 'react'
import { todayStr } from '../../lib/date'
import { getXp, addXp, getLevel, xpInLevel } from '../../lib/xp'
import { showMiniToast } from '../../lib/miniToast'
import { showConfirm } from '../../lib/showConfirm'
import { LeaderboardModal } from './Leaderboard'
import { isLeaderboardOn } from '../../lib/leaderboardPref'

interface SprintGoal {
  id: string
  name: string
  target: number   // 목표 (10회, 10분, ...)
  unit: string     // 회 / 시간 / 분 / 페이지 / 개 / ''
  current: number  // 현재 누적
  smallStep?: number  // +버튼 작은 단위 (default 1)
  bigStep?: number    // +버튼 큰 단위 (default 5)
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
    s.goals = (s.goals || []).map((g: { id?: string; name?: string; target?: number; unit?: string; current?: number; progress?: number }) => {
      // Migrate either shape to current target/unit/current model
      const target = typeof g.target === 'number' && g.target > 0 ? g.target : 10
      const unit = typeof g.unit === 'string' ? g.unit : '회'
      let current = typeof g.current === 'number' ? g.current : 0
      if (typeof g.current !== 'number' && typeof g.progress === 'number') {
        current = Math.round((g.progress / 100) * target)
      }
      return {
        id: g.id || String(Date.now() + Math.random()),
        name: g.name || '',
        target,
        unit,
        current,
      }
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

function goalPct(g: SprintGoal): number {
  if (!g.target) return 0
  return Math.min(100, Math.round((g.current / g.target) * 100))
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
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false)
  useEffect(() => {
    function onChange() { setLeaderboardOnState(isLeaderboardOn()) }
    window.addEventListener('ff-leaderboard-changed', onChange)
    return () => window.removeEventListener('ff-leaderboard-changed', onChange)
  }, [])

  useEffect(() => { saveSprint(sprint) }, [sprint])
  useEffect(() => { saveHistory(history) }, [history])

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
    const result = addXp(100)
    setXp(result.newXp)
    if (result.leveledUp) showMiniToast('🎉 Lv.' + result.newLevel + ' 달성!')
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


  const lv = getLevel(xp)
  const xpProg = xpInLevel(xp)
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
  const sprintProgress = Math.min((elapsed / SPRINT_DAYS) * 100, 100)
  const overall = sprintOverall(sprint)
  const lastSprint = history.length ? history[history.length - 1] : null
  const lastOverall = lastSprint ? sprintOverall(lastSprint) : null
  const diff = lastOverall != null ? overall - lastOverall : null

  function bumpGoal(id: string, delta: number) {
    if (!sprint) return
    const g = sprint.goals.find((x) => x.id === id)
    if (!g) return
    const cur = typeof g.current === 'number' ? g.current : 0
    const next = Math.max(0, cur + delta)
    updateGoal(id, { current: next })
    if (next > cur) {
      const result = addXp(5 * (next - cur))
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
        const p = goalPct(g)
        return (
          <div key={g.id} style={{ marginBottom: 10, padding: 12, background: 'var(--pl)', borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
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
                style={{ width: 46, padding: '6px 4px', border: '1.5px solid #fff', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff', textAlign: 'center', flexShrink: 0 }}
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
              <button onClick={async () => { if (await showConfirm('이 목표를 삭제할까?')) removeGoal(g.id) }}
                style={{ background: '#FFF0F0', border: 'none', color: '#E24B4A', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--pd)' }}>
                {g.current}<span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>/{g.target}{g.unit}</span>
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pink)' }}>{p}%</span>
            </div>
            <div style={{ height: 8, background: '#fff', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--pink)', width: p + '%', transition: 'width .3s', borderRadius: 4 }} />
            </div>
            {(() => {
              const step = g.smallStep && g.smallStep > 0 ? g.smallStep : 1
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => bumpGoal(g.id, -step)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#fff', color: '#888', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>아쉽다 🫣 -{step}</button>
                  <input
                    type="number"
                    value={step}
                    onChange={(e) => updateGoal(g.id, { smallStep: Math.max(1, parseInt(e.target.value) || 1) })}
                    aria-label="버튼 단위"
                    style={{ width: 44, padding: '6px 0', border: '1.5px solid #fff', borderRadius: 8, fontSize: 12, textAlign: 'center', fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#888', flexShrink: 0 }}
                  />
                  <button onClick={() => bumpGoal(g.id, step)}
                    style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>내가 해냄 🙌 +{step}</button>
                </div>
              )
            })()}
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

    </div>
    {leaderboardModalOpen && <LeaderboardModal onClose={() => setLeaderboardModalOpen(false)} />}
    </>
  )
}
