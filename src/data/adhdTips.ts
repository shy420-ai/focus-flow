import type { AdhdTip, TipCategory } from '../types/adhdTip'

export const CATEGORY_META: Record<TipCategory, { label: string; emoji: string; color: string }> = {
  start: { label: '시작·집중', emoji: '🎯', color: '#FFB677' },
  study: { label: '학습', emoji: '🌀', color: '#9CB7FF' },
  mood: { label: '감정', emoji: '🧠', color: 'var(--pink)' },
  record: { label: '기록', emoji: '📝', color: '#B6A8E8' },
  social: { label: '관계', emoji: '👥', color: '#7DD8C7' },
  body: { label: '약·수면', emoji: '💊', color: '#F2A6C6' },
  archive: { label: '아카이브', emoji: '📎', color: '#A0A0A0' },
}

export const ADHD_TIPS: AdhdTip[] = [
  {
    id: 'task-initiation',
    title: '시작 못 할 때',
    category: 'start',
    summary: '"매번 의지로 결정" X, "환경에 박아두기" ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 시작 장벽은 의지·게으름 X.\n도파민 회로가 "이거 보상돼" 신호를 못 띄워서 의욕이 안 옴.\n매번 의지 끌어모으는 거 진짜 어려움.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '매번 의지로 결정 X → 환경에 박아두기.\n결정 한 번 하고 환경이 자동으로 끌고 가게.\n첫 행동만 5초로 끝나게 쪼개면 관성으로 다음 5분 자동 시작.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '📍 환경 디자인 (자동 셋업)\n• 퇴근 후 운동 못 감 → 직장 근처 헬스장 끊기\n• 책상 앞에 못 앉음 → 단골 카페 만들기\n• 약 매번 까먹음 → 침대 옆 약통 + 11pm 알람\n• 아침 운동 → 어젯밤 운동복 침대 옆에\n\n🪶 미세 행동 (5초 첫 동작)\n• 공부 → "노트북 열고 그 폴더 클릭" (3초)\n• 청소 → "책상 위 컵 1개만 싱크대로"',
      },
    ],
    source: 'Barkley (2014) ADHD and Executive Functions',
    tags: ['시작', '환경디자인', '실전'],
  },
  {
    id: 'sleep-on-it',
    title: '결정·대화는 자고 나서',
    category: 'mood',
    summary: '잠 부족 = 편도체 60% ↑ + 전전두엽 ↓. 후회할 결정의 공식.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '잠 부족하면 편도체(감정 회로) 활성도가 정상보다 약 60% 높아짐.\n동시에 전전두엽(이성·판단)은 둔해짐.\n→ 분노·불안에 휘둘려서 후회할 결정을 내리기 쉬움.\nADHD는 수면 부족 영향이 신경전형인보다 약 2배.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '큰 결정·민감한 대화는 자고 일어난 다음 날로 미루기.\nREM 수면 중 뇌가 감정 강도를 자동으로 낮춤 — "수면이 감정을 정리".\n하룻밤 자면 같은 일도 무게가 다르게 느껴짐.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 화나는 카톡 → 답장 보류, 내일 아침에 다시 읽기\n• 큰 구매·해지·이직 → 24시간 룰 적용\n• 관계 끝낼지 결정 → 최소 하룻밤 자고\n• 다툼 후 사과/해명 메시지 → 새벽에 보내지 말고 자고 일어나서\n• 회의 후 격앙된 이메일 → 임시 저장, 다음 날 아침 재검토',
      },
    ],
    source: 'Walker (2017) Why We Sleep; Yoo et al. (2007) The human emotional brain without sleep, Current Biology',
    tags: ['수면', '결정', '감정조절'],
  },
]

export function getCategoryTips(category: TipCategory): AdhdTip[] {
  return ADHD_TIPS.filter((t) => t.category === category)
}

export function getTip(id: string): AdhdTip | undefined {
  return ADHD_TIPS.find((t) => t.id === id)
}
