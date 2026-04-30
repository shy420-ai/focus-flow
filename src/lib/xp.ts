const KEY = 'ff_xp'
const PER_LEVEL = 50  // XP needed per level

export function getXp(): number {
  const n = parseInt(localStorage.getItem(KEY) || '0')
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function addXp(n: number): { newXp: number; leveledUp: boolean; newLevel: number } {
  const before = getXp()
  const after = Math.max(0, before + n)
  const beforeLv = Math.floor(before / PER_LEVEL) + 1
  const afterLv = Math.floor(after / PER_LEVEL) + 1
  localStorage.setItem(KEY, String(after))
  window.dispatchEvent(new CustomEvent('ff-xp-changed'))
  return { newXp: after, leveledUp: afterLv > beforeLv, newLevel: afterLv }
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
