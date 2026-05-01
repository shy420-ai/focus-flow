// User-added archive entries — links with previews, stored in localStorage.
// YouTube URLs auto-resolve title + thumbnail via oEmbed; everything else
// keeps the title the user typed.

const KEY = 'ff_archive_entries'

export interface ArchiveEntry {
  id: string
  title: string
  url: string
  description?: string
  thumbnail?: string
  ts: number
}

export function loadArchive(): ArchiveEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as ArchiveEntry[] }
  catch { return [] }
}

export function saveArchive(items: ArchiveEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function addEntry(e: Omit<ArchiveEntry, 'id' | 'ts'>): ArchiveEntry {
  const entry: ArchiveEntry = { ...e, id: String(Date.now()), ts: Date.now() }
  const cur = loadArchive()
  cur.unshift(entry)
  saveArchive(cur)
  window.dispatchEvent(new CustomEvent('ff-archive-changed'))
  return entry
}

export function deleteEntry(id: string): void {
  saveArchive(loadArchive().filter((e) => e.id !== id))
  window.dispatchEvent(new CustomEvent('ff-archive-changed'))
}

export async function fetchYoutubePreview(url: string): Promise<{ title: string; thumbnail: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    if (!res.ok) return null
    const data = await res.json()
    return {
      title: typeof data.title === 'string' ? data.title : '',
      thumbnail: typeof data.thumbnail_url === 'string' ? data.thumbnail_url : '',
    }
  } catch { return null }
}

export function isYoutubeUrl(url: string): boolean {
  return /youtu\.be\/|youtube\.com\/watch|youtube\.com\/embed/.test(url)
}
