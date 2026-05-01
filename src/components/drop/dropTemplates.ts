// Drop template palette — stored in localStorage so the user can edit it
// from the DropDetailModal via TemplateEditModal.
export interface DropTemplate {
  id: string
  emoji: string
  label: string
}

const STORAGE_KEY = 'ff_drop_templates'

export const DEFAULT_TEMPLATES: DropTemplate[] = [
  { id: '', emoji: '📝', label: '없음' },
  { id: 'idea', emoji: '💡', label: '아이디어' },
  { id: 'quote', emoji: '📚', label: '인용' },
  { id: 'link', emoji: '🔗', label: '링크' },
  { id: 'task', emoji: '✅', label: '할 일' },
  { id: 'memo', emoji: '🧠', label: '메모' },
]

export function loadTemplates(): DropTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TEMPLATES
    const parsed = JSON.parse(raw) as DropTemplate[]
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TEMPLATES
    if (!parsed.find((t) => t.id === '')) parsed.unshift(DEFAULT_TEMPLATES[0])
    return parsed
  } catch { return DEFAULT_TEMPLATES }
}

export function saveTemplates(list: DropTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent('ff-drop-templates-changed'))
}
