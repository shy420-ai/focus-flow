// Single-emoji avatar shared with friends and leaderboard.
import { queue, registerCollect, registerHydrate } from './syncManager'
import type { UserDoc } from './firestore'

const KEY = 'ff_avatar'
const DEFAULT = '🧸'

export const AVATAR_OPTIONS = [
  '🧸', '🐰', '🐱', '🐶', '🐻', '🐼', '🦊', '🦝',
  '🐯', '🦁', '🐮', '🐸', '🐵', '🐧', '🐤', '🦄',
  '🐙', '🐠', '🦋', '🌸', '🌻', '🌈', '⭐️', '☁️',
  '🍑', '🍓', '🍋', '🍇', '🍰', '🧁', '☕️', '🍵',
] as const

export function getAvatar(): string {
  return localStorage.getItem(KEY) || DEFAULT
}

export function setAvatar(emoji: string): void {
  localStorage.setItem(KEY, emoji)
  window.dispatchEvent(new CustomEvent('ff-avatar-changed'))
  queue()
}

registerCollect(() => {
  const v = localStorage.getItem(KEY)
  return v ? { avatar: v } : {}
})

registerHydrate((d: UserDoc) => {
  if (typeof d.avatar === 'string' && d.avatar) {
    if (localStorage.getItem(KEY) !== d.avatar) {
      localStorage.setItem(KEY, d.avatar)
      window.dispatchEvent(new CustomEvent('ff-avatar-changed'))
    }
  }
})
