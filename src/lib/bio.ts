// One-line profile message visible to friends.
import { queue, registerCollect, registerHydrate } from './syncManager'
import type { UserDoc } from './firestore'

const KEY = 'ff_bio'
const MAX_LEN = 80

export function getBio(): string {
  return localStorage.getItem(KEY) || ''
}

export function setBio(text: string): void {
  const trimmed = text.slice(0, MAX_LEN)
  localStorage.setItem(KEY, trimmed)
  window.dispatchEvent(new CustomEvent('ff-bio-changed'))
  queue()
}

registerCollect(() => {
  const v = localStorage.getItem(KEY)
  return typeof v === 'string' ? { bio: v } : {}
})

registerHydrate((d: UserDoc) => {
  if (typeof d.bio === 'string') {
    if (localStorage.getItem(KEY) !== d.bio) {
      localStorage.setItem(KEY, d.bio)
      window.dispatchEvent(new CustomEvent('ff-bio-changed'))
    }
  }
})
