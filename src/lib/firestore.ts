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
