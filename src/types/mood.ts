export interface DailyMood {
  date: string  // YYYY-MM-DD
  focus?: number    // 0~10
  mood?: number     // 0~10
  energy?: number   // 0~10
  note?: string
  updatedAt?: number
}

export interface MoodEntry {
  id: number
  ts: number
  date: string  // YYYY-MM-DD
  time: string  // HH:MM
  // Per-entry quick sliders (a snapshot of how I'm doing right now)
  focus?: number    // 0~10
  mood?: number     // 0~10
  energy?: number   // 0~10
  quickNote?: string  // optional one-liner with the sliders
  // CBT thought record fields
  situation?: string       // A — what happened
  autoThought?: string     // B — automatic belief
  emotions?: string[]      // C — emotion labels
  intensity?: number       // C — 0~10
  bodyFelt?: string        // C — body sensation
  distortions?: string[]   // CBT — cognitive distortion ids
  reframe?: string         // D — balanced thought (legacy, no longer in UI)
  nextAction?: string      // E — chosen behavior
  distressBefore?: number  // 0~10 (before reframe)
  distressAfter?: number   // 0~10 (after reframe)
  youtubeUrl?: string      // BGM embed
}
