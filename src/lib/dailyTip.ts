// Time-of-day contextual tip prompts shown on the daily timeline. Each
// entry is a question + one-line punchy answer + a tipId to open the
// full detail modal. Picked deterministically by date+period so the same
// hour today always shows the same one — predictable, not anxiety
// inducing on refresh.

export type DailyPeriod = 'morning' | 'day' | 'evening' | 'night'

export interface DailyPrompt {
  prompt: string     // 질문 카피
  oneLiner: string   // 1줄 답
  tipId: string      // ADHD_TIPS 의 id (없으면 카드 클릭 X)
  period: DailyPeriod
}

export const DAILY_PROMPTS: DailyPrompt[] = [
  // 🌅 아침 (5~10시)
  { period: 'morning', prompt: '🌅 아침에 일어나기 힘들 때?', oneLiner: '폰 알람 침대 반대편에 두기.', tipId: 'alarm-bypass' },
  { period: 'morning', prompt: '🌅 시동 안 걸려?', oneLiner: '5분만 눕는 의식 — 그 후 일어나면 OK.', tipId: 'task-initiation' },
  { period: 'morning', prompt: '🌅 콘서타 효과 시작 전 흔들리는 시간?', oneLiner: '단백질 간식 + 물 한 잔.', tipId: 'med-rebound' },
  { period: 'morning', prompt: '🌅 콘서타 적응 안 돼?', oneLiner: '첫 2주는 부작용 일지 적기.', tipId: 'concerta-titration' },
  { period: 'morning', prompt: '🌅 약 까먹을까봐?', oneLiner: '약통 옆에 폰 알람 + 칫솔 옆에.', tipId: 'med-forget' },
  { period: 'morning', prompt: '🌅 새 약 처방 받음?', oneLiner: '첫 2주는 가벼운 일정만, 큰 결정 X.', tipId: 'new-med-first-2-weeks' },

  // 🌞 낮 (10~17시)
  { period: 'day', prompt: '🌞 집중 안 돼?', oneLiner: '갈색소음 켜봐. 백색보다 ADHD에 맞아.', tipId: 'noise-calibration' },
  { period: 'day', prompt: '🌞 점심 후 졸려?', oneLiner: 'Power nap 정확히 20분 — 더 자면 역효과.', tipId: 'power-nap' },
  { period: 'day', prompt: '🌞 한 일 끝났는데 다음 시작 못해?', oneLiner: '5분 의식 — 책상 정리 + 물 한 잔.', tipId: 'task-transition' },
  { period: 'day', prompt: '🌞 멀티태스킹으로 다 망치는 중?', oneLiner: '딴 탭 다 닫고 1개만.', tipId: 'single-tasking' },
  { period: 'day', prompt: '🌞 25분 휴식 5분 짧아?', oneLiner: '50분/10분으로 바꿔봐.', tipId: 'pomo-50-10' },
  { period: 'day', prompt: '🌞 강의 따라가기 힘들어?', oneLiner: '녹음 + 키워드만 메모 → 후 검토.', tipId: 'lecture-recording' },
  { period: 'day', prompt: '🌞 비밀번호 매번 새로?', oneLiner: '패스워드 매니저 1개 깔고 끝.', tipId: 'password-vault' },
  { period: 'day', prompt: '🌞 직장 평가 두려워?', oneLiner: '주 1회 15분 1:1 정기화.', tipId: 'work-prearrange' },

  // 🌙 저녁 (17~22시)
  { period: 'evening', prompt: '🌙 또 야식 폭주 중?', oneLiner: '낮에 단백질 식사 추가 — 저녁 폭주 ↓.', tipId: 'revenge-bedtime' },
  { period: 'evening', prompt: '🌙 내일 약속 까먹을까?', oneLiner: '받자마자 캘린더에 — 1초 안.', tipId: 'one-calendar' },
  { period: 'evening', prompt: '🌙 결정 못 하고 마비?', oneLiner: '작고 되돌릴 수 있는 거 1개부터.', tipId: 'decision-paralysis' },
  { period: 'evening', prompt: '🌙 몸이 신호 보내고 있어?', oneLiner: '신호 무시 = 다음 주에 폭발.', tipId: 'body-warning-signs' },
  { period: 'evening', prompt: '🌙 하이퍼포커스 끝나고 멍?', oneLiner: '단백질 간식 + 5분 산책 + 일찍 자기.', tipId: 'hyperfocus-crash' },
  { period: 'evening', prompt: '🌙 오늘 하루 망함 느낌?', oneLiner: '1시간 정상 일정으로 회복 의식.', tipId: 'post-flood-recovery' },
  { period: 'evening', prompt: '🌙 외로움 짓눌릴 때?', oneLiner: '카페·산책 = 약한 연결도 OK.', tipId: 'loneliness-weak-tie' },
  { period: 'evening', prompt: '🌙 거절 못 해서 일정 폭발?', oneLiner: '"확인하고 알려줄게" 24시간 룰.', tipId: 'no-power' },

  // 🌚 밤 (22~5시)
  { period: 'night', prompt: '🌚 30분 누웠는데 못 자?', oneLiner: '침대에서 나와. 다른 방 책 5분.', tipId: 'cant-sleep-thirty-min' },
  { period: 'night', prompt: '🌚 머리에 생각 끝없이?', oneLiner: '메모지에 다 적어 — 뇌 비우기.', tipId: 'racing-thoughts-bed' },
  { period: 'night', prompt: '🌚 자기 전에 폰만 보고 있어?', oneLiner: '잠 1시간 전 = 폰 다른 방.', tipId: 'screen-cutoff' },
  { period: 'night', prompt: '🌚 운동하고 잠 안 와?', oneLiner: '저녁 격렬한 운동 = 잠 시간 3시간 전까지만.', tipId: 'pre-bed-exercise' },
]

