export interface MedItem {
  name: string
  dose: string
  timing: '아침' | '점심' | '저녁' | '수시'
  duration: number // hours
}

export interface MedConfig {
  meds: MedItem[]
  wakeGoal?: number  // target wake hour
  bedGoal?: number   // target bed hour
  height?: number    // cm
  weight?: number    // kg
}

export type MedLogType = 'take' | 'status' | 'wake' | 'sleeptime' | 'bed' | 'wakeup'

export interface MedLog {
  id: string
  date: string        // YYYY-MM-DD
  type: MedLogType
  timing?: '아침' | '점심' | '저녁'
  time?: number       // hour + fraction (e.g. 8.5 = 8:30)
  level?: number      // 0-4 for status/wake/sleeptime
  hour?: number       // for status (current hour)
}
