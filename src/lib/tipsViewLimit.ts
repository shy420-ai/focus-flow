// Daily soft lock for the 정보 tab. Counts how many tips opened today;
// past the limit, TipsView renders a lock screen with a 30s wait
// override that grants a few more views before re-locking.

const VIEW_KEY = 'ff_tips_viewed_today'
const OVERRIDE_KEY = 'ff_tips_override_today'
const LIMIT_KEY = 'ff_tips_limit'

const DEFAULT_LIMIT = 5
const OVERRIDE_EXTRA = 3   // each override grants +3 tip opens

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

interface ViewState { date: string; count: number }
interface OverrideState { date: string; extra: number }

function loadView(): ViewState {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (!raw) return { date: todayStr(), count: 0 }
    const s = JSON.parse(raw) as ViewState
    if (s.date !== todayStr()) return { date: todayStr(), count: 0 }
    return s
  } catch { return { date: todayStr(), count: 0 } }
}

function loadOverride(): OverrideState {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY)
    if (!raw) return { date: todayStr(), extra: 0 }
    const o = JSON.parse(raw) as OverrideState
    if (o.date !== todayStr()) return { date: todayStr(), extra: 0 }
    return o
  } catch { return { date: todayStr(), extra: 0 } }
}

export function getTipsLimit(): number {
  const v = parseInt(localStorage.getItem(LIMIT_KEY) || String(DEFAULT_LIMIT))
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_LIMIT
}

export function setTipsLimit(n: number): void {
  localStorage.setItem(LIMIT_KEY, String(n))
}

export function getTipsViewedToday(): number {
  return loadView().count
}

export function getOverrideExtraToday(): number {
  return loadOverride().extra
}

export function getEffectiveLimit(): number {
  return getTipsLimit() + getOverrideExtraToday()
}

export function isLocked(): boolean {
  return getTipsViewedToday() >= getEffectiveLimit()
}

export function recordTipView(): void {
  const s = loadView()
  s.count = s.count + 1
  localStorage.setItem(VIEW_KEY, JSON.stringify(s))
  window.dispatchEvent(new CustomEvent('ff-tips-view-changed'))
}

export function applyOverride(): void {
  const o = loadOverride()
  o.extra = o.extra + OVERRIDE_EXTRA
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(o))
  window.dispatchEvent(new CustomEvent('ff-tips-view-changed'))
}
