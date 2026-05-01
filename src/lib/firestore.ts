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
  getCountFromServer,
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

// Fetch a generous slice ordered by monthlyXp (single-field — no composite index needed).
// Returns ALL fetched docs without filtering by month — the caller decides whether to
// strict-filter or include stale-month docs (so users with stale tags still appear once
// flushSync has had a chance to update them).
async function fetchMonthlyEntries(maxFetch: number = 200): Promise<Array<{ uid: string; data: UserDoc }>> {
  const db = getDb()
  const q = query(collection(db, 'users'), orderBy('monthlyXp', 'desc'), limit(maxFetch))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ uid: d.id, data: d.data() as UserDoc }))
}

function toLeaderEntry({ uid, data }: { uid: string; data: UserDoc }): LeaderEntry {
  return {
    uid,
    nickname: data.nickname || 'ADHD-' + uid.slice(0, 4),
    xp: entryXpForMonth(data),
  }
}

export async function getTopXp(n: number = 10): Promise<LeaderEntry[]> {
  const all = await fetchMonthlyEntries(100)
  const month = curMonthTag()
  // Prefer entries already on the current month, but fall back to others (stale tag)
  // sorted by their raw monthlyXp so brand-new accounts and not-yet-synced users still
  // show somewhere instead of being silently dropped.
  const cur = all.filter((e) => e.data.monthlyXpMonth === month)
  if (cur.length >= n) return cur.slice(0, n).map(toLeaderEntry)
  const stale = all.filter((e) => e.data.monthlyXpMonth !== month)
  return [...cur, ...stale.map((e) => ({ uid: e.uid, data: { ...e.data, monthlyXp: 0 } as UserDoc }))]
    .slice(0, n)
    .map(toLeaderEntry)
}

export async function getRankSnapshot(myUid: string, myXp: number, ahead: number = 5): Promise<{ rank: number | null; total: number; ahead: LeaderEntry[] }> {
  const all = await fetchMonthlyEntries(200)
  const month = curMonthTag()
  const monthEntries = all.filter((e) => e.data.monthlyXpMonth === month)
  // total counts both fresh and stale-tag rows (everyone the leaderboard could show this month)
  const total = Math.max(monthEntries.length, all.length, 1)
  let rank = 1
  for (const e of monthEntries) {
    const x = entryXpForMonth(e.data)
    if (x > myXp) rank++
  }
  const aheadList = monthEntries
    .filter((e) => e.uid !== myUid && entryXpForMonth(e.data) > myXp)
    .sort((a, b) => entryXpForMonth(a.data) - entryXpForMonth(b.data))
    .slice(0, ahead)
    .reverse()
    .map(toLeaderEntry)
  return { rank, total, ahead: aheadList }
}

export async function getUserCount(): Promise<number> {
  const db = getDb()
  const snap = await getCountFromServer(collection(db, 'users'))
  return snap.data().count
}
