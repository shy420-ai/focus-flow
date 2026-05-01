// Per-user bookmarks for the 정보 tab. Stored in localStorage so each
// device keeps its own list (no Firestore sync needed for personal
// bookmarks).
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
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('ff-tip-bookmarks-changed'))
}
