// Team check-in feed (dev mode preview). 4 fixed teams, one-line posts,
// hearts only, 24h auto-expire. No comments, no DMs, no photos — the
// whole point is "low pressure body doubling for ADHD".
import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/AppStore'
import { TEAMS, listenTeam, postCheckin, toggleHeart, type TeamId, type TeamPost } from '../../lib/teamCheckin'

const ACTIVE_KEY = 'ff_team_active'
const MAX_LEN = 80

function loadActive(): TeamId {
  const v = localStorage.getItem(ACTIVE_KEY)
  return TEAMS.find((t) => t.id === v) ? (v as TeamId) : 'job'
}

function relTs(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return m + '분 전'
  const h = Math.floor(m / 60)
  return h + '시간 전'
}

export function TeamView() {
  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const [active, setActive] = useState<TeamId>(loadActive)
  const [posts, setPosts] = useState<TeamPost[]>([])
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, active)
    const unsub = listenTeam(active, (d) => {
      setPosts([...d.posts].sort((a, b) => b.ts - a.ts))
    })
    return () => unsub()
  }, [active])

  const meta = TEAMS.find((t) => t.id === active) ?? TEAMS[0]
  const myNick = displayName || (uid ? 'ADHD-' + uid.slice(0, 4) : '익명')

  async function submit() {
    if (!uid || !text.trim() || posting) return
    setPosting(true)
    try {
      await postCheckin(active, uid, myNick, text)
      setText('')
    } catch (e) {
      console.error('postCheckin failed', e)
    } finally {
      setPosting(false)
    }
  }

  async function heart(postId: string) {
    if (!uid) return
    try {
      await toggleHeart(active, postId, uid)
    } catch (e) {
      console.error('toggleHeart failed', e)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
      <div style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--pl) 70%, #fff) 0%, #fff 100%)',
        borderRadius: 18, padding: '14px 18px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 14, color: 'var(--pd)', fontWeight: 800, marginBottom: 2 }}>
          👥 팀 인증 <span style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>(베타)</span>
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>한 줄로 인증만 · 큰 대화 X · 24시간 후 자동 사라짐</div>
      </div>

      {/* Team chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
        {TEAMS.map((t) => {
          const on = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                flexShrink: 0,
                padding: '7px 14px', borderRadius: 99,
                border: '1.5px solid ' + (on ? 'var(--pink)' : '#eee'),
                background: on ? 'color-mix(in srgb, var(--pink) 18%, #fff)' : '#fff',
                color: on ? 'var(--pd)' : '#888',
                fontSize: 12, fontWeight: on ? 700 : 600, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>{t.emoji}</span>
              <span style={{ color: on ? 'var(--pd)' : '#666' }}>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Composer */}
      <div style={{ background: '#fff', border: '1.5px solid color-mix(in srgb, var(--pl) 70%, #fff)', borderRadius: 14, padding: 10, marginBottom: 14 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          placeholder={meta.hint}
          rows={2}
          style={{
            width: '100%', border: 'none', outline: 'none', resize: 'none',
            fontSize: 13, fontFamily: 'inherit', color: 'var(--pd)',
            background: 'transparent', padding: '4px 2px',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#bbb', fontWeight: 600 }}>{text.length}/{MAX_LEN}</span>
          <button
            onClick={submit}
            disabled={!text.trim() || posting || !uid}
            style={{
              padding: '6px 14px', borderRadius: 99, border: 'none',
              background: text.trim() && uid ? 'var(--pink)' : '#ddd',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: text.trim() && uid ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}
          >{posting ? '올리는 중…' : '인증 올리기'}</button>
        </div>
      </div>

      {/* Feed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '0 2px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)' }}>{meta.emoji} {meta.label} 인증</span>
        <span style={{ background: 'color-mix(in srgb, var(--pink) 25%, #fff)', color: 'var(--pd)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
          {posts.length}개
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, color-mix(in srgb, var(--pl) 80%, #fff), transparent)' }} />
      </div>

      {posts.length === 0 ? (
        <div style={{ background: 'color-mix(in srgb, var(--pl) 25%, #fff)', borderRadius: 14, padding: '24px 16px', textAlign: 'center', color: '#999', fontSize: 12, lineHeight: 1.7 }}>
          아직 오늘 인증한 사람이 없어<br />
          <span style={{ fontSize: 10, color: '#bbb' }}>네가 첫 번째 인증자가 되어볼래?</span>
        </div>
      ) : (
        posts.map((p) => {
          const mine = p.uid === uid
          const liked = !!uid && p.hearts.includes(uid)
          return (
            <div key={p.id} style={{
              background: '#fff', borderRadius: 12, padding: '10px 12px', marginBottom: 6,
              border: '1px solid #f5f5f5',
              borderLeft: '3px solid ' + (mine ? 'var(--pink)' : '#eee'),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: mine ? 'var(--pink)' : 'var(--pd)' }}>
                  {p.nickname}{mine ? ' (나)' : ''}
                </span>
                <span style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>{relTs(p.ts)}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--pd)', lineHeight: 1.5, marginBottom: 6 }}>{p.text}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => heart(p.id)}
                  disabled={!uid}
                  style={{
                    background: 'none', border: 'none', cursor: uid ? 'pointer' : 'default',
                    fontSize: 12, padding: '2px 6px', color: liked ? 'var(--pink)' : '#bbb',
                    fontFamily: 'inherit', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{liked ? '♥' : '♡'}</span>
                  {p.hearts.length > 0 && <span>{p.hearts.length}</span>}
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
