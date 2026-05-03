// Lightweight team check-in feed. One Firestore doc per team holds the
// last 24h of posts as an array — same pattern as tipFeedback to keep
// reads/writes minimal during the MVP. Old posts are pruned by whoever
// writes next, no cron needed.
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { getDb } from './firestore'

export type TeamId = 'job' | 'worker' | 'student' | 'athlete'

export interface TeamMeta {
  id: TeamId
  emoji: string
  label: string
  hint: string  // placeholder for the input
}

export const TEAMS: TeamMeta[] = [
  { id: 'job',     emoji: '🎓', label: '취준생', hint: '예: 오늘 자소서 1개 제출' },
  { id: 'worker',  emoji: '💼', label: '직장인', hint: '예: 9시 출근 완료' },
  { id: 'student', emoji: '📚', label: '수험생', hint: '예: 새벽 5시 기상 공부 시작' },
  { id: 'athlete', emoji: '🏃', label: '운동인', hint: '예: 5km 러닝 완주' },
]

// Reaction palette — anonymous, only counts visible. Order matters (display).
export const REACTIONS = ['❤️', '🤩', '💪', '👍'] as const
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
  return {
    id: p.id ?? '',
    uid: p.uid ?? '',
    nickname: p.nickname ?? '익명',
    text: p.text ?? '',
    ts: p.ts ?? 0,
    reactions,
  }
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

export async function postCheckin(teamId: TeamId, uid: string, nickname: string, text: string): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'teams', teamId)
  const cutoff = Date.now() - TTL_MS
  const newPost: TeamPost = {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    uid,
    nickname,
    text: text.trim().slice(0, 80),
    ts: Date.now(),
    reactions: {},
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
