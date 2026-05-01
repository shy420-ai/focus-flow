import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DropItem } from '../types/drop'
import { readJSON, writeJSON } from '../lib/localStorage'
import { flushSync, registerCollect, registerHydrate } from '../lib/syncManager'
import type { UserDoc } from '../lib/firestore'

interface DropState {
  items: DropItem[]
}

interface DropActions {
  addItem: (name: string, opts?: { template?: string; tags?: string[] }) => void
  toggleDone: (id: number) => void
  deleteItem: (id: number) => void
  editItem: (id: number, patch: Partial<DropItem>) => void
  reorder: (fromIdx: number, toIdx: number) => void
  clearDone: () => void
  clearAll: () => void
  shuffle: () => void
  toggleStar: (id: number) => void
  setNote: (id: number, note: string) => void
  setTags: (id: number, tags: string[]) => void
  setImage: (id: number, imageUrl: string | null) => void
}

type DropStore = DropState & DropActions

const TOMBSTONE_KEY = 'ff_drops_tombstones'

function loadTombstones(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(TOMBSTONE_KEY) || '[]')) }
  catch { return new Set() }
}

function saveTombstones(set: Set<number>): void {
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(Array.from(set)))
}

function persist(items: DropItem[]) {
  writeJSON('ff_drops', items)
  // Push immediately. Drop edits are infrequent and a single delete
  // shouldn't compete with a stale echo that brings the row back.
  flushSync().catch(() => { /* offline ok */ })
  window.dispatchEvent(new CustomEvent('ff-drops-local-changed'))
}

export const useDropStore = create<DropStore>()(
  immer((set, get) => ({
    items: readJSON<DropItem[]>('ff_drops', []),

    addItem: (name, opts) => {
      if (!name.trim()) return
      set((state) => {
        state.items.unshift({
          id: Date.now(),
          name: name.trim(),
          done: false,
          template: opts?.template,
          tags: opts?.tags?.length ? opts.tags : undefined,
          createdAt: Date.now(),
        })
      })
      persist(get().items)
    },

    toggleDone: (id) => {
      set((state) => {
        const item = state.items.find((i) => i.id === id)
        if (item) item.done = !item.done
      })
      persist(get().items)
    },

    deleteItem: (id) => {
      set((state) => {
        state.items = state.items.filter((i) => i.id !== id)
      })
      // Mark id as deleted so a stale Firestore snapshot can't resurrect it
      // through the merge-on-hydrate path.
      const tombstones = loadTombstones()
      tombstones.add(id)
      saveTombstones(tombstones)
      persist(get().items)
    },

    editItem: (id, patch) => {
      set((state) => {
        const item = state.items.find((i) => i.id === id)
        if (item) Object.assign(item, patch)
      })
      persist(get().items)
    },

    toggleStar: (id) => {
      set((state) => {
        const item = state.items.find((i) => i.id === id)
        if (item) item.starred = !item.starred
      })
      persist(get().items)
    },

    setNote: (id, note) => {
      set((state) => {
        const item = state.items.find((i) => i.id === id)
        if (item) item.note = note
      })
      persist(get().items)
    },

    setTags: (id, tags) => {
      set((state) => {
        const item = state.items.find((i) => i.id === id)
        if (item) item.tags = tags.length ? tags : undefined
      })
      persist(get().items)
    },

    setImage: (id, imageUrl) => {
      set((state) => {
        const item = state.items.find((i) => i.id === id)
        if (item) item.imageUrl = imageUrl || undefined
      })
      persist(get().items)
    },

    reorder: (fromIdx, toIdx) => {
      set((state) => {
        const todo = state.items.filter((i) => !i.done)
        const done = state.items.filter((i) => i.done)
        const [moved] = todo.splice(fromIdx, 1)
        todo.splice(toIdx, 0, moved)
        state.items = [...todo, ...done]
      })
      persist(get().items)
    },

    clearDone: () => {
      set((state) => {
        state.items = state.items.filter((i) => !i.done)
      })
      persist(get().items)
    },

    clearAll: () => {
      set((state) => {
        state.items = []
      })
      persist(get().items)
    },

    shuffle: () => {
      set((state) => {
        const todo = state.items.filter((i) => !i.done)
        const done = state.items.filter((i) => i.done)
        for (let i = todo.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[todo[i], todo[j]] = [todo[j], todo[i]]
        }
        state.items = [...todo, ...done]
      })
      persist(get().items)
    },
  })),
)

// ── Firestore sync registration ──────────────────────────────────────────────

registerCollect(() => ({ drops: useDropStore.getState().items }))

registerHydrate((d: UserDoc) => {
  if (!d.drops) return
  // Append-only on hydrate, plus tombstones: a stale Firestore snapshot
  // can't resurrect an item the user just deleted locally because the
  // tombstone set blocks it.
  const localItems = useDropStore.getState().items
  const localById = new Map(localItems.map((i) => [i.id, i]))
  const tombstones = loadTombstones()
  const merged: DropItem[] = [...localItems]
  for (const r of d.drops) {
    if (localById.has(r.id)) continue
    if (tombstones.has(r.id)) continue
    merged.push(r)
  }
  if (merged.length !== localItems.length) {
    useDropStore.setState({ items: merged })
    writeJSON('ff_drops', merged)
  }
})
