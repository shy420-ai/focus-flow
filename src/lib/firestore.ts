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

export async function getTopXp(n: number = 10): Promise<LeaderEntry[]> {
  const db = getDb()
  const month = curMonthTag()
  const q = query(collection(db, 'users'), where('monthlyXpMonth', '==', month), orderBy('monthlyXp', 'desc'), limit(n))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data() as UserDoc
    return {
      uid: d.id,
      nickname: data.nickname || 'ADHD-' + d.id.slice(0, 4),
      xp: entryXpForMonth(data),
    }
  })
}

export async function getRankSnapshot(_myUid: string, myXp: number, ahead: number = 5): Promise<{ rank: number | null; total: number; ahead: LeaderEntry[] }> {
  const db = getDb()
  const month = curMonthTag()
  const allQ = query(collection(db, 'users'), where('monthlyXpMonth', '==', month))
  const all = await getDocs(allQ)
  const total = all.size
  let rank = 0
  all.docs.forEach((d) => {
    const x = entryXpForMonth(d.data() as UserDoc)
    if (x > myXp) rank++
  })
  rank += 1
  const aheadQ = query(collection(db, 'users'), where('monthlyXpMonth', '==', month), where('monthlyXp', '>', myXp), orderBy('monthlyXp', 'asc'), limit(ahead))
  const aheadSnap = await getDocs(aheadQ)
  const aheadList: LeaderEntry[] = aheadSnap.docs.map((d) => {
    const data = d.data() as UserDoc
    return {
      uid: d.id,
      nickname: data.nickname || 'ADHD-' + d.id.slice(0, 4),
      xp: entryXpForMonth(data),
    }
  }).reverse()
  return { rank: total > 0 ? rank : null, total, ahead: aheadList }
}
