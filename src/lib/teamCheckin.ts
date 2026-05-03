// Lightweight team check-in feed. One Firestore doc per team holds the
// last 24h of posts as an array — same pattern as tipFeedback to keep
// reads/writes minimal during the MVP. Old posts are pruned by whoever
// writes next, no cron needed.
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { getDb } from './firestore'

export type TeamId = 'job' | 'college' | 'student' | 'athlete'

export interface TeamMeta {
  id: TeamId
  emoji: string
  label: string
  hint: string  // placeholder for the input
  color: string // primary accent — banner/border/button per team
  bgSoft: string // softened background tint for header gradient
  // Pinned notice — bullet list of what kind of check-ins fit this team.
  // Helps new members know what to post.
  examples: string[]
}

// Available swatch palette for per-room color customization. First column is
// each team's default; rest are alternative options. Users pick from this
// curated list (no raw color picker — keeps the look cohesive).
export const COLOR_SWATCHES: string[] = [
  '#5B9DF9', // sky blue
  '#4FBD8F', // sage
  '#F5BD3C', // sun yellow
  '#9B7EE0', // lavender
  '#F58E5C', // peach
  '#E8A0B8', // pink
  '#E8557A', // coral
  '#4DC4D9', // teal
]

const COLORS_KEY = 'ff_team_colors'

function loadColorOverrides(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(COLORS_KEY) || '{}') as Record<string, string>
  } catch { return {} }
}
export function setTeamColor(teamId: TeamId, color: string | null): void {
  const cur = loadColorOverrides()
  if (color) cur[teamId] = color
  else delete cur[teamId]
  localStorage.setItem(COLORS_KEY, JSON.stringify(cur))
  window.dispatchEvent(new CustomEvent('ff-team-colors-changed'))
}

// hex(#RRGGBB) blended with white. pct = team color weight (0..1).
function mixWithWhite(hex: string, pct: number): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const mr = Math.round(r * pct + 255 * (1 - pct))
  const mg = Math.round(g * pct + 255 * (1 - pct))
  const mb = Math.round(b * pct + 255 * (1 - pct))
  return '#' + [mr, mg, mb].map((v) => v.toString(16).padStart(2, '0')).join('')
}

// Returns the team meta with any user-set color override applied.
// bgSoft is auto-derived (~14% color + white) so it always matches.
export function getTeamMeta(teamId: TeamId): TeamMeta {
  const base = TEAMS.find((t) => t.id === teamId) ?? TEAMS[0]
  const overrides = loadColorOverrides()
  const custom = overrides[teamId]
  if (!custom) return base
  return { ...base, color: custom, bgSoft: mixWithWhite(custom, 0.14) }
}

export const TEAMS: TeamMeta[] = [
  { id: 'job',     emoji: '📝', label: '취준생', hint: '예: 오늘 자소서 1개 제출',     color: '#5B9DF9', bgSoft: '#E8F1FE',
    examples: [
      '기상 시간 인증',
      '자소서 한 개 제출',
      '자격증 공부 및 취득 인증',
    ] },
  { id: 'college', emoji: '🎓', label: '대학생', hint: '예: 1교시 출석 / 과제 제출',  color: '#F5BD3C', bgSoft: '#FCF3D9',
    examples: [
      '1교시 출석 인증',
      '과제 / 팀플 한 단계 진행',
      '도서관·열람실 도착 인증',
    ] },
  { id: 'student', emoji: '📚', label: '수험생', hint: '예: 새벽 5시 기상 공부 시작', color: '#9B7EE0', bgSoft: '#EFEAFA',
    examples: [
      '기상 시간 인증',
      '오늘 푼 문제 / 인강 진도',
      '하루 마감 정리 인증',
    ] },
  { id: 'athlete', emoji: '🏃', label: '운동인', hint: '예: 5km 러닝 완주',            color: '#F58E5C', bgSoft: '#FCE8DC',
    examples: [
      '러닝 / 걷기 거리 인증',
      '헬스·홈트 세션 완료',
      '운동 후 식단 인증',
    ] },
]

// Reaction palette — anonymous, only counts visible. Order matters (display).
export const REACTIONS = ['❤️', '🤩', '💪', '👍', '😎', '🥳', '😲', '🥹'] as const
export type ReactionEmoji = typeof REACTIONS[number]

export interface TeamPost {
  id: string
  uid: string
  nickname: string
  text: string
  ts: number
  // emoji → list of uids (uids stored only to enforce one-per-user toggling,
  // never displayed in UI)
  reactions: Record<string, string[]>
  photoUrl?: string  // optional — Firebase Storage download URL
  streak?: number    // consecutive days the author has posted in this team
}

// Streak tracking — stored in localStorage per (team, uid). Counts unique
// calendar days. Yesterday → streak+1, today → unchanged, gap → reset to 1.
function streakKey(teamId: TeamId): string {
  return `ff_team_streak_${teamId}`
}
function todayDateStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
function yesterdayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
export function getStreak(teamId: TeamId): number {
  try {
    const raw = localStorage.getItem(streakKey(teamId))
    if (!raw) return 0
    const { count, lastDate } = JSON.parse(raw) as { count: number; lastDate: string }
    const today = todayDateStr()
    // Streak is still valid only if last post was today or yesterday.
    if (lastDate === today || yesterdayOf(lastDate) === today) return count
    return 0
  } catch { return 0 }
}
function bumpStreak(teamId: TeamId): number {
  const today = todayDateStr()
  let next = 1
  try {
    const raw = localStorage.getItem(streakKey(teamId))
    if (raw) {
      const { count, lastDate } = JSON.parse(raw) as { count: number; lastDate: string }
      if (lastDate === today) next = count                    // already counted today
      else if (yesterdayOf(lastDate) === today) next = count + 1  // consecutive
      // else gap → reset to 1
    }
  } catch { /* ignore */ }
  localStorage.setItem(streakKey(teamId), JSON.stringify({ count: next, lastDate: today }))
  return next
}

