import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/AppStore'
import { getXp, getLevel } from '../../lib/xp'
import { getTopXp, getRankSnapshot, type LeaderEntry } from '../../lib/firestore'

const PREF_KEY = 'ff_leaderboard_on'

export function isLeaderboardOn(): boolean {
  return localStorage.getItem(PREF_KEY) === '1'
}

export function setLeaderboardOn(on: boolean): void {
  if (on) localStorage.setItem(PREF_KEY, '1')
  else localStorage.removeItem(PREF_KEY)
  window.dispatchEvent(new Event('ff-leaderboard-changed'))
}

export function Leaderboard() {
  const uid = useAppStore((s) => s.uid)
  const [top, setTop] = useState<LeaderEntry[]>([])
  const [rank, setRank] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [ahead, setAhead] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const myXp = getXp()
  const myLv = getLevel(myXp)

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
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  if (!uid) {
    return (
      <div style={{ background: '#FAFAFA', borderRadius: 12, padding: 14, marginBottom: 12, textAlign: 'center', fontSize: 11, color: '#888' }}>
        🔑 순위 보려면 로그인 필요 (설정에서 로그인)
      </div>
    )
  }

  const percentile = rank != null && total > 0 ? Math.round((1 - (rank - 1) / total) * 100) : null
  const inTop10 = rank != null && rank <= 10

  return (
    <div style={{ marginBottom: 12 }}>
      {/* My rank summary */}
      <div style={{ background: 'linear-gradient(135deg, #FFE0EC, #FFF8FA)', borderRadius: 12, padding: 12, marginBottom: 8, border: '1.5px solid var(--pink)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)' }}>🏆 나의 위치</span>
          <button onClick={refresh} disabled={loading} style={{ fontSize: 9, color: '#888', background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? '...' : '↻ 새로고침'}
          </button>
        </div>
        {error ? (
          <div style={{ fontSize: 11, color: '#E24B4A' }}>{error}</div>
        ) : rank == null ? (
          <div style={{ fontSize: 11, color: '#888' }}>아직 데이터 부족 — 곧 나타날거야</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--pd)' }}>{rank}<span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}> / {total}</span></span>
              {percentile != null && <span style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 700 }}>상위 {Math.max(100 - percentile, 1)}%</span>}
              {inTop10 && <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--pink)', color: '#fff', padding: '2px 6px', borderRadius: 6 }}>🔥 TOP 10</span>}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>나: Lv.{myLv} ({myXp} XP)</div>
          </>
        )}
      </div>

      {/* People just ahead */}
      {ahead.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 8, border: '1px solid #eee' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#666', marginBottom: 6 }}>🎯 추격 대상 (바로 위 {ahead.length}명)</div>
          {ahead.map((u, i) => {
            const lvl = Math.floor(u.xp / 50) + 1
            const diff = u.xp - myXp
            return (
              <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '3px 0' }}>
                <span style={{ color: '#888', minWidth: 20 }}>↑{ahead.length - i}</span>
                <span style={{ flex: 1, color: '#333' }}>{u.nickname}</span>
                <span style={{ color: '#666' }}>Lv.{lvl}</span>
                <span style={{ color: 'var(--pink)', fontWeight: 700, minWidth: 50, textAlign: 'right' }}>+{diff} XP</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Top 10 hall of fame */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 10, border: '1px solid #eee' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#666', marginBottom: 6 }}>👑 명예의 전당 (Top 10)</div>
        {top.length === 0 ? (
          <div style={{ fontSize: 11, color: '#aaa' }}>{loading ? '불러오는 중...' : '아직 데이터 없음'}</div>
        ) : (
          top.map((u, i) => {
            const lvl = Math.floor(u.xp / 50) + 1
            const isMe = u.uid === uid
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
            return (
              <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 6px', borderRadius: 6, background: isMe ? 'var(--pl)' : 'transparent' }}>
                <span style={{ minWidth: 24, fontSize: i < 3 ? 14 : 11, color: '#666' }}>{medal}</span>
                <span style={{ flex: 1, color: '#333', fontWeight: isMe ? 700 : 400 }}>{u.nickname}{isMe ? ' (나)' : ''}</span>
                <span style={{ color: '#666' }}>Lv.{lvl}</span>
                <span style={{ color: 'var(--pink)', fontWeight: 700, minWidth: 50, textAlign: 'right' }}>{u.xp} XP</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
