// App-wide font selector. Two bundled Korean fonts + an optional user
// upload (custom .ttf/.otf/.woff/.woff2 stored in IndexedDB so 1-3 MB
// files don't bust the 5 MB localStorage cap).
//
// Apply path: registers a FontFace at runtime → swaps the --app-font
// CSS variable on documentElement. The preference key is just a string
// in localStorage; no Firestore sync (intentional — fonts are heavy
// and per-device feels right).

const PREF_KEY = 'ff_font_pref'

// Bundled options. id matches the option saved in PREF_KEY.
const PRESETS: Record<string, { name: string; url: string; family: string }> = {
  leeseoyoon: {
    name: '이서윤체',
    url: import.meta.env.BASE_URL + 'fonts/Leeseoyoon.ttf',
    family: 'Leeseoyoon',
  },
  dxmsub: {
    name: 'DX 영화자막체',
    url: import.meta.env.BASE_URL + 'fonts/DXMSubtitles.ttf',
    family: 'DXMSubtitles',
  },
}

const DEFAULT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const CUSTOM_FAMILY = 'CustomUserFont'

export type FontPref = 'default' | keyof typeof PRESETS | 'custom'

export function getFontPref(): FontPref {
  const v = localStorage.getItem(PREF_KEY)
  if (v === 'leeseoyoon' || v === 'dxmsub' || v === 'custom') return v
  return 'default'
}

export function setFontPref(pref: FontPref): void {
  if (pref === 'default') localStorage.removeItem(PREF_KEY)
  else localStorage.setItem(PREF_KEY, pref)
  applyFont().catch(() => { /* offline / blob missing */ })
  window.dispatchEvent(new CustomEvent('ff-font-changed'))
}

export function listPresets(): Array<{ id: keyof typeof PRESETS; name: string }> {
  return Object.entries(PRESETS).map(([id, v]) => ({ id: id as keyof typeof PRESETS, name: v.name }))
}

// ── IndexedDB for custom font blob ──────────────────────────────────
const DB = 'ff-font'
const STORE = 'blob'
const BLOB_KEY = 'custom'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

export async function saveCustomFont(blob: Blob, fileName: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ blob, fileName }, BLOB_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadCustomFont(): Promise<{ blob: Blob; fileName: string } | null> {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const r = tx.objectStore(STORE).get(BLOB_KEY)
      r.onsuccess = () => resolve(r.result || null)
      r.onerror = () => reject(r.error)
    })
  } catch { return null }
}

export async function clearCustomFont(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(BLOB_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* ignore */ }
}

// Track loaded families so we don't double-register.
const loaded = new Set<string>()

async function ensurePresetLoaded(id: keyof typeof PRESETS): Promise<string> {
  const p = PRESETS[id]
  if (loaded.has(p.family)) return p.family
  const face = new FontFace(p.family, `url(${p.url})`)
  await face.load()
  document.fonts.add(face)
  loaded.add(p.family)
  return p.family
}

async function ensureCustomLoaded(): Promise<string | null> {
  const r = await loadCustomFont()
  if (!r) return null
  // Always re-register on each apply call — the file may have changed.
  // FontFaceSet.add of the same family overwrites silently in Chrome,
  // and most other browsers handle it gracefully too.
  const url = URL.createObjectURL(r.blob)
  const face = new FontFace(CUSTOM_FAMILY, `url(${url})`)
  try { await face.load() }
  catch { URL.revokeObjectURL(url); return null }
  document.fonts.add(face)
  loaded.add(CUSTOM_FAMILY)
  return CUSTOM_FAMILY
}

export async function applyFont(): Promise<void> {
  const pref = getFontPref()
  const root = document.documentElement
  if (pref === 'default') {
    root.style.setProperty('--app-font', DEFAULT_STACK)
    return
  }
  if (pref === 'custom') {
    const fam = await ensureCustomLoaded()
    if (fam) root.style.setProperty('--app-font', `'${fam}', ${DEFAULT_STACK}`)
    else root.style.setProperty('--app-font', DEFAULT_STACK)
    return
  }
  // preset
  try {
    const fam = await ensurePresetLoaded(pref)
    root.style.setProperty('--app-font', `'${fam}', ${DEFAULT_STACK}`)
  } catch {
    root.style.setProperty('--app-font', DEFAULT_STACK)
  }
}
