// Per-section visibility — controls what *my* friends see when they
// open my profile. Stored as flat fields on the user doc so each section
// can be toggled independently and the friend's read just checks the
// corresponding flag.
import { queue, registerCollect, registerHydrate } from './syncManager'
import type { UserDoc } from './firestore'

export type VisibilitySection = 'timeline' | 'habits' | 'sprint' | 'xp' | 'condition'

const KEY = 'ff_friend_visibility'

const DEFAULT: Record<VisibilitySection, boolean> = {
  timeline: true,
  habits: true,
  sprint: true,
  xp: true,
  condition: true,
}

export const VISIBILITY_LABELS: Record<VisibilitySection, string> = {
  timeline: '일간',
  habits: '습관',
  sprint: '목표',
  xp: '레벨',
  condition: '컨디션',
}

export function getVisibility(): Record<VisibilitySection, boolean> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as Partial<Record<VisibilitySection, boolean>>
    return { ...DEFAULT, ...parsed }
  } catch {
    return { ...DEFAULT }
  }
}

export function setVisibility(next: Record<VisibilitySection, boolean>): void {
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('ff-friend-visibility-changed'))
  queue()
}

// Read a friend's UserDoc and decide if a given section is visible to me.
// Defaults to true when the friend hasn't set anything — matches the legacy
// behavior where every section was always shared.
export function isSectionVisible(friendDoc: UserDoc, section: VisibilitySection): boolean {
  const v = (friendDoc.friendVisibility as Partial<Record<VisibilitySection, boolean>> | undefined) || {}
  return v[section] !== false
}

registerCollect(() => {
  const v = getVisibility()
  return { friendVisibility: v }
})

registerHydrate((d: UserDoc) => {
  const v = d.friendVisibility as Partial<Record<VisibilitySection, boolean>> | undefined
  if (v && typeof v === 'object') {
    const merged = { ...DEFAULT, ...v }
    const localStr = localStorage.getItem(KEY)
    const remoteStr = JSON.stringify(merged)
    if (localStr !== remoteStr) {
      localStorage.setItem(KEY, remoteStr)
      window.dispatchEvent(new CustomEvent('ff-friend-visibility-changed'))
    }
  }
})
