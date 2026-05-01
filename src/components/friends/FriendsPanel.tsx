import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/AppStore'
import { findUserByShareCode, setShareCode, pushGuestbook, listenUserDoc } from '../../lib/firestore'
import { todayStr, pad, fmtH } from '../../lib/date'
import { useBackClose } from '../../hooks/useBackClose'
import { showPrompt } from '../../lib/showPrompt'
import { flushSync } from '../../lib/syncManager'
import { computeStreak } from '../../lib/habitStreak'
import { getLastReadTs, markGuestbookRead } from '../../lib/guestbookUnread'
import { showMiniToast } from '../../lib/miniToast'
import { isSectionVisible } from '../../lib/friendVisibility'
import { Avatar } from '../ui/Avatar'
import type { UserDoc } from '../../lib/firestore'

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

interface SprintGoalShape { id: string; name: string; target: number; unit: string; current: number }
interface SprintShape { startDate: string; goals: SprintGoalShape[] }
interface CompletedSprintShape { startDate: string; endDate: string; goals: SprintGoalShape[]; overall?: number }
function sprintPct(s: SprintShape | CompletedSprintShape | null | undefined): number | null {
  if (!s || !s.goals?.length) return null
  const avg = s.goals.reduce((sum, g) => {
    const t = g.target || 1
    return sum + Math.min(100, Math.round((g.current / t) * 100))
  }, 0) / s.goals.length
  return Math.round(avg)
}

const PER_LEVEL = 50
function levelFromXp(xp: number): number { return Math.floor(xp / PER_LEVEL) + 1 }
function xpInLevel(xp: number): { current: number; needed: number; pct: number } {
  const lv = levelFromXp(xp)
  const base = (lv - 1) * PER_LEVEL
  const current = xp - base
  return { current, needed: PER_LEVEL, pct: Math.round((current / PER_LEVEL) * 100) }
}

const DAY_MODE_LABEL: Record<string, { emoji: string; text: string; color: string }> = {
  low: { emoji: '🌧', text: '오늘 컨디션 낮음', color: '#A7B3CC' },
  normal: { emoji: '☁️', text: '평소 컨디션', color: '#B0B0B0' },
  good: { emoji: '☀️', text: '컨디션 좋음!', color: '#F5A623' },
}

function activeStatus(lastActiveAt: string | undefined): { label: string; live: boolean } {
  if (!lastActiveAt) return { label: '기록 없음', live: false }
  const last = new Date(lastActiveAt)
  const now = new Date()
  const diffMin = Math.round((now.getTime() - last.getTime()) / 60000)
  if (diffMin < 30) return { label: '지금 활동중', live: true }
  if (diffMin < 60 * 6) return { label: `${Math.round(diffMin / 60) || 1}시간 전`, live: false }
  if (last.toDateString() === now.toDateString()) return { label: '오늘 활동', live: false }
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (last.toDateString() === yest.toDateString()) return { label: '어제 활동', live: false }
  const days = Math.floor((now.getTime() - last.getTime()) / 86400000)
  return { label: `${days}일 전`, live: false }
}


interface Friend {
  uid: string
  code: string
  name: string
}

function getMyShareCode(uid: string): string {
  let h = 0
  for (let i = 0; i < uid.length; i++) {
    h = ((h << 5) - h) + uid.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36).toUpperCase().slice(0, 6)
}

function loadFriends(): Friend[] {
  try { return JSON.parse(localStorage.getItem('ff_friends') || '[]') } catch { return [] }
}

function saveFriendsLocal(friends: Friend[]) {
  localStorage.setItem('ff_friends', JSON.stringify(friends))
}

interface FriendDetailProps {
  uid: string
  name: string
  myUid: string
  onBack: () => void
}

