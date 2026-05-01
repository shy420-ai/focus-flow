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
        body: 'ADHD 시작 장벽은 의지·게으름 X. 도파민 회로가 "이거 보상돼" 신호를 못 띄워서 의욕이 안 옴. 매번 의지 끌어모으는 거 진짜 어려움.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '매번 의지로 결정 X → 환경에 박아두기. 결정 한 번 하고 환경이 자동으로 끌고 가게.',
      },
      {
        icon: '📍',
        title: '환경 디자인',
        body: '동선·도구·알람으로 자동 유도되는 셋업.\n• 퇴근 후 운동 못 감 → 직장 근처 헬스장 끊기 (퇴근 동선에 박힘)\n• 책상 앞에 못 앉음 → 단골 카페 만들기 (그 카페 = 공부 모드 자동 트리거)\n• 약 매번 까먹음 → 침대 옆 약통 + 11pm 알람\n• 아침 운동 → 어젯밤 운동복 침대 옆에 꺼내두기',
      },
      {
        icon: '🎯',
        title: '미세 행동',
        body: '5초 안에 끝낼 첫 동작 1개. 부담 ↓ + 관성 켜기.\n• 공부 → "노트북 열고 그 폴더 클릭" (3초)\n• 청소 → "책상 위 컵 1개만 싱크대로"',
      },
      {
        icon: '✨',
        title: '핵심',
        body: '첫 행동 끝나면 관성으로 다음 5분 자동 시작. "전체"를 시작하려 하지 말고 "첫 클릭"만.',
      },
    ],
    source: 'Barkley (2014) ADHD and Executive Functions',
    tags: ['시작', '환경디자인', '실전'],
  },
]

export function getCategoryTips(category: TipCategory): AdhdTip[] {
  return ADHD_TIPS.filter((t) => t.category === category)
}

export function getTip(id: string): AdhdTip | undefined {
  return ADHD_TIPS.find((t) => t.id === id)
}
