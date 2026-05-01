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
  // commentId → list of uids who hearted it. Stored as a map so we can
  // arrayUnion/arrayRemove on a single comment without rewriting the
  // whole comments array.
  commentReactions?: Record<string, string[]>
}

const EMPTY: TipFeedback = { likes: [], comments: [], commentReactions: {} }

export function listenTipFeedback(tipId: string, cb: (data: TipFeedback) => void): Unsubscribe {
  const db = getDb()
  return onSnapshot(doc(db, 'tipFeedback', tipId), (snap) => {
    if (snap.exists()) {
      const d = snap.data() as Partial<TipFeedback>
      cb({ likes: d.likes ?? [], comments: d.comments ?? [], commentReactions: d.commentReactions ?? {} })
    } else {
      cb(EMPTY)
    }
  })
}

export async function setCommentReaction(tipId: string, commentId: string, uid: string, liked: boolean): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'tipFeedback', tipId)
  const path = `commentReactions.${commentId}`
  if (liked) {
    try { await updateDoc(ref, { [path]: arrayUnion(uid) }) }
    catch {
      // doc missing → seed it
      await setDoc(ref, { commentReactions: { [commentId]: [uid] } }, { merge: true })
    }
  } else {
    try { await updateDoc(ref, { [path]: arrayRemove(uid) }) }
    catch { /* doc missing, nothing to remove */ }
  }
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