function FriendDetail({ uid, name, myUid, onBack }: FriendDetailProps) {
  const [data, setData] = useState<UserDoc | null>(null)
  const [guestInput, setGuestInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Live subscription so the friend's edits (nickname, avatar, sprint
    // progress, day mode, guestbook) reflect without manual refresh.
    const unsub = listenUserDoc(uid, (d) => { setData(d); setLoading(false) })
    return () => unsub()
  }, [uid])

  async function postGuestbook() {
    if (!guestInput.trim()) return
    const text = guestInput.trim()
    setGuestInput('')
    // Always pull the nickname fresh at post time — never the OAuth real
    // name. Falls back to '익명' if user hasn't set one yet.
    const freshName = localStorage.getItem('ff_nickname')?.trim() || '익명'
    const now = new Date()
    const entry = {
      from: freshName,
      text,
      date: todayStr(),
      time: pad(now.getHours()) + ':' + pad(now.getMinutes()),
      ts: Date.now(),
      fromUid: myUid,
    }
    await pushGuestbook(uid, entry)
    // listenUserDoc handles refreshing data — no explicit reload needed.
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>불러오는 중...</div>
  if (!data) return <div style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>데이터를 불러올 수 없어요</div>

  const today = todayStr()
  const tasks = (data.tasks || []).filter((b) => b.date === today && !b.isBuf && (b.type === 'timeline' || !b.type))
  const habits = data.habits || []
  const habitLogs: Record<string, Record<string, boolean>> = (data.habitLogs || {}) as Record<string, Record<string, boolean>>
  const doneCount = tasks.filter((b) => b.done).length
  const totalH = tasks.reduce((s, b) => s + (b.durHour || 0), 0)
  const guestbook = (data.guestbook as Array<{ from: string; text: string; date?: string; time?: string }>) || []
  const sprint = data.sprint as SprintShape | null | undefined
  const spct = sprintPct(sprint)
  const sprintHistory = (data.sprintHistory as CompletedSprintShape[] | undefined) || []
  const dayMode = data.dayMode as string | undefined
  const dmInfo = dayMode ? DAY_MODE_LABEL[dayMode] : null
  const status = activeStatus(data.lastActiveAt as string | undefined)
  const friendAvatar = (data.avatar as string | undefined) || '🧸'
  const friendBio = (data.bio as string | undefined) || ''
  const showCondition = isSectionVisible(data, 'condition')
  const showXp = isSectionVisible(data, 'xp')
  const showSprint = isSectionVisible(data, 'sprint')
  const showTimeline = isSectionVisible(data, 'timeline')
  const showHabits = isSectionVisible(data, 'habits')
  const friendXp = typeof data.xp === 'number' ? data.xp : 0
  const friendLv = levelFromXp(friendXp)
  const friendLvProg = xpInLevel(friendXp)
  const friendMonthlyXp = typeof data.monthlyXp === 'number' ? data.monthlyXp : 0

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ display: 'inline-block', width: 72, height: 72, borderRadius: 36, background: 'var(--pl)', overflow: 'hidden', border: '2px solid var(--pink)', marginBottom: 4 }}>
          <Avatar value={friendAvatar} size={68} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--pd)' }}>{name}</div>
        {friendBio && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 4, padding: '0 12px', lineHeight: 1.4 }}>{friendBio}</div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: status.live ? '#2BA84A' : '#aaa', marginTop: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: status.live ? '#2BA84A' : '#ccc', display: 'inline-block' }} />
          {status.label}
        </div>
      </div>

      {/* Day mode banner */}
      {showCondition && dmInfo && (
        <div style={{ background: dmInfo.color + '22', borderLeft: `3px solid ${dmInfo.color}`, padding: '6px 10px', borderRadius: 8, marginBottom: 12, fontSize: 11, color: '#555' }}>
          {dmInfo.emoji} {dmInfo.text}
        </div>
      )}

      {/* Level / XP header */}
      {showXp && friendXp > 0 && (
        <div style={{ background: 'linear-gradient(135deg, var(--pd), var(--pink))', color: '#fff', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>🎮 Lv.{friendLv}</span>
            <span style={{ fontSize: 10, opacity: .9 }}>{friendLvProg.current}/{friendLvProg.needed} XP · 이번달 {friendMonthlyXp}</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,.25)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#fff', borderRadius: 3, width: friendLvProg.pct + '%' }} />
          </div>
        </div>
      )}

      {/* Sprint progress (1주 챌린지) */}
      {showSprint && sprint && spct != null && (
        <div style={{ background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 50%, #fff))', borderRadius: 12, padding: 12, marginBottom: 12, border: '1.5px solid var(--pink)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)' }}>🎯 이번주 챌린지</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--pink)' }}>{spct}%</div>
          </div>
          <div style={{ height: 6, background: '#fff', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--pink)', borderRadius: 3, width: spct + '%', transition: 'width .3s' }} />
          </div>
          {sprint.goals.slice(0, 3).map((g) => (
            <div key={g.id} style={{ fontSize: 10, color: '#666', marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {g.name || '(이름없음)'}</span>
              <span style={{ color: 'var(--pd)', fontWeight: 600 }}>{g.current}/{g.target} {g.unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* Past sprint history (recent 3) */}
      {showSprint && sprintHistory.length > 0 && (
        <div style={{ background: '#FAFAFA', borderRadius: 10, padding: 10, marginBottom: 12, border: '1px solid #eee' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#666', marginBottom: 6 }}>📚 지난 챌린지 ({sprintHistory.length})</div>
          {[...sprintHistory].reverse().slice(0, 3).map((h, i) => {
            const pct = sprintPct(h) ?? 0
            return (
              <div key={i} style={{ fontSize: 10, color: '#888', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ minWidth: 75, fontSize: 9, color: '#aaa' }}>{h.startDate}~{h.endDate?.slice(5) || '?'}</span>
                <div style={{ flex: 1, height: 4, background: '#eee', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: pct >= 100 ? '#2BA84A' : 'var(--pink)', width: Math.min(pct, 100) + '%' }} />
                </div>
                <span style={{ minWidth: 32, textAlign: 'right', fontWeight: 600, color: pct >= 100 ? '#2BA84A' : 'var(--pd)' }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Timeline section (chips, progress bar, task list) */}
      {showTimeline && (
        <>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            {[`📋 ${tasks.length}개`, `✅ ${doneCount}/${tasks.length}`, `⏱ ${totalH.toFixed(1)}h`].map((t) => (
              <div key={t} style={{ background: 'var(--pl)', borderRadius: 99, padding: '4px 12px', fontSize: 11, color: 'var(--pd)', fontWeight: 500 }}>{t}</div>
            ))}
          </div>

          {tasks.length > 0 && (
            <div style={{ height: 6, background: 'var(--pl)', borderRadius: 3, marginBottom: 14 }}>
              <div style={{ height: '100%', background: 'var(--pink)', borderRadius: 3, width: Math.round(doneCount / tasks.length * 100) + '%' }} />
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', marginBottom: 6 }}>📅 타임라인</div>
          {tasks.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: 12, textAlign: 'center', padding: '12px 0', marginBottom: 12 }}>오늘 일정 없음</div>
          ) : (
            [...tasks].sort((a, b) => a.startHour - b.startHour).map((b) => (
              <div key={b.id} style={{ padding: 10, background: b.done ? '#f5f5f5' : 'var(--pl)', borderRadius: 10, marginBottom: 6, borderLeft: '3px solid ' + (b.done ? '#ccc' : 'var(--pink)'), opacity: b.done ? .6 : 1 }}>
                <div style={{ color: b.done ? '#aaa' : 'var(--pd)', fontWeight: 600, fontSize: 11 }}>{fmtH(b.startHour)} - {fmtH(b.startHour + b.durHour)}</div>
                <div style={{ color: b.done ? '#aaa' : '#333', marginTop: 2, textDecoration: b.done ? 'line-through' : 'none', fontSize: 12 }}>{b.done ? '✓ ' : ''}{b.name}</div>
              </div>
            ))
          )}
        </>
      )}

      {/* Habits */}
      {showHabits && habits.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', margin: '14px 0 6px' }}>
            🌱 습관 ({habits.filter((h) => habitLogs[today]?.[String(h.id)]).length}/{habits.length})
          </div>
          {habits.map((h) => {
            const done = !!habitLogs[today]?.[String(h.id)]
            const streak = computeStreak(String(h.id), habitLogs)
            return (
              <div key={h.id} style={{ fontSize: 12, padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 14, opacity: done ? 1 : .3 }}>{done ? '🌸' : '○'}</span>
                <span style={{ flex: 1, opacity: done ? 1 : .6 }}>{h.name}</span>
                {streak > 0 && (
                  <span style={{ fontSize: 10, color: streak >= 7 ? '#E24B4A' : '#888', fontWeight: 600 }}>🔥 {streak}일째</span>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* Guestbook */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', margin: '14px 0 6px' }}>💌 방명록</div>
      {guestbook.length === 0 ? (
        <div style={{ color: '#ccc', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>아직 방명록이 없어. 첫 글을 남겨봐!</div>
      ) : (
        [...guestbook].reverse().slice(0, 10).map((g, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', marginBottom: 6, border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 10, color: '#aaa' }}>{g.from} · {g.date} {g.time}</div>
            <div style={{ fontSize: 12, color: '#333', marginTop: 2 }}>{g.text}</div>
          </div>
        ))
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          value={guestInput}
          onChange={(e) => setGuestInput(e.target.value)}
          placeholder="응원 한마디 남기기..."
          style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) postGuestbook() }}
        />
        <button onClick={postGuestbook} style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--pink)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>남기기</button>
      </div>

      <button onClick={onBack} style={{ marginTop: 16, width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--pl)', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--pd)' }}>← 돌아가기</button>
    </div>
  )
}

interface Props {
  onClose?: () => void
  embedded?: boolean  // true = render as a tab page (no fixed overlay)
}

export function FriendsPanel({ onClose, embedded = false }: Props) {
  const uid = useAppStore((s) => s.uid)
  const [friends, setFriends] = useState<Friend[]>(loadFriends)
  const [viewingFriend, setViewingFriend] = useState<Friend | null>(null)
  const [friendStatuses, setFriendStatuses] = useState<Record<string, { lastActiveAt?: string; nickname?: string; avatar?: string }>>({})
  // Only intercept the back button when rendered as a modal — the tab
  // version stays put while the user navigates between tabs.
  useBackClose(!embedded && !!onClose, onClose || (() => {}))

  const myCode = uid ? getMyShareCode(uid) : null

  // Make sure my own shareCode lives in Firestore as soon as I open the
  // panel — otherwise friends can't find me until I successfully add one
  // first (chicken-and-egg if we're both new).
  useEffect(() => {
    if (!uid || !myCode) return
    setShareCode(uid, myCode).catch(() => { /* sync may be offline */ })
  }, [uid, myCode])

  useEffect(() => {
    // Subscribe to each friend's doc so nickname/avatar/lastActiveAt updates
    // land in real time. Cleans up its listeners when the friends list
    // changes or the panel unmounts.
    const unsubs = friends.map((f) =>
      listenUserDoc(f.uid, (d) => {
        setFriendStatuses((prev) => ({
          ...prev,
          [f.uid]: {
            lastActiveAt: d.lastActiveAt as string | undefined,
            nickname: d.nickname as string | undefined,
            avatar: d.avatar as string | undefined,
          },
        }))
      }),
    )
    return () => { unsubs.forEach((u) => u()) }
  }, [friends])

  // Subscribe to my own guestbook so new messages from friends show up
  // without manual refresh.
  const [myGuestbook, setMyGuestbook] = useState<Array<{ from: string; text: string; date?: string; time?: string; ts?: number; fromUid?: string }>>([])
  const lastRead = getLastReadTs()
  useEffect(() => {
    if (!uid) return
    const unsub = listenUserDoc(uid, (d) => {
      const gb = (d?.guestbook as typeof myGuestbook | undefined) || []
      setMyGuestbook(gb)
    })
    // Mark as read once user opens the panel
    markGuestbookRead()
    return () => unsub()
  }, [uid])

  async function addFriend() {
    const code = await showPrompt('친구의 공유 코드를 입력해:')
    if (!code?.trim()) return
    const trimmed = code.trim().toUpperCase()
    if (!uid) { alert('로그인이 필요해요!'); return }
    try {
      const result = await findUserByShareCode(trimmed)
      if (!result) { alert('해당 코드의 사용자를 찾을 수 없어요'); return }
      if (result.uid === uid) { alert('자기 자신은 추가할 수 없어!'); return }
      const current = loadFriends()
      if (current.find((f) => f.uid === result.uid)) { alert('이미 추가된 친구야!'); return }
      const name = (result.data.nickname as string) || (result.data.displayName as string) || '친구'
      const newFriends = [...current, { uid: result.uid, code: trimmed, name }]
      saveFriendsLocal(newFriends)
      setFriends(newFriends)
      await setShareCode(uid, myCode!)
      // Push the new friend to Firestore immediately so a refresh (or the
      // other device) can't roll us back to the old empty list.
      await flushSync()
    } catch (e) {
      alert('에러: ' + String(e))
    }
  }

  function removeFriend(friendUid: string) {
    const updated = friends.filter((f) => f.uid !== friendUid)
    saveFriendsLocal(updated)
    setFriends(updated)
    flushSync().catch(() => { /* offline ok */ })
  }

  // Embedded (tab) view: horizontal avatar bar at top, friend detail below.
  // No "보기" button — tapping an avatar switches the panel directly.
  if (embedded && uid) {
    const myAvatarLocal = (typeof window !== 'undefined' && localStorage.getItem('ff_avatar')) || '🧸'
    const selectedFriend = viewingFriend && friends.find((f) => f.uid === viewingFriend.uid) ? viewingFriend : null
    return (
      <div style={{ padding: '12px 12px 120px', maxWidth: 480, margin: '0 auto' }}>
        {/* Horizontal friend bar */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 4px 12px', marginBottom: 8 }}>
          {/* My profile tab */}
          <button
            onClick={() => setViewingFriend(null)}
            style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 26, overflow: 'hidden', background: 'var(--pl)', border: selectedFriend === null ? '2.5px solid var(--pink)' : '2px solid #eee' }}>
              <Avatar value={myAvatarLocal} size={52} />
            </div>
            <div style={{ fontSize: 9, color: selectedFriend === null ? 'var(--pink)' : '#888', fontWeight: 700, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>나</div>
          </button>
          {/* Friend tabs */}
          {friends.map((f) => {
            const fStatus = friendStatuses[f.uid]
            const isSel = selectedFriend?.uid === f.uid
            const status = activeStatus(fStatus?.lastActiveAt)
            const av = fStatus?.avatar || '🧸'
            const nm = fStatus?.nickname || f.name
            return (
              <button
                key={f.uid}
                onClick={() => setViewingFriend(f)}
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >
                <div style={{ position: 'relative', width: 52, height: 52, borderRadius: 26, overflow: 'hidden', background: 'var(--pl)', border: isSel ? '2.5px solid var(--pink)' : '2px solid #eee' }}>
                  <Avatar value={av} size={52} />
                  {status.live && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, background: '#2BA84A', border: '2px solid #fff' }} />}
                </div>
                <div style={{ fontSize: 9, color: isSel ? 'var(--pink)' : '#888', fontWeight: 600, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nm}</div>
              </button>
            )
          })}
          {/* Add button */}
          <button
            onClick={addFriend}
            style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 26, background: '#fff', border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#bbb' }}>+</div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600 }}>추가</div>
          </button>
        </div>

        {/* Detail area */}
        {selectedFriend ? (
          <FriendDetail
            key={selectedFriend.uid}
            uid={selectedFriend.uid}
            name={selectedFriend.name}
            myUid={uid}
            onBack={() => setViewingFriend(null)}
          />
        ) : (
          <div>
            {/* My received guestbook — always visible, with empty state */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span>💌 내 방명록 (받은 응원)</span>
                <span style={{ fontSize: 10, color: '#aaa', fontWeight: 500 }}>{myGuestbook.length}개</span>
              </div>
              {myGuestbook.length === 0 ? (
                <div style={{ background: '#fff', border: '1px dashed #eee', borderRadius: 10, padding: '14px 12px', fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 1.5 }}>
                  아직 받은 응원이 없어<br />
                  <span style={{ fontSize: 10, color: '#bbb' }}>친구가 너 화면에서 응원 남기면 여기 떠</span>
                </div>
              ) : (
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {[...myGuestbook].reverse().slice(0, 20).map((g, i) => {
                    const unread = g.ts != null && g.ts > lastRead && g.fromUid !== uid
                    return (
                      <div key={i} style={{ background: unread ? '#FFF6F8' : '#fff', borderRadius: 10, padding: '8px 10px', marginBottom: 6, border: '1px solid ' + (unread ? 'var(--pink)' : '#f0f0f0') }}>
                        <div style={{ fontSize: 10, color: '#aaa' }}>
                          {unread && <span style={{ color: 'var(--pink)', fontWeight: 700, marginRight: 4 }}>● NEW</span>}
                          {g.from} · {g.date} {g.time}
                        </div>
                        <div style={{ fontSize: 12, color: '#333', marginTop: 2 }}>{g.text}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {/* My profile rendered just like a friend tab (with privacy
                toggles applied). Share code lives in settings now. */}
            <FriendDetail
              key="self-profile"
              uid={uid}
              name={(localStorage.getItem('ff_nickname') || '').trim() || '나'}
              myUid={uid}
              onBack={() => { /* no-op for self view */ }}
            />
          </div>
        )}
      </div>
    )
  }

  const inner = (
      <div style={embedded
        ? { padding: '16px 16px 120px', maxWidth: 480, margin: '0 auto' }
        : { background: '#fff', borderRadius: 20, padding: 24, width: '90%', maxWidth: 340, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--pd)', marginBottom: 16, textAlign: 'center' }}>👥 친구</div>

        {viewingFriend ? (
          <FriendDetail
            uid={viewingFriend.uid}
            name={viewingFriend.name}
            myUid={uid || ''}
            onBack={() => setViewingFriend(null)}
          />
        ) : (
          <>
            {!uid ? (
              <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '20px 0' }}>로그인하면 친구와 공유할 수 있어!</div>
            ) : (
              <>
                {/* My received guestbook */}
                {myGuestbook.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 6 }}>💌 받은 응원 ({myGuestbook.length})</div>
                    <div style={{ maxHeight: 140, overflowY: 'auto' }}>
                      {[...myGuestbook].reverse().slice(0, 10).map((g, i) => {
                        const unread = g.ts != null && g.ts > lastRead && g.fromUid !== uid
                        return (
                          <div key={i} style={{ background: unread ? '#FFF6F8' : '#fff', borderRadius: 10, padding: '8px 10px', marginBottom: 6, border: '1px solid ' + (unread ? 'var(--pink)' : '#f0f0f0') }}>
                            <div style={{ fontSize: 10, color: '#aaa' }}>
                              {unread && <span style={{ color: 'var(--pink)', fontWeight: 700, marginRight: 4 }}>● NEW</span>}
                              {g.from} · {g.date} {g.time}
                            </div>
                            <div style={{ fontSize: 12, color: '#333', marginTop: 2 }}>{g.text}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* My code */}
                <div style={{ background: 'var(--pl)', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>내 공유 코드</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--pd)', letterSpacing: 4 }}>{myCode}</div>
                  <button
                    onClick={async () => {
                      if (!myCode) return
                      const ok = await copyToClipboard(myCode)
                      showMiniToast(ok ? '📋 코드 복사 완료' : '😢 복사 실패')
                    }}
                    style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--pink)', background: '#fff', color: 'var(--pink)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >📋 코드 복사하기</button>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 6 }}>친구에게 이 코드를 알려줘!</div>
                </div>

                {/* Friend list */}
                {friends.length === 0 ? (
                  <div style={{ color: '#bbb', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>아직 친구가 없어.<br />코드로 친구를 추가해봐!</div>
                ) : (
                  friends.map((f) => {
                    const fStatus = friendStatuses[f.uid]
                    const status = activeStatus(fStatus?.lastActiveAt)
                    const displayName = fStatus?.nickname || f.name
                    const avatar = fStatus?.avatar || '🧸'
                    return (
                      <div key={f.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--pl)', borderRadius: 12, marginBottom: 8 }}>
                        <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 18, overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
                          <Avatar value={avatar} size={36} />
                          {status.live && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: 4, background: '#2BA84A', border: '2px solid var(--pl)' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--pd)' }}>{displayName}</div>
                          <div style={{ fontSize: 10, color: status.live ? '#2BA84A' : '#bbb' }}>{status.label}</div>
                        </div>
                        <button onClick={() => setViewingFriend(f)} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 11, cursor: 'pointer' }}>보기</button>
                        <button onClick={() => removeFriend(f.uid)} style={{ background: '#FFF0F0', border: 'none', color: '#E24B4A', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    )
                  })
                )}

                <button
                  onClick={addFriend}
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}
                >+ 친구 추가</button>
              </>
            )}
          </>
        )}
      </div>
  )

  if (embedded) return inner

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose() }}
    >
      {inner}
    </div>
  )
}
