// Dev-mode tip-tab analytics. One-shot read of /tipFeedback, aggregates
// reads / likes / comments / bookmarks (excluding the dev's own uid),
// shows TOP 5 by each metric + a full table sorted by reads.
import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../../store/AppStore'
import { useBackClose } from '../../hooks/useBackClose'
import { getAllTipFeedback, type TipFeedbackRow } from '../../lib/tipFeedback'
import { getTip } from '../../data/adhdTips'

interface Props { onClose: () => void }

function relTime(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000))
  if (sec < 60) return `${sec}초 전`
  return `${Math.floor(sec / 60)}분 전`
}

interface Aggregated {
  id: string
  title: string
  reads: number
  likes: number
  bookmarks: number
  comments: number  // top-level only
}

export function TipStatsPanel({ onClose }: Props) {
  useBackClose(true, onClose)
  const myUid = useAppStore((s) => s.uid)
  const [rows, setRows] = useState<TipFeedbackRow[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number>(0)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  function refresh() {
    setRefreshing(true)
    setErr(null)
    getAllTipFeedback()
      .then((r) => { setRows(r); setFetchedAt(Date.now()) })
      .catch((e) => setErr(e instanceof Error ? e.message : '불러오기 실패'))
      .finally(() => setRefreshing(false))
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh() }, [])

  const agg: Aggregated[] = useMemo(() => {
    if (!rows) return []
    return rows.map((r) => {
      const filter = (xs: string[]) => myUid ? xs.filter((u) => u !== myUid) : xs
      const tip = getTip(r.id)
      return {
        id: r.id,
        title: tip?.title || r.id,
        reads: filter(r.reads).length,
        likes: filter(r.likes).length,
        bookmarks: filter(r.bookmarks).length,
        comments: r.comments.filter((c) => !c.parentId && c.fromUid !== myUid).length,
      }
    })
  }, [rows, myUid])

  const totals = useMemo(() => {
    if (!rows) return { uniqueReaders: 0, totalReads: 0, totalLikes: 0, totalBookmarks: 0, totalComments: 0 }
    const readers = new Set<string>()
    let likes = 0, bookmarks = 0, comments = 0, totalReads = 0
    for (const r of rows) {
      for (const u of r.reads) if (u !== myUid) { readers.add(u); totalReads++ }
      likes += r.likes.filter((u) => u !== myUid).length
      bookmarks += r.bookmarks.filter((u) => u !== myUid).length
      comments += r.comments.filter((c) => !c.parentId && c.fromUid !== myUid).length
    }
    return { uniqueReaders: readers.size, totalReads, totalLikes: likes, totalBookmarks: bookmarks, totalComments: comments }
  }, [rows, myUid])

  const top = (key: keyof Pick<Aggregated, 'reads' | 'likes' | 'bookmarks' | 'comments'>, n = 5) =>
    [...agg].sort((a, b) => b[key] - a[key]).filter((x) => x[key] > 0).slice(0, n)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)', zIndex: 9500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--pd)' }}>📊 정보탭 통계</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {fetchedAt > 0 && (
              // eslint-disable-next-line react-hooks/purity
              <span style={{ fontSize: 9, color: '#aaa' }}>{relTime(Date.now() - fetchedAt)}</span>
            )}
            <button onClick={refresh} disabled={refreshing}
              aria-label="새로고침"
              style={{ background: 'var(--pl)', border: 'none', color: 'var(--pd)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: refreshing ? 0.5 : 1 }}
            >{refreshing ? '...' : '↻ 새로고침'}</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 14 }}>네 uid ({myUid?.slice(0, 6) || '?'}…) 는 자동 제외 · 댓글은 본인 작성·답글 제외</div>

          {err && <div style={{ background: '#FFF0F0', color: '#E24B4A', padding: 10, borderRadius: 8, fontSize: 12 }}>{err}</div>}
          {!rows && !err && <div style={{ textAlign: 'center', padding: 30, color: '#aaa', fontSize: 12 }}>불러오는 중…</div>}
          {rows && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 18 }}>
                <Stat label="고유 독자" value={totals.uniqueReaders} emoji="👥" />
                <Stat label="총 읽음 (중복 제외)" value={totals.totalReads} emoji="📖" />
                <Stat label="총 도움됐어" value={totals.totalLikes} emoji="❤️" />
                <Stat label="총 북마크" value={totals.totalBookmarks} emoji="🔖" />
                <Stat label="총 댓글" value={totals.totalComments} emoji="💬" />
                <Stat label="활성 팁" value={agg.filter((a) => a.reads > 0).length} emoji="🟢" />
              </div>

              <Section title="🏆 가장 많이 읽힌 TOP 5" rows={top('reads')} metric="reads" />
              <Section title="❤️ 가장 도움됐어 TOP 5" rows={top('likes')} metric="likes" />
              <Section title="🔖 가장 북마크된 TOP 5" rows={top('bookmarks')} metric="bookmarks" />
              <Section title="💬 댓글 많은 TOP 5" rows={top('comments')} metric="comments" />

              <div style={{ marginTop: 22, fontSize: 12, fontWeight: 800, color: 'var(--pd)', marginBottom: 8 }}>📋 전체 (읽음 순)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[...agg].sort((a, b) => b.reads - a.reads).map((row) => (
                  <div key={row.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: '#fafafa', borderRadius: 8, fontSize: 11 }}>
                    <span style={{ flex: 1, color: 'var(--pd)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</span>
                    <span style={{ color: '#888', whiteSpace: 'nowrap' }}>📖 {row.reads} ❤️ {row.likes} 🔖 {row.bookmarks} 💬 {row.comments}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div style={{ background: 'var(--pl)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{emoji} {label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--pd)' }}>{value.toLocaleString()}</div>
    </div>
  )
}

function Section({ title, rows, metric }: { title: string; rows: Aggregated[]; metric: keyof Pick<Aggregated, 'reads' | 'likes' | 'bookmarks' | 'comments'> }) {
  if (rows.length === 0) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--pd)', marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((row, i) => (
          <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, fontSize: 11 }}>
            <span style={{ width: 18, textAlign: 'center', color: '#888', fontWeight: 700 }}>{i + 1}</span>
            <span style={{ flex: 1, color: 'var(--pd)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</span>
            <span style={{ color: 'var(--pink)', fontWeight: 800 }}>{row[metric]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
