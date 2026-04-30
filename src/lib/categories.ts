import type { Category } from '../constants/categories'
import { DEFAULT_CATEGORIES } from '../constants/categories'

const KEY = 'ff_cats'
const CAT_COLORS = [
  '#D14B47', '#F08585', '#F8C0BC', '#F47550', '#F8D8C0', '#E8B898',
  '#E8B038', '#F4D43C', '#FCF4C4', '#1FA176', '#5BBE91', '#C0E8D8',
  '#9CD8C0', '#A0C8AC', '#C0DDE0', '#3678D2', '#7CB1E0', '#A8D0EC',
  '#4D78E8', '#7898C0', '#B8C0CC', '#8F70A8', '#B0A0E8', '#C8B8F0',
  '#B498D4', '#C895C0', '#E0B8DC', '#D85878', '#E89098', '#F4C8D0',
  '#F0E0C8', '#C8B894', '#9F704D', '#806050', '#74808E', '#1F2630',
]

export function getCategories(): Category[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return DEFAULT_CATEGORIES
    const parsed = JSON.parse(raw) as Category[]
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES
    return parsed
  } catch {
    return DEFAULT_CATEGORIES
  }
}

export function saveCategories(cats: Category[]): void {
  localStorage.setItem(KEY, JSON.stringify(cats))
  window.dispatchEvent(new Event('ff-cats-changed'))
}

export function addCategory(name: string, color?: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  const cats = getCategories()
  if (cats.find((c) => c.name === trimmed)) return
  const usedColors = cats.map((c) => c.color)
  const finalColor = color ?? (CAT_COLORS.find((c) => !usedColors.includes(c)) ?? CAT_COLORS[cats.length % CAT_COLORS.length])
  saveCategories([...cats, { name: trimmed, color: finalColor }])
}

export function removeCategory(name: string): void {
  const cats = getCategories().filter((c) => c.name !== name)
  saveCategories(cats)
}

export function updateCategoryColor(name: string, color: string): void {
  const cats = getCategories().map((c) => c.name === name ? { ...c, color } : c)
  saveCategories(cats)
}

export { CAT_COLORS }
