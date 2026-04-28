import { pad, todayStr, addDays } from './date'

const META = new Set([
  '오늘', '내일', '모레', '어제', '오전', '오후', '시작', '끝내기', '완료',
  '마감', '까지', '이내', '정도', '걸림', '걸려', '소요', '예정', '급함',
  '이하', '내로', '내에', '하기', '시간', '분', '동안', '안에', '매주', '매일',
])

const DAY_MAP: Record<string, number> = {
  '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0,
}

function isMeta(t: string): boolean {
  if (/^\d+$/.test(t)) return true
  if (META.has(t)) return true
  if (/(?:듯|처럼|이내|이하|이전|이후|까지|부터|동안|위해|위한|관련|만큼|정도|가량|이고|이며)$/.test(t)) return true
  if (t.length === 1) return true
  return false
}

export interface ParseResult {
  name: string
  date: string
  startHour: number | null
  durHour: number
  daysUntil: number
  recurDays: number[] | null
}

export function parse(raw: string): ParseResult {
  const today = todayStr()
  const now = new Date()
  const year = now.getFullYear()
  let date = today
  let m: RegExpMatchArray | null

  m = raw.match(/(\d{1,2})[월]\s*(\d{1,2})[일]?/)
  if (m) {
    const mon = parseInt(m[1])
    const day = parseInt(m[2])
    if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
      let y = year
      if (new Date(y + '-' + pad(mon) + '-' + pad(day) + 'T12:00:00') < now) y++
      date = y + '-' + pad(mon) + '-' + pad(day)
    }
  } else {
    m = raw.match(/(\d{1,2})[./](\d{1,2})(?=[^\d]|$)/)
    if (m) {
      const mon = parseInt(m[1])
      const day = parseInt(m[2])
      if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
        let y = year
        if (new Date(y + '-' + pad(mon) + '-' + pad(day) + 'T12:00:00') < now) y++
        date = y + '-' + pad(mon) + '-' + pad(day)
      }
    }
  }

  if (/오늘/.test(raw)) date = today
  if (/내일/.test(raw)) date = addDays(today, 1)
  if (/모레/.test(raw)) date = addDays(today, 2)

  let start: number | null = null
  const tPatterns = [
    { r: /오후\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/, pm: true },
    { r: /오전\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/, pm: false },
    { r: /(\d{1,2})시(?:\s*(\d{1,2})분)?(?=\s*(?:에|부터|시작|,|\.| |$))/, pm: false },
    { r: /(\d{1,2}):(\d{2})/, pm: false },
  ]
  for (const { r, pm } of tPatterns) {
    const tm = raw.match(r)
    if (tm) {
      let h = parseInt(tm[1])
      if (pm && h < 12) h += 12
      if (!pm && h < 7 && h !== 0) h += 12
      start = h + (tm[2] && parseInt(tm[2]) >= 30 ? 0.5 : 0)
      break
    }
  }

  let dur = 1
  const dPatterns: Array<{ r: RegExp; fn: (m: RegExpMatchArray) => number }> = [
    { r: /(\d+(?:\.\d+)?)\s*시간\s*(\d+)\s*분/, fn: (m) => parseInt(m[1]) + parseInt(m[2]) / 60 },
    { r: /(\d+(?:\.\d+)?)\s*시간(?:\s*(?:이내|반|가량|정도|내))?/, fn: (m) => parseFloat(m[1]) },
    { r: /(\d+)\s*분/, fn: (m) => Math.max(0.5, Math.round(parseInt(m[1]) / 60 * 2) / 2) },
    { r: /(\d+(?:\.\d+)?)h(?:r)?/i, fn: (m) => parseFloat(m[1]) },
  ]
  for (const { r, fn } of dPatterns) {
    const dm = raw.match(r)
    if (dm) {
      dur = Math.max(0.5, Math.min(12, fn(dm)))
      break
    }
  }

  let masked = raw
  masked = masked
    .replace(/매주\s*[월화수목금토일]+/g, ' ')
    .replace(/매일/g, ' ')
    .replace(/(\d{1,2})[월]\s*\d{1,2}[日]?(?:\s*까지)?/g, ' ')
    .replace(/(\d{1,2})[./]\d{1,2}(?:\s*까지)?/g, ' ')
    .replace(/오전|오후/g, ' ')
    .replace(/오늘|내일|모레|어제/g, ' ')
    .replace(/(\d{1,2})\s*시\s*\d{1,2}\s*분/g, ' ')
    .replace(/(\d{1,2}):\d{2}/g, ' ')
    .replace(/(\d{1,2})\s*시(?:\s*(?:에|부터|까지|시작))?/g, ' ')
    .replace(/\d+(?:\.\d+)?\s*시간(?:\s*\d+\s*분)?(?:\s*(?:이내|반|가량|정도|내|걸림|걸려|소요))?/g, ' ')
    .replace(/\d+\s*분/g, ' ')
    .replace(/\d+(?:\.\d+)?h(?:r)?/gi, ' ')
    .replace(/\d+/g, ' ')
    .replace(/[,.\-_·。!?~]+/g, ' ')

  const tokens = masked
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !isMeta(t))
  const name = tokens.join(' ') || '새 작업'

  const daysUntil = Math.round(
    (new Date(date + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000,
  )

  let recurDays: number[] | null = null
  if (/매일/.test(raw)) {
    recurDays = [0, 1, 2, 3, 4, 5, 6]
  } else if (/매주/.test(raw)) {
    const dayChars = raw.match(/매주\s*([월화수목금토일]+)/)
    if (dayChars) {
      recurDays = [...dayChars[1]].map((c) => DAY_MAP[c]).filter((d) => d !== undefined)
    }
  }

  if (!recurDays) {
    const standalone = raw.match(/([월화수목금토일]{2,})/)
    if (standalone && /매주|매일/.test(raw)) {
      recurDays = [...standalone[1]].map((c) => DAY_MAP[c]).filter((d) => d !== undefined)
    }
  }

  return { name, date, startHour: start, durHour: dur, daysUntil, recurDays }
}
