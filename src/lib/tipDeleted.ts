// Admin-only soft delete of curated tips in the 정보 tab. Stored locally;
// only visible to dev-mode users in the UI. Filtering happens at render
// time so tips can be brought back by removing the id from the list.
const KEY = 'ff_tip_deleted'

export function loadDeleted(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as string[] }
  catch { return [] }
}

export function isDeleted(id: string): boolean {
  return loadDeleted().includes(id)
}

export function deleteTip(id: string): void {
  const cur = loadDeleted()
  if (cur.includes(id)) return
  localStorage.setItem(KEY, JSON.stringify([...cur, id]))
  window.dispatchEvent(new CustomEvent('ff-tip-deleted-changed'))
}

export function restoreTip(id: string): void {
  const cur = loadDeleted()
  const next = cur.filter((x) => x !== id)
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('ff-tip-deleted-changed'))
}
