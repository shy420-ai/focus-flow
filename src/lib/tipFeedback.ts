// Shared tip feedback (likes + comments + bookmarks + reads) stored in
// Firestore at /tipFeedback/{tipId}. Requires Firestore rules to allow
// authenticated reads and writes on this collection.
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { getDb } from './firestore'

export interface TipComment {
  id: string
  fromUid: string
  fromNickname: string
  text: string
  ts: number
  parentId?: string  // if set, this is a 1-level reply
}

export interface TipFeedback {
  likes: string[]      // user uids who tapped 도움됐어
  comments: TipComment[]
  // commentId → list of uids who hearted it. Stored as a map so we can
  // arrayUnion/arrayRemove on a single comment without rewriting the
  // whole comments array.
  commentReactions?: Record<string, string[]>
  bookmarks?: string[] // user uids who bookmarked (for global count)
  reads?: string[]     // user uids who opened the detail modal (dedup'd)
}

const EMPTY: TipFeedback = { likes: [], comments: [], commentReactions: {}, bookmarks: [], reads: [] }

export interface TipCounts {
  likes: number
  comments: number
  bookmarks: number
}

export function listenTipFeedback(tipId: string, cb: (data: TipFeedback) => void): Unsubscribe {
  const db = getDb()
  return onSnapshot(doc(db, 'tipFeedback', tipId), (snap) => {
    if (snap.exists()) {
      const d = snap.data() as Partial<TipFeedback>
      cb({
        likes: d.likes ?? [],
        comments: d.comments ?? [],
        commentReactions: d.commentReactions ?? {},
        bookmarks: d.bookmarks ?? [],
      })
    } else {
      cb(EMPTY)
    }
  })
}

// One-shot batch read of counts for the visible tip cards. Top-level
// comments only (replies don't count toward the card-level 💬 number).
export async function getTipCountsBatch(tipIds: string[]): Promise<Record<string, TipCounts>> {
  const db = getDb()
  const out: Record<string, TipCounts> = {}
  await Promise.all(tipIds.map(async (id) => {
    try {
      const snap = await getDoc(doc(db, 'tipFeedback', id))
      if (!snap.exists()) {
        out[id] = { likes: 0, comments: 0, bookmarks: 0 }
        return
      }
      const d = snap.data() as Partial<TipFeedback>
      const topLevel = (d.comments ?? []).filter((c) => !c.parentId).length
      out[id] = {
        likes: (d.likes ?? []).length,
        comments: topLevel,
        bookmarks: (d.bookmarks ?? []).length,
      }
    } catch {
      out[id] = { likes: 0, comments: 0, bookmarks: 0 }
    }
  }))
  return out
}

// Record an open of the detail modal. arrayUnion makes this idempotent —
// the same uid landing many times doesn't inflate the count. Best-effort:
// failures are silent (offline, rules glitch, etc.).
export async function recordTipRead(tipId: string, uid: string): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'tipFeedback', tipId)
  try { await setDoc(ref, { reads: arrayUnion(uid) }, { merge: true }) }
  catch (e) { console.error('[recordTipRead]', tipId, e) }
}

// One-shot read of every tipFeedback doc. Used by the dev stats panel.
// Heavy — fetches every document. Don't call from regular UI paths.
export interface TipFeedbackRow {
  id: string
  reads: string[]
  likes: string[]
  bookmarks: string[]
  comments: TipComment[]
}
export async function getAllTipFeedback(): Promise<TipFeedbackRow[]> {
  const db = getDb()
  const snap = await getDocs(collection(db, 'tipFeedback'))
  return snap.docs.map((d) => {
    const data = d.data() as Partial<TipFeedback>
    return {
      id: d.id,
      reads: data.reads ?? [],
      likes: data.likes ?? [],
      bookmarks: data.bookmarks ?? [],
      comments: data.comments ?? [],
    }
  })
}

export async function setBookmarkRemote(tipId: string, uid: string, on: boolean): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'tipFeedback', tipId)
  if (on) {
    try { await setDoc(ref, { bookmarks: arrayUnion(uid) }, { merge: true }) }
    catch (e) { console.error('[setBookmarkRemote] add', tipId, e) }
  } else {
    try { await updateDoc(ref, { bookmarks: arrayRemove(uid) }) }
    catch (e) {
      // Doc might not exist yet; that's fine, but log other errors.
      const code = (e as { code?: string }).code
      if (code !== 'not-found') console.error('[setBookmarkRemote] remove', tipId, e)
    }
  }
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
