// IndexedDB-backed storage for the mood BGM mp3 upload.
// localStorage is too small for audio files (~5MB cap on most browsers),
// so we put the blob in IndexedDB and keep just the filename in
// localStorage so the UI knows there's a file without opening the DB.

const DB_NAME = 'ff-mood-bgm'
const STORE = 'files'
const KEY = 'default'

const NAME_KEY = 'ff_mood_audio_name'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveAudio(file: File): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(file, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
  localStorage.setItem(NAME_KEY, file.name)
}

export async function loadAudioBlob(): Promise<Blob | null> {
  try {
    const db = await openDb()
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const get = tx.objectStore(STORE).get(KEY)
      get.onsuccess = () => resolve((get.result as Blob | undefined) ?? null)
      get.onerror = () => reject(get.error)
    })
    db.close()
    return blob
  } catch {
    return null
  }
}

export async function clearAudio(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch { /* ignore */ }
  localStorage.removeItem(NAME_KEY)
}

export function getAudioName(): string {
  return localStorage.getItem(NAME_KEY) ?? ''
}
