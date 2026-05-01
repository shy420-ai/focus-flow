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
  {
    id: 'active-recall',
    title: '책 덮고 떠올리기',
    category: 'study',
    summary: '읽기 ❌ → 머리에서 꺼내기 ⭕. 같은 시간 50% 더 남음.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '같은 페이지 5번 읽어도 머리에 안 남음.\nADHD는 passive 모드 (그냥 읽기·하이라이트만)에 들어가면 5초 만에 멍.\n눈은 글자 따라가도 뇌는 다른 데 가있음.\n시험 전날 다시 읽기는 "안다"는 착각만 줌 (familiarity ≠ recall).',
      },
      {
        icon: '💡',
        title: '해결',
        body: '책 덮고 방금 본 거 머리에서 꺼내기 (active recall).\n맞든 틀리든 일단 떠올려 → 그 다음 책 보고 확인.\n뇌가 "꺼내는 동작" 자체를 학습 신호로 받아들임.\nRoediger & Karpicke (2006): 같은 시간 passive review보다 약 50% 더 기억 정착.\n특히 1주일 후 retention 차이가 압도적.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 한 챕터 읽고 → 책 덮고 핵심 3개 소리내서 말하기\n• 강의 끝나고 → 5분 동안 노트 보지 말고 떠오르는 거 적기\n• 30초도 OK — "방금 뭐 읽었더라?" 한 번 멈추기\n• Anki / Quizlet 카드로 자동 active recall (ADHD에 강력)\n• 시험 전날 → 다시 읽기 ❌, 백지 시험지 만들기 ⭕\n• 화이트보드에 빈 다이어그램 그리고 채우기\n• 친구한테 "퀴즈 내줘" 부탁',
      },
    ],
    source: 'Roediger & Karpicke (2006) Test-Enhanced Learning, Psychological Science',
    tags: ['공부', '암기', '시험'],
  },
  {
    id: 'spaced-repetition',
    title: '시간 분산 학습',
    category: 'study',
    summary: '한 번에 4시간 ❌ → 30분 × 8번 (며칠 분산) ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '시험 전날 8시간 벼락치기 → 시험 끝나면 다 까먹음.\n같은 내용 한 자리에서 반복 = "내가 안다"는 착각만 줌.\nADHD 작업기억은 짧아서 한 번에 많이 넣어도 새는 양이 큼.\nEbbinghaus 망각 곡선: 1일 후 70% 망각, 1주 후 90% 망각.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '같은 내용을 며칠에 걸쳐 짧게 여러 번 반복 (spaced repetition).\n간격이 벌어질수록 장기 기억 정착 ↑.\nBjork "desirable difficulty" — 약간 잊기 직전에 다시 보면 가장 강력.\n분산이 같은 시간 투자로 retention 2~3배 ↑.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 1일차 학습 → 1일 후 → 3일 후 → 1주일 후 (1-1-3-7 룰)\n• Anki: 자동 분산 (앱이 알아서 간격 조정)\n• 한 단원 4시간 ❌ → 4일 동안 1시간씩 ⭕\n• 시험 D-7부터 매일 30분 (벼락치기 X)\n• 일주일 단위로 "이번주 배운 거 5분 회고" 루틴\n• 다음날 아침 5분: 어제 배운 거 떠올리기',
      },
    ],
    source: 'Bjork (1994) Memory & Metamemory; Cepeda et al. (2006) Distributed Practice meta-analysis',
    tags: ['공부', '암기', '분산'],
  },
  {
    id: 'study-moving',
    title: '움직이면서 학습',
    category: 'study',
    summary: '의자 고정 ❌ → 걸으면서 / 서서 / 손 만지작 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 뇌는 "가만히 앉아 집중" 자세에서 도파민이 떨어짐.\n5분 안에 다리 떨고, 의자에서 비비적 → 책 못 읽음.\n선생님·부모님은 "가만히 좀!"이라 하지만 그건 ADHD 뇌엔 역효과.\n비ADHD엔 잡음, ADHD엔 신호.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '몸 움직이면서 학습하면 집중력 ↑.\nSarver et al. (2015): ADHD 아동의 fidgeting은 working memory 성능과 양의 상관관계.\n운동 직후 학습 효율 ↑ (BDNF 분비로 뇌 가소성 ↑).\n중강도 유산소 20분 후 다음 학습 세션이 가장 효율적.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 강의·팟캐스트 → 산책하면서 듣기 (오디오 학습)\n• 외울 때 → 방 안 왔다갔다하며 소리내서 읽기\n• 의자 ❌ → 스탠딩 데스크 / 발 받침대 흔들기\n• 손에 fidget cube / 펜 돌리기 / 슬라임\n• 30분 공부 → 5분 점프·푸시업 → 다음 30분 효율 ↑\n• 발표 외울 때 → 거실 걸으며 큰 소리로 연습\n• 어려운 개념 → 화이트보드 앞에 서서 그려가며',
      },
    ],
    source: 'Sarver et al. (2015) Hyperactivity in ADHD; Ratey (2008) Spark',
    tags: ['공부', '운동', '집중'],
  },
  {
    id: 'feynman-technique',
    title: '가르치듯 설명하기',
    category: 'study',
    summary: '외운 거 그대로 ❌ → 친구한테 설명하듯 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '교과서 읽으면 "다 안다"는 느낌 ⭕.\n근데 시험에서 막상 쓸 때 "어 이거 뭐였지" 막힘.\n이유: 인식(recognition) ≠ 이해(understanding).\n외운 단어를 패턴으로 토하는 건 진짜 이해 X.',
      },
      {
        icon: '💡',
        title: '해결',
        body: 'Feynman Technique — 어린아이한테 설명하듯 풀어 말하기.\n쉬운 말로 못 설명하면 진짜 이해 못 한 부분.\n빈 공간이 정확히 어딘지 보임 → 그 부분만 다시.\n혼잣말 녹음 / ChatGPT한테 설명 / 빈 의자한테 발표 다 OK.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 챕터 끝나면 → 폰 녹음 켜고 5분 설명 (전문용어 X, 친구 말투)\n• 안 풀린 문제 → "왜 이 답인지" 소리내서 설명\n• ChatGPT한테 "초등학생한테 이거 가르쳐줘" 식 프롬프트\n• 화이트보드에 다이어그램 그리고 옆에서 자기한테 강의\n• 룸메이트·친구 → 5분만 들어달라고 부탁\n• 모범 발표: 학원 강의 흉내내며 분필 들고 설명',
      },
    ],
    source: 'Richard Feynman; Bjork (1994) generation effect',
    tags: ['공부', '이해', '발표'],
  },
  {
    id: 'eighty-twenty',
    title: '핵심 20%만 잡기',
    category: 'study',
    summary: '100% 외워야 ❌ → 핵심 20%로 80점 ⭕. 완벽주의가 적.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 완벽주의 함정: "다 외워야 시험 봄" 모드.\n앞부분만 빈틈없이 보다 시간 끝남, 뒤는 손도 못 댐.\n결과: 부분만 알아 점수가 더 떨어짐.\n또는 "완벽한 노트" 만들다 한 챕터에 일주일.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '시험·과제의 핵심 20%만 먼저 잡으면 80% 점수.\nPareto 원칙 — 출제율·중요도 높은 것부터 코어 다지기.\n전체 한 번 훑은 후 → 다시 깊이 들어가기 (top-down).\n남은 시간에 디테일 채우기. 완성보다 커버리지.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 시험: 기출 5개년 → 반복 출제되는 주제 = 핵심 20%\n• 과제: 채점 기준표(rubric) 먼저 → 점수 큰 항목부터\n• 책: 목차 + 결론 + 굵은 글씨 = 80% 메시지 캡처\n• 강의: 교수가 두 번 이상 말한 거 / 슬라이드 빨간색 = 시험에 나옴\n• 발표: 한 페이지 요약 → 그 위에 살 붙이기\n• 노트: 완벽 정리 ❌, 핵심 키워드 + 화살표만\n• 자격증: 합격선 + 5점 노리기 (만점 X)',
      },
    ],
    source: 'Pareto principle; Ericsson (2008) Deliberate Practice',
    tags: ['공부', '시험', '완벽주의'],
  },
  {
    id: 'interleaved-practice',
    title: '단원 섞어가며',
    category: 'study',
    summary: '한 단원 끝까지 ❌ → 단원 섞어가며 ⭕. 패턴 인식 ↑.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '같은 유형 문제만 연속으로 풀면 "패턴" 알아서 자동 답.\n근데 시험은 유형이 섞여서 나옴 → 어느 유형인지 못 알아봄.\nADHD엔 단조로움도 추가 문제 (도파민 ↓).\n수학 한 단원 50문제 풀고 다음날 전혀 못 풀던 경험.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '단원·유형을 섞어가며 풀기 (interleaved practice).\nblock practice (한 단원 몰아 풀기) 보다 transfer ↑.\nRohrer (2015): 수학·운동 학습에서 일관되게 더 좋은 시험 점수.\nADHD 단조로움 ↓ + 패턴 일반화 능력 ↑ 양쪽 다 효과.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 수학: 1단원 10문제 ❌ → 1·2·3단원 섞어 30문제 ⭕\n• 영단어: 한 챕터만 ❌ → 어제·오늘·일주일 전 카드 섞기\n• 코딩: 같은 알고리즘 반복 ❌ → 다양한 패턴 섞어 풀기\n• 시험 직전: 모의고사 형식으로 섞인 문제 풀기 (백지 모의시험)\n• 외국어 회화: 주제 한 가지 ❌ → 일상·여행·문화 섞기\n• 악기: 한 곡 반복 ❌ → 여러 곡 짧게 돌려가며',
      },
    ],
    source: 'Rohrer (2015) Interleaved Practice; Bjork (1994) Desirable Difficulties',
    tags: ['공부', '연습', '시험'],
  },
  {
    id: 'sound-calibration',
    title: '환경 소리 조정',
    category: 'study',
    summary: '무음 ❌ → 백색소음 / lofi / 빗소리 ⭕. ADHD엔 정적 = 자극 부족.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '도서관 무음 = ADHD 뇌엔 너무 조용함.\n자극이 부족하면 뇌가 자극을 만들기 시작 → 잡생각 폭발.\n반대로 시끄러운 카페 = 너무 자극 ↑ → 분산.\n가사 있는 음악 = 언어 회로 충돌해서 텍스트 처리 방해.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '뇌가 무시할 수 있는 일정한 배경음 깔기.\nADHD 뇌는 "stochastic resonance" — 적당한 노이즈가 신호를 더 잘 들리게 함 (Sikström & Söderlund 2007).\n가사 X, 변주 적은 음악·자연 소리·백색소음.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• Lofi hiphop (가사 X, 일정한 비트) — YouTube 24시간 라이브\n• 빗소리·계곡물 (rainymood.com)\n• 카페 소음 (coffitivity.com)\n• 클래식 (Bach·Vivaldi 같은 일정한 패턴)\n• 노이즈 캔슬링 헤드폰 + 백색소음\n• 같은 곡 무한반복 (영화 OST 1시간 반복)\n• 일기 탭 BGM 기능: mp3 업로드해서 일정한 곡 깔기\n• ❌ K-POP / 가사 있는 곡 / 변주 큰 EDM',
      },
    ],
    source: 'Sikström & Söderlund (2007) Stimulus-Dependent Dopamine Hypothesis; Söderlund et al. (2010)',
    tags: ['공부', '환경', '집중'],
  },
  {
    id: 'dual-coding',
    title: '글 + 그림 동시에',
    category: 'study',
    summary: '텍스트만 ❌ → 글 + 도식 / 그림 ⭕. 시각형 ADHD 뇌에 강력.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '교과서 글만 읽으면 머리에 안 들어옴.\nADHD는 시각·공간 처리가 강한 편 — 글자만 입력은 한 채널만 사용.\n같은 정보를 텍스트로만 받으면 잠들기 직전.\n특히 추상 개념 (경제·역사 흐름) 은 글로만 외우기 거의 불가능.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '같은 정보를 두 채널 (시각 + 언어) 로 받기 — Dual Coding (Paivio).\n그림·도표·다이어그램 + 설명 텍스트가 같이 있으면 기억 정착 ↑.\nADHD에 특히 효과 큼 (시각 우세 뇌).\n자기가 그린 도식 = 외운 도식보다 훨씬 강력.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 역사 흐름 → 타임라인 그리기 (사건 + 화살표)\n• 경제 개념 → 수요·공급 그래프 직접 그리며 설명\n• 생물 구조 → 세포 도식 손으로 그리고 라벨링\n• 영단어 → 단어 + 작은 그림 (눈 = eye + 눈 모양)\n• 챕터 정리 → 마인드맵 (가운데 주제 + 가지)\n• 강의 노트 → 한쪽엔 글, 한쪽엔 도표 (Cornell 노트법)\n• 어려운 개념 → 메타포 그림 (DNA = 지퍼)',
      },
    ],
    source: 'Paivio (1986) Dual Coding Theory; Mayer (2009) Multimedia Learning',
    tags: ['공부', '시각', '암기'],
  },
]

export function getCategoryTips(category: TipCategory): AdhdTip[] {
  return ADHD_TIPS.filter((t) => t.category === category)
}

export function getTip(id: string): AdhdTip | undefined {
  return ADHD_TIPS.find((t) => t.id === id)
}
