export type TipCategory =
  | 'bookmarks' // ⭐ 북마크 (user-saved subset of curated tips)
  | 'start'     // 🎯 시작·집중
  | 'study'     // 🌀 학습
  | 'mood'      // 🧠 감정
  | 'record'    // 📝 기록
  | 'social'    // 👥 관계
  | 'body'      // 💊 약
  | 'sleep'     // 😴 수면
  | 'archive'   // 📎 아카이브 (user-added links)

export interface TipSection {
  icon?: string   // emoji marker (e.g., '😔', '💡')
  title: string
  body: string    // newlines preserved
}

export interface AdhdTip {
  id: string
  title: string
  category: TipCategory
  summary: string   // one-line teaser
  // Either structured sections (preferred) or a plain-text body. The modal
  // renderer prefers sections when both are set.
  sections?: TipSection[]
  body?: string
  source?: string
  tags?: string[]
}