const PERIOD_HOURS: Record<DailyPeriod, [number, number]> = {
  morning: [5, 10],
  day: [10, 17],
  evening: [17, 22],
  night: [22, 5],  // wraps midnight
}

export function currentPeriod(now: Date = new Date()): DailyPeriod {
  const h = now.getHours()
  if (h >= 5 && h < 10) return 'morning'
  if (h >= 10 && h < 17) return 'day'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

export function periodLabel(p: DailyPeriod): string {
  const [a, b] = PERIOD_HOURS[p]
  if (p === 'morning') return `새벽~아침 (${a}-${b}시)`
  if (p === 'day') return `낮 (${a}-${b}시)`
  if (p === 'evening') return `저녁 (${a}-${b}시)`
  return '밤 (22시~새벽)'
}

// Stable hash so the same date+period always picks the same tip.
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function pickDailyTip(now: Date = new Date(), skip: string[] = []): DailyPrompt | null {
  const period = currentPeriod(now)
  const pool = DAILY_PROMPTS.filter((p) => p.period === period && !skip.includes(p.tipId))
  if (pool.length === 0) return null
  const dayKey = now.toISOString().slice(0, 10) + ':' + period
  const idx = hashStr(dayKey) % pool.length
  return pool[idx]
}

// "다른 거 보기" — pick the next one in the same period pool, also
// deterministic so if the user comes back later they see the same one.
export function pickNextDailyTip(currentId: string, now: Date = new Date()): DailyPrompt | null {
  const period = currentPeriod(now)
  const pool = DAILY_PROMPTS.filter((p) => p.period === period)
  if (pool.length <= 1) return pool[0] ?? null
  const i = pool.findIndex((p) => p.tipId === currentId)
  return pool[(i + 1) % pool.length]
}

// User preference for the daily widget on the timeline. Default: 'tip'.
const PREF_KEY = 'ff_daily_widget'
export type DailyWidgetPref = 'tip' | 'saju' | 'off'

export function getDailyWidgetPref(): DailyWidgetPref {
  const v = localStorage.getItem(PREF_KEY)
  if (v === 'tip' || v === 'saju' || v === 'off') return v
  return 'tip'
}

export function setDailyWidgetPref(pref: DailyWidgetPref): void {
  if (pref === 'tip') localStorage.removeItem(PREF_KEY)
  else localStorage.setItem(PREF_KEY, pref)
  window.dispatchEvent(new CustomEvent('ff-daily-widget-changed'))
}
