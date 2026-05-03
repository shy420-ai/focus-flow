// Time-of-day contextual tip prompts shown on the daily timeline. Each
// entry is a question + one-line punchy answer + a tipId to open the
// full detail modal. Picked deterministically by date+period so the same
// hour today always shows the same one — predictable, not anxiety
// inducing on refresh.

export type DailyPeriod = 'morning' | 'day' | 'evening' | 'night'

export interface DailyPrompt {
  prompt: string     // 질문 카피
  bullets: string[]  // 3개 정도 구체 행동 (실용 정보 ↑)
  tipId: string      // ADHD_TIPS 의 id (없으면 카드 클릭 X)
  period: DailyPeriod
}

export const DAILY_PROMPTS: DailyPrompt[] = [
  // 🌅 아침 (5~10시)
  {
    period: 'morning', prompt: '아침에 일어나기 힘들 때는?', tipId: 'alarm-bypass',
    bullets: [
      '폰 알람 = 침대에서 3m 이상 (책상 위)',
      '워치 진동 + 폰 + 거실 스피커 = 3중',
      '일어나자마자 커튼 즉시 — 햇빛 = 멜라토닌 차단',
    ],
  },
  {
    period: 'morning', prompt: '아침에 시동 안 걸릴 때는?', tipId: 'task-initiation',
    bullets: [
      '"5분만" 룰 — 5분만 눕고 끝 (대부분 일어나짐)',
      '입은 채로 잠 = 갈아입는 마찰 ↓',
      '아침 의식 자동화 (커피·세수 같은 순서 매일)',
    ],
  },
  {
    period: 'morning', prompt: '약 효과 시작 전 흔들릴 때는?', tipId: 'med-rebound',
    bullets: [
      '아침 약 = 일어나자마자 (효과 1시간 후)',
      '효과 떨어지는 시간 = 단백질 간식 미리',
      '카페인은 약 1시간 후 (흡수 방해 방지)',
    ],
  },
  {
    period: 'morning', prompt: '콘서타 적응기 부작용 있을 때는?', tipId: 'concerta-titration',
    bullets: [
      '첫 2주 = 부작용 일지 (식욕·잠·심박)',
      '2주마다 의사 상담 = 용량 조정',
      '하루 거르기 X — 적응 처음부터 다시',
    ],
  },
  {
    period: 'morning', prompt: '약 자꾸 까먹을 때는?', tipId: 'med-forget',
    bullets: [
      '약통 = 칫솔 옆 (매일 보는 자리)',
      '폰 알람 + 워치 진동 = 둘 다 켜기',
      '주간 약통 (일~토 칸) = 먹었는지 시각 체크',
    ],
  },
  {
    period: 'morning', prompt: '새 약 처방 받은 첫 2주에는?', tipId: 'new-med-first-2-weeks',
    bullets: [
      '큰 결정·면접·운전 시험 X',
      '부작용 일지 — 졸음·식욕·기분 매일 한 줄',
      '술·새 영양제 X (효과 판단 흐려짐)',
    ],
  },

  // 🌞 낮 (10~17시)
  {
    period: 'day', prompt: '집중 안 될 때는?', tipId: 'noise-calibration',
    bullets: [
      '갈색소음 (brown noise) = ADHD에 가장 좋음',
      'YouTube "brown noise 8 hours" 무료',
      '주 단위로 바꾸기 — 적응되면 효과 ↓',
    ],
  },
  {
    period: 'day', prompt: '점심 후 졸음 폭발할 때는?', tipId: 'power-nap',
    bullets: [
      '정확히 20분 — 알람 무조건 (더 자면 역효과)',
      '의자 기대거나 차 안 — 침대 X',
      'Caffeine nap = 커피 직전 마시고 자기',
    ],
  },
  {
    period: 'day', prompt: '한 일 끝났는데 다음 시작 못 할 때는?', tipId: 'task-transition',
    bullets: [
      '끝난 신호 = 책상 1칸 정리',
      '5분 break = 물 + 창밖 1분',
      '시작 신호 = 노트 펼치고 "다음: B" 한 줄',
    ],
  },
  {
    period: 'day', prompt: '멀티태스킹으로 다 망치는 중일 땐?', tipId: 'single-tasking',
    bullets: [
      '브라우저 탭 5개 ↑ = 다 닫고 1개만',
      '폰 = 다른 방 / 가방 / 잠금',
      '"동시에" 단어 들어간 일 = 순차로 분해',
    ],
  },
  {
    period: 'day', prompt: '뽀모 25/5 휴식이 너무 짧을 때는?', tipId: 'pomo-50-10',
    bullets: [
      '50분 일 / 10분 휴식으로 바꾸기',
      '10분 휴식 = 폰 X, 몸 쓰기',
      '4사이클 후 = 30분 큰 휴식 + 식사',
    ],
  },
  {
    period: 'day', prompt: '강의·회의 따라가기 힘들 땐?', tipId: 'lecture-recording',
    bullets: [
      '녹음 ON + 키워드 + 시간 스탬프만 메모',
      '클로바노트 = 한국어 자동 텍스트 변환',
      '24시간 안에 1.5배속으로 다시 듣기',
    ],
  },
  {
    period: 'day', prompt: '비밀번호 매번 새로 만들 때는?', tipId: 'password-vault',
    bullets: [
      '1Password / Bitwarden / iCloud Keychain 1개',
      '마스터 비번 = 외울 수 있는 긴 문장',
      '2FA 백업 코드도 매니저 안에',
    ],
  },
  {
    period: 'day', prompt: '직장 평가 시즌 두려울 땐?', tipId: 'work-prearrange',
    bullets: [
      '주 1회 금요일 15분 1:1 정기화',
      '시작 때 평가 기준 글로 받기',
      '분기 1번 "지금 어디쯤이에요?" 직접 물어보기',
    ],
  },

  // 🌙 저녁 (17~22시)
  {
    period: 'evening', prompt: '또 야식 폭주 중일 땐?', tipId: 'revenge-bedtime',
    bullets: [
      '낮에 단백질 식사 추가 (저녁 폭주 ↓)',
      '취침 1시간 전 알람 = 폰 다른 방',
      '간식 = 미리 소분 (봉지째 X)',
    ],
  },
  {
    period: 'evening', prompt: '내일 약속 또 까먹을 것 같을 땐?', tipId: 'one-calendar',
    bullets: [
      '받자마자 캘린더 — 카톡 보면 그 자리에서',
      '시리/구글 음성 — "내일 3시 치과"',
      '알람 = 24h 전 + 1h 전 + 15분 전',
    ],
  },
  {
    period: 'evening', prompt: '결정 못 하고 마비될 땐?', tipId: 'decision-paralysis',
    bullets: [
      '큰 결정 = 작고 되돌릴 수 있는 1개로 쪼개기',
      '"이직" → "이력서 1줄만 갱신"',
      '동전 던지기 → 결과 보고 안도/실망 = 진짜 마음',
    ],
  },
  {
    period: 'evening', prompt: '몸이 신호 보내는 중일 땐?', tipId: 'body-warning-signs',
    bullets: [
      '두통·소화불량·근긴장 = 하루 멈춤 신호',
      '저녁에 1시간 일찍 마무리',
      '내일 일정 = 30% 줄이기',
    ],
  },
  {
    period: 'evening', prompt: '하이퍼포커스 끝나고 멍할 땐?', tipId: 'hyperfocus-crash',
    bullets: [
      '직후 = 단백질 간식 + 물 큰 잔',
      '5분 산책 (도파민 회로 식히기)',
      '저녁 일찍 자기 + 다음날 가벼운 일정',
    ],
  },
  {
    period: 'evening', prompt: '오늘 하루 망한 느낌 들 땐?', tipId: 'post-flood-recovery',
    bullets: [
      '"오늘 = 끝, 내일 새로 시작" 의식적 컷',
      '따뜻한 샤워 → 옷 갈아입기',
      '내일 1개만 — "꼭 할 한 가지" 정하기',
    ],
  },
  {
    period: 'evening', prompt: '외로움 짓눌릴 때는?', tipId: 'loneliness-weak-tie',
    bullets: [
      '동네 카페·편의점 = 약한 연결도 OK',
      '단골 가게 만들기 — 자연스레 인사',
      'ADHD 단톡방·디스코드 = 같은 결의 친구',
    ],
  },
  {
    period: 'evening', prompt: '거절 못 해서 일정 폭발할 땐?', tipId: 'no-power',
    bullets: [
      '"잠깐, 캘린더 보고 답해줄게" 즉답 X',
      '24시간 룰 = 그날 안 답하고 다음날 결정',
      '거절: "이번엔 어려워" — 변명 X 사과 X',
    ],
  },

  // 🌚 밤 (22~5시)
  {
    period: 'night', prompt: '30분 누웠는데 못 잘 땐?', tipId: 'cant-sleep-thirty-min',
    bullets: [
      '침대에서 나와 — 다른 방으로',
      '약한 조명 + 종이책 5분',
      '졸리면 다시 들어오기 (안 졸리면 더 안 옴)',
    ],
  },
  {
    period: 'night', prompt: '머리에 생각 끝없이 떠오를 땐?', tipId: 'racing-thoughts-bed',
    bullets: [
      '머리맡 메모지에 떠오르는 거 다 적기',
      '"내일 아침에 처리" 한 줄로 끝내기',
      '4-7-8 호흡 (4초 들숨 / 7초 멈춤 / 8초 날숨)',
    ],
  },
  {
    period: 'night', prompt: '자기 전에 폰만 보고 있을 땐?', tipId: 'screen-cutoff',
    bullets: [
      '잠 1시간 전 = 폰 다른 방·서랍에',
      '침대 옆 = 종이책 / 일기장만',
      '못 참겠으면 = 회색조·다크모드 강제',
    ],
  },
  {
    period: 'night', prompt: '운동하고 잠 안 올 땐?', tipId: 'pre-bed-exercise',
    bullets: [
      '저녁 격렬한 운동 = 잠 3시간 전까지만',
      '7시 이후 = 가벼운 산책·요가만',
      '운동 후 = 따뜻한 샤워 → 체온 ↓ 도움',
    ],
  },

  // ── 추가 (2026-05-04) — 풀 다양성 ↑ ──────────────────
  // 🌅 아침
  {
    period: 'morning', prompt: '시작만 하면 되는데 첫 1분이 안 될 때?', tipId: 'first-minute-magic',
    bullets: [
      '"1분만" 룰 — 1분 후 그만둘 수 있게 약속',
      'If-Then 미리: "9시 알람 = 노트북 열기" (열기까지만)',
      '같은 자리·같은 음악 = 조건 반사 시동',
    ],
  },
  {
    period: 'morning', prompt: '재택근무 출근 모드 안 들 때?', tipId: 'work-remote-isolation',
    bullets: [
      '잠옷 X — 출근 옷 갈아입기 (작은 의식)',
      '시작 음악 = 매번 같은 곡 (조건 반사)',
      '책상 = 일 전용. 침대 X 소파 X',
    ],
  },

  // 🌞 낮
  {
    period: 'day', prompt: '폰을 30초마다 잡고 있을 때?', tipId: 'phone-addiction',
    bullets: [
      '의지 X — 다른 방·서랍·잠긴 박스에 폰',
      'Forest·ScreenZen·디지털웰빙 앱 활용',
      '워치만 ON (전화·텍스트 알림만)',
    ],
  },
  {
    period: 'day', prompt: '오후 2~4시 머리 안 돌 때?', tipId: 'afternoon-slump',
    bullets: [
      '슬럼프 = 받아들이고 가벼운 일·산책으로',
      'Power nap 정확히 20분 (더 자면 역효과)',
      '카페인은 오후 2시 이전만',
    ],
  },
  {
    period: 'day', prompt: '자투리 10~15분 그냥 흘릴 때?', tipId: 'micro-task-time',
    bullets: [
      '미리 만든 마이크로 태스크 리스트 활용',
      '5분: 메일 1통 / 10분: 책상 정리 / 15분: 짧은 글',
      '자투리 = 폰 X, 리스트 보고 1개 시작',
    ],
  },
  {
    period: 'day', prompt: '시간 추정 매번 망할 때?', tipId: 'work-time-blindness',
    bullets: [
      '본인 추정 X 1.5~2배 = 진짜 견적',
      'Toggl·Clockify로 같은 일 5번 평균',
      '약속할 땐 견적 + 30% 버퍼',
    ],
  },
  {
    period: 'day', prompt: '메일함 800통, 열기조차 무서울 때?', tipId: 'work-email-overload',
    bullets: [
      'inbox zero 강박 버리고 4D (Delete·Delegate·Defer·Do)',
      '메일 시간 = 11:00·16:00 두 번만',
      '5분 안 끝낼 거 = "오늘 할 일" 노트로',
    ],
  },
  {
    period: 'day', prompt: '큰 프로젝트 1년째 시작 못 할 때?', tipId: 'big-project-elephant',
    bullets: [
      '매일 30분만 같은 시간 — 누적이 마법',
      '첫 30분 = 분해·계획 (작은 단계 10개)',
      '"오늘 30분 못 했다" = OK, 다음날',
    ],
  },
  {
    period: 'day', prompt: 'SNS·유튜브 1시간 자기도 모르게 갈 때?', tipId: 'internet-block',
    bullets: [
      '의지 X — Cold Turkey / Freedom 차단 도구',
      '잠금 비밀번호 = 친구한테',
      '폰 흑백 모드 = 도파민 ↓ (실제 효과)',
    ],
  },
  {
    period: 'day', prompt: '"할 수 있는데 못 함" 자기 비난 들어올 때?', tipId: 'executive-dysfunction-self',
    bullets: [
      '의지 X 신경 회로 차이 — 의학적 사실',
      '도구·약·코치 = 다 정당한 도움',
      '한 일 카운트 (작아도) → 자존감 회복',
    ],
  },
  {
    period: 'day', prompt: '보고서·기획서 첫 줄에서 막힐 때?', tipId: 'work-doc-blank-page',
    bullets: [
      '거꾸로 쓰기: 결론 → 예시 → 본문 → 서론 → 제목',
      '예시·데이터부터 = 가장 쉬운 부분',
      '음성 입력 = 시작 마찰 ↓ (말이 더 쉬움)',
    ],
  },

  // 🌙 저녁
  {
    period: 'evening', prompt: '회식 술자리 — 약 먹는 날인데?', tipId: 'work-drinking-meds',
    bullets: [
      '거절 멘트: "약 때문에 무알콜로 갈게요"',
      '마실 거면 = 평소 양 1/2 + 천천히 + 물 같이',
      '다음날 약 = 평소대로 (식사 후)',
    ],
  },
  {
    period: 'evening', prompt: '엄격한 루틴 못 만들겠을 때?', tipId: 'routine-flexible',
    bullets: [
      '핵심 1개만 고정 (예: 아침 약, 침대 정리)',
      '나머지 = 그날 컨디션 따라 자유',
      '80% 만 지키면 OK — 100% 강박 X',
    ],
  },
  {
    period: 'evening', prompt: '인사고과 받고 RSD 폭발할 때?', tipId: 'work-perf-review-rsd',
    bullets: [
      '24시간 룰 — 그날엔 답·결정 X',
      '다음날 = 객관 자료 (1년 성과) 옆에 두고 다시',
      '안전한 친구 1명한테 평가 그대로 보여주기',
    ],
  },
  {
    period: 'evening', prompt: '이직 결정 1년째 못 내리고 있을 때?', tipId: 'work-job-change-decide',
    bullets: [
      '큰 결정 X — 작고 reversible 한 1개부터',
      '"이력서 1줄 갱신" → "1군데 지원"',
      '6개월 시한 정하기 — 안 하면 안 그만두는 거',
    ],
  },
  {
    period: 'evening', prompt: '무례한 말 받아주고 자기혐오 올 때?', tipId: 'rude-delay-trap',
    bullets: [
      '몸 신호 4가지: 어깨·미소·심박·손에 힘',
      '외워둘 한 마디: "어, 잠깐. 그건 좀 그렇다."',
      '놓쳤어도 = 가라앉은 후 24시간 안에 다시',
    ],
  },

  // 🌚 밤
  {
    period: 'night', prompt: '멜라토닌 잘못 먹고 있는 거 아닌가 싶을 때?', tipId: 'sleep-melatonin-timing',
    bullets: [
      '저용량 (0.3~0.5mg) = 충분, 5mg = 과량',
      '잠 4시간 전 복용 = 위상 조정',
      '매일 X — 주 4일 정도 (내성 방지)',
    ],
  },
  {
    period: 'night', prompt: '수면 무호흡 의심될 때?', tipId: 'sleep-apnea-suspect',
    bullets: [
      '8시간 자도 피곤 + 코골이 = 의심',
      '수면 녹음 앱 (SnoreLab·ShutEye) 1차 진단',
      '수면 클리닉·이비인후과 → 검사',
    ],
  },
  {
    period: 'night', prompt: '오늘 망함 느낌으로 자기 전에 누웠을 때?', tipId: 'post-flood-recovery',
    bullets: [
      '"오늘 = 끝, 내일 새로 시작" 의식적 컷',
      '따뜻한 샤워 → 옷 갈아입기',
      '내일 1개만 — "꼭 할 한 가지" 정하기',
    ],
  },
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
