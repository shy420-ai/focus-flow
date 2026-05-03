// Team check-in chatroom (dev preview). Each team is its own colored
// 단톡방 — KakaoTalk-style bubbles, avatars, anonymous reactions, photo
// capture with timestamp watermark, daily streak badges.
import { useState, useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '../../store/AppStore'
import {
  TEAMS, REACTIONS, listenTeam, postCheckin, toggleReaction, streakBadge,
  type TeamId, type TeamPost, type ReactionEmoji,
} from '../../lib/teamCheckin'
import { compressImage, uploadTeamPhoto, watermarkStamp } from '../../lib/teamStorage'

const ACTIVE_KEY = 'ff_team_active'
const MAX_LEN = 80
const GROUP_GAP_MS = 2 * 60 * 1000  // sender breaks if last msg > 2 min ago

function loadActive(): TeamId {
  const v = localStorage.getItem(ACTIVE_KEY)
  return TEAMS.find((t) => t.id === v) ? (v as TeamId) : 'job'
}

function clockTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 || 12
  return `${ampm} ${h12}:${m}`
}

// Hash nickname to pick one of a few muted avatar tints. Stable per user.
function avatarColor(nick: string): string {
  const palette = ['#7AB7E8', '#9DC79E', '#E0A87B', '#C49AD9', '#E8A0B8', '#9BC7C4']
  let h = 0
  for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) | 0
  return palette[Math.abs(h) % palette.length]
}

