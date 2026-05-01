import type { AdhdTip, TipCategory } from '../types/adhdTip'

export const CATEGORY_META: Record<TipCategory, { label: string; emoji: string; color: string }> = {
  start: { label: '시작·집중', emoji: '🎯', color: '#FFB677' },
  study: { label: '학습', emoji: '🌀', color: '#9CB7FF' },
  mood: { label: '감정', emoji: '🧠', color: 'var(--pink)' },
  record: { label: '기록', emoji: '📝', color: '#B6A8E8' },
  social: { label: '관계', emoji: '👥', color: '#7DD8C7' },
  body: { label: '약·수면', emoji: '💊', color: '#F2A6C6' },
}

// Tips will be added later. Keep array empty for now so the category
// shell renders without committing to specific copy.
export const ADHD_TIPS: AdhdTip[] = []

export function getCategoryTips(category: TipCategory): AdhdTip[] {
  return ADHD_TIPS.filter((t) => t.category === category)
}

export function getTip(id: string): AdhdTip | undefined {
  return ADHD_TIPS.find((t) => t.id === id)
}
