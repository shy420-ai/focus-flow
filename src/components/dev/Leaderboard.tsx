import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/AppStore'
import { getMonthlyXp } from '../../lib/xp'
import { getTopXp, getRankSnapshot, type LeaderEntry } from '../../lib/firestore'
import { useBackClose } from '../../hooks/useBackClose'


function daysLeftThisMonth(): number {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return last.getDate() - now.getDate()
}

function monthLabel(): string {
  const d = new Date()
  return `${d.getMonth() + 1}월`
}

interface Props {
  onClose: () => void
}

export function LeaderboardModal({ onClose }: Props) {
  useBackClose(true, onClose)
  const uid = useAppStore((s) => s.uid)
  const [top, setTop] = useState<LeaderEntry[]>([])
  const [rank, setRank] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [ahead, setAhead] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const myXp = getMonthlyXp()

  async function refresh() {
    if (!uid) return
    setLoading(true)
    setError(null)
    try {
      const [t, r] = await Promise.all([
        getTopXp(10),
        getRankSnapshot(uid, myXp, 5),
      ])
      setTop(t)
      setRank(r.rank)
      setTotal(r.total)
      setAhead(r.ahead)
    } catch (err) {
      console.error(err)
      setError('순위를 불러오지 못했어')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  const percentile = rank != null && total > 0 ? Math.round((1 - (rank - 1) / total) * 100) : null
  const inTop10 = rank != null && rank <= 10
  const dleft = daysLeftThisMonth()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 9050, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 16, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', pointerEvents: 'auto', boxShadow: '0 -8px 24px rgba(0,0,0,.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)' }}>🏆 {monthLabel()} 순위</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 12 }}>
          매월 1일 자동 리셋 · 마감까지 D-{dleft}
        </div>

        {!uid ? (
          <div style={{ background: '#FAFAFA', borderRadius: 12, padding: 14, textAlign: 'center', fontSize: 12, color: '#888' }}>
            🔑 순위 보려면 로그인 필요 (설정에서 로그인)
          </div>
        ) : (
          <>
            {/* My rank summary */}
            <div style={{ background: 'linear-gradient(135deg, #FFE0EC, #FFF8FA)', borderRadius: 12, padding: 12, marginBottom: 10, border: '1.5px solid var(--pink)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)' }}>나의 위치</span>
                <button onClick={refresh} disabled={loading} style={{ fontSize: 9, color: '#888', background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {loading ? '...' : '↻ 새로고침'}
                </button>
              </div>
              {error ? (
                <div style={{ fontSize: 11, color: '#E24B4A' }}>{error}</div>
              ) : rank == null ? (
                <div style={{ fontSize: 11, color: '#888' }}>아직 데이터 부족 — XP 좀 쌓이면 등장</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--pd)' }}>{rank}<span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}> / {total}</span></span>
                    {percentile != null && <span style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 700 }}>상위 {Math.max(100 - percentile, 1)}%</span>}
                    {inTop10 && <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--pink)', color: '#fff', padding: '2px 6px', borderRadius: 6 }}>🔥 TOP 10</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>이번달 {myXp} XP</div>
                </>
              )}
            </div>

            {/* People just ahead */}
            {ahead.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 10, border: '1px solid #eee' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#666', marginBottom: 6 }}>🎯 추격 대상 (바로 위 {ahead.length}명)</div>
                {ahead.map((u, i) => {
                  const diff = u.xp - myXp
                  return (
                    <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '3px 0' }}>
                      <span style={{ color: '#888', minWidth: 20 }}>↑{ahead.length - i}</span>
                      <span style={{ flex: 1, color: '#333' }}>{u.nickname}</span>
                      <span style={{ color: 'var(--pink)', fontWeight: 700, minWidth: 60, textAlign: 'right' }}>+{diff} XP</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Top 10 hall of fame */}
            <div style={{ background: '#fff', borderRadius: 10, padding: 10, border: '1px solid #eee' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#666', marginBottom: 6 }}>👑 명예의 전당 (이번달 Top 10)</div>
              {top.length === 0 ? (
                <div style={{ fontSize: 11, color: '#aaa' }}>{loading ? '불러오는 중...' : '아직 데이터 없음'}</div>
              ) : (
                top.map((u, i) => {
                  const isMe = u.uid === uid
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
                  return (
                    <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 6px', borderRadius: 6, background: isMe ? 'var(--pl)' : 'transparent' }}>
                      <span style={{ minWidth: 24, fontSize: i < 3 ? 14 : 11, color: '#666' }}>{medal}</span>
                      <span style={{ flex: 1, color: '#333', fontWeight: isMe ? 700 : 400 }}>{u.nickname}{isMe ? ' (나)' : ''}</span>
                      <span style={{ color: 'var(--pink)', fontWeight: 700, minWidth: 60, textAlign: 'right' }}>{u.xp} XP</span>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