export function TeamView() {
  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const [active, setActive] = useState<TeamId>(loadActive)
  const [posts, setPosts] = useState<TeamPost[]>([])
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  )

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, active)
    const unsub = listenTeam(active, (d) => {
      setPosts([...d.posts].sort((a, b) => a.ts - b.ts))
    })
    return () => unsub()
  }, [active])

  useEffect(() => {
    // Auto-scroll feed to bottom on new message / team switch.
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
  }, [posts.length, active])

  useEffect(() => {
    if (!photoPreview) return
    return () => URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  const meta = TEAMS.find((t) => t.id === active) ?? TEAMS[0]
  const myNick = displayName || (uid ? 'ADHD-' + uid.slice(0, 4) : '익명')

  function pickPhoto() { fileInputRef.current?.click() }
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
        const compressed = await compressImage(photoFile, 800, 0.7, watermarkStamp())
        const tempId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
        photoUrl = await uploadTeamPhoto(active, tempId, compressed)
      }
      await postCheckin(active, uid, myNick, text || (photoUrl ? '📷' : ''), photoUrl)
      setText('')
      clearPhoto()
    } catch (e) {
      console.error('postCheckin failed', e)
      const msg = e instanceof Error ? e.message : String(e)
      alert('업로드 실패\n\n' + msg + '\n\nFirebase Storage 보안 규칙을 확인해줘.')
    } finally {
      setPosting(false)
    }
  }

  async function react(postId: string, emoji: ReactionEmoji) {
    if (!uid) return
    setReactionPickerFor(null)
    try {
      await toggleReaction(active, postId, uid, emoji)
    } catch (e) {
      console.error('toggleReaction failed', e)
    }
  }

  const accent = meta.color
  const bgSoft = meta.bgSoft

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>
      {/* Team chips — segment-style */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 0 6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexShrink: 0 }}>
        {TEAMS.map((t) => {
          const on = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                flexShrink: 0,
                padding: '6px 12px', borderRadius: 99,
                border: 'none',
                background: on ? t.color : '#f3f3f3',
                color: on ? '#fff' : '#777',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: 'background .15s',
              }}
            >
              <span style={{ fontSize: 13 }}>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Sub header — minimal info line */}
      <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', padding: '4px 0 8px', flexShrink: 0 }}>
        익명 · 24h 후 사라짐 · 큰 대화 X
      </div>

      {/* Chat feed */}
      <div
        ref={feedRef}
        style={{
          background: bgSoft,
          borderRadius: 16,
          padding: '12px 10px',
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}
      >
        {posts.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#999', fontSize: 12, lineHeight: 1.7, textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>{meta.emoji}</div>
            <div style={{ fontWeight: 600, color: '#666', marginBottom: 4 }}>아직 인증한 사람이 없어</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>첫 인증 한 줄 남겨봐</div>
          </div>
        ) : (
          posts.map((p, i) => {
            const mine = p.uid === uid
            const prev = i > 0 ? posts[i - 1] : null
            const next = i < posts.length - 1 ? posts[i + 1] : null
            const newGroup = !prev || prev.uid !== p.uid || (p.ts - prev.ts) > GROUP_GAP_MS
            const groupEnd = !next || next.uid !== p.uid || (next.ts - p.ts) > GROUP_GAP_MS
            const reactionEntries = Object.entries(p.reactions).filter(([, uids]) => uids.length > 0)
            const badge = streakBadge(p.streak ?? 0)
            const isOpen = reactionPickerFor === p.id

            return (
              <div key={p.id} style={{
                display: 'flex',
                flexDirection: mine ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 6,
                marginTop: newGroup ? 10 : 1,
              }}>
                {/* Avatar — only for first message of a group, only for others */}
                {!mine && (
                  newGroup ? (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: avatarColor(p.nickname),
                      color: '#fff', fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>{p.nickname.slice(0, 1).toUpperCase()}</div>
                  ) : (
                    <div style={{ width: 32, flexShrink: 0 }} />
                  )
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', maxWidth: '74%' }}>
                  {/* Author + streak — only on first of group, only for others */}
                  {newGroup && !mine && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3, padding: '0 4px' }}>
                      <span style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>{p.nickname}</span>
                      {badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: '#fff', background: badge.color,
                          padding: '1px 6px', borderRadius: 99, lineHeight: 1.4,
                        }}>{badge.emoji} {badge.label}</span>
                      )}
                    </div>
                  )}
                  {newGroup && mine && badge && (
                    <div style={{ marginBottom: 3, padding: '0 4px' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: '#fff', background: badge.color,
                        padding: '1px 6px', borderRadius: 99, lineHeight: 1.4,
                      }}>{badge.emoji} {badge.label}</span>
                    </div>
                  )}

                  {/* Bubble row — bubble + reactions */}
                  <div style={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 4 }}>
                    {/* Bubble */}
                    <div
                      onClick={() => setReactionPickerFor(isOpen ? null : p.id)}
                      style={{
                        background: mine ? accent : '#fff',
                        color: mine ? '#fff' : 'var(--pd)',
                        padding: p.photoUrl && (!p.text || p.text === '📷') ? 3 : '8px 12px',
                        borderRadius: 16,
                        borderTopRightRadius: mine && newGroup ? 4 : 16,
                        borderTopLeftRadius: !mine && newGroup ? 4 : 16,
                        fontSize: 13, lineHeight: 1.5,
                        boxShadow: mine ? 'none' : '0 1px 2px rgba(0,0,0,.05)',
                        wordBreak: 'break-word',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {p.photoUrl && (
                        <img
                          src={p.photoUrl}
                          alt="인증"
                          onClick={(e) => { e.stopPropagation(); setLightbox(p.photoUrl!) }}
                          style={{
                            display: 'block', width: '100%', maxWidth: 240,
                            borderRadius: 13, marginBottom: p.text && p.text !== '📷' ? 6 : 0,
                            cursor: 'zoom-in',
                          }}
                          loading="lazy"
                        />
                      )}
                      {p.text && p.text !== '📷' && <div>{p.text}</div>}
                    </div>

                    {/* Reactions + time stack on bubble side */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', gap: 2 }}>
                      {/* Time only on last msg of group */}
                      {groupEnd && (
                        <span style={{ fontSize: 9, color: '#999', fontWeight: 600, padding: '0 2px' }}>{clockTime(p.ts)}</span>
                      )}
                    </div>
                  </div>

                  {/* Reaction chips — only used ones; tap to toggle */}
                  {reactionEntries.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap', justifyContent: mine ? 'flex-end' : 'flex-start', padding: '0 4px' }}>
                      {reactionEntries.map(([emoji, uids]) => {
                        const mineReacted = !!uid && uids.includes(uid)
                        return (
                          <button
                            key={emoji}
                            onClick={() => react(p.id, emoji as ReactionEmoji)}
                            disabled={!uid}
                            style={{
                              background: mineReacted ? `color-mix(in srgb, ${accent} 18%, #fff)` : '#fff',
                              border: '1px solid ' + (mineReacted ? accent : '#eee'),
                              cursor: uid ? 'pointer' : 'default',
                              padding: '1px 7px', borderRadius: 99,
                              fontSize: 11, fontFamily: 'inherit', fontWeight: 700,
                              color: mineReacted ? 'var(--pd)' : '#888',
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              lineHeight: 1.5,
                            }}
                          >
                            <span>{emoji}</span>
                            <span style={{ fontSize: 10 }}>{uids.length}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Reaction picker — shows when bubble tapped */}
                  {isOpen && (
                    <div style={{
                      display: 'flex', gap: 2, marginTop: 4, padding: '4px 6px',
                      background: '#fff', borderRadius: 99,
                      boxShadow: '0 4px 12px rgba(0,0,0,.12)',
                    }}>
                      {REACTIONS.map((emoji) => {
                        const mineReacted = !!uid && (p.reactions[emoji] ?? []).includes(uid)
                        return (
                          <button
                            key={emoji}
                            onClick={(e) => { e.stopPropagation(); react(p.id, emoji) }}
                            disabled={!uid}
                            style={{
                              background: mineReacted ? `color-mix(in srgb, ${accent} 18%, #fff)` : 'transparent',
                              border: 'none', cursor: uid ? 'pointer' : 'default',
                              padding: '4px 6px', borderRadius: 99, fontSize: 18,
                              fontFamily: 'inherit', lineHeight: 1,
                            }}
                          >{emoji}</button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div style={{
        background: '#fff', borderRadius: 24, marginTop: 8, padding: 6,
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
      }}>
        {photoPreview && (
          <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start', margin: '4px 0 0 8px' }}>
            <img src={photoPreview} alt="미리보기" style={{ maxWidth: 100, maxHeight: 80, borderRadius: 10, display: 'block', border: '1px solid #eee' }} />
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
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          <button
            onClick={pickPhoto}
            disabled={posting}
            title="카메라"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 8,
              fontSize: 20, lineHeight: 1, color: accent, fontFamily: 'inherit', flexShrink: 0,
            }}>📷</button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            placeholder={meta.hint}
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontSize: 14, fontFamily: 'inherit', color: 'var(--pd)',
              background: 'transparent', padding: '10px 4px',
              boxSizing: 'border-box', lineHeight: 1.4,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
            }}
          />
          <button
            onClick={submit}
            disabled={(!text.trim() && !photoFile) || posting || !uid}
            style={{
              padding: '8px 14px', borderRadius: 99, border: 'none',
              background: (text.trim() || photoFile) && uid ? accent : '#ddd',
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: (text.trim() || photoFile) && uid ? 'pointer' : 'default',
              fontFamily: 'inherit', flexShrink: 0,
            }}
          >{posting ? '…' : '전송'}</button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setPhotoFile(f)
          }}
        />
      </div>

      {/* Lightbox — fullscreen photo viewer */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, cursor: 'zoom-out',
          }}
        >
          <img src={lightbox} alt="인증 사진" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
        </div>
      )}
    </div>
  )
}
