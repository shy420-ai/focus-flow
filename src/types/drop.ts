export interface DropItem {
  id: number
  name: string
  done: boolean
  starred?: boolean   // ⭐ pinned to 보관함
  note?: string       // multi-line longer content
  tags?: string[]     // free-form hashtags
  imageUrl?: string   // data: URL (resized like avatars)
  template?: string   // 'idea' | 'quote' | 'link' | etc.
  createdAt?: number  // ms timestamp
}
