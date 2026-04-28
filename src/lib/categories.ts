import type { Category } from '../constants/categories'
import { DEFAULT_CATEGORIES } from '../constants/categories'

const KEY = 'ff_cats'
const CAT_COLORS = [
  '#E8849D', '#5B7FFF', '#1D9E75', '#378ADD', '#C4A6D7',
  '#F0D264', '#F4A261', '#E76F51', '#8DC8E8', '#7ECDB0',
]

export function getCategories(): Category[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_CATEGORIES
    const parsed = JSON.parse(raw) as Category[]
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIES
    return parsed
  } catch {
    return DEFAULT_CATEGORIES
  }
}

export function saveCategories(cats: Category[]): void {
  localStorage.setItem(KEY, JSON.stringify(cats))
  window.dispatchEvent(new Event('ff-cats-changed'))
}

export function addCategory(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  const cats = getCategories()
  if (cats.find((c) => c.name === trimmed)) return
  const usedColors = cats.map((c) => c.color)
  const color = CAT_COLORS.find((c) => !usedColors.includes(c)) ?? CAT_COLORS[cats.length % CAT_COLORS.length]
  saveCategories([...cats, { name: trimmed, color }])
}

export function removeCategory(name: string): void {
  const cats = getCategories().filter((c) => c.name !== name)
  saveCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES)
}

export function updateCategoryColor(name: string, color: string): void {
  const cats = getCategories().map((c) => c.name === name ? { ...c, color } : c)
  saveCategories(cats)
}

export { CAT_COLORS }
