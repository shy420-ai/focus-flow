// Shared tip feedback (likes + comments) stored in Firestore at
// /tipFeedback/{tipId}. Requires Firestore rules to allow authenticated
// reads and writes on this collection (see deployment notes).
import { doc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { getDb } from './firestore'

export interface TipComment {
  id: string
  fromUid: string
  fromNickname: string
  text: string
  ts: number
}

export interface TipFeedback {
  likes: string[]      // user uids
  comments: TipComment[]
}

const EMPTY: TipFeedback = { likes: [], comments: [] }

export function listenTipFeedback(tipId: string, cb: (data: TipFeedback) => void): Unsubscribe {
  const db = getDb()
  return onSnapshot(doc(db, 'tipFeedback', tipId), (snap) => {
    if (snap.exists()) {
      const d = snap.data() as Partial<TipFeedback>
      cb({ likes: d.likes ?? [], comments: d.comments ?? [] })
    } else {
      cb(EMPTY)
    }
  })
}

export async function setLike(tipId: string, uid: string, liked: boolean): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'tipFeedback', tipId)
  if (liked) {
    await setDoc(ref, { likes: arrayUnion(uid) }, { merge: true })
  } else {
    // updateDoc fails if doc doesn't exist — fallback to setDoc with merge
    try { await updateDoc(ref, { likes: arrayRemove(uid) }) }
    catch { await setDoc(ref, { likes: [] }, { merge: true }) }
  }
}

export async function addComment(tipId: string, comment: TipComment): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'tipFeedback', tipId)
  await setDoc(ref, { comments: arrayUnion(comment) }, { merge: true })
}

export async function deleteComment(tipId: string, comment: TipComment): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'tipFeedback', tipId)
  try { await updateDoc(ref, { comments: arrayRemove(comment) }) }
  catch { /* doc missing, nothing to remove */ }
}
