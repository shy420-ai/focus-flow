export type BlockType = 'timeline' | 'inbox' | 'buffer'
export type BlockColor = 'red' | 'amb' | 'pink' | 'blue' | 'teal'
export type Priority = 'today' | 'tomorrow' | 'week' | 'someday' | null

export interface Block {
  id: string
  type: BlockType
  name: string
  date: string
  startHour: number
  durHour: number
  color: BlockColor
  done: boolean
  memo: string
  category: string
  deadline: string | null
  priority: Priority
  isBuf?: boolean
  isRecurring?: boolean
  recurId?: string
  recurDoneId?: string
  reward?: string | null
}
