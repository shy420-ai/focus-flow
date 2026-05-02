// Per-user bookmarks for the 정보 tab. Local list drives the UI (instant
// star toggle, per-device "내 북마크" filter). The toggle also pushes to
// /tipFeedback/{id}.bookmarks so we can show a global "🔖 N" count on
// each card.
import { setBookmarkRemote } from './tipFeedback'
import { useAppStore } from '../store/AppStore'

const KEY = 'ff_tip_bookmarks'

export function loadBookmarks(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as string[] }
  catch { return [] }
}

export function isBookmarked(id: string): boolean {
  return loadBookmarks().includes(id)
}

export function toggleBookmark(id: string): void {
  const cur = loadBookmarks()
  const on = !cur.includes(id)
  const next = on ? [...cur, id] : cur.filter((x) => x !== id)
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('ff-tip-bookmarks-changed'))
  const uid = useAppStore.getState().uid
  if (uid) setBookmarkRemote(id, uid, on).catch(() => { /* offline ok */ })
}
