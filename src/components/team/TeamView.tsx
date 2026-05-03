// Team check-in feed (dev mode preview). Chat-room style — each team has
// its own color theme, bubbles are oldest-on-top / newest-on-bottom with
// auto-scroll, real-time via onSnapshot, photo attach optional.
import { useState, useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '../../store/AppStore'
import { TEAMS, REACTIONS, listenTeam, postCheckin, toggleReaction, type TeamId, type TeamPost, type ReactionEmoji } from '../../lib/teamCheckin'
import { compressImage, uploadTeamPhoto } from '../../lib/teamStorage'

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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const feedEndRef = useRef<HTMLDivElement>(null)
  // Derive preview URL via memo (not state) so we don't write state in an
  // effect — the eslint react-hooks/set-state-in-effect rule forbids that.
  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  )

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, active)
    const unsub = listenTeam(active, (d) => {
      // Oldest on top, newest at bottom — chat-room order.
      setPosts([...d.posts].sort((a, b) => a.ts - b.ts))
    })
    return () => unsub()
  }, [active])

  // Auto-scroll to bottom when new messages arrive (chat behavior).
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [posts.length, active])

  // Clean up the preview blob URL when the file changes / unmounts.
  useEffect(() => {
    if (!photoPreview) return
    return () => URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  const meta = TEAMS.find((t) => t.id === active) ?? TEAMS[0]
  const myNick = displayName || (uid ? 'ADHD-' + uid.slice(0, 4) : '익명')

  function pickPhoto() {
    fileInputRef.current?.click()
  }
  function clearPhoto() {
    setPhotoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submit() {
    if (!uid || posting) return
    if (!text.trim() && !photoFile) return
    setPosting(true)
    try {
      let photoUrl: string | undefined
      if (photoFile) {
        const compressed = await compressImage(photoFile, 800, 0.7)
        const tempId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
        photoUrl = await uploadTeamPhoto(active, tempId, compressed)
      }
      await postCheckin(active, uid, myNick, text || (photoUrl ? '📷' : ''), photoUrl)
      setText('')
      clearPhoto()
    } catch (e) {
      console.error('postCheckin failed', e)
      alert('업로드 실패 — Storage 권한 또는 네트워크 확인')
    } finally {
      setPosting(false)
    }
  }

  async function react(postId: string, emoji: ReactionEmoji) {
    if (!uid) return
    try {
      await toggleReaction(active, postId, uid, emoji)
    } catch (e) {
      console.error('toggleReaction failed', e)
    }
  }

  // Per-team color theme — banner / bubble accents / send button.
  const accent = meta.color
  const bgSoft = meta.bgSoft

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
      {/* Team header — banner color matches team */}
      <div style={{
        background: `linear-gradient(135deg, ${bgSoft} 0%, #fff 100%)`,
        borderRadius: 18, padding: '14px 18px', marginBottom: 10,
        borderLeft: `4px solid ${accent}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{meta.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: 'var(--pd)', fontWeight: 800 }}>
              팀 {meta.label} 단톡방 <span style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>(베타)</span>
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>익명 인증 · 24h 후 사라짐</div>
          </div>
        </div>
      </div>

      {/* Team chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10, paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
        {TEAMS.map((t) => {
          const on = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                flexShrink: 0,
                padding: '7px 14px', borderRadius: 99,
                border: '1.5px solid ' + (on ? t.color : '#eee'),
                background: on ? `color-mix(in srgb, ${t.color} 14%, #fff)` : '#fff',
                color: on ? t.color : '#888',
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

      {/* Chat feed — oldest on top, newest at bottom. Fixed-ish height
          with internal scroll so the composer stays anchored. */}
      <div style={{
        background: bgSoft,
        borderRadius: 14, padding: 10, marginBottom: 8,
        minHeight: 220, maxHeight: 'calc(100vh - 360px)', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        border: '1px solid color-mix(in srgb, ' + accent + ' 25%, #fff)',
      }}>
        {posts.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#999', fontSize: 12, lineHeight: 1.7 }}>
            아직 오늘 인증한 사람이 없어<br />
            <span style={{ fontSize: 10, color: '#bbb' }}>네가 첫 번째 인증자가 되어볼래?</span>
          </div>
        ) : (
          posts.map((p, i) => {
            const mine = p.uid === uid
            const prev = i > 0 ? posts[i - 1] : null
            // Show author label only when sender changes (chat threading style).
            const showAuthor = !prev || prev.uid !== p.uid
            const align = mine ? 'flex-end' : 'flex-start'
            const bubbleBg = mine ? accent : '#fff'
            const textColor = mine ? '#fff' : 'var(--pd)'
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: align, marginBottom: 6 }}>
                {showAuthor && !mine && (
                  <div style={{ fontSize: 10, color: '#777', fontWeight: 700, marginBottom: 2, marginLeft: 8 }}>{p.nickname}</div>
                )}
                <div style={{
                  maxWidth: '78%',
                  background: bubbleBg, color: textColor,
                  padding: p.photoUrl && !p.text ? 4 : '8px 12px',
                  borderRadius: 14,
                  borderTopRightRadius: mine ? 4 : 14,
                  borderTopLeftRadius: mine ? 14 : 4,
                  fontSize: 13, lineHeight: 1.5,
                  boxShadow: mine ? 'none' : '0 1px 2px rgba(0,0,0,.04)',
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                }}>
                  {p.photoUrl && (
                    <img
                      src={p.photoUrl}
                      alt="인증 사진"
                      style={{
                        display: 'block', width: '100%', maxWidth: 240,
                        borderRadius: 10, marginBottom: p.text ? 6 : 0,
                      }}
                      loading="lazy"
                    />
                  )}
                  {p.text && p.text !== '📷' && <div>{p.text}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, padding: mine ? '0 4px 0 0' : '0 0 0 8px', flexDirection: mine ? 'row-reverse' : 'row' }}>
                  <span style={{ fontSize: 9, color: '#aaa', fontWeight: 600 }}>{relTs(p.ts)}</span>
                  {/* Reactions inline */}
                  {REACTIONS.map((emoji) => {
                    const uids = p.reactions[emoji] ?? []
                    const count = uids.length
                    const mineReacted = !!uid && uids.includes(uid)
                    if (count === 0 && !mineReacted) {
                      // Show empty button only on hover would be nice; for now keep all visible
                      // but smaller until first reaction.
                      return (
                        <button
                          key={emoji}
                          onClick={() => react(p.id, emoji)}
                          disabled={!uid}
                          style={{
                            background: 'none', border: 'none', cursor: uid ? 'pointer' : 'default',
                            padding: '2px 3px', fontSize: 11, opacity: 0.4, lineHeight: 1,
                            fontFamily: 'inherit',
                          }}
                        >{emoji}</button>
                      )
                    }
                    return (
                      <button
                        key={emoji}
                        onClick={() => react(p.id, emoji)}
                        disabled={!uid}
                        style={{
                          background: mineReacted ? `color-mix(in srgb, ${accent} 18%, #fff)` : '#fff',
                          border: '1px solid ' + (mineReacted ? accent : '#eee'),
                          cursor: uid ? 'pointer' : 'default',
                          padding: '1px 6px', borderRadius: 99,
                          fontSize: 10, fontFamily: 'inherit', fontWeight: 700,
                          color: mineReacted ? 'var(--pd)' : '#888',
                          display: 'inline-flex', alignItems: 'center', gap: 2,
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ fontSize: 11 }}>{emoji}</span>
                        {count > 0 && <span>{count}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Composer — sticky-ish at bottom of feed area */}
      <div style={{
        background: '#fff', border: `1.5px solid ${accent}`, borderRadius: 14,
        padding: 8,
      }}>
        {photoPreview && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 6 }}>
            <img src={photoPreview} alt="미리보기" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 8, display: 'block' }} />
            <button
              onClick={clearPhoto}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 20, height: 20, borderRadius: '50%',
                background: '#000', color: '#fff', border: '2px solid #fff',
                cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: 0,
                lineHeight: 1, fontFamily: 'inherit',
              }}>×</button>
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          placeholder={meta.hint}
          rows={2}
          style={{
            width: '100%', border: 'none', outline: 'none', resize: 'none',
            fontSize: 13, fontFamily: 'inherit', color: 'var(--pd)',
            background: 'transparent', padding: '4px 2px', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={pickPhoto}
              disabled={posting}
              title="사진 추가"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                fontSize: 18, lineHeight: 1, color: accent, fontFamily: 'inherit',
              }}>📷</button>
            <span style={{ fontSize: 10, color: '#bbb', fontWeight: 600 }}>{text.length}/{MAX_LEN}</span>
          </div>
          <button
            onClick={submit}
            disabled={(!text.trim() && !photoFile) || posting || !uid}
            style={{
              padding: '6px 14px', borderRadius: 99, border: 'none',
              background: (text.trim() || photoFile) && uid ? accent : '#ddd',
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: (text.trim() || photoFile) && uid ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}
          >{posting ? '올리는 중…' : '인증'}</button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setPhotoFile(f)
          }}
        />
      </div>
    </div>
  )
}
