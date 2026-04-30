import type { Category } from '../constants/categories'
import { DEFAULT_CATEGORIES } from '../constants/categories'

const KEY = 'ff_cats'
const CAT_COLORS = [
  '#F0A0A0', '#F4B8B0', '#F8CCC4', '#F4B098', '#FAD0BC', '#F8C8B0',
  '#F4D880', '#F8E8A0', '#FCF4C8', '#9CD4B0', '#BCE0BC', '#D0E8C8',
  '#B8E0CC', '#C8E0C4', '#DCEAEC', '#A0C4E8', '#BCD4F0', '#D0E0F4',
  '#B0BCE8', '#C8D0E0', '#D8DCE0', '#B098C8', '#CCB8E8', '#DCC8EC',
  '#C8B0DC', '#DCB8D0', '#E8CCDE', '#F0A0B0', '#F4BCC8', '#F8D0DC',
  '#F4E8D8', '#E0D0B0', '#C8B0A0', '#B49C90', '#B0BCC8', '#7C8898',
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
