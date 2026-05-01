import { queue, registerCollect, registerHydrate } from './syncManager'
import type { UserDoc } from './firestore'

const KEY = 'ff_xp'                 // lifetime XP — never reset
const MONTH_KEY = 'ff_monthly_xp'   // current month XP — leaderboard score
const MONTH_TAG = 'ff_xp_month'     // YYYY-MM that monthlyXp belongs to
const PER_LEVEL = 50                // XP needed per level

function curMonth(): string {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

export function getXp(): number {
  const n = parseInt(localStorage.getItem(KEY) || '0')
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function getMonthlyXp(): number {
  // Auto-reset if month changed since last write
  const tag = localStorage.getItem(MONTH_TAG)
  if (tag !== curMonth()) {
    localStorage.setItem(MONTH_TAG, curMonth())
    localStorage.setItem(MONTH_KEY, '0')
    // Push the fresh month tag to Firestore so the leaderboard sees us
    // immediately after the auto-reset (otherwise our doc still carries
    // last month's tag and we'd get filtered out).
    queue()
    return 0
  }
  const n = parseInt(localStorage.getItem(MONTH_KEY) || '0')
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function addXp(n: number): { newXp: number; leveledUp: boolean; newLevel: number } {
  const beforeLifetime = getXp()
  const afterLifetime = Math.max(0, beforeLifetime + n)
  const beforeLv = Math.floor(beforeLifetime / PER_LEVEL) + 1
  const afterLv = Math.floor(afterLifetime / PER_LEVEL) + 1
  localStorage.setItem(KEY, String(afterLifetime))

  // Monthly XP — mirrors lifetime so '아쉽다 -1' also rewinds leaderboard score.
  // Floored at 0 (no negative monthly).
  const beforeMonthly = getMonthlyXp()  // also handles auto-reset
  localStorage.setItem(MONTH_KEY, String(Math.max(0, beforeMonthly + n)))

  window.dispatchEvent(new CustomEvent('ff-xp-changed'))
  queue()
  return { newXp: afterLifetime, leveledUp: afterLv > beforeLv, newLevel: afterLv }
}

export function getLevel(xp?: number): number {
  const v = xp ?? getXp()
  return Math.floor(v / PER_LEVEL) + 1
}

export function xpInLevel(xp?: number): { current: number; needed: number; pct: number } {
  const v = xp ?? getXp()
  const lv = getLevel(v)
  const baseForLevel = (lv - 1) * PER_LEVEL
  const current = v - baseForLevel
  const pct = Math.round((current / PER_LEVEL) * 100)
  return { current, needed: PER_LEVEL, pct }
}

export function resetXp(): void {
  localStorage.setItem(KEY, '0')
  localStorage.setItem(MONTH_KEY, '0')
  localStorage.setItem(MONTH_TAG, curMonth())
  window.dispatchEvent(new CustomEvent('ff-xp-changed'))
  queue()
}

registerCollect(() => ({
  xp: getXp(),
  monthlyXp: getMonthlyXp(),
  monthlyXpMonth: curMonth(),
}))

registerHydrate((d: UserDoc) => {
  if (typeof d.xp === 'number') {
    const local = getXp()
    if (d.xp > local) {
      localStorage.setItem(KEY, String(d.xp))
      window.dispatchEvent(new CustomEvent('ff-xp-changed'))
    }
  }
  // Pull monthly only if it's the same month (otherwise stale data wins on a new month)
  if (typeof d.monthlyXp === 'number' && d.monthlyXpMonth === curMonth()) {
    const local = getMonthlyXp()
    if (d.monthlyXp > local) {
      localStorage.setItem(MONTH_TAG, curMonth())
      localStorage.setItem(MONTH_KEY, String(d.monthlyXp))
    }
  }
})
