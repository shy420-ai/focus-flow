// Team check-in chatroom (dev preview). Each team is its own colored
// 단톡방 — KakaoTalk-style bubbles, avatars, anonymous reactions, photo
// capture with timestamp watermark, daily streak badges.
import { useState, useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '../../store/AppStore'
import {
  TEAMS, REACTIONS, COLOR_SWATCHES, listenTeam, postCheckin, toggleReaction, deletePost, adminDeletePost,
  streakBadge, getTeamMeta, setTeamColor,
  type TeamId, type TeamPost, type ReactionEmoji,
} from '../../lib/teamCheckin'
import { compressImage, uploadTeamPhoto, watermarkStamp, blobToDataUrl, withTimeout } from '../../lib/teamStorage'
import { CameraCaptureModal } from './CameraCaptureModal'
import { TeamAvatar } from './TeamAvatar'
import { useBackClose } from '../../hooks/useBackClose'
import { isAdminCached, banUser } from '../../lib/banList'
import { showConfirm } from '../../lib/showConfirm'

const ACTIVE_KEY = 'ff_team_active'
const ROOM_KEY = 'ff_team_inroom'  // null = list view, TeamId = inside that room
const HIDDEN_KEY = 'ff_team_hidden_rooms'  // JSON string[] — rooms hidden from list
// 30자 = 사진 정중앙 캡션이 2줄 안에 안전하게 들어가는 한계 + 인증 형식상
// 짧은 한 줄을 유도. 텍스트 단독 메시지에도 동일 적용 — 큰 대화 X 컨셉.
const MAX_LEN = 30
const GROUP_GAP_MS = 2 * 60 * 1000  // sender breaks if last msg > 2 min ago

function loadActive(): TeamId {
  const v = localStorage.getItem(ACTIVE_KEY)
  return TEAMS.find((t) => t.id === v) ? (v as TeamId) : 'job'
}
function loadInRoom(): TeamId | null {
  const v = localStorage.getItem(ROOM_KEY)
  return TEAMS.find((t) => t.id === v) ? (v as TeamId) : null
}
function loadHiddenRooms(): TeamId[] {
  try {
    const arr = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]') as string[]
    return arr.filter((id) => TEAMS.some((t) => t.id === id)) as TeamId[]
  } catch { return [] }
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
  const [inRoom, setInRoomState] = useState<TeamId | null>(loadInRoom)
  const [hiddenRooms, setHiddenRooms] = useState<TeamId[]>(loadHiddenRooms)
  const [roomSettingsOpen, setRoomSettingsOpen] = useState(false)
  const setInRoom = (id: TeamId | null) => {
    if (id) localStorage.setItem(ROOM_KEY, id)
    else localStorage.removeItem(ROOM_KEY)
    setInRoomState(id)
  }
  // 시스템 뒤로가기 = 채팅방 나가기 → 방 리스트
  useBackClose(inRoom !== null, () => setInRoom(null))
  // bump on color overrides changing so memoized 'meta' below recomputes.
  const [, setColorBump] = useState(0)
  useEffect(() => {
    function onHidden() { setHiddenRooms(loadHiddenRooms()) }
    function onColors() { setColorBump((n) => n + 1) }
    window.addEventListener('ff-team-hidden-changed', onHidden)
    window.addEventListener('ff-team-colors-changed', onColors)
    return () => {
      window.removeEventListener('ff-team-hidden-changed', onHidden)
      window.removeEventListener('ff-team-colors-changed', onColors)
    }
  }, [])
  const [posts, setPosts] = useState<TeamPost[]>([])
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
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

  const meta = getTeamMeta(active)
  // 우선순위: 사용자가 설정한 닉네임 > 구글 표시 이름 > ADHD-uid 폴백.
  // 실명 노출이 부담스러운 사용자도 SettingsPopup에서 닉네임 바꾸면 즉시 적용됨.
  const customNick = (localStorage.getItem('ff_nickname') || '').trim()
  const myNick = customNick || displayName || (uid ? 'ADHD-' + uid.slice(0, 4) : '익명')
  const amAdmin = isAdminCached(uid)

  async function handleBan(targetUid: string, targetNick: string) {
    if (!uid) return
    const reason = window.prompt(
      `${targetNick} 계정 영구 정지. 사유 입력 (밴 사유는 본인에게 표시됨):`,
      '얼굴/노출 사진 업로드 — 커뮤니티 가이드라인 위반',
    )
    if (!reason) return
    try {
      await banUser(targetUid, reason, uid)
      alert('영구 정지 처리 완료. 다음 세션부터 적용됨.')
    } catch (e) {
      console.error('banUser failed', e)
      alert('밴 실패: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  function openCamera() { setCameraOpen(true) }
  function pickFromGallery() {
    setCameraOpen(false)
    fileInputRef.current?.click()
  }
  function clearPhoto() {
    setPhotoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submit() {
    if (!uid) return
    // Tap-while-posting = escape hatch. Reset state and let user retry.
    if (posting) {
      setPosting(false)
      setErrorMsg('전송 강제 취소됨. 다시 시도해줘.')
      return
    }
    // Photo-only policy — text without photo is rejected.
    if (!photoFile) {
      setErrorMsg('📷 사진 인증만 받아요. 카메라 버튼 눌러서 인증샷 찍어줘.')
      return
    }
    setPosting(true)
    setErrorMsg(null)
    // Hard-stop after 15s so the button can never get permanently stuck
    // when Storage / Firestore hangs (e.g. Storage not enabled).
    const safety = setTimeout(() => {
      setPosting(false)
      setErrorMsg('업로드 시간 초과 (15초). 네트워크 또는 Firebase Storage 설정을 확인해줘. 사진 없이는 텍스트만 올라감.')
    }, 15000)
    try {
      let photoUrl: string | undefined
      // When a photo is attached, the text caption is burned INTO the photo
      // as a styled overlay — not stored as a separate text bubble. The
      // post's text field becomes a sentinel ('📷') so feed knows it's a
      // pure-photo bubble.
      const captionForPhoto = photoFile ? text.trim().slice(0, 80) : ''
      if (photoFile) {
        const stamp = watermarkStamp()
        try {
          const compressed = await compressImage(photoFile, 800, 0.7, stamp, captionForPhoto)
          const tempId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
          photoUrl = await withTimeout(uploadTeamPhoto(active, tempId, compressed), 5000, 'storage timeout')
        } catch (storageErr) {
          console.warn('Storage upload failed, falling back to base64:', storageErr)
          const small = await compressImage(photoFile, 480, 0.55, stamp, captionForPhoto)
          photoUrl = await blobToDataUrl(small)
        }
      }
      const postText = photoUrl ? '📷' : text
      await postCheckin(active, uid, myNick, postText, photoUrl)
      setText('')
      clearPhoto()
    } catch (e) {
      console.error('postCheckin failed', e)
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMsg(msg)
    } finally {
      clearTimeout(safety)
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

  async function handleDeleteMine(postId: string) {
    if (!uid) return
    const ok = await showConfirm('이 인증을 삭제할까?\n\n남이 남긴 리액션도 함께 사라져.')
    if (!ok) return
    try {
      await deletePost(active, postId, uid)
    } catch (e) {
      console.error('deletePost failed', e)
      setErrorMsg('삭제 실패: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  async function handleDeleteAsAdmin(postId: string, nick: string) {
    const ok = await showConfirm(`운영자 권한으로 삭제할까?\n\n${nick}의 인증이 모든 사용자에게서 사라져.`)
    if (!ok) return
    try {
      await adminDeletePost(active, postId)
    } catch (e) {
      console.error('adminDeletePost failed', e)
      setErrorMsg('운영 삭제 실패: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const accent = meta.color
  const bgSoft = meta.bgSoft

  // Room-list view (KakaoTalk-style). Tapping a card enters chat mode.
  if (inRoom === null) {
    const visibleTeams = TEAMS.filter((t) => !hiddenRooms.includes(t.id))
    function toggleHidden(id: TeamId) {
      const next = hiddenRooms.includes(id)
        ? hiddenRooms.filter((x) => x !== id)
        : [...hiddenRooms, id]
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next))
      setHiddenRooms(next)
    }
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '8px 4px 16px' }}>
        <div style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--pl) 70%, #fff) 0%, #fff 100%)', borderRadius: 18, padding: '14px 18px', marginBottom: 12, position: 'relative' }}>
          <div style={{ fontSize: 14, color: 'var(--pd)', fontWeight: 800, marginBottom: 2 }}>
            👥 그룹 인증 <span style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>(베타)</span>
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>⏰ 24시간 후 자동 사라짐 · 📷 오직 사진 인증만</div>
          <button
            onClick={() => setRoomSettingsOpen(true)}
            aria-label="그룹 설정"
            title="그룹 표시 설정"
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,.7)', border: 'none',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#888', fontFamily: 'inherit', padding: 0,
              backdropFilter: 'blur(4px)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {visibleTeams.length === 0 ? (
          <div style={{ background: 'color-mix(in srgb, var(--pl) 25%, #fff)', borderRadius: 14, padding: '24px 16px', textAlign: 'center', color: '#999', fontSize: 12, lineHeight: 1.7 }}>
            모든 그룹 숨김 상태야<br />
            <span style={{ fontSize: 10, color: '#bbb' }}>우측 상단 ⚙ 눌러서 다시 켤 수 있어</span>
          </div>
        ) : (
          visibleTeams.map((tBase) => {
            const t = getTeamMeta(tBase.id)
            return (
            <button
              key={t.id}
              onClick={() => { setActive(t.id); setInRoom(t.id) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '14px 14px',
                marginBottom: 8, borderRadius: 14, fontFamily: 'inherit',
                background: '#fff',
                border: '1px solid #f0f0f0',
                borderLeft: `4px solid ${t.color}`,
                cursor: 'pointer', textAlign: 'left',
                transition: 'transform .12s, box-shadow .12s',
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <TeamAvatar teamId={t.id} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--pd)', marginBottom: 2 }}>
                  팀 {t.label}
                </div>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.7, wordBreak: 'keep-all' }}>
                  {t.examples.map((ex, i) => (
                    <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      · {ex} 등
                    </div>
                  ))}
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#ccc', fontWeight: 700, flexShrink: 0 }}>›</span>
            </button>
            )
          })
        )}

        {/* Group visibility settings — opened from gear icon */}
        {roomSettingsOpen && (
          <div
            onClick={() => setRoomSettingsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,.32)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 480,
                background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                padding: '20px 18px calc(20px + env(safe-area-inset-bottom, 0px))',
                boxShadow: '0 -4px 16px rgba(0,0,0,.15)',
              }}
            >
              <div style={{ width: 36, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 14px' }} />
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--pd)', textAlign: 'center', marginBottom: 4 }}>👥 그룹 표시 설정</div>
              <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginBottom: 14 }}>
                탭하면 켜짐/꺼짐 — 꺼진 그룹은 목록에서 안 보여
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
                {TEAMS.map((tBase) => {
                  const t = getTeamMeta(tBase.id)
                  const on = !hiddenRooms.includes(t.id)
                  return (
                    <div key={t.id} style={{
                      padding: 10, borderRadius: 12,
                      border: '1.5px solid ' + (on ? t.color : '#eee'),
                      background: on ? `color-mix(in srgb, ${t.color} 8%, #fff)` : '#fafafa',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TeamAvatar teamId={t.id} size={36} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>팀 {t.label}</span>
                        <button
                          onClick={() => toggleHidden(t.id)}
                          aria-label="표시/숨김"
                          style={{
                            width: 32, height: 18, borderRadius: 99,
                            background: on ? t.color : '#ddd',
                            position: 'relative', transition: 'background .2s',
                            flexShrink: 0, border: 'none', cursor: 'pointer', padding: 0,
                          }}
                        >
                          <span style={{
                            position: 'absolute', top: 2, ...(on ? { right: 2 } : { left: 2 }),
                            width: 14, height: 14, borderRadius: '50%', background: '#fff',
                            transition: 'all .2s',
                          }} />
                        </button>
                      </div>
                      {/* Color swatch row + reset to default */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {COLOR_SWATCHES.map((sw) => {
                          const picked = t.color.toLowerCase() === sw.toLowerCase()
                          return (
                            <button key={sw}
                              onClick={() => setTeamColor(t.id, sw)}
                              aria-label={`색상 ${sw}`}
                              style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: sw, border: '2px solid ' + (picked ? '#222' : '#fff'),
                                boxShadow: '0 0 0 1px #ddd',
                                cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                              }}
                            />
                          )
                        })}
                        <button
                          onClick={() => setTeamColor(t.id, null)}
                          title="기본 색으로 되돌리기"
                          style={{
                            background: 'none', border: 'none', color: '#888',
                            fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            padding: '2px 6px', marginLeft: 'auto',
                          }}>↺ 기본</button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => setRoomSettingsOpen(false)}
                style={{
                  width: '100%', marginTop: 14, padding: '10px 12px',
                  borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>완료</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Chat view — for the selected room.
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>
      {/* Header — back + team name (replaces old chip row) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 4px', flexShrink: 0 }}>
        <button
          onClick={() => setInRoom(null)}
          aria-label="뒤로"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#f3f3f3', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 800, color: 'var(--pd)', fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >‹</button>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--pd)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <TeamAvatar teamId={meta.id} size={28} />
          팀 {meta.label}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: '#aaa', fontWeight: 600 }}>⏰ 24h · 📷 사진만</span>
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
        {/* Pinned notice — what to post in this team */}
        {meta.examples.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: 12, padding: '10px 12px',
            marginBottom: 10, borderLeft: `3px solid ${accent}`,
            boxShadow: '0 1px 2px rgba(0,0,0,.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 11 }}>📌</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: accent }}>팀 {meta.label}! 이 그룹에선 이런 걸 인증해</span>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: '#555', lineHeight: 1.7 }}>
              {meta.examples.map((ex, i) => <li key={i}>{ex} 등</li>)}
            </ul>
            <div style={{
              marginTop: 8, padding: '6px 8px', background: '#FEEAEA',
              borderRadius: 8, fontSize: 10, color: '#B23939', lineHeight: 1.5,
              fontWeight: 600,
            }}>
              ⚠️ 자신/타인의 얼굴·노출·신체 사진 업로드 시 즉시 계정 영구 정지
            </div>
          </div>
        )}

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
                  {/* Author + streak — first of group, both mine and others */}
                  {newGroup && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3,
                      padding: '0 4px',
                      flexDirection: mine ? 'row-reverse' : 'row',
                    }}>
                      <span style={{ fontSize: 11, color: mine ? 'var(--pink)' : '#555', fontWeight: 700 }}>
                        {p.nickname}{mine ? ' (나)' : ''}
                      </span>
                      {badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: '#fff', background: badge.color,
                          padding: '1px 6px', borderRadius: 99, lineHeight: 1.4,
                        }}>{badge.emoji} {badge.label}</span>
                      )}
                    </div>
                  )}

                  {/* Bubble row — keep bubble + time column tight; alignSelf
                      forces this row to its content width instead of stretching
                      to the column's max-width (which left the time floating
                      far from the bubble). */}
                  <div style={{
                    display: 'flex',
                    flexDirection: mine ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 4,
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                  }}>
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
                      {/* Owner-only delete (×). Always visible on own posts. */}
                      {mine && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMine(p.id) }}
                          title="인증 삭제"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: 2, fontSize: 12, color: '#aaa', fontFamily: 'inherit',
                            lineHeight: 1, fontWeight: 700,
                          }}
                        >✕</button>
                      )}
                      {/* Admin-only on others' posts: delete + ban */}
                      {amAdmin && !mine && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteAsAdmin(p.id, p.nickname) }}
                            title="운영자 삭제"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: 2, fontSize: 11, color: '#888', fontFamily: 'inherit',
                              lineHeight: 1, fontWeight: 700,
                            }}
                          >✕</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBan(p.uid, p.nickname) }}
                            title="영구 정지"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: 2, fontSize: 11, color: '#E24B4A', fontFamily: 'inherit',
                              lineHeight: 1, fontWeight: 700,
                            }}
                          >🚫</button>
                        </>
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

      {/* Inline error banner — shows when an upload/post fails */}
      {errorMsg && (
        <div style={{
          background: '#FEEAEA', color: '#B23939', borderRadius: 10,
          padding: '8px 12px', marginTop: 6, fontSize: 11, lineHeight: 1.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <span style={{ flex: 1, wordBreak: 'break-word' }}>⚠️ {errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B23939', fontSize: 14, padding: 0, fontFamily: 'inherit', lineHeight: 1, flexShrink: 0 }}
          >×</button>
        </div>
      )}

      {/* Composer */}
      <div style={{
        background: '#fff', borderRadius: 24, marginTop: 8, padding: 6,
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
      }}>
        {photoPreview && (
          <>
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
            <div style={{
              fontSize: 10, color: accent, fontWeight: 700,
              padding: '4px 10px', margin: '2px 8px 0',
              background: `color-mix(in srgb, ${accent} 8%, #fff)`,
              borderRadius: 10, lineHeight: 1.5,
              display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
            }}>
              ✨ 적은 텍스트는 사진에 새겨져 인증샷으로 올라가요
            </div>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          <button
            onClick={openCamera}
            disabled={posting}
            title="무음 카메라"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 8, lineHeight: 0, color: accent, fontFamily: 'inherit', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="카메라">
              <path d="M3 8.5a2 2 0 0 1 2-2h2.2L9 4.5h6L16.8 6.5H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z" fill="currentColor" fillOpacity=".15" />
              <circle cx="12" cy="13" r="3.6" />
              <circle cx="12" cy="13" r="1.4" fill="currentColor" />
              <circle cx="17.5" cy="9" r=".7" fill="currentColor" stroke="none" />
            </svg>
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            placeholder={photoFile ? '사진에 새길 한 줄 (선택)' : '먼저 📷 카메라로 인증샷 찍기'}
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
            disabled={(!photoFile && !posting) || !uid}
            title={posting ? '탭하면 강제 취소' : '전송'}
            style={{
              padding: '8px 14px', borderRadius: 99, border: 'none',
              background: posting ? '#888' : (photoFile && uid ? accent : '#ddd'),
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: ((photoFile || posting) && uid) ? 'pointer' : 'default',
              fontFamily: 'inherit', flexShrink: 0,
            }}
          >{posting ? '취소' : '전송'}</button>
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

      {/* Silent camera modal */}
      {cameraOpen && (
        <CameraCaptureModal
          onCapture={(blob) => {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
            setPhotoFile(file)
            setCameraOpen(false)
          }}
          onCancel={() => setCameraOpen(false)}
          onFallback={pickFromGallery}
        />
      )}

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
