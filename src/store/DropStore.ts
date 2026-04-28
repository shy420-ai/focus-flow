import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DropItem } from '../types/drop'
import { readJSON, writeJSON } from '../lib/localStorage'
import { queue, registerCollect, registerHydrate } from '../lib/syncManager'
import type { UserDoc } from '../lib/firestore'

interface DropState {
  items: DropItem[]
}

interface DropActions {
  addItem: (name: string) => void
  toggleDone: (id: number) => void
  deleteItem: (id: number) => void
  editItem: (id: number, name: string) => void
  reorder: (fromIdx: number, toIdx: number) => void
  clearDone: () => void
  shuffle: () => void
}

type DropStore = DropState & DropActions

function persist(items: DropItem[]) {
  writeJSON('ff_drops', items)
  queue()
}

export const useDropStore = create<DropStore>()(
  immer((set, get) => ({
    items: readJSON<DropItem[]>('ff_drops', []),

    addItem: (name) => {
      if (!name.trim()) return
      set((state) => {
        state.items.unshift({ id: Date.now(), name: name.trim(), done: false })
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
      persist(get().items)
    },

    editItem: (id, name) => {
      set((state) => {
        const item = state.items.find((i) => i.id === id)
        if (item) item.name = name
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
  if (d.drops) useDropStore.setState({ items: d.drops })
})