export interface TeamDoc {
  posts: TeamPost[]
}

const TTL_MS = 24 * 60 * 60 * 1000

function normalizePost(p: Partial<TeamPost> & { hearts?: string[] }): TeamPost {
  // Backwards-compat: legacy posts had hearts:string[] instead of reactions.
  const reactions = p.reactions ?? {}
  if (p.hearts && p.hearts.length && !reactions['❤️']) {
    reactions['❤️'] = p.hearts
  }
  // Firestore rejects undefined values, so spread optional fields only when set.
  const out: TeamPost = {
    id: p.id ?? '',
    uid: p.uid ?? '',
    nickname: p.nickname ?? '익명',
    text: p.text ?? '',
    ts: p.ts ?? 0,
    reactions,
  }
  if (typeof p.photoUrl === 'string') out.photoUrl = p.photoUrl
  if (typeof p.streak === 'number') out.streak = p.streak
  return out
}

// Streak badge — 새싹이 66일에 걸쳐 꽃피우는 성장기. Lally et al. (2010)
// 의 "습관 형성에 평균 66일" 연구 기반:
//   🌱 새싹 (2-6일) → ☘️ 클로버 (7-13일) → 🌿 잎 (14-21일)
//   → 🌷 꽃봉오리 (22-32일) → 🌸 꽃 (33-44일) → 🌺 만발 (45-65일)
//   → 💐 습관 완성 (66일+)
export function streakBadge(n: number): { emoji: string; label: string; color: string } | null {
  if (!n || n < 2) return null
  if (n >= 66) return { emoji: '💐', label: `${n}일째 · 습관 완성!`, color: '#9B7EE0' }
  if (n >= 45) return { emoji: '🌺', label: `${n}일째`, color: '#E8557A' }
  if (n >= 33) return { emoji: '🌸', label: `${n}일째`, color: '#F5A8C4' }
  if (n >= 22) return { emoji: '🌷', label: `${n}일째`, color: '#F58E5C' }
  if (n >= 14) return { emoji: '🌿', label: `${n}일째`, color: '#56C6A0' }
  if (n >= 7)  return { emoji: '☘️', label: `${n}일째`, color: '#80D4A8' }
  return { emoji: '🌱', label: `${n}일째`, color: '#A4E0BC' }
}

export function listenTeam(teamId: TeamId, cb: (data: TeamDoc) => void): Unsubscribe {
  const db = getDb()
  return onSnapshot(doc(db, 'teams', teamId), (snap) => {
    if (snap.exists()) {
      const d = snap.data() as Partial<TeamDoc>
      const cutoff = Date.now() - TTL_MS
      const fresh = (d.posts ?? []).map(normalizePost).filter((p) => p.ts > cutoff)
      cb({ posts: fresh })
    } else {
      cb({ posts: [] })
    }
  })
}

export async function postCheckin(teamId: TeamId, uid: string, nickname: string, text: string, photoUrl?: string): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'teams', teamId)
  const cutoff = Date.now() - TTL_MS
  const streak = bumpStreak(teamId)
  const newPost: TeamPost = {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    uid,
    nickname,
    text: text.trim().slice(0, 30),
    ts: Date.now(),
    reactions: {},
    streak,
    ...(photoUrl ? { photoUrl } : {}),
  }
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const cur = snap.data() as Partial<TeamDoc>
    const kept = (cur.posts ?? []).map(normalizePost).filter((p) => p.ts > cutoff)
    await updateDoc(ref, { posts: [...kept, newPost] })
  } else {
    await setDoc(ref, { posts: [newPost] })
  }
}

// Generate a stable post id ahead of time so the photo path can match the
// post id (cleanup later by id). Caller passes this to both uploadTeamPhoto
// and postCheckin's internal id (currently auto-generated, so this stays
// out of the public API for now).
export function newPostId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export async function deletePost(teamId: TeamId, postId: string, uid: string): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'teams', teamId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const cur = snap.data() as Partial<TeamDoc>
  const posts = (cur.posts ?? []).map(normalizePost)
  // Only allow author or admin (admin check handled at call site).
  const filtered = posts.filter((p) => !(p.id === postId && p.uid === uid))
  if (filtered.length === posts.length) return
  await updateDoc(ref, { posts: filtered })
}

// Admin can delete any post regardless of author. Call site verifies admin.
export async function adminDeletePost(teamId: TeamId, postId: string): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'teams', teamId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const cur = snap.data() as Partial<TeamDoc>
  const posts = (cur.posts ?? []).map(normalizePost)
  const filtered = posts.filter((p) => p.id !== postId)
  if (filtered.length === posts.length) return
  await updateDoc(ref, { posts: filtered })
}

export async function toggleReaction(
  teamId: TeamId,
  postId: string,
  uid: string,
  emoji: ReactionEmoji,
): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'teams', teamId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const cur = snap.data() as Partial<TeamDoc>
  const posts = (cur.posts ?? []).map(normalizePost)
  const target = posts.find((p) => p.id === postId)
  if (!target) return
  const cur_uids = target.reactions[emoji] ?? []
  const has = cur_uids.includes(uid)
  const updated = posts.map((p) => {
    if (p.id !== postId) return p
    const next = { ...p.reactions }
    next[emoji] = has ? cur_uids.filter((u) => u !== uid) : [...cur_uids, uid]
    if (next[emoji].length === 0) delete next[emoji]
    return { ...p, reactions: next }
  })
  await updateDoc(ref, { posts: updated })
}
