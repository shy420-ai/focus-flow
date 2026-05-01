export type TipCategory =
  | 'start'    // 🎯 시작·집중
  | 'study'    // 🌀 학습
  | 'mood'     // 🧠 감정
  | 'record'   // 📝 기록
  | 'social'   // 👥 관계
  | 'body'     // 💊 약·수면

export interface AdhdTip {
  id: string
  title: string
  category: TipCategory
  summary: string   // one-line teaser
  body: string      // longer plain-text content (newlines preserved)
  source?: string   // citation / reference
  tags?: string[]
}
