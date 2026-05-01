import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store/AppStore'
import { findUserByShareCode, setShareCode, pushGuestbook, listenUserDoc } from '../../lib/firestore'
import { todayStr, pad, fmtH } from '../../lib/date'
import { useBackClose } from '../../hooks/useBackClose'
import { showPrompt } from '../../lib/showPrompt'
import { flushSync } from '../../lib/syncManager'
import { computeStreak } from '../../lib/habitStreak'
import { getLastReadTs, markGuestbookRead } from '../../lib/guestbookUnread'
import { showMiniToast } from '../../lib/miniToast'
import { showConfirm } from '../../lib/showConfirm'
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

// Lightweight digest of the structural fields we want to flag a NEW badge
// on. Excludes XP/monthly counters and lastActiveAt — those advance on
// every app open and would cause every friend to show NEW constantly.
function computeScheduleHash(d: UserDoc): string {
  const sprint = d.sprint as { goals?: Array<{ id: string; name: string; target: number; current: number; unit: string }> } | undefined
  const slim = {
    sprintIds: sprint?.goals?.map((g) => `${g.id}:${g.name}:${g.target}:${g.unit}`).join('|') || '',
    sprintHistory: Array.isArray(d.sprintHistory) ? d.sprintHistory.length : 0,
    tasks: Array.isArray(d.tasks) ? d.tasks.length : 0,
    habits: Array.isArray(d.habits) ? d.habits.map((h) => `${h.id}:${h.name}`).join('|') : '',
    drops: Array.isArray(d.drops) ? d.drops.filter((x) => !x.done).length : 0,
    bio: d.bio || '',
    nickname: d.nickname || '',
    avatar: typeof d.avatar === 'string' ? d.avatar.slice(0, 32) : '',
  }
  // djb2-style hash so the value fits in localStorage cheaply.
  const s = JSON.stringify(slim)
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
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

interface FriendAvatarTabProps {
  friend: { uid: string; code: string; name: string }
  avatar: string
  nickname: string
  live: boolean
  selected: boolean
  hasUpdate: boolean
  onSelect: () => void
  onRequestRemove: () => void
}

function FriendAvatarTab({ avatar, nickname, live, selected, hasUpdate, onSelect, onRequestRemove }: FriendAvatarTabProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)
  const [pressed, setPressed] = useState(false)

  function startPress() {
    longPressedRef.current = false
    setPressed(true)
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      setPressed(false)
      onRequestRemove()
    }, 600)
  }

  function endPress() {
    setPressed(false)
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  return (
    <button
      onClick={() => { if (!longPressedRef.current) onSelect() }}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={endPress}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontFamily: 'inherit',
        transform: pressed ? 'scale(.92)' : 'scale(1)',
        transition: 'transform .15s',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      <div style={{ position: 'relative', width: 52, height: 52, borderRadius: 26, overflow: 'hidden', background: 'var(--pl)', border: selected ? '2.5px solid var(--pink)' : '2px solid #eee' }}>
        <Avatar value={avatar} size={52} />
        {live && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, background: '#2BA84A', border: '2px solid #fff' }} />}
        {hasUpdate && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: 'var(--pink)', color: '#fff', fontSize: 9, fontWeight: 800,
            padding: '1px 5px', borderRadius: 99, border: '2px solid #fff',
            lineHeight: 1.3, letterSpacing: 0.3,
          }}>NEW</span>
        )}
      </div>
      <div style={{ fontSize: 9, color: selected ? 'var(--pink)' : '#888', fontWeight: 600, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nickname}</div>
    </button>
  )
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

  // Self-view: re-render when local sprint/xp changes so the panel mirrors
  // localStorage in real time without waiting for a Firestore round trip.
  const [, forceTick] = useState(0)
  useEffect(() => {
    if (uid !== myUid) return
    function bump() { forceTick((t) => t + 1) }
    window.addEventListener('ff-sprint-local-changed', bump)
    window.addEventListener('ff-xp-changed', bump)
    window.addEventListener('ff-drops-local-changed', bump)
    window.addEventListener('ff-friend-visibility-changed', bump)
    return () => {
      window.removeEventListener('ff-sprint-local-changed', bump)
      window.removeEventListener('ff-xp-changed', bump)
      window.removeEventListener('ff-drops-local-changed', bump)
      window.removeEventListener('ff-friend-visibility-changed', bump)
    }
  }, [uid, myUid])

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
  // Self-view: read sprint from localStorage directly so the user always
  // sees the freshest data, no Firestore round-trip required. Friend
  // view: rely on the synced Firestore doc.
  let sprint: SprintShape | null | undefined = data.sprint as SprintShape | null | undefined
  let sprintHistory: CompletedSprintShape[] = (data.sprintHistory as CompletedSprintShape[] | undefined) || []
  if (uid === myUid) {
    try {
      const localSprintRaw = localStorage.getItem('ff_sprint')
      if (localSprintRaw) sprint = JSON.parse(localSprintRaw) as SprintShape
      const localHistRaw = localStorage.getItem('ff_sprint_history')
      if (localHistRaw) sprintHistory = JSON.parse(localHistRaw) as CompletedSprintShape[]
    } catch { /* fall through to Firestore values */ }
  }
  const spct = sprintPct(sprint)
  const dayMode = data.dayMode as string | undefined
  const dmInfo = dayMode ? DAY_MODE_LABEL[dayMode] : null
  const status = activeStatus(data.lastActiveAt as string | undefined)
  const friendAvatar = (data.avatar as string | undefined) || '🧸'
  const friendBio = (data.bio as string | undefined) || ''
  // Pomodoro lifetime stats. Self-view reads from localStorage to show the
  // freshest number; friend-view reads from the synced UserDoc.
  let pomoCount = typeof data.pomoTotalCount === 'number' ? data.pomoTotalCount : 0
  let pomoMinutes = typeof data.pomoTotalMinutes === 'number' ? data.pomoTotalMinutes : 0
  if (uid === myUid) {
    try {
      const saved = JSON.parse(localStorage.getItem('ff_pomo_v2') || '{}')
      if (typeof saved.totalCount === 'number') pomoCount = saved.totalCount
      if (typeof saved.totalMinutes === 'number') pomoMinutes = saved.totalMinutes
    } catch { /* fall through */ }
  }
  // For self-view, evaluate visibility against the local prefs (instant
  // reflection of toggle changes). For friend-view, use what's on the
  // friend's UserDoc.
  const visDoc: UserDoc = uid === myUid
    ? { friendVisibility: (() => {
        try { return JSON.parse(localStorage.getItem('ff_friend_visibility') || '{}') } catch { return {} }
      })() }
    : data
  const showXp = isSectionVisible(visDoc, 'xp')
  const showSprint = isSectionVisible(visDoc, 'sprint')
  const showTimeline = isSectionVisible(visDoc, 'timeline')
  const showHabits = isSectionVisible(visDoc, 'habits')
  const showDrop = isSectionVisible(visDoc, 'drop')
  let drops = (data.drops as Array<{ id: number; name: string; done: boolean }> | undefined) || []
  if (uid === myUid) {
    try {
      const raw = localStorage.getItem('ff_drops')
      if (raw) drops = JSON.parse(raw) as typeof drops
    } catch { /* keep Firestore copy */ }
  }
  // Self-view: pull XP from localStorage so it reflects taps instantly,
  // not after the queue debounce + Firestore round-trip.
  let friendXp = typeof data.xp === 'number' ? data.xp : 0
  if (uid === myUid) {
    const localXp = parseInt(localStorage.getItem('ff_xp') || '0')
    if (Number.isFinite(localXp) && localXp >= 0) friendXp = localXp
  }
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

      {/* Day mode banner — always visible (no longer in privacy toggles) */}
      {dmInfo && (
        <div style={{ background: dmInfo.color + '22', borderLeft: `3px solid ${dmInfo.color}`, padding: '6px 10px', borderRadius: 8, marginBottom: 12, fontSize: 11, color: '#555' }}>
          {dmInfo.emoji} {dmInfo.text}
        </div>
      )}

      {/* Level / XP header — render whenever visibility is on, even at 0 XP */}
      {showXp && (
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

      {/* Pomodoro lifetime stats — small card; hide when nothing yet */}
      {pomoCount > 0 && (
        <div style={{ background: '#FFF6F8', border: '1px solid var(--pl)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)' }}>🍅 뽀모도로 누적</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink)' }}>
            {pomoCount}회 · {(pomoMinutes / 60).toFixed(1)}h
          </span>
        </div>
      )}

      {/* Sprint progress (1주 챌린지) — when self-viewing and the card is
          hidden, surface a one-line reason so it's not a mystery. */}
      {uid === myUid && (!showSprint || !sprint || spct == null) && (
        <div style={{ background: '#FFF6F8', border: '1px dashed var(--pink)', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 11, color: '#888' }}>
          🎯 이번주 챌린지 안 보이는 이유 — {!showSprint ? '설정에서 "목표" 비공개로 꺼져있어' : !sprint ? '아직 Firestore에 동기화 안 됨 (목표탭 한 번 들어갔다 와봐)' : '챌린지에 목표가 없음'}
        </div>
      )}
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

      {/* Drops — undone bucket-list items (max 8) */}
      {showDrop && drops.length > 0 && (() => {
        const undone = drops.filter((d) => !d.done).slice(0, 8)
        const doneCount = drops.filter((d) => d.done).length
        if (undone.length === 0 && doneCount === 0) return null
        return (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', margin: '14px 0 6px' }}>
              💧 드롭 ({doneCount}/{drops.length} 완료)
            </div>
            {undone.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>전부 완료했어!</div>
            ) : (
              undone.map((d) => (
                <div key={d.id} style={{ fontSize: 12, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6, color: '#555' }}>
                  <span>•</span>
                  <span style={{ flex: 1 }}>{d.name}</span>
                </div>
              ))
            )}
          </>
        )
      })()}

      {/* Guestbook — hidden on self view (the parent 나 tab already shows
          "내 방명록" above and there's no point writing to yourself). */}
      {uid !== myUid && (<>
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
      </>)}

      {uid !== myUid && (
        <button onClick={onBack} style={{ marginTop: 16, width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--pl)', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--pd)' }}>← 돌아가기</button>
      )}
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

  // Refresh local friends list when applyRemote merges in additions from
  // another device. Without this the panel shows stale state until a manual
  // remount.
  useEffect(() => {
    function onRemoteSync() { setFriends(loadFriends()) }
    window.addEventListener('ff-remote-sync', onRemoteSync)
    return () => window.removeEventListener('ff-remote-sync', onRemoteSync)
  }, [])

  // Whenever the panel mounts or another XP/sprint change lands, push my
  // latest local state to Firestore so self-preview / friend views read
  // fresh values instead of whatever was last debounced.
  useEffect(() => {
    if (!uid) return
    flushSync().catch(() => { /* offline ok */ })
    function onLocalChange() { flushSync().catch(() => { /* offline ok */ }) }
    window.addEventListener('ff-xp-changed', onLocalChange)
    window.addEventListener('ff-sprint-local-changed', onLocalChange)
    return () => {
      window.removeEventListener('ff-xp-changed', onLocalChange)
      window.removeEventListener('ff-sprint-local-changed', onLocalChange)
    }
  }, [uid])
  const [friendStatuses, setFriendStatuses] = useState<Record<string, { lastActiveAt?: string; nickname?: string; avatar?: string; scheduleHash?: string }>>({})
  // Per-friend "last seen by me" timestamps. Stored as ISO; entries get
  // updated when the user opens that friend's tab.
  const [seenMap, setSeenMap] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('ff_friend_seen') || '{}') } catch { return {} }
  })
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
            scheduleHash: computeScheduleHash(d),
          },
        }))
      }),
    )
    return () => { unsubs.forEach((u) => u()) }
  }, [friends])

  // While a friend's tab is open, mark new updates as seen so the NEW
  // badge doesn't keep flashing back as their schedule hash advances.
  useEffect(() => {
    if (!viewingFriend) return
    const fStatus = friendStatuses[viewingFriend.uid]
    if (!fStatus?.scheduleHash) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeenMap((prev) => {
      if (prev[viewingFriend.uid] === fStatus.scheduleHash) return prev
      const next = { ...prev, [viewingFriend.uid]: fStatus.scheduleHash as string }
      try { localStorage.setItem('ff_friend_seen', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [viewingFriend, friendStatuses])

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
    // Tombstone so the next hydrate doesn't re-add this uid from the
    // server snapshot. Same pattern as drops.
    try {
      const ts: string[] = JSON.parse(localStorage.getItem('ff_friend_tombstones') || '[]')
      if (!ts.includes(friendUid)) {
        ts.push(friendUid)
        localStorage.setItem('ff_friend_tombstones', JSON.stringify(ts))
      }
    } catch { /* ignore */ }
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
          {/* Friend tabs — long-press to remove */}
          {friends.map((f) => {
            const fStatus = friendStatuses[f.uid]
            const isSel = selectedFriend?.uid === f.uid
            const status = activeStatus(fStatus?.lastActiveAt)
            const av = fStatus?.avatar || '🧸'
            const nm = fStatus?.nickname || f.name
            const curHash = fStatus?.scheduleHash
            const seenHash = seenMap[f.uid]
            // Only flag NEW when the structural hash changed since last view.
            // XP/lastActiveAt-only updates don't move the hash so they no
            // longer trigger the badge.
            const hasUpdate = !!curHash && curHash !== seenHash
            return (
              <FriendAvatarTab
                key={f.uid}
                friend={f}
                avatar={av}
                nickname={nm}
                live={status.live}
                selected={isSel}
                hasUpdate={hasUpdate && !isSel}
                onSelect={() => {
                  setViewingFriend(f)
                  if (curHash) {
                    setSeenMap((prev) => {
                      const next = { ...prev, [f.uid]: curHash }
                      try { localStorage.setItem('ff_friend_seen', JSON.stringify(next)) } catch { /* ignore */ }
                      return next
                    })
                  }
                }}
                onRequestRemove={async () => {
                  const ok = await showConfirm(`${nm} 친구 삭제할까?`)
                  if (ok) {
                    if (selectedFriend?.uid === f.uid) setViewingFriend(null)
                    removeFriend(f.uid)
                  }
                }}
              />
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
