import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  arrayUnion,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseApp } from './firebase'
import type { Block } from '../types/block'
import type { RecurringTask } from '../types/recurring'
import type { Habit, HabitLogs } from '../types/habit'
import type { DropItem } from '../types/drop'
import type { Roadmap, GoalEntries } from '../types/goal'
import type { MedLog } from '../types/med'

function getDb() {
  return getFirestore(getFirebaseApp())
}

export interface UserDoc {
  tasks?: Block[]
  recurring?: RecurringTask[]
  habits?: Habit[]
  habitLogs?: HabitLogs
  drops?: DropItem[]
  roadmap?: Roadmap
  goals?: GoalEntries
  quickMemo?: string
  medConfig?: Record<string, unknown> | null
  medLogs?: MedLog[]
  friends?: Array<{ uid: string; code: string; name: string }>
  birthday?: string
  birthyear?: string | number
  nickname?: string
  xp?: number             // lifetime XP (level reflects this)
  monthlyXp?: number      // current month XP (leaderboard score)
  monthlyXpMonth?: string // YYYY-MM tag for monthlyXp
  shareCode?: string
  guestbook?: Array<Record<string, unknown>>
  metrics?: Record<string, unknown>[]
  metricLogs?: Record<string, unknown>
  mandala?: Record<string, unknown>
  [key: string]: unknown
}

export async function loadUserDoc(uid: string): Promise<UserDoc | null> {
  const db = getDb()
  const snap = await getDoc(doc(db, 'users', uid))
  if (snap.exists()) return snap.data() as UserDoc
  return null
}

export async function saveUserDoc(uid: string, data: UserDoc): Promise<void> {
  const db = getDb()
  await setDoc(
    doc(db, 'users', uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export function listenUserDoc(uid: string, callback: (data: UserDoc) => void): Unsubscribe {
  const db = getDb()
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) callback(snap.data() as UserDoc)
  })
}

export async function findUserByShareCode(shareCode: string): Promise<{ uid: string; data: UserDoc } | null> {
  const db = getDb()
  const q = query(collection(db, 'users'), where('shareCode', '==', shareCode))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { uid: snap.docs[0].id, data: snap.docs[0].data() as UserDoc }
}

export async function setShareCode(uid: string, shareCode: string): Promise<void> {
  const db = getDb()
  await setDoc(doc(db, 'users', uid), { shareCode }, { merge: true })
}

export async function pushGuestbook(friendUid: string, entry: Record<string, string | number>): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, 'users', friendUid), { guestbook: arrayUnion(entry) })
}

export interface LeaderEntry { uid: string; nickname: string; xp: number }

function curMonthTag(): string {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

function entryXpForMonth(data: UserDoc): number {
  // Only count monthlyXp if it belongs to the current month — otherwise treat as 0
  if (typeof data.monthlyXp === 'number' && data.monthlyXpMonth === curMonthTag()) {
    return data.monthlyXp
  }
  return 0
}

// Fetch a generous slice ordered by monthlyXp (single-field — no composite index needed),
// then filter client-side to the current month tag. Avoids requiring the user to set
// up a Firestore composite index before the leaderboard works.
async function fetchMonthlyEntries(maxFetch: number = 100): Promise<Array<{ uid: string; data: UserDoc }>> {
  const db = getDb()
  const q = query(collection(db, 'users'), orderBy('monthlyXp', 'desc'), limit(maxFetch))
  const snap = await getDocs(q)
  const month = curMonthTag()
  return snap.docs
    .map((d) => ({ uid: d.id, data: d.data() as UserDoc }))
    .filter(({ data }) => data.monthlyXpMonth === month && typeof data.monthlyXp === 'number')
}

function toLeaderEntry({ uid, data }: { uid: string; data: UserDoc }): LeaderEntry {
  return {
    uid,
    nickname: data.nickname || 'ADHD-' + uid.slice(0, 4),
    xp: entryXpForMonth(data),
  }
}

export async function getTopXp(n: number = 10): Promise<LeaderEntry[]> {
  const entries = await fetchMonthlyEntries(50)
  return entries.slice(0, n).map(toLeaderEntry)
}

export async function getRankSnapshot(myUid: string, myXp: number, ahead: number = 5): Promise<{ rank: number | null; total: number; ahead: LeaderEntry[] }> {
  const entries = await fetchMonthlyEntries(200)
  // Make sure my own row is represented even if I'm beyond the fetch slice (rare).
  const total = entries.length || 1
  let rank = 1
  for (const e of entries) {
    const x = entryXpForMonth(e.data)
    if (x > myXp) rank++
  }
  // Top N people just ahead of me (smallest gap first)
  const aheadList = entries
    .filter((e) => e.uid !== myUid && entryXpForMonth(e.data) > myXp)
    .sort((a, b) => entryXpForMonth(a.data) - entryXpForMonth(b.data))
    .slice(0, ahead)
    .reverse() // top of UI = furthest ahead
    .map(toLeaderEntry)
  return { rank, total, ahead: aheadList }
}
