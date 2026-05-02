import type { AdhdTip, TipCategory } from '../types/adhdTip'

export const CATEGORY_META: Record<TipCategory, { label: string; emoji: string; color: string }> = {
  bookmarks: { label: '북마크', emoji: '⭐', color: '#F5B91E' },
  start: { label: '시작·집중', emoji: '🎯', color: '#FFB677' },
  study: { label: '학습', emoji: '🌀', color: '#9CB7FF' },
  mood: { label: '감정', emoji: '🧠', color: 'var(--pink)' },
  record: { label: '기록', emoji: '📝', color: '#B6A8E8' },
  social: { label: '관계', emoji: '👥', color: '#7DD8C7' },
  body: { label: '약', emoji: '💊', color: '#F2A6C6' },
  sleep: { label: '수면', emoji: '😴', color: '#7B9BFF' },
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
    id: 'pomodoro-short',
    title: '25분도 못 앉을 때 뽀모도로 짧게',
    category: 'start',
    summary: '25분 길면 ❌ → 10분부터 시작 → 점점 늘리기 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '"뽀모도로 = 25분 집중 + 5분 휴식" 표준은 ADHD엔 첫날부터 너무 김.\n5분도 안 가서 멍 → "내가 이런 것도 못해" 좌절 → 포기.\n뽀모도로 자체에 거부감 생김.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '본인에게 맞는 시간으로 시작 — 5분이든 10분이든.\n"내가 끝까지 갈 수 있는" 시간만 잡고 → 끝나면 다시.\n점점 늘리기 (1주 단위로 +5분).\nADHD엔 25분 표준보다 본인 페이스가 핵심.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 첫 주: 10분 집중 + 3분 휴식 (반복)\n• 둘째 주: 15분 + 5분\n• 셋째 주: 20분 + 5분 (서서히 25분으로)\n• 한 라운드 끝나면 점수 적기 (게임화)\n• 일기 탭 슬라이더로 라운드 후 집중도 기록\n• 휴식 시간엔 폰 X — 스트레칭·물 마시기 (자극 도파민 X)\n• 못 앉으면 → 더 짧게 (3분 + 1분도 OK)\n• 일주일에 6라운드 = 나쁘지 않은 출발',
      },
    ],
    source: 'Cirillo (1980s) Pomodoro Technique; ADHD timer adaptation research',
    tags: ['집중', '뽀모도로', '시간'],
  },
  {
    id: 'block-distractions',
    title: '알림에 자꾸 끊길 때 환경 차단',
    category: 'start',
    summary: '의지로 안 봄 ❌ → 폰 다른 방 + 앱 차단 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '카톡 띵 한 번 = ADHD 집중 5분 후퇴.\n알림 보고 "10초만" → 30분 SNS 스크롤.\n"의지로 안 봄" 매번 실패 — 도파민 회로가 자동으로 끌어당김.\n이미 끌렸을 때 멈추는 건 거의 불가능.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '의지 X, 환경 차단.\n폰을 손에 닿지 않는 곳에.\n앱 잠금·집중 모드·에이프리코트 같은 차단 앱.\n자극 자체가 안 들어오면 → 의지 안 써도 집중 유지.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 폰 → 다른 방 / 가방 안 / 자물쇠 박스\n• 폰 집중 모드 (iOS Focus / Android Do Not Disturb)\n• Forest·Cold Turkey·OneSec 같은 앱 차단 도구\n• 노트북: 풀스크린 + 알림 OFF + 다른 탭 닫기\n• 메신저 데스크톱 앱 종료\n• 스마트워치 알림 OFF (시계 진동도 끊김)\n• "급한 일 있으면 전화하라" 가족·동료에게 양해\n• 25~50분 단위로 차단 후 → 휴식 시간만 알림 확인',
      },
    ],
    source: 'Mark et al. (2008) Disruption recovery research; ADHD distraction studies',
    tags: ['집중', '알림', '환경'],
  },
  {
    id: 'single-tasking',
    title: '할 일 너무 많을 때 1번에 1개만',
    category: 'start',
    summary: '멀티태스킹 ❌ → 한 가지만 끝낼 때까지 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '할 일 10개 → 모두 시작했다 모두 어중간하게 멈춤.\n뇌가 한꺼번에 다 처리하려다 어느 것도 안 끝남.\nADHD는 멀티태스킹 능력 가장 떨어지는 그룹 — 작업 전환 비용 ↑.\n"바쁘게 했는데 한 거 없음" 모드.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '한 번에 1개만 — 끝낼 때까지 다른 거 X.\n다른 할 일 떠오르면 → 종이에 적고 다시 본 일로.\n하나라도 끝내는 게 5개 시작하는 것보다 강력.\n작업 전환 비용 ↓ → 효율 ↑ + 자존감 ↑.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 책상에 1개 작업만 띄우기 (다른 탭·서류 닫기)\n• "지금은 이것만" 한 줄 메모 책상 위에\n• 새 아이디어 떠오르면 → 따로 메모 (외부화) → 본 일 복귀\n• 카톡·이메일 같은 multitask trap → 정해진 시간에 한 번에\n• "끝낸 후 다음" 룰 — Done 라인 명확히\n• 큰 일은 소단위로 쪼개고 그 1개씩 single-task\n• 5개 어중간보다 1개 완료가 훨씬 도파민 ↑',
      },
    ],
    source: 'Rubinstein et al. (2001) Task switching cost; Barkley executive function',
    tags: ['집중', '멀티태스킹', '실행'],
  },
  {
    id: 'body-doubling',
    title: '혼자 못 집중할 때 Body Doubling',
    category: 'start',
    summary: '옆에 누가 있으면 집중 2배. 줌 / 라이브 / 카페 다 OK.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '혼자 책상 앞 = 5분 만에 멍.\n근데 도서관·카페에 가면 갑자기 집중 잘됨.\nADHD 뇌는 사회적 시선이 self-monitoring 회로를 대체해줌.\n혼자 의지로 self-monitoring하는 건 거의 불가능.',
      },
      {
        icon: '💡',
        title: '해결',
        body: 'Body doubling — 누구랑 같이 작업.\n실제 옆에 있어도 OK, 줌·디코·라이브 시청도 OK.\n친구한테 "나 지금 공부 시작" 톡 한 줄도 효과.\nADHD 코칭 임상에서 가장 강력한 도구 중 하나.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 도서관·스터디카페 (실시간 옆 사람 ↑)\n• 줌·디코로 친구랑 화면 공유 (서로 영상 켜고 작업)\n• YouTube "study with me" 라이브 (시청자 만 명이 같이 공부 효과)\n• Focusmate 같은 1:1 매칭 앱\n• 친구한테 "1시간 후 진행 상황 알려줄게" 약속 (소셜 압박)\n• 카페에서 시간 정해두고 (사람 보이는 자리)\n• 룸메이트·가족 옆에 (조용히 작업하는 척만 해도)\n• 줌 미팅 = 카메라 ON → 집중도 ↑',
      },
    ],
    source: 'ADHD coaching practice; CHADD body doubling guides',
    tags: ['집중', '소셜', '환경'],
  },
  {
    id: 'gamification',
    title: '단순 작업 지루할 때 게임화',
    category: 'start',
    summary: '"공부 6시간" 안 보임 ❌ → "6라운드 클리어" 보임 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 뇌는 추상적 시간(6시간) 보다 점수형 진척도가 강력.\n같은 작업도 "지루함" 모드 들어가면 도파민 끊김 → 못 함.\n"오늘 6시간 했어"는 기억 X, 동기 부여 약함.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '작업을 게임으로 변환 — 점수·라운드·보상 시스템.\n뇌가 "이건 게임" 인식하면 도파민 자동 분비.\n눈에 보이는 진척도 (그래프·체크 등) 가 핵심.\nADHD는 게임 디자인이 가장 잘 먹히는 그룹.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 25분 = 1라운드 → 점수 누적 (10라운드 = 보상)\n• 페이지 50쪽 = 50점 / 문제 100개 = 100점\n• 매일 클리어 → 캘린더에 ✓ 줄 길게\n• 친구랑 경쟁 (오늘 누가 더 많이 했나)\n• 보상 미리 정하기: "30라운드 = 새 책 / 50라운드 = 영화"\n• 일기 탭 슬라이더 → 매일 평균 점수 그래프\n• Habitica·Forest 같은 게임화 앱\n• "지루해" 신호 = "라운드 시작" 신호로 재정의',
      },
    ],
    source: 'Self-Determination Theory (Deci & Ryan); Habitica research',
    tags: ['집중', '게임화', '동기'],
  },
  {
    id: 'fake-deadline',
    title: '마감 멀게 느껴질 때 가짜 마감',
    category: 'start',
    summary: '마감 멀면 안 함 ❌ → 친구한테 보낼 약속 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 뇌는 "now vs not now" 만 인식.\n마감 1주일 = "나중" → 뇌가 작업 안 시작.\n마감 전날에야 도파민·아드레날린 폭발해서 시작.\n매번 벼락치기 → 퀄리티 ↓ + 번아웃.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '본 마감보다 빠른 가짜 마감 만들기.\n친구·동료·가족에게 "X일까지 보낼게" 외부 약속.\n외부 시선 = 작업 트리거 (ADHD 동기 회로).\n실제 마감 X 가짜 마감으로 동기 부여.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 마감 1주 전 → "친구한테 초안 보내기" 약속\n• 학회 발표 → 친구한테 "리허설 봐줘" 일주일 전\n• 책 다 읽기 → 독서 모임에서 발표 약속\n• 보고서 → 동료한테 "검토 부탁" 1주일 전\n• 친구한테 "내일 진행 상황 알려줄게" → 작은 마감\n• 트위터·인스타에 "이번주 X 완성" 공개 약속\n• 일주일 마감 → 매일 25% 단위로 쪼개고 매일 인증\n• Body doubling + 가짜 마감 콤보 = 강력',
      },
    ],
    source: 'Ariely (2002) Procrastination research; ADHD time perception',
    tags: ['집중', '마감', '동기'],
  },
  {
    id: 'reentry-after-break',
    title: '인터럽션 후 다시 못 들어갈 때 5분 룰',
    category: 'start',
    summary: '한 번 끊기면 30분 → 5분 룰 + 신호 → 빠른 복귀.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '집중 들어갔다가 카톡 한 번에 → 다시 못 돌아옴.\n연구: 인터럽션 후 평균 23분 후에야 원래 작업 재진입.\nADHD엔 더 길게 (30분~) — 한 번 끊기면 그날 끝.\n"잠깐만" 들었다가 1시간 SNS 스크롤.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '복귀 의식 (re-entry ritual) 으로 빠르게 다시 들어가기.\n인터럽트 직전 상태 메모로 남기기 → 다시 보고 시작.\n5분 룰 — 끊겼으면 5분 안에 책상 복귀.\n환경 차단 + 휴식은 정해진 시간에만.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 작업 멈출 때 메모: "여기까지 함, 다음은 X" → 복귀 시 그 메모 보고 시작\n• 5분 알람 — 휴식하면 5분 후 책상 복귀 강제\n• 휴식 = 폰 X — 물 / 스트레칭 / 창밖 (자극 없는 휴식)\n• "1시간 집중 → 10분 휴식" 강제 박스\n• 복귀 시 "지난 1분 했던 거 다시 읽기" 의식\n• 카톡 답장 = "이번 라운드 끝나고" 룰\n• 자기에게 사전 약속: "한 번 끊기면 무조건 5분 안에 복귀"',
      },
    ],
    source: 'Mark et al. (2008) The Cost of Interrupted Work; ADHD attention recovery research',
    tags: ['집중', '복귀', '인터럽션'],
  },
  {
    id: 'meeting-agenda',
    title: '회의에 멍해질 때 어젠다 미리 받기',
    category: 'start',
    summary: '맥락 없으면 5분 만에 멍 → 어젠다·노트로 외부 닻 만들기.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '회의 시작 5분 후 머리 멍 → 30분 동안 무슨 얘기 했는지 기억 X.\nADHD 작업기억 짧아서 맥락 안 잡히면 빠르게 떨어져 나감.\n끝나고 "결정 사항이 뭐였더라" 동료한테 다시 물어봄.' },
      { icon: '💡', title: '해결', body: '회의 전 어젠다 받기 (없으면 요청).\n회의 중 노트 적기 — 손으로 적는 동작이 집중 닻.\n끝나면 한 줄 요약 본인용 메모.\nfidget·doodle도 OK (집중 ↑).' },
      { icon: '🎯', title: '예시', body: '• 회의 전: "어젠다 공유해줄 수 있어요?" 한 줄 요청\n• 미리 받으면 → 발언할 부분 한 줄 미리 메모\n• 회의 중: 종이·노트북에 핵심 키워드 적기\n• 카메라 ON + 노트 같이 보이게 (집중 신호)\n• 화면 공유 시 화면 캡처 + 메모\n• 끝나면 30초 — "결정 사항 / 내가 할 거" 한 줄\n• Granola·Otter 같은 AI 회의록 도구 활용\n• 손에 fidget toy / 종이에 doodle도 OK' },
    ],
    source: 'CHADD ADHD workplace; Mark et al. attention research',
    tags: ['집중', '회의', '직장'],
  },
  {
    id: 'sleep-on-it',
    title: '큰 결정 앞에서 흔들릴 때 자고 결정',
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
    title: '읽어도 안 남을 때 책 덮고 떠올리기',
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
    title: '벼락치기로 안 남을 때 며칠 분산해서',
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
    title: '가만히 못 앉을 때 움직이며 공부',
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
    title: '외워도 못 풀 때 가르치듯 설명',
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
    title: '다 외워야 할 것 같을 때 핵심 20%만',
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
    title: '한 유형만 풀고 시험에서 막힐 때 섞어 풀기',
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
    title: '조용해서 집중 안 될 때 lofi 깔기',
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
    title: '텍스트만 안 들어올 때 그림이랑 같이',
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
  {
    id: 'exam-blank-mind',
    title: '시험 직전 머리 하얘질 때 손으로 다시 그리기',
    category: 'study',
    summary: '백지 → 핵심 도식 손으로 한 번 그리면 회상 회로 켜짐.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '시험 입실 직전 / 발표 직전 머리 완전 백지.\n전부 다 외웠는데 첫 단어가 안 떠올라 → 패닉 → 더 안 떠올림.\nADHD + 불안 콤보의 흔한 패턴.' },
      { icon: '💡', title: '해결', body: '본 시험 시작 5분 전: 종이에 핵심 도식·키워드 손으로 그려보기.\n쓰는 동작이 retrieval 회로 활성화 → 막혔던 머리 풀림.\n시험지 받자마자 첫 30초도 같은 룰 — 핵심 키워드 빈 종이에 토하기.' },
      { icon: '🎯', title: '예시', body: '• 시험 직전 5분: 백지에 그날 시험 핵심 마인드맵 그리기\n• 도서관 입실 전 → 화장실에서 5분 손으로 적기\n• 시험지 받자마자: 30초 동안 빈 여백에 키워드·공식 다 적기\n• 발표 직전: 화이트보드에 도식 그려보기 (혼자 발표 리허설)\n• 4-7-8 호흡 4번 (편도체 ↓)\n• "내가 다 알고 있다" 자기말 5초\n• 첫 1분 잘 넘기면 그 다음은 자동' },
    ],
    source: 'Karpicke & Roediger (2008) retrieval practice; ADHD test anxiety research',
    tags: ['공부', '시험', '불안'],
  },

  // ── 🧠 감정 (추가) ────────────────────────────────────
  {
    id: 'ninety-sec-wave',
    title: '감정 폭풍 한가운데서 90초만 견디기',
    category: 'mood',
    summary: '모든 격한 감정은 90초 안에 자연 가라앉아.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '분노·불안·수치심이 영원할 것 같음.\n그 안에서 결정·말·행동을 해서 사고를 침.\n진짜 영원하면 평생 못 살았겠지만, 사실은 짧음.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '신경과학자 Jill Bolte Taylor: 모든 강한 감정의 화학 물질은 90초 안에 몸에서 빠짐.\n그 후에도 남는 건 "내가 그 감정을 계속 끌고 있을 때"뿐.\n핵심: 90초만 가만히 흘려보내기. 그 동안 결정·반응 X.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 분노 폭발 → 시계 보고 90초 카운트, 그 동안 답장 X\n• 카톡 보고 화남 → "90초만 기다려봐" 자기말\n• 회의에서 무시당함 → 손목 시계 한 번 보고 침묵\n• 일기 탭 강도 슬라이더 → 90초 후 다시 매겨보기 (진짜 떨어지는지 확인)\n• 부부싸움 → "잠깐 90초만" 외우고 화장실로\n• 친구한테 RSD 폭발 직전 → 답장 보류 90초',
      },
    ],
    source: 'Jill Bolte Taylor (2008) My Stroke of Insight',
    tags: ['감정', '분노', 'RSD'],
  },
  {
    id: 'trigger-log',
    title: '같은 일에 매번 폭발할 때 패턴 적기',
    category: 'mood',
    summary: '폭풍 패턴은 적어야 보여. 2주면 너의 핫스팟 발견.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '같은 상황에 매번 폭발하는데 왜 그런지 모름.\n사후엔 "또 그랬네" 후회만 — 분석 X.\nADHD 작업기억 짧아서 어제 트리거를 오늘 잊음.\n패턴 모르면 예방도 X.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '발작 직후 짧게 적어두기 (1~2분).\n네 가지: 무슨 일 / 머리에 든 생각 / 몸 어디 / 강도 0~10.\n2주 쌓이면 너의 핫스팟 명확히 보임.\nCBT 표준 도구 — 패턴 인식이 변화의 시작.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 발작 직후 폰 메모: "팀장 코멘트 / 또 망했다 / 가슴 답답 / 9"\n• 일기 탭 활용: 사고 함정 칩 + 강도 슬라이더 자동 누적\n• 주말 5분: 한 주 일지 훑어보기\n• 패턴 발견 예: "오후 4시 + 카페인 + 회의 = 항상 폭발"\n• 그 패턴 1개에만 시스템 만들기 (예: 회의 전 카페인 X)\n• 의사한테 보여주면 약 조정에 도움',
      },
    ],
    source: 'Beck CBT thought record; Linehan DBT diary card',
    tags: ['감정', '기록', 'CBT'],
  },
  {
    id: 'coping-card',
    title: 'RSD 발작 시 미리 적은 카드 꺼내기',
    category: 'mood',
    summary: '폭풍 시엔 의지 X. 평소에 미리 적어둔 카드만 꺼냄.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'RSD·분노 폭발 한가운데서는 합리적 사고 거의 불가능.\n전전두엽 일시 셧다운 → 평소에 알던 대처법도 안 떠오름.\n"숨 깊게 쉬어야지" 자체를 까먹음.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '평소(맑은 정신 상태)에 자기에게 할 말을 카드로 미리 적어두기.\n폭풍 시엔 그냥 카드만 꺼내 읽음. 의지·기억 X.\nCBT 표준 도구 — 미래의 나를 위한 처방전.\n폰 메모·잠금화면·지갑 카드·일기 탭 즐겨찾기 등.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• "이건 RSD 폭풍이야. 진짜 거절 X. 90초 기다려"\n• "지금 이 결정 24시간 보류. 자고 일어나서 다시 봐"\n• "이메일 답장 임시저장. 내일 아침에 다시 읽기"\n• "가슴 답답할 땐 4-7-8 호흡 4번"\n• "친구가 같은 일 겪었으면 뭐라 말해줄까? 그 말 나한테"\n• "이 일이 1년 후엔 어떨 무게? 0.5/10"\n• 잠금화면 위젯에 즐겨쓰는 카드 1개 고정',
      },
    ],
    source: 'Beck (1976) Cognitive Therapy; DBT skill cards (Linehan)',
    tags: ['감정', 'CBT', 'RSD'],
  },
  {
    id: 'comfort-kit',
    title: '폭풍에 의지가 0일 때 진정 도구 미리',
    category: 'mood',
    summary: '폭풍 올 때 의지 X. 손 닿는 곳에 진정 도구 미리.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '감정 폭풍 한가운데서 "산책 가야지" 결정 못 내림.\n진정 도구 (음악·향·스트레스볼) 어디 있는지 찾는 동안 더 폭발.\n격앙 시 의지력은 0 — 환경이 자동으로 도와줘야.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '평소에 폭풍용 도구 키트 만들어 손 닿는 곳에 두기.\n결정 X, 그냥 손 뻗어 사용.\n환경 디자인 + 즉각 진정 — 가장 빠른 회복.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 노이즈 캔슬링 헤드폰 + 진정 플레이리스트 (한 곡 무한반복)\n• 무거운 담요 / 베개 (deep pressure → 부교감 활성)\n• 차가운 음료 (얼음물 한 모금 → 미주신경 자극)\n• 향기 (라벤더·페퍼민트 오일)\n• 스트레스볼 / 슬라임 / fidget cube\n• 따뜻한 차 한 봉지 (찻주전자 옆 상시 비치)\n• 일기 탭 BGM에 진정 곡 mp3 하나 깔아두기\n• 친구·상담사 단축번호 잠금화면',
      },
    ],
    source: 'DBT Self-Soothing Skills (Linehan)',
    tags: ['감정', '환경디자인', '실전'],
  },
  {
    id: 'cold-shock',
    title: '격앙 8/10 넘을 때 찬물 세수',
    category: 'mood',
    summary: '얼음물·찬물 세수 30초 → 자율신경 즉각 진정.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '격앙 8/10 이상 — 호흡법도 머리에 안 들어옴.\n생각으로 진정시키려는 건 거의 불가능.\n몸을 직접 건드려야 하는 임계점.',
      },
      {
        icon: '💡',
        title: '해결',
        body: 'DBT TIPP 기법 중 Temperature.\n차가운 자극이 "잠수 반사 (mammalian dive reflex)" 트리거 → 미주신경 활성 → 심박수·혈압 즉각 ↓.\n호흡법보다 빠름 (격앙 시 가장 강력한 도구).',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 차가운 물 세수 30초 (가장 쉬움)\n• 얼음 한 줌 손에 쥐기 30초\n• 얼음 팩을 눈·이마에 30초\n• 찬물 한 모금 → 입에 머금고 5초\n• 찬 샤워 1분 (집이면)\n• 손목·목 흐르는 찬물 30초\n• 냉장고에서 차가운 음료 꺼내 양손에 쥐기\n⚠️ 심장질환·당뇨 있으면 의사 상담',
      },
    ],
    source: 'Linehan (2014) DBT Skills Training Manual; Wittling et al. (1998) facial cold-water stimulation',
    tags: ['감정', '분노', '응급'],
  },
  {
    id: 'aerobic-prescription',
    title: '감정 조절 안 될 때 빠른 걷기 20분',
    category: 'mood',
    summary: '20분 운동 = 약 다음으로 강력한 감정 조절.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 감정 조절은 도파민 시스템 문제.\n약 외엔 효과 보장 도구 거의 없음.\n근데 운동은 RCT 다수에서 약물에 가까운 효과 보고.\n그런데도 "운동해라" 잔소리로만 듣고 안 함.',
      },
      {
        icon: '💡',
        title: '해결',
        body: 'Aerobic 운동 20~30분이 ADHD 감정·집중 조절에 강력.\n도파민·세로토닌·BDNF 모두 증가.\nRatey (Spark): "운동은 ADHD에 약 처방과 같다".\n하루 한 번 처방받았다 생각하고 실행.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 매일 빠른 걷기 20분 (헬스장 X, 동네 산책)\n• 출근/등교를 한 정거장 일찍 내려서 걷기\n• 점심 후 10분 빠른 걷기 = 오후 집중 ↑\n• 운동 직후 30분 = 학습 효율 골든타임\n• 격앙 후 5분 점프·푸시업으로 "에너지 방출"\n• 좋아하는 운동 우선 (러닝 싫으면 댄스·복싱·등산)\n• 일기 탭 컨디션 슬라이더 + 운동 패턴 같이 보면 효과 명확\n💊 약 + 운동 = 약 단독보다 효과 ↑ (Hoza 2015)',
      },
    ],
    source: 'Ratey (2008) Spark; Hoza et al. (2015) Aerobic exercise + ADHD meta-analysis',
    tags: ['감정', '운동', '약물'],
  },
  {
    id: 'body-warning-signs',
    title: '폭풍 직전 몸 신호 알아채기',
    category: 'mood',
    summary: '폭풍 직전 몸이 먼저 신호. 그 신호가 "멈춤" 자동 트리거.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '감정 폭발은 갑작스럽지 않음 — 몸이 먼저 신호.\n근데 ADHD는 신체 감각 인식 (interoception) 약해서 신호 놓침.\n그러다 "갑자기" 분노 7/10에 도달 → 이미 늦음.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '본인의 폭풍 직전 신체 신호 1~2개 알아두기.\n그 신호 = 자동으로 "멈춤·이동" 트리거 만들기.\nInteroception 훈련 자체가 감정 조절 ↑ (Critchley 2004).\n신호 → 휴식 자동화가 RSD/분노 예방의 핵심.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 흔한 신호: 가슴 답답 / 손 떨림 / 어깨 긴장 / 얼굴 화끈 / 위장 조임 / 턱 악물기\n• 트리거 일지로 본인 신호 패턴 찾기 (2주)\n• 신호 → 30초 화장실 (자리 떠나기)\n• 신호 → 일기 탭 강도 슬라이더 한 번 끌기 (인식만으로도 ↓)\n• 신호 → 4-7-8 호흡 / 차가운 물 세수\n• 잠금화면에 자기 신호 카드: "가슴 답답 = 멈춰"\n• 명상·바디스캔 = interoception 훈련 도구',
      },
    ],
    source: 'Critchley et al. (2004) Neural systems supporting interoceptive awareness',
    tags: ['감정', '몸', 'RSD'],
  },
  {
    id: 'physical-time-out',
    title: '격앙됐을 때 5초 안에 자리 떠나기',
    category: 'mood',
    summary: '격앙 5초 안에 자리 떠나. 진정 후 복귀.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '폭발 직전인데 그 자리에서 대화·결정 계속하면 100% 사고침.\n현장에서 진정시키려는 건 거의 불가능 (전전두엽 셧다운).\n주변 사람·내용·소리 다 자극이라 더 격앙됨.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '5초 안에 물리적으로 자리 떠나기 (Time-out).\n공간 분리만으로 자극 ↓ → 부교감 활성.\n이상한 게 아니라 신경학적으로 가장 빠른 진정 방법.\n진정 후 복귀 — 사과·재대화는 그 후.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• "잠깐 화장실" 한 마디 → 5초 안에 일어남\n• 회의 중이면 "메모 좀" 하고 복도\n• 가족 다툼 → "산책 다녀올게" 5분~30분\n• 카페·공공장소 → 밖으로 나가서 한 바퀴\n• 줌 미팅 → 카메라 끄고 키보드 마이크 mute\n• 자기에게 사전 약속: "신호 뜨면 무조건 자리 떠나"\n• 친구한테 미리 양해: "내가 갑자기 사라지면 진정 후 다시 와"\n⚠️ 책임 회피 X — 진정 후 꼭 복귀해서 마무리',
      },
    ],
    source: 'Linehan DBT Crisis Skills; Gottman (1993) Flooding research',
    tags: ['감정', '관계', '응급'],
  },
  {
    id: 'post-flood-recovery',
    title: '폭풍 후 부끄러울 때 사후 회복 의식',
    category: 'mood',
    summary: '폭발 자체보다 후처리가 자존감을 만듦. 24시간 룰 + 사과.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '감정 폭발하고 나면 다음날 부끄러움·자기혐오 폭발.\n"또 그랬어, 나는 망한 인간" 모드 → 우울 가속.\n사과를 안 하거나 너무 길게 끌면 관계까지 끊어짐.' },
      { icon: '💡', title: '해결', body: '폭발은 일어남 — 그 후의 회복이 자존감과 관계를 살림.\n24시간 안에: 짧고 솔직한 사과 + 다음 시도 1개.\n자기에게도 자기연민 — 친구가 같은 일 했으면 뭐라 할지.\n실수 메모에 "이번 폭풍 트리거" 한 줄 → 다음 예방.' },
      { icon: '🎯', title: '예시', body: '• 24시간 안에 짧은 사과: "어제 격앙됐어, 미안해. 다음엔 ___ 해볼게"\n• 길게 변명 X — 짧게, 다음 시도 1개\n• 자기연민 카드 한 줄 읽기\n• 친구한테 "내가 그랬으면 뭐라 할까" 자문\n• 폭풍 트리거 한 줄 메모 (트리거 일지)\n• 그 트리거 환경 디자인 1개 (예: 카페인 줄이기)\n• 자기를 "결함" X, "회복하는 사람" ⭕\n• 매번 폭풍 후 회복 = 신뢰 회복 (관계도 유지됨)' },
    ],
    source: 'Brené Brown shame research; Gottman repair attempts',
    tags: ['감정', 'RSD', '회복'],
  },

  // ── 👥 관계 (추가) ────────────────────────────────────
  {
    id: 'forget-promises',
    title: '약속 자꾸 까먹을 때 외부에 박기',
    category: 'social',
    summary: '머리 X, 캘린더·알람 ⭕. "내 의지" 믿지 말고 시스템.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD는 작업기억 짧음 → 약속·생일·답장 자꾸 까먹음.\n상대는 "관심 없는 거야?" 라고 받아들임 (배려 X 아님).\n반복되면 신뢰 하락 → 친구·연인 자연스럽게 멀어짐.\n"기억력 좋아져야지" 결심으로는 절대 안 고쳐짐.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '머리에 두지 말고 100% 외부 시스템에 위임.\n캘린더·알람·앱이 너 대신 기억하게.\n"의지로 기억" ❌, "환경이 알려줌" ⭕.\n외부화는 ADHD 1차 처방 (Barkley).',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 약속 잡자마자 그 자리에서 캘린더 입력 (나중에 ❌)\n• 생일·기념일 → 매년 반복 알람 1주일·1일·당일 3개\n• 답장 미루는 카톡 → 즉시 별표 / 리마인더 앱\n• "이번주 안에 연락" 약속 → 당일 알람 박기\n• 부탁받은 거 → 대화 중에 메모 (눈 앞에서 적기, 신뢰감 ↑)\n• 친구한테 솔직히: "약속 잡으면 같이 캘린더 추가하자" 부탁\n• 체크리스트: 약속 잡았으면 → 캘린더 + 알람 + 친구도 캘린더에 (셋다)',
      },
    ],
    source: 'Barkley (2014) Externalization principle',
    tags: ['관계', '약속', '외부화'],
  },
  {
    id: 'distracted-conversation',
    title: '대화 중 멍해질 때 폰 치우고 요약 답',
    category: 'social',
    summary: '"듣고 있는 척" ❌ → 폰 X + 요약 답 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '친구·연인 말 듣다 머리 5초 만에 다른 데로.\n"응응" 답하지만 실제로 못 들음.\n나중에 들킴 → "내 말 안 들었지?" → 관계 균열.\nADHD엔 의지 X — 환경이 문제.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '환경 정리: 폰 뒤집기 / 다른 방 두기. 시각 자극 차단.\n적극적 청취 (Active Listening): 들은 거 짧게 요약해서 되묻기.\n"~가 ~ 했다는 거 맞지?" → 상대도 들었다는 신호 받음.\nADHD 뇌가 "출력" 동작을 하면 입력 정착 ↑.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 진지한 대화 시작 → 폰 뒤집어 두고 시작\n• 상대 말 끝나면 → "그러니까 ~ 했다는 거지?" 한 줄 요약\n• 멍 들어가는 신호 (몇 분간 같은 말) → "잠깐, 다시 말해줄래?" 솔직히\n• 카톡 길게 오면 → 천천히 한 번에 1~2 문단 답 (한 번에 다 X)\n• 식당 = 자극 많음 → 조용한 곳에서 큰 대화\n• 줌 미팅 → 카메라 ON + 메모하면서 듣기 (집중 ↑)\n• 듣고 5분 후 까먹기 시작 → 핵심 한 줄 메모',
      },

    ],
    source: 'Active Listening (Carl Rogers); HelpGuide ADHD relationship guide',
    tags: ['관계', '대화', '집중'],
  },
  {
    id: 'criticism-as-info',
    title: '비판 한 마디에 무너질 때 정보로 받기',
    category: 'social',
    summary: '"날 싫어해" ❌ → "행동 정보 알려줌" ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '친구·연인의 작은 비판 한 마디 → 머릿속 "날 싫어함" 폭발.\nRSD 발작 → 과민 반응 → 더 큰 다툼 → 신뢰 하락.\n비판 = 인격 공격으로 자동 변환되는 ADHD 함정.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '비판을 "행동 정보 (data)"로 분리해 받기.\n"이건 내 인격 X, 내 행동 1개에 대한 피드백" 자기말.\n실제 90% 이상은 정보 — 너 미워해서가 아니라 그 행동만 불편.\nCBT의 cognitive restructuring + Brené Brown shame work.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• "약속 까먹어" 들음 → "이 행동에 대한 피드백, 내 가치 X" 자기말\n• 즉시 답 ❌ — 90초 견디고 답 (감정 폭풍 통과)\n• "정확히 어떤 거였어?" 구체로 묻기 (인격 → 행동 좁히기)\n• "고쳐볼게, 같이 도와줄래?" 응답 (시스템 만들기)\n• 그 자리 떠나서 트리거 일지 적기 → 패턴 보면 RSD vs 진짜 비판 구분\n• 진짜 비판은 받아들이고, 인격 공격은 거리두기 (둘 구분 가능)\n• 평소 자기연민 카드 미리 만들어두기',
      },
    ],
    source: 'Beck CBT; Brown (2012) Daring Greatly; Dodson on RSD',
    tags: ['관계', 'RSD', '감정'],
  },
  {
    id: 'friend-fade',
    title: '친구 자연스럽게 멀어질 때 정기 체크인',
    category: 'social',
    summary: '연락 없으면 잊음 ❌ → 정기 알람으로 챙기기 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD "out of sight, out of mind".\n눈 앞에 없으면 친구 존재 자체가 머리에서 사라짐.\n정작 좋아하는 친구인데 6개월 지나 어색해짐 → 죄책감 → 더 못 연락 (눈덩이).\n게으른 게 아니라 ADHD 작업기억 특성.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '연락을 의지에 맡기지 않고 정기 알람으로 외부화.\n친구별로 "1개월 1번" 같은 주기 정해두기.\n알람 뜨면 그냥 짧게 한 줄 — 길게 안 써도 OK.\n친구한테도 솔직히: "내가 자주 잊어, 너도 막 던져줘".',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 친구 5명 리스트 만들고 → 각자 매월 1일·15일 알람 박기\n• 알람 뜨면: "잘 지내?" / "최근 본 영화 추천" 한 줄 톡\n• 답장 안 와도 OK — 보낸 행위 자체가 관계 유지\n• 생일·기념일 → 자동 반복 알람 (캘린더에 영구)\n• 연 1회 만남 정해두기 ("매년 12월 송년회")\n• 친구한테 ADHD 공개: "내가 잊으면 너가 톡 던져줘"\n• 그룹 채팅 활용 — 1:1 부담 ↓\n• 일기 탭 친구 패널 활용해 친구 활동 보기',
      },
    ],
    source: 'ADHD friendship guides (Sachs Center, CHADD); Barkley working memory',
    tags: ['관계', '친구', '외부화'],
  },
  {
    id: 'impulse-reply',
    title: '충동 답장 후회할 때 24시간 보류',
    category: 'social',
    summary: '바로 답 ❌ → 자고 일어나 답 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '화나는 카톡·메일 받으면 즉시 답하고 후회.\nADHD 충동성 + RSD 폭발이 합쳐져 격앙된 답 보냄.\n사후 "왜 그렇게 보냈지" 후회 — 관계는 이미 깨짐.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '격앙된 메시지엔 24시간 룰. 무조건 자고 일어나 답.\n수면이 편도체 가라앉히고 전전두엽 회복.\n같은 일도 다음 날 무게가 다르게 느껴짐.\nWalker (2017) Why We Sleep — 결정 후회율 ↓.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 화나는 카톡 → 임시저장 (전송 X)\n• 격앙된 이메일 → 받는 사람 칸 비우고 작성 → 다음 날 보낼지 결정\n• 답장 보류 알람 (내일 아침 8시)\n• 다음 날 다시 읽어서 → 90% 안 보냄, 더 부드럽게 다시 씀\n• 친구한테 미리 양해: "내가 답 늦어도 자고 답할게"\n• 격앙 시 → 폰 비행기 모드 30분 (충동 차단)\n• 일기 탭 → 그 카톡에 대한 자동 사고 적고 다음 날 균형 잡힌 생각 추가',
      },
    ],
    source: 'Walker (2017) Why We Sleep; Yoo et al. (2007); Linehan DBT',
    tags: ['관계', '충동', 'RSD'],
  },
  {
    id: 'parent-child-dynamic',
    title: '연인이 잔소리 모드로 갈 때 역할 리셋',
    category: 'social',
    summary: '부모-아이 관계 ❌ → 동등한 동반자 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD가 약속·집안일 자주 잊음 → 비ADHD 파트너가 "관리자"로.\n시간 지나면 부모-아이 다이내믹 형성.\n파트너는 피곤·억울, ADHD는 무력감·수치심.\n양쪽 다 사랑하지만 관계가 망가지는 흔한 패턴.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '"내 ADHD 책임 = 내 거" 명확히 분리.\n파트너에게 잔소리 → 시스템에게 잔소리로 옮기기 (캘린더·체크리스트).\n파트너는 코치 X, 동등한 어른.\n주 1회 "팀 미팅" 정해서 일주일 같이 점검.\nOrlov (2010) ADHD Effect on Marriage 핵심 처방.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 잔소리 시작되면 → "그건 내 시스템 문제, 내가 알람 박을게"\n• 집안일 → 분담 명확히 + 각자 알람 (서로 안 챙겨줌)\n• 주 1회 30분 "관계 미팅" 정해두기 → 그 외엔 잔소리 X\n• 비ADHD 파트너 번아웃 신호 (피곤·짜증) 인정 → 미안함 표현\n• ADHD 처방·치료 진지하게 (책임 회피 X)\n• 파트너한테 "관리자 그만 해도 돼" 명시적으로 말하기\n• 둘이 함께 ADHD 책 읽기 (Orlov 추천)',
      },
    ],
    source: 'Orlov (2010) The ADHD Effect on Marriage',
    tags: ['관계', '연인', '책임'],
  },
  {
    id: 'meeting-interrupt',
    title: '회의에서 끼어들기 충동 들 때 메모로',
    category: 'social',
    summary: '말하고 싶은 거 ❌ 종이에 → 차례 올 때 정리해서 발언.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '회의에서 좋은 아이디어 떠오르면 즉시 말하고 싶음.\n근데 끼어들면 동료 짜증 + "예의 없다" 인식.\n참으면 → 30초 만에 까먹어서 좌절.\nADHD 충동성 + 작업기억 짧음의 결합.' },
      { icon: '💡', title: '해결', body: '말하고 싶은 거 즉시 종이·메모에 적기 → 안전하게 보관.\n차례 올 때 정리된 발언으로 변환.\n잊을 걱정 X → 끼어들지 않을 수 있음.\n외부화 + 충동 관리.' },
      { icon: '🎯', title: '예시', body: '• 회의 중 노트 + 펜 always\n• 떠오르는 아이디어 → 한 줄 적기 (그 자체로 충동 ↓)\n• 차례 오면 메모 보고 정리해서 발언\n• 줌·온라인 → 채팅창 본인용 메모 (private)\n• 작은 ★ 표시로 "꼭 말할 거" 우선순위\n• 회의 끝나고 다 발언 못 한 거 이메일 / 슬랙 후속\n• 동료한테 양해: "내가 메모하다 손 들면 발언 차례 줘"\n• ADHD 공개한 사이라면 "충동 제어 도구야" 설명' },
    ],
    source: 'CHADD ADHD workplace; Linehan DBT impulse skills',
    tags: ['관계', '회의', '충동'],
  },
  {
    id: 'group-conversation',
    title: '그룹 대화 못 따라갈 때 1:1로 빠지기',
    category: 'social',
    summary: '여러 명 동시 대화 = 자극 과부하. 1:1 코너로 빠지기.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '4명 이상 대화 = 누가 누구한테 말하는지 따라가기 어려움.\nADHD 청각 처리 + 분리 청취 (cocktail party effect) 약함.\n"또 한 마디도 못 했네" → 모임 후 외로움·소외감.' },
      { icon: '💡', title: '해결', body: '강제로 그룹 대화 따라가지 X.\n1:1 또는 2:1 작은 코너로 자연스럽게 빠지기.\n뇌가 처리 가능한 자극 수준으로 ↓.\nADHD엔 깊이 있는 1:1 대화가 더 잘 맞음.' },
      { icon: '🎯', title: '예시', body: '• 모임 도착 → 한 명한테 "오늘 어땠어?" 1:1 시작\n• 그룹 대화 안 따라가져 → 옆 사람한테 작은 질문\n• 시끄러운 식당 → 한 사람 옆에 앉아 본인 대화에 집중\n• 파티: 코너에서 1~2명 깊은 대화 (전체 휘젓기 X)\n• 본인에게 사전 약속: "오늘 1명만 깊게 알면 성공"\n• 친구한테 양해: "내가 그룹 대화엔 약해, 1:1로 만나자"\n• 온라인 줌 회의 → 사이드 채팅·DM으로 1:1 보충\n• 모임 후 자기 칭찬 — 그룹 자체가 ADHD엔 어려움' },
    ],
    source: 'Cocktail party effect research; ADHD social processing',
    tags: ['관계', '대화', '소셜'],
  },

  // ── 💊 약 ──────────────────────────────────────────────
  {
    id: 'med-tracking',
    title: '약 효과 모를 때 일주일 추적',
    category: 'body',
    summary: '추측 ❌ → 데이터 ⭕. 의사한테 보여주면 약 조정 빨라짐.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 약 효과 = 사람마다·날마다 다름.\n"오늘 좀 도움됐나?" 감으로만 판단하면 약 조정이 느림.\n시간대별 효과·부작용·기분 변화를 데이터로 안 잡으면 의사도 추측만.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '1~2주 동안 매일 4가지 추적: 집중·기분·식욕·수면.\n시간대별 (아침·점심·저녁) 슬라이더 0~10.\n패턴 보이면 의사한테 데이터로 보여주기 → 용량·종류 조정 빨라짐.\n메디 탭 + 일기 탭 슬라이더 활용.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 매일 같은 시간 (오전 10시·오후 3시·저녁 8시) 슬라이더 한 번씩\n• 약 복용 시간 정확히 기록 (메디 탭)\n• 부작용 (두통·식욕·심박) 강도 0~10\n• 1주 후 그래프로 패턴 확인 — "오후 3시 효과 떨어짐" 같은 명확한 신호\n• 의사 진료 전 한 페이지 요약 출력해서 가져가기\n• 일기 탭 슬라이더 + 메디 탭 약 기록 같이 보면 자동 상관관계',
      },
    ],
    source: 'Cleveland Clinic ADHD medication guide; Ani Møller medication tracker',
    tags: ['약', '추적', '의사'],
  },
  {
    id: 'appetite-loss',
    title: '약 먹고 식욕 사라질 때 시간대 식단',
    category: 'body',
    summary: '식욕 ❌일 때 억지 X → 효과 떨어진 시간에 영양 챙기기.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '자극제 ADHD 약 = 약 80%가 식욕 저하 경험.\n낮에 약 효과 동안엔 거의 못 먹음 → 저녁에 폭식 → 영양 불균형.\n체중 감소·피로·머리 멍 → 약 효과까지 떨어짐.\n"안 먹고 견디면 됨" 모드는 위험.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '약 먹기 전 / 효과 떨어지는 저녁에 영양 집중.\n약 효과 동안엔 적게 자주 (소량 단백질·견과류).\n단백질 + 복합탄수 = 약 효과 안정화.\n식사를 시간 박스로 강제 (배고픔 신호 안 와서 까먹음).',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 약 먹기 전 30분 → 단백질 든든히 (계란·요거트·시리얼)\n• 약 효과 중 점심 → 작게: 견과류·치즈·바나나·프로틴 셰이크\n• 약 효과 떨어진 저녁 → 정상 식사 (이때 식욕 ↑)\n• 점심 알람 박기 (배고픔 신호 안 옴)\n• 물 자주 (탈수도 식욕 ↓ 가속)\n• 폭식 패턴 보이면 → 저녁 7시 이전에 정상 식사 분량\n• 체중 감소 빠르면 → 의사한테 약 조정 의논',
      },
    ],
    source: 'Bluewater Psychiatry ADHD meal timing; ADDitude appetite guides',
    tags: ['약', '식사', '부작용'],
  },
  {
    id: 'med-sleep-timing',
    title: '약 때문에 밤에 잠 안 올 때 시간 고정',
    category: 'body',
    summary: '늦게 먹으면 ❌ 밤새 → 매일 같은 시간 (가능한 이른) ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '자극제는 6~12시간 작용 → 늦게 먹으면 밤까지 효과 남음 → 잠 못 듦.\n수면 부족 → 다음날 ADHD 증상 2배 악화.\n약 효과 vs 잠 사이 줄다리기 → 둘 다 나빠지는 악순환.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '약 시간을 매일 같은 시간 — 가능한 이른 시간에 고정.\n일어나자마자 (8~9시) 먹으면 저녁 8시쯤 효과 떨어짐.\n늦은 오후 추가 복용 X (의사 처방 외엔).\n수면 위생도 같이 — 카페인·블루라이트 컷오프.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 약 알람 매일 같은 시간 (8:00 / 9:00) — 알람 먼저, 일어나서 즉시\n• 늦게 일어났어도 그날 약 시간 8~9시 그대로 (10시 넘어 먹으면 밤 못 잠)\n• 오후 4시 이후 카페인 X\n• 잠 1시간 전 폰 OFF\n• 잠 안 와도 침대 → 30분 후 다른 방으로 (불면증 굳어짐 방지)\n• 수면 부족 → 다음날 약 효과까지 떨어짐 → 반드시 7시간 확보\n• 주말도 같은 약 시간 (취침 리듬 유지)',
      },
    ],
    source: 'Cleveland Clinic ADHD medication; Hvolby (2015) Sleep in ADHD',
    tags: ['약', '수면', '타이밍'],
  },
  {
    id: 'med-forget',
    title: '약 깜빡 자주 할 때 외부 시스템',
    category: 'body',
    summary: '"오늘 먹었나?" ❌ → 알람 + 시각 트리거 ⭕.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 약은 ADHD 때문에 까먹는 아이러니.\n"먹었나 안 먹었나" 헷갈려서 두 번 먹거나 건너뜀.\n불규칙 복용 = 효과 들쭉날쭉 + 체내 농도 안정 X → 정확한 효과 평가 X.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '의지 X, 시스템 ⭕.\n약 알람 + 시각 트리거 + 위치 고정.\n메디 탭 매일 체크 → 먹었는지 즉시 확인.\nBarkley 외부화 원칙 — 머리 외부에 시스템.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 약 매일 같은 시간 알람 (스누즈 비활성화)\n• 침대 옆 / 칫솔 옆 / 커피머신 옆 등 매일 보는 곳에 약통\n• 일주일 약통 (요일별 칸) — 빈 칸이면 안 먹은 거\n• 메디 탭에 매일 체크 → "오늘 먹었나" 헷갈림 ↓\n• 잠금화면 위젯에 "오늘 약 먹었나" 체크\n• 가족·룸메이트한테 부탁: "내가 약 먹었는지 물어봐줘"\n• 자동화: 약통 위에 IoT 압력센서 (고급)',
      },
    ],
    source: 'Barkley externalization; ADHD medication adherence research',
    tags: ['약', '외부화', '습관'],
  },
  {
    id: 'med-caffeine',
    title: '약 먹고 불안 ↑ 일 때 카페인 분리',
    category: 'body',
    summary: '약 + 카페인 = 심박 ↑ 불안 ↑. 시간 분리 필수.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 약 (자극제) 이미 도파민·노르에피네프린 ↑.\n여기에 커피·에너지 드링크 추가 → 심박·혈압·불안 폭증.\n잠도 못 자고, 손 떨림·메스꺼움까지.\n"커피 하나쯤" 으로 시작했다 부작용으로 약 끊는 사람 많음.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '약과 카페인 시간 분리 + 양 제한.\n약 복용 후 2시간 내 카페인 X.\n오후 2시 이후 카페인 X (수면까지 영향).\n일일 200mg 이하 (아메리카노 2잔 정도).\n생리주기 황체기엔 카페인 민감도 ↑ — 더 줄이기.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 아침: 약 → 2시간 후 커피\n• 오후 14시 이후 카페인 X\n• 디카페인으로 의식 전환 (입맛만 충족)\n• 에너지 드링크 ❌ (카페인 + 타우린 = 심박 폭증)\n• 부작용 (심박 ↑, 손 떨림) 있으면 → 카페인 먼저 줄여보기\n• 친구 만나러 카페 → 디카페인 / 차 / 우유 라떼\n• 황체기·생리 주에는 더 줄이기 (호르몬 + 약 + 카페인 시너지 위험)',
      },
    ],
    source: 'Cleveland Clinic ADHD medication; Quinn (2005) Treating Women with ADHD',
    tags: ['약', '카페인', '부작용'],
  },
  {
    id: 'new-med-first-2-weeks',
    title: '새 약 시작했을 때 첫 2주 기록',
    category: 'body',
    summary: '"몸이 적응 중인지 안 맞는지" 분간하려면 데이터.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '새 ADHD 약 시작 → 첫 1~2주는 부작용 강할 수 있음.\n그게 적응 과정인지 진짜 안 맞는지 구분 어려움.\n"안 맞나봐" 충동적으로 끊거나, 거꾸로 부작용 견디다 망가짐.\n첫 2주 데이터가 약 평가의 핵심.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '첫 2주 매일 짧은 일지: 효과 / 부작용 / 기분 / 식욕 / 수면.\n3~5일 차에 처음 안정화 신호 보임.\n2주 후 의사한테 데이터로 보고 → 계속할지 / 용량 조정 / 다른 약.\n충동적 결정 X, 데이터 기반.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 매일 잠자기 전 5분: 효과 / 부작용 / 기분 / 식욕 / 수면 (0~10)\n• 짜증·불안·심박 같은 부작용 강도\n• 식욕·수면 변화 패턴\n• 일주일 단위 평균 — 1주차 vs 2주차 비교\n• 안정화 신호: 부작용 ↓, 효과 일정 (3~5일 차)\n• 적응 안 됨 신호: 2주째도 강한 부작용 / 우울·불안 ↑\n• 응급: 가슴 통증·환각·자살사고 → 즉시 의사·응급실\n• 일기 탭 슬라이더 활용 → 자동 누적 그래프',
      },
    ],
    source: 'AuDHD Psychiatry Starting ADHD Medication; FDA medication guidelines',
    tags: ['약', '시작', '추적'],
  },
  {
    id: 'concerta-titration',
    title: '콘서타 시작했을 때 적응기간',
    category: 'body',
    summary: '18 → 36 → 54 단계 올라가는 게 표준. 첫 1~2주 부작용 흔함.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '콘서타 처음 받으면 효과·부작용 둘 다 강하게 느껴짐.\n첫 1주 두통·식욕 저하·잠 안 옴 → "이거 안 맞나?" 충동 중단 위험.\n반대로 첫 1주 효과가 약하면 "안 듣나?" → 용량 자가 조정 위험.\n적응 패턴 모르면 평가가 잘못됨.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '표준 titration: 18mg → (1~2주) → 36mg → (1~2주) → 54mg.\n각 단계별 1~2주 적응 후 다음 용량 의사가 조정.\n첫 1~2주 부작용은 대부분 일시적 (몸이 자극제에 적응).\n효과는 36~54mg에서 명확히 나타나는 사람 많음.\n자가 조정 X, 의사와 매주 확인.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 1주차 (18mg): 두통·식욕↓·약간 멍함이 흔함 → 일시적\n• 2주차 (18mg): 부작용 ↓ 시작, 효과 첫 신호 (집중 ↑)\n• 3주차부터 36mg → 효과 명확해짐, 부작용 다시 살짝 ↑ → 일주일 후 안정화\n• 5주차 54mg → 본격 효과, 부작용은 1주 안에 안정\n• 매일 체크: 효과·식욕·수면·기분·심박 (메디 탭 + 일기 탭)\n• 응급 신호 (가슴 통증·환각·자살사고) → 즉시 의사·응급실\n• 심한 부작용 1주 넘게 지속 → 의사한테 데이터로 알리기 (자가 중단 X)\n• 36mg에서 효과 충분하면 54mg 안 가도 됨 (사람마다 다름)',
      },
    ],
    source: 'Concerta® prescribing info; Cleveland Clinic ADHD medication',
    tags: ['약', '콘서타', '적응'],
  },
  {
    id: 'med-not-fitting',
    title: '약이 안 맞는 것 같을 때 다른 계열 시도',
    category: 'body',
    summary: '메틸페니데이트 ↔ 암페타민 — 50%는 한쪽이 더 잘 맞아.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '콘서타·메디키넷 (메틸페니데이트) 먹어도 효과 약하거나 부작용 큼.\n"내가 약이 안 듣는 사람인가?" 좌절 → 치료 포기 위험.\n실제론 ADHD 약 80%+ 환자가 약물 반응 — 다만 사람마다 맞는 약 다름.',
      },
      {
        icon: '💡',
        title: '해결',
        body: 'ADHD 자극제 = 두 계열: 메틸페니데이트 (콘서타·메디키넷·페니드) vs 암페타민 (Adderall·Vyvanse·엘반세).\n50% 환자는 한 계열에 더 잘 반응.\n현재 약 6~8주 충분히 시도 후 효과 약하면 → 의사한테 다른 계열 의논.\n비자극제 (스트라테라·인튜니브) 도 옵션.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 콘서타 6~8주 적정 용량까지 올려도 효과 약함 → 다른 계열 의논\n• 메틸페니데이트 부작용 강함 (불안·심박) → 암페타민 더 잘 맞을 수 있음\n• 엘반세 (Vyvanse) — 한국 처방 가능, prodrug라 약 효과 부드러움\n• 비자극제 옵션: 스트라테라 (atomoxetine), 인튜니브 (guanfacine)\n• 약 바꿀 때도 첫 2주 적응 일지 기록 (앞 팁 참고)\n• 한 계열 안 맞아도 다른 계열은 잘 맞을 가능성 50%\n• 자가 판단 X — 의사와 데이터 보고 결정\n• 한국에선 콘서타·메디키넷이 1차, 엘반세는 처방 받기 비교적 쉬움',
      },
    ],
    source: 'Cortese et al. (2018) Comparative efficacy ADHD meds Lancet Psychiatry; Child Mind Institute',
    tags: ['약', '계열', '의사'],
  },
  {
    id: 'med-rebound',
    title: '약 효과 끝날 때 리바운드 견디기',
    category: 'body',
    summary: '오후 효과 떨어질 때 짜증·우울 일시적. 견뎌도 OK.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '약 효과 떨어지는 시간 (오후 3~5시쯤) 짜증·우울·피로 폭발.\n"약 끊으니 더 나빠지나?" 걱정.\n도파민 일시적 ↓ → 감정 dysregulation 일시적 ↑ — Rebound effect.\n파트너·자녀·동료한테 짜증 폭발해서 후회.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '리바운드는 일시적 (1~2시간) 자연 현상.\n그 시간 알아두고 큰 결정·민감한 대화 X.\n간단한 대처: 단백질 간식 + 물 + 짧은 산책.\n매일 같은 시간이면 → 의사한테 약 종류·시간 조정 의논 (서방형 등).',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 매일 효과 끝나는 시간 메디 탭·일기 탭에 기록 (보통 오후 3~5시)\n• 그 시간엔 회의·대화·의사결정 피하기\n• 단백질 간식 (견과류·치즈·요거트) + 물 1잔\n• 5분 산책 → 도파민 자연 보충\n• 그 시간 알람 박기: "리바운드 시간이야 — 견디면 1시간 후 안정"\n• 가족한테 미리 양해: "나 오후 4시쯤 짜증 폭발해, 그 시간엔 큰 얘기 X"\n• 매일 같은 시간 강한 리바운드 → 의사한테 → 12hr 서방형·소량 추가 복용 등 의논\n• 기록 데이터로 의사 진료 → 약 조정 빨라짐',
      },
    ],
    source: 'Concerta® prescribing info; Cleveland Clinic; Faraone (2019) ADHD pharmacotherapy',
    tags: ['약', '리바운드', '오후'],
  },
  {
    id: 'med-out-day',
    title: '약 떨어진 날 비상 plan',
    category: 'body',
    summary: '약 X 일주일은 위험. 미리 처방·예비 약 시스템.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '약 깜빡 처방 못 받은 채로 떨어짐 → 며칠 약 X.\n갑자기 약 끊으면 (특히 자극제) → 우울·집중력 ↓ + 시험·발표 망함.\n응급실은 ADHD 약 처방 X — 외래 의사 약속 잡아야 함.' },
      { icon: '💡', title: '해결', body: '예방이 핵심: 약 1주일 분 남았을 때 처방 알람.\n비상시: 의사 진료 즉시 잡기 + 약국에 fax 처방.\n며칠 약 없으면 그 기간 스케줄 가볍게 (큰 일정 X).\n장기 여행 가기 전 미리 처방 받기.' },
      { icon: '🎯', title: '예시', body: '• 약 1주 남았을 때 알람 → 처방 예약\n• 단골 약국 정해두면 빠른 fax 처방\n• 메디 탭에 다음 처방일 등록\n• 주말 병원 영업 X → 평일 미리 챙기기\n• 약 떨어졌을 때: 큰 회의·시험 미루거나 줄이기\n• 카페인 + 운동 + 수면으로 임시 보강 (대체 X)\n• 휴가·출장 전 의사한테 "20일 분 받을 수 있나" 미리 의논\n• 비행기·해외: 처방전 영문 카피 + 약 원본 포장에 (세관)' },
    ],
    source: 'CHADD ADHD medication management; ADDA medication adherence',
    tags: ['약', '비상', '예방'],
  },

  // ── 😴 수면 ────────────────────────────────────────────
  {
    id: 'racing-thoughts-bed',
    title: '잠자리에서 생각 폭주할 때 브레인덤프',
    category: 'sleep',
    summary: '머릿속 X → 종이로. 잠 들기 5분 글로 토하기.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '눕자마자 머리에서 생각·걱정·할 일 100개 폭주.\nADHD 뇌는 낮 동안 멈추던 회로가 조용해지면 오히려 활성화.\n낮에 못 처리한 모든 게 한꺼번에 떠올라 잠 못 듦.\n잠 부족 → 다음날 ADHD 증상 악화 → 더 안 자려 함 → 악순환.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '잠 들기 전 5분 브레인덤프 — 머릿속 다 종이·앱으로 토하기.\n정리 X, 막 적기. 외부에 적힌 순간 뇌가 "저장됨" 처리하고 안심.\nADHD 코호트 연구: 미완료 작업 리스트 적기로 잠 침투 사고 약 35% 감소.\n덤프 탭이나 일기 탭 활용.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 잠 들기 30분 전 침대 옆에 종이·폰 메모장 준비\n• 5분 동안 머리에 떠오르는 거 다 적기 — 할 일·걱정·아이디어 가리지 X\n• 정리·맞춤법·문장 X. 키워드만이라도\n• "이건 종이에 옮겼으니 머리에서 빼" 자기말\n• 마지막 한 줄: "지금 더 할 수 있는 거 없음 — 자자"\n• 덤프 탭에 "잠자기 전" 카테고리 만들기\n• 일기 탭 슬라이더로 컨디션 + 메모 한 줄도 OK\n• 그래도 떠오르면 → 일어나 또 적고 다시 누워',
      },
    ],
    source: 'ADDitude sleep formula; ADHD insomnia brain dump research',
    tags: ['수면', '불면', '덤프'],
  },
  {
    id: 'revenge-bedtime',
    title: '새벽까지 폰 못 놓을 때 낮 보상 만들기',
    category: 'sleep',
    summary: '"내 시간"이 밤만 있으면 안 잠 → 낮에 자유 시간 박기.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '낮 종일 일·공부에 끌려다님 → 밤이 유일한 "내 시간".\n폰·유튜브·게임으로 새벽 2~3시까지 → "Revenge Bedtime Procrastination".\n잠 부족 → 다음날 더 힘듦 → 또 밤에 보상받으려 → 악순환.\nADHD가 특히 빠지기 쉬운 패턴 (도파민 보상 끊긴 낮 + 자유로운 밤).',
      },
      {
        icon: '💡',
        title: '해결',
        body: '문제는 잠이 아니라 낮의 자유 시간 부족.\n낮에도 "내 시간" 박스 강제로 박기 → 밤에 보상 욕구 ↓.\n잠 자기 = 낮 자유 빼앗는 거 아님 (오히려 회복).\n취침 전 90분은 자극 컷오프 (블루라이트·짧은 영상).',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 점심시간 30분 → 폰·산책·낮잠 자유 시간 (회의 X)\n• 퇴근 후 1시간 → "나만의 시간" 박스 캘린더에 박기 (가족·친구 X)\n• 주말 오전 = 자유 시간으로 정해두기\n• 취침 90분 전 → 폰 다른 방 / 무음 모드\n• 아침 알람보다 "잠 알람" 박기 (자야 할 시간)\n• "나는 자고 싶다 X, 내 시간 더 갖고 싶다" 자기 인식\n• 5분 단위 행동 — 양치 → 침대 → 폰 X → 책 5쪽 → 끄기\n• 자기 패턴 트래킹 (수면 앱) → 평균 취침 시간 보면 충격 (현실 인식)',
      },
    ],
    source: 'ADDitude Revenge Bedtime; Kroese et al. (2014) Bedtime Procrastination',
    tags: ['수면', '의지', '보상'],
  },
  {
    id: 'cant-sleep-thirty-min',
    title: '잠 안 와 누워있을 때 30분 룰',
    category: 'sleep',
    summary: '30분 안 잠들면 다른 방으로. 침대 = 잠 연결 유지.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '잠 안 와도 누워있으면 점점 더 깨어남.\n뇌가 "침대 = 깨어 있는 곳" 학습 → 다음 밤도 잠 못 듦.\nADHD + 불면 만성화의 시작.\n핸드폰 만지면 자극 ↑ → 더 늦게 자게 됨.',
      },
      {
        icon: '💡',
        title: '해결',
        body: 'CBT-I (불면증 인지행동치료) 표준 룰.\n눕고 30분 안 잠들면 일어나 다른 방으로.\n어두운 곳에서 지루한 것 (책·라디오) → 졸리면 다시 침대.\n침대 = 잠으로만 연결시키기.\nCBT-I는 ADHD에 약물보다 효과 큼 (장기적).',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 침대 누워 30분 = 못 자면 일어나기 (시계 보지 마, 감으로)\n• 다른 방 어두운 곳 → 지루한 책 / 종이 다이어리\n• 폰·TV·게임 ❌ (자극 ↑ → 잠 더 멀어짐)\n• 졸음 다시 오면 침대로 — 계속 깨면 또 일어나기\n• 시계 거꾸로 두기 (몇 시인지 확인 X — 불안 ↑)\n• 침대에서 일·공부·영상 ❌ — 침대는 오직 잠·관계만\n• 잠 자려고 노력 X, 자려는 의도 자체를 빼기 ("그냥 누워있을게")\n• 만성 불면 6주 이상 → 의사·CBT-I 상담',
      },
    ],
    source: 'CBT-I (Cognitive Behavioral Therapy for Insomnia); ADDA sleep guide',
    tags: ['수면', '불면', 'CBT-I'],
  },
  {
    id: 'morning-light',
    title: '아침에 못 일어날 때 기상시간 고정',
    category: 'sleep',
    summary: '취침은 가변, 기상은 고정. 아침 햇빛이 시계 리셋.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 70%+ 가 DSPS (수면주기 지연) 동반.\n늦게 자고 늦게 일어남 → 아침 못 일어남 → 학교·회사 지각 반복.\n주말 보충 잠으로 더 늦어짐 → "social jet lag" → 월요일 더 망함.\n취침 시간 일정하게 하려는 시도 대부분 실패 (못 잠).',
      },
      {
        icon: '💡',
        title: '해결',
        body: '취침 시간 X, 기상 시간 고정.\n매일 같은 시간 일어나면 며칠 후 자연 잠 시간 당겨짐.\n아침 햇빛 10분 = 멜라토닌 시계 리셋 → 저녁 잠 시간 ↓.\n주말도 같은 기상 시간 (1시간 차이 OK).',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 매일 같은 시간 알람 (8시 등) — 주말 포함\n• 일어나자마자 커튼 활짝 / 발코니 5~10분 (햇빛 직접)\n• 흐린 날: 형광등이라도 가장 밝게 (10000 lux 라이트박스도 옵션)\n• 아침에 약 챙기기 → 약 + 햇빛 = 강력 콤보\n• 취침 시간은 가변 OK — 기상만 고정하면 며칠 후 잠 시간도 따라옴\n• 주말 늦잠 1시간 이내로 (3시간 늦으면 월요일 = 시차 적응처럼 망)\n• 알람 멀리 두기 (침대 → 책상) → 끄러 일어나야 함\n• 만성 DSPS → 의사한테 저용량 멜라토닌 (0.3~0.5mg) 의논',
      },
    ],
    source: 'Frontiers (2025) ADHD as circadian rhythm disorder; Van Veen et al. (2010) DSPS in ADHD',
    tags: ['수면', '기상', '햇빛'],
  },
  {
    id: 'screen-cutoff',
    title: '잠자기 전에 폰 못 놓을 때 90분 컷오프',
    category: 'sleep',
    summary: '의지 X, 환경 ⭕. 폰 다른 방 + 알람 별도.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '잠 자기 직전까지 폰 → 블루라이트가 멜라토닌 분비 30분~1시간 지연.\n블루라이트보다 더 큰 문제는 자극 (영상·SNS·게임 도파민 ↑).\nADHD 뇌엔 "한 영상만"이 1시간으로 늘어남.\n"의지로 끄자" 매번 실패.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '의지 X, 환경 디자인.\n취침 90분 전 → 폰 침실 밖.\n알람은 별도 알람 시계 (폰 알람 X — 폰 가져오는 핑계).\n폰 대신 종이책·라디오·오디오북.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 침실 입구에 충전기 — 폰 거기 두고 자기\n• 알람은 별도 시계 (5천원짜리도 OK)\n• 잠 90분 전 = 화장실·양치 → 책 → 침대 (폰 안 만짐)\n• "공식 잠 알람" 설정 (자야 할 시간) — 그 시각 폰 침실 밖에\n• 그래도 만지고 싶으면: 폰 그레이스케일 모드 (재미 ↓)\n• 잠 안 와도 폰 ❌ — 라디오·오디오북·종이책으로\n• 안경·스마트워치 차단 (LED 알림)\n• 1주만 해보면 잠 시간 확실히 빨라짐',
      },
    ],
    source: 'Cajochen et al. (2011) Light effects on melatonin; Sleep Foundation ADHD guide',
    tags: ['수면', '폰', '환경'],
  },
  {
    id: 'pre-bed-exercise',
    title: '저녁 운동으로 잠 빨리 들기',
    category: 'sleep',
    summary: '오후 4~6시 20분 빠른 걷기 = 잠 시간 15분 ↓.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 뇌는 저녁에도 자극 부족하면 활성화 — 잠 못 듦.\n앉아만 있으면 운동 부족 → 아데노신 (잠 압력 호르몬) 분비 ↓ → 잠 안 옴.\n약 효과 떨어진 저녁에 우울·짜증도 같이 옴.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '오후 4~6시 (취침 6시간 전) 중강도 유산소 20~30분.\n아데노신·세로토닌 분비 ↑ → 잠 시간 평균 15분 단축.\n저녁 늦은 운동 (취침 2시간 전 이후) 은 오히려 각성.\n약 효과까지 떨어진 시점에 운동 = 리바운드 완화 보너스.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 오후 4~6시 빠른 걷기 20분 (지하철 한 정거장 일찍 내리기)\n• 저녁 식사 전이 베스트 (식후엔 소화 우선)\n• 헬스장 갈 시간 X → 회사 계단 / 동네 5바퀴\n• 강도: 약간 숨차고 말하기 약간 어려운 정도\n• 취침 2시간 전 이후 격렬 운동 ❌ — 잠 더 멀어짐\n• 가벼운 스트레칭·요가는 잠 직전도 OK\n• 한국 도시 환경: 한강·공원·아파트 주변 산책로\n• 1주일 시도 → 잠 들기 빨라지는 거 직접 확인',
      },
    ],
    source: 'Kredlow et al. (2015) Exercise on sleep meta-analysis; Sleep Foundation',
    tags: ['수면', '운동', '저녁'],
  },

  // ── 📝 기록 ────────────────────────────────────────────
  {
    id: 'mistake-memo',
    title: '실수 자주 반복할 때 1줄 메모',
    category: 'record',
    summary: '날짜 / 실수 / 상황 / 예방 — 3줄 넘기지 마.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '같은 실수 반복인데 패턴 안 보임 → "왜 또 이러지" 자책만.\n길게 쓰면 다음엔 안 씀 → 데이터 0.\n자책 모드로 적으면 수치심 일기장 됨 → 우울 가속.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '1줄만. 3줄 넘기지 마.\n"날짜 / 실수 / 상황 / 예방" 4칸 템플릿.\n자책 X → 패턴 찾기 ⭕.\n2주 쌓이면 너의 핫스팟 발견.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 5/1 카드 분실 / 카페 결제 후 / 페이만 쓰자\n• 5/1 환승역 지나침 / 폰 영상 보다가 / 알람 ON\n• 4/30 약속 까먹음 / 회의 후 바로 잊음 / 캘린더 의존\n• 태그 4개 분류: #시간 #물건 #감정 #공간\n• 일요일 5분 리뷰 → 반복 패턴 1개만 시스템화\n• 1회성 사고는 무시 (ADHD는 가끔 사고 침)\n• 덤프 탭에 "실수 메모" 카테고리 활용',
      },
    ],
    source: 'CBT thought record (Beck); pattern log methodology',
    tags: ['기록', '실수', '패턴'],
  },
  {
    id: 'time-log',
    title: '시간 왜곡 보정 타임 로그',
    category: 'record',
    summary: '"샤워 30분 걸렸음" 한 가지만 1주일 → 계획 현실적으로.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD = "시간에 대한 근시" (Barkley).\n샤워 10분이면 될 줄 알고 → 실제 30분.\n약속 항상 늦음, 마감 항상 못 맞춤.\n예측이 계속 빗나가는데 데이터 없으니 학습 X.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '한 가지 활동만 골라 1주일 실측.\n"예상 시간 vs 실제 시간" 두 칸만.\n쌓이면 본인 시간 감각 ↔ 현실 차이 명확히 보임.\n다음 계획 시 그 데이터로 현실 보정.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 1주일: 출근 준비 시간 → "예상 30분, 실제 50분"\n• 다음 주: 다른 활동 → 이메일 답장 시간\n• 일주일 평균 = 너의 진짜 시간\n• 계획 세울 때 "내 예상 + 1.5배" 룰 적용\n• 메모장·시계 앱·스톱워치 다 OK\n• 일기 탭 메모에 "샤워 30분 걸림" 한 줄도 충분\n• 2주 후 → "내가 30분 일찍 시작해야겠다" 자연스러운 보정',
      },
    ],
    source: 'Russell Barkley (2014) ADHD and time blindness',
    tags: ['기록', '시간', '계획'],
  },
  {
    id: 'i-did-list',
    title: 'To-Do 압박될 때 I DID 리스트',
    category: 'record',
    summary: '못한 거 ❌ → 한 거 ⭕. 도파민 보상 회로 자극.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 뇌는 못한 거에 100% 집중하는 디폴트.\nTo-Do 리스트 = 끝나지 않은 게 부담.\n매일 자려고 누워도 "오늘 아무것도 못했어" 자책.\n실제론 많이 했는데 인식 ↓.',
      },
      {
        icon: '💡',
        title: '해결',
        body: 'To-Do 말고 Done 리스트 (I DID).\n끝낸 거만 적어. 작은 것도 다.\n도파민 보상 회로 활성화 — 행동 치료 / 긍정 심리학 입증.\n자존감 회복 + 다음날 동기 부여.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 오후 5시 알람 → 1분 동안 "오늘 한 거" 적기\n• 작은 것도 카운트: 점심 챙김·약 먹음·답장 1개·5분 산책\n• 7개 적으면 "오늘 아무것도 안 했다" 환상 깨짐\n• 일기 탭 메모에 "오늘 한 거" 한 줄\n• 친구한테 매일 1개씩 공유 (소셜 강화)\n• 한 주 끝에 모아보면 → 진짜 많이 했음 보임\n• 우울 시즌 = 더 자주 (작은 거라도 카운트)',
      },
    ],
    source: 'Behavioral Activation Therapy; Positive Psychology (Seligman)',
    tags: ['기록', '자존감', '도파민'],
  },
  {
    id: 'weekly-review',
    title: '매일 똑같이 살 것 같을 때 1주 회고',
    category: 'record',
    summary: '5분만 — 잘된 거 1개 / 패턴 1개 / 다음주 시도 1개.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '주중 정신없이 흘러감 → 한 달이 한 주 같음.\n"이번주 뭐 했지?" 기억 X → 성장 인식 0 → 무기력.\n매일 일기는 부담 → 거의 안 쓰게 됨.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '주 1회만 5분 회고.\n3가지: 잘된 거 1개 / 패턴 1개 / 다음주 시도 1개.\n매일 X — 일요일 밤 / 월요일 아침 정해진 시간.\n6주 쌓이면 너의 진짜 패턴 보임.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 일요일 밤 9시 알람 → 5분 회고\n• Q1: 잘된 거 1개 → "수요일 발표 잘함"\n• Q2: 패턴 1개 → "오후 4시 + 카페인 = 짜증 폭발"\n• Q3: 다음주 시도 1개 → "오후 카페인 줄이기"\n• 일기 탭에 "주간 회고" 메모 카테고리\n• 친구·파트너랑 같이 회고 (서로 들어주기)\n• Bullet Journal "Weekly Review" 페이지\n• 6주 후 → 패턴 보고 본인 변화 인식',
      },
    ],
    source: 'David Allen (2001) Getting Things Done; Bullet Journal weekly review',
    tags: ['기록', '회고', '주간'],
  },
  {
    id: 'one-line-journal',
    title: '일기 부담될 때 1줄 일기',
    category: 'record',
    summary: '"오늘 어땠어?" 한 줄. 매일 → 6주 후 패턴 보임.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '일기 쓰겠다 결심 → 첫날 1페이지 → 둘째날 X → 안 씀.\n매일 길게 쓰는 건 ADHD에 거의 불가능.\n근데 안 쓰면 본인 패턴·기분·성장 데이터 0.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '1줄만. 진짜 1줄.\n"오늘 어땠어?" 한 줄 답.\n맞춤법·문장 X. 키워드만이라도.\n매일 같은 시간 30초 → 6주 후 패턴 폭발적으로 보임.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 잠 자기 전 30초 알람 → 1줄 적기\n• 예: "발표 잘했음, 그래도 피곤" / "감기 걸림" / "친구랑 다툼"\n• 일기 탭 슬라이더 + 한 줄 메모로 자동\n• 5분짜리 일기 X — 30초가 핵심\n• 빈 칸 며칠 OK — 다음 날 다시 시작\n• 한 달 모아보면 패턴 (수요일 항상 우울 등) 발견\n• 한 줄 + 슬라이더 = 자동 그래프로 시각화',
      },
    ],
    source: 'Pennebaker expressive writing; minimum viable journal',
    tags: ['기록', '일기', '습관'],
  },
  {
    id: 'capture-system',
    title: '아이디어 자주 잊을 때 30초 캡처',
    category: 'record',
    summary: '떠오르는 거 30초 안에 적기. 잊기 전에.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: 'ADHD 뇌는 통찰·아이디어·중요한 생각이 자주 떠오름.\n근데 작업기억 짧아서 30초 만에 사라짐.\n"이 아이디어 좋았는데..." 후회 → 다시 안 떠올라서 좌절.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '떠오르는 즉시 30초 안에 적기.\n어떤 형식이든 OK — 메모·음성·사진 다.\n뇌가 "저장됐다" 인식하면 다음 생각으로 넘어감.\n나중에 정리는 별개 — 일단 캡처.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 폰 메모장 단축 — 잠금화면에서 한 번에 열리게\n• 시리/구글: "메모 — [내용]" 음성 캡처\n• 카카오톡 "나에게 보내기" 가장 빠름\n• 운전 중 → 음성 메모만\n• 덤프 탭에 즉시 (앱 안에서 캡처)\n• 화장실에 작은 메모지 (떠오르는 곳)\n• 잠 들기 전 침대 옆 종이 (잠 직전 통찰 많음)\n• 1주일에 한 번 캡처한 거 정리 (별개 활동)',
      },
    ],
    source: 'David Allen (2001) GTD capture habit; Barkley externalization',
    tags: ['기록', '아이디어', '캡처'],
  },
  {
    id: 'visual-tracker',
    title: '진척 안 보일 때 시각 트래커',
    category: 'record',
    summary: '습관 매일 ✓ → 30일 후 줄 보면서 자존감 회복.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '습관 만들고 싶은데 진척이 안 보임 → 동기 ↓.\n"내가 며칠 했지?" 기억 X.\n며칠 빠지면 "다 망쳤어" 모드 → 그만둠.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '시각 트래커 — 매일 ✓ 또는 X.\n선이 길어지는 거 시각으로 보면 강력한 도파민.\n며칠 빠져도 OK — 그래프 끊지 않고 다시 시작.\nSeinfeld의 "Don\'t break the chain" 기법.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• A4 용지에 30칸 그리고 매일 ✓\n• 습관 탭 활용 (스트릭 자동 계산)\n• 30일 후 → 빨간 줄 모아보고 자존감 회복\n• 며칠 빠져도 다음날 다시 — 0 만들지 마\n• 색깔 다르게 (월화 파랑·수목 초록 등) → 패턴 더 잘 보임\n• 친구한테 매일 사진 공유 (소셜 강화)\n• 너무 많은 습관 X → 1~2개만 (ADHD엔 한 번에 많은 거 부담)',
      },
      ],
    source: 'Seinfeld "Don\'t break the chain"; Habit Loop (Duhigg)',
    tags: ['기록', '습관', '시각'],
  },
  {
    id: 'visual-journal',
    title: '글로 못 적을 때 사진·낙서 일기',
    category: 'record',
    summary: 'ADHD 시각형엔 글보다 이미지가 잘 남음.',
    sections: [
      {
        icon: '😔',
        title: '문제',
        body: '글로 일기 쓰는 게 너무 부담 → 매번 포기.\nADHD인 70%가 시각·공간 우세형 — 글보다 이미지에 강함.\n근데 일기 = 글이라는 고정관념 때문에 시도 자체 X.',
      },
      {
        icon: '💡',
        title: '해결',
        body: '글로 안 적어도 OK.\n사진·낙서·만화·다이어그램 다 일기.\nDual Coding Theory: 시각 + 의미 결합이 글만보다 기억 정착 ↑.\n자기에게 맞는 형식이 가장 좋은 일기.',
      },
      {
        icon: '🎯',
        title: '예시',
        body: '• 매일 1장 사진 (인스타 X 본인 폴더) — 그날의 한 장면\n• 낙서·만화로 그날 기분 표현 (스틱맨도 OK)\n• 마인드맵 일기 — 가운데 오늘 / 가지 뻗기\n• 색깔로 기분 표현 (빨강 = 짜증, 파랑 = 평온)\n• 이모티콘 일기 — 5개 이모지로 하루 요약\n• 일기 탭 imageUrl 활용 — 사진 + 한 줄 메모\n• 일주일 모아보면 시각으로 한 주 패턴 보임',
      },
    ],
    source: 'Paivio Dual Coding Theory; visual journaling research',
    tags: ['기록', '시각', '일기'],
  },
  // ── 🎯 시작·집중 (추가 2026-05-02) ──────────────────────
  {
    id: 'hyperfocus-crash',
    title: '하이퍼포커스 끝나고 멍해질 때',
    category: 'start',
    summary: '몇 시간 몰입 후 갑자기 좀비 → 회복 의식 미리.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '한 작업에 5시간 몰입 → 끝난 순간 갑자기 머리 텅 빔.\n물·식사·화장실 다 잊은 채 도파민만 태워서 신체 자원 바닥.\n그 후 1~2일 좀비 모드 → 다음 시작 못 함.\n하이퍼포커스 = 양날의 검.' },
      { icon: '💡', title: '해결', body: '몰입 끝난 직후 회복 의식 자동화.\n신체 (수분·식사·화장실) → 머리 (잠깐 산책) → 마무리 (다음 할 일 메모).\n다음 몰입까지 24시간 회복 시간 인정.\n예방: 90분마다 알람으로 강제 break.' },
      { icon: '🎯', title: '예시', body: '• 90분 알람 (워치·폰) — 무조건 일어나서 물 + 화장실\n• 끝나자마자: 단백질 간식 (계란·요거트) + 물 큰 잔\n• 5분 산책 (도파민 회로 식히기)\n• "다음 할 일" 한 줄만 메모 → 다음 세션 시작점\n• 그날 저녁 일찍 자기 (회복 시간)\n• 다음 날 = 가벼운 일정만 (큰 결정·시작 X)\n• 친구한테 "오늘 좀비야" 양해 (RSD 폭발 예방)' },
    ],
    source: 'Hyperfocus & ADHD recovery research; Hallowell (2005)',
    tags: ['집중', '하이퍼포커스', '회복'],
  },
  {
    id: 'task-transition',
    title: '다음 작업으로 못 옮길 때 전환 의식',
    category: 'start',
    summary: '한 일 끝났는데 다음 시작 못 함 → 작은 의식으로 신호.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: 'A 끝냈는데 B 시작 못 하고 30분 멍.\nADHD는 "작업 전환 (task switching)" 회로가 약함.\n뇌가 "끝남" 상태에서 "시작" 상태로 못 넘어감.\n이 transition gap이 하루 시간 가장 많이 잡아먹는 도둑.' },
      { icon: '💡', title: '해결', body: '전환 의식 (transition ritual) 짧게 만들기.\n"끝남 신호 → 짧은 break → 시작 신호" 패턴.\n매번 의식이 같아야 뇌가 자동화.\n5분 이내, 자극 적은 활동.' },
      { icon: '🎯', title: '예시', body: '• A 끝나면 → 책상 1칸 정리 (끝남 신호)\n• 일어나서 물 한 잔 + 창밖 1분 (전환 break)\n• B 시작 전 → 노트 펼치고 "다음: B" 한 줄 적기 (시작 신호)\n• 음악 바꾸기 — A는 lofi, B는 빗소리\n• 자세 바꾸기 — A 의자, B 스탠딩 데스크\n• 알람으로 "전환 5분" 박스 (그 안에 의식 다 마침)\n• 폰 보면 transition 30분 됨 → 폰 다른 방' },
    ],
    source: 'Rubinstein et al. (2001) Task switching; ADHD coaching practice',
    tags: ['집중', '전환', '실행'],
  },

  {
    id: 'impulse-spending',
    title: '충동 구매 자주 할 때 24시간 + 자동화',
    category: 'record',
    summary: '"지금 사야 돼" ❌ → 위시리스트 + 24시간 후 다시.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: 'ADHD 충동성 + 즉각 보상 회로 = 충동 구매.\n온라인 쇼핑 원클릭 → 며칠 후 후회.\n신용카드·간편결제 = 돈 쓰는 감각 ↓ → 통장 잔고 보면 충격.\n매달 같은 패턴, 의지로 안 고쳐짐.' },
      { icon: '💡', title: '해결', body: '24시간 룰 + 자동화 + 현금화.\n사고 싶은 거 → 위시리스트만 추가, 24시간 후 다시 보기.\n90% 이상은 그때 안 사도 OK 였음 — 도파민이 가라앉음.\n자동 적금·자동 결제로 의지 X.' },
      { icon: '🎯', title: '예시', body: '• 사고 싶음 → 위시리스트·메모에 추가, 카트 비우기\n• 24시간 알람 → 다시 보고 결정\n• 5만원↑ 비싼 거 → 1주일 룰\n• 신용카드 → 체크카드 / 현금만 (지출 감각 ↑)\n• 월급 들어오자마자 자동 적금 → 안 보이게\n• 정기 결제 매달 점검 (안 쓰는 구독 해지)\n• 사기 전 자기말: "1년 후에도 가치 있을까?"\n• 일기 탭 / 덤프 탭에 "사고 싶었던 거" 메모 → 패턴 분석\n• Mint·Toss 같은 가계부 앱 자동 추적' },
    ],
    source: 'CHADD Money Management; Ariely (2012) impulse spending research',
    tags: ['기록', '돈', '충동'],
  },
  // ── 📚 학습 (추가 2026-05-02) ──────────────────────
  {
    id: 'lecture-recording',
    title: '강의 못 따라갈 때 녹음 + 후 검토',
    category: 'study',
    summary: '실시간 필기 강박 ❌ → 녹음 + 핵심 키워드만, 나중에 다시.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '강의 중 필기하다가 흐름 놓침 → 그 다음부터 안 들림.\nADHD 작업 기억 한계 — "듣기 + 쓰기" 동시는 무리.\n다 적으려다 핵심 못 잡고, 또 멍 때리는 시간 길어짐.\n끝나면 노트는 가득한데 머리엔 아무것도 없음.' },
      { icon: '💡', title: '해결', body: '녹음 켜고 듣기에 집중 → 키워드 + 시간 스탬프만 메모.\n나중에 그 시간 부분 다시 들으며 정리.\n"실시간 완벽 필기" 환상 버리기.\n오디오 + 후 정리가 뇌 부담 ↓ + 이해 ↑.' },
      { icon: '🎯', title: '예시', body: '• 강의 시작 = 녹음 앱 ON (Otter, 클로바노트, 폰 기본 녹음)\n• 노트엔: 시간 (12:34) + 키워드 ("디플레이션 정의") 만\n• 모르는 단어·중요해 보이는 그래프도 시간만 적기\n• 강의 끝 24시간 내 — 키워드 옆 부분 1.5배속으로 다시\n• 그때 정식 정리 (Notion·Obsidian)\n• 클로바노트 = 한국어 자동 텍스트 변환 (검색 가능)\n• 단, 녹음은 강사 동의 받기 (대학 보통 OK, 직장은 확인)' },
    ],
    source: 'Cognitive load theory (Sweller); ADHD academic accommodation guides',
    tags: ['학습', '강의', '녹음'],
  },
  {
    id: 'language-srs',
    title: '외국어 단어 안 외워질 때 SRS',
    category: 'study',
    summary: '단어장 100번 ❌ → 잊을 만할 때 다시 = SRS.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '단어장 1~100번 외우고 → 다음 날 다 까먹음.\nADHD는 반복 자극에 빠르게 무뎌짐 — 단어장 같은 거 지루.\n"외운 줄 알았는데" 시험 때 안 나옴 = 망각 곡선.\n전통적 암기법은 ADHD 뇌랑 맞지 않음.' },
      { icon: '💡', title: '해결', body: 'SRS (Spaced Repetition System) — 잊을 만한 타이밍에만 다시.\nAnki·Quizlet·Migaku 같은 앱이 자동 계산.\n매일 10분만, 그 단어가 떠오를 만한 직전에 띄워줌.\n시각 + 예문 + 발음 함께 = dual coding.' },
      { icon: '🎯', title: '예시', body: '• Anki 무료 (Mac/PC/iOS) — ADHD 학습자 표준\n• 카드 앞: 단어 / 뒤: 뜻 + 예문 + 사진 + 발음\n• 매일 10분 알람 — 그 이상 X (지치면 안 함)\n• 자기가 직접 카드 만들기 (만드는 과정에 정착)\n• 1일·3일·1주·2주 간격 = 자동 계산\n• 영상 자막에서 모르는 단어 → 바로 카드화 (Migaku 익스텐션)\n• 게임처럼 — Streak 기록하면 dopamine ↑\n• 출퇴근·줄서기 자투리 시간 = 베스트' },
    ],
    source: 'Ebbinghaus forgetting curve; SuperMemo / Anki research',
    tags: ['학습', '외국어', 'SRS'],
  },
  // ── 💚 감정 (추가 2026-05-02) ──────────────────────
  {
    id: 'decision-paralysis',
    title: '결정 못 내리고 마비될 때 작은 결정부터',
    category: 'mood',
    summary: '큰 결정 앞에서 freeze → 작고 reversible 한 거부터.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '"이직할까 말까", "헤어질까" 같은 큰 결정 → 몇 달 freeze.\nADHD 실행기능 약함 + 완벽주의 = 결정 마비.\n"잘못 결정하면 돌이킬 수 없다" 두려움 → 결정 자체 회피.\n결국 시간이 결정 — 더 나쁜 결과.' },
      { icon: '💡', title: '해결', body: '큰 결정을 작고 reversible (되돌릴 수 있는) 단위로 쪼개기.\n"이직" → "이력서 1줄 업데이트" → "1군데 지원" → ...\n각 단계는 언제든 멈출 수 있음 — 부담 ↓.\n움직이면서 정보 수집 → 결정이 자연스럽게 됨.' },
      { icon: '🎯', title: '예시', body: '• 큰 결정 = 종이에 적기 → 첫 작은 행동 1개만 동그라미\n• "이직" → "링크드인 프로필 사진만 갱신"\n• "헤어짐" → "내 감정 일기 1주일만 기록"\n• "이사" → "원하는 동네 지도 보기 30분"\n• 결정 못 하겠으면 = 일주일 deadline 정함, 그때까지 정보만 수집\n• 동전 던지기 — 결과 보고 안도 / 실망 = 진짜 마음\n• 친구·코치한테 "결정 안 해도 OK" 허락 받기\n• 잠 잘 자고 다시 — 회복된 뇌가 더 잘 결정' },
    ],
    source: 'Bezos "two-way door" decisions; Ariely behavioral econ; ADHD coaching',
    tags: ['감정', '결정', '실행'],
  },
  {
    id: 'loneliness-weak-tie',
    title: '외로움 짓눌릴 때 약한 연결도 OK',
    category: 'mood',
    summary: '"진짜 친구" 강박 ❌ → 카페 직원·동네 산책 마주침도 약.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: 'ADHD 자주 친구 멀어짐 (연락 까먹음) + RSD = 만성 외로움.\n"깊은 진짜 친구" 만 의미 있다는 강박 → 약한 연결 무시.\n외로움 → 더 고립 → 더 외로움 악순환.\n혼자 방에서 폰만 = 우울·불안 ↑.' },
      { icon: '💡', title: '해결', body: '약한 연결 (weak ties) = 사회적 영양제로 인정.\n사람과 살짝 마주치는 것만으로도 옥시토신 ↑.\n매일 1번 사람 얼굴 보기 (편의점·카페·산책).\n온라인 친구·커뮤니티도 약한 연결 — 가치 있음.' },
      { icon: '🎯', title: '예시', body: '• 매일 1번 외출 — 카페·편의점·동네 산책 (말 안 해도 됨)\n• 단골 가게 만들기 (카페·빵집) — 자연스럽게 인사\n• 도서관·공부 카페 = 침묵의 동행 (body doubling)\n• ADHD 단톡방·디스코드 — 같은 결의 약한 연결\n• 헬스장 PT — 주 1회 안정적 사람 접촉\n• 반려동물 산책 — 동물 친구들도 만남\n• 친구한테 "잘 지내?" 한 줄 — 답 기대 X 그냥 던지기\n• 화상 통화 — 부담 적은 거리 (얼굴 + 안전 거리)' },
    ],
    source: 'Granovetter (1973) Strength of weak ties; Sandstrom & Dunn (2014) social interaction',
    tags: ['감정', '외로움', '연결'],
  },
  // ── 📝 기록 (추가 2026-05-02) ──────────────────────
  {
    id: 'auto-shopping-list',
    title: '장보기·집안일 자꾸 까먹을 때 자동 리스트',
    category: 'record',
    summary: '"필요할 때 살 거" ❌ → 떨어지는 순간 즉시 추가, 한 번에 구매.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '마트 갔는데 사야 할 거 다 까먹음 → 또 가야 함.\n집에서 떨어진 거 보면 "사야 돼" → 까먹음 → 며칠 불편.\nADHD 작업 기억 약함 — "그때 사야지" 안 됨.\n결국 같은 거 두 번 사거나, 필요한 거 못 사거나.' },
      { icon: '💡', title: '해결', body: '떨어지는 순간 즉시 폰에 추가 (1초 내).\n공유 리스트 = 가족·룸메이트도 추가 가능.\n주 1회 정해진 시간에 한 번에 장보기.\n핵심: "사야 돼" 생각 → 즉시 폰 → 손에서 떼면 잊음.' },
      { icon: '🎯', title: '예시', body: '• Apple 미리알림·Google Keep "장보기" 리스트 — 홈 화면 위젯\n• 떨어짐 = 그 자리에서 추가 (3초 룰)\n• 음성 — Siri "장보기에 우유 추가"\n• 가족 공유 리스트 = 룸메이트도 즉시 추가\n• 마트 도착 = 리스트만 보고 카트\n• 자주 사는 거 (휴지·세제) = 정기 배송 자동화\n• 약·렌즈·영양제 = 한 달 전 알람\n• 냉장고 문 안쪽에 종이 + 펜 (디지털 안 맞으면)' },
    ],
    source: 'GTD (Getting Things Done) capture; ADHD executive function support',
    tags: ['기록', '장보기', '자동화'],
  },
  {
    id: 'password-vault',
    title: '비밀번호 매번 새로 만들 때 vault',
    category: 'record',
    summary: '"같은 비번" ❌ → 패스워드 매니저 = 한 번만 외우기.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '비밀번호 까먹어서 매번 "비번 찾기" — 시간 낭비.\nADHD = 모든 사이트에 같은 비번 (보안 취약) or 매번 새로 (혼란).\n2단계 인증 + OTP 까먹으면 계정 영구 잠김.\n인증 화면에서 freeze → 그 일 자체 포기.' },
      { icon: '💡', title: '해결', body: '패스워드 매니저 = 1개 마스터 비번만 외움.\n나머지 자동 생성·자동 채우기.\n2FA 백업 코드는 매니저에 저장.\n핵심: 인증 마찰 ↓ = 행동 마찰 ↓.' },
      { icon: '🎯', title: '예시', body: '• 1Password·Bitwarden·iCloud Keychain (애플 무료)\n• 마스터 비번 = 외울 수 있는 긴 문장 (예: "내고양이는치즈좋아해2024!")\n• 신규 가입 = 매니저가 24자 랜덤 자동 생성\n• 자동 채우기 (브라우저·앱) = 클릭 1번\n• 2FA 코드도 매니저 안에 저장 (Authy도 OK)\n• 백업 코드 = 매니저 + 종이 1부 (집 어딘가)\n• 가족 공유 vault = 넷플릭스·와이파이 비번\n• 무료 시작 = Bitwarden / 애플 사용자 = iCloud Keychain' },
    ],
    source: 'NIST password guidelines; cybersecurity for ADHD productivity',
    tags: ['기록', '비밀번호', '디지털'],
  },
  // ── 👥 관계 (추가 2026-05-02) ──────────────────────
  {
    id: 'family-adhd-edu',
    title: '가족이 ADHD 이해 못 할 때 함께 읽을 자료',
    category: 'social',
    summary: '"의지 부족" 비난 → 영상·책으로 외부 권위 빌리기.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '부모·배우자: "그냥 노력하면 되잖아", "다들 그래".\nADHD 설명해도 "변명"으로 들음 → 더 외로움.\n자기가 설명하면 = 변명, 권위자가 설명하면 = 정보.\n관계 갈등의 핵심 원인.' },
      { icon: '💡', title: '해결', body: '가족과 함께 볼 영상·책 = 외부 권위 빌리기.\n자기 입으로 설명 X → 같이 보고 대화.\n짧은 영상 (10분 내) 부터 — 책은 너무 부담.\n핵심: "이게 나야" 보다 "이게 ADHD야" 가 받아들이기 쉬움.' },
      { icon: '🎯', title: '예시', body: '• 유튜브 "How to ADHD" (영문, 자막) — 친절한 설명\n• 닥터 라이언 햄튼·정우열 정신과 의사 채널 (한글)\n• 책: 산만한 가족, 흔들리는 가족 (Hallowell)\n• "ADHD 2.0" (Hallowell & Ratey 2021)\n• 진료 동행 — 의사가 직접 설명 = 신뢰 ↑\n• 짧은 인스타 카드뉴스부터 (부담 ↓)\n• "이거 보고 같이 얘기해보자" 톤 — 강요 X\n• 한 번에 다 X — 한 달 1개씩 천천히' },
    ],
    source: 'Hallowell & Ratey (2021) ADHD 2.0; family psychoeducation research',
    tags: ['관계', '가족', '교육'],
  },
  {
    id: 'work-prearrange',
    title: '직장에서 평가 두려울 때 사전 합의',
    category: 'social',
    summary: '"잘하고 있나" 추측 ❌ → 매주 짧은 1:1 + 명문화.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: 'RSD + ADHD = 상사 표정 1초만 봐도 "나 망함" 추측.\n평가 시즌까지 6개월 ↑ 추측 → 만성 불안.\n불안 → 회피 → 보고 늦어짐 → 진짜 평가 ↓ 악순환.\n"나만 모르는 평가 기준" 공포가 가장 큼.' },
      { icon: '💡', title: '해결', body: '주 1회 짧은 1:1 (15분) 정기 — 추측 시간 ↓.\n시작 때 평가 기준 명문화 요청 ("어떤 게 잘하는 거예요?").\n분기별로 "지금 어디쯤이에요?" 직접 물어보기.\n글로 받기 — 말은 곡해 가능, 글은 다시 볼 수 있음.' },
      { icon: '🎯', title: '예시', body: '• 매주 금요일 15분 1:1 — 짧고 자주\n• 시작 때 노션·구글닥에 "이번 주 한 일 / 막힌 거 / 다음 주" 미리 적기\n• 분기 1번 "현재 평가 어떤 위치?" 직접 물기 (어렵지만 효과 ↑)\n• 큰 프로젝트 시작 = "성공의 모습" 합의 + 글로 남김\n• 메일·슬랙으로 마무리 — 구두 합의는 글로 다시\n• ADHD 공개 여부는 회사 문화 보고 — 안 해도 OK\n• 합의 사항 자기 노션에 따로 백업 (1년 후 보면 진보 보임)\n• 평가 시즌 직전 = 1:1에서 "놀랄 일 없는지" 확인' },
    ],
    source: 'Manager Tools 1:1 framework; ADHD workplace accommodation research',
    tags: ['관계', '직장', '평가'],
  },
  // ── 💊 약 (추가 2026-05-02) ──────────────────────
  {
    id: 'med-alcohol',
    title: '약과 술 같이 마실까 고민될 때',
    category: 'body',
    summary: '자극제 + 술 = 심혈관 부담, 항우울제 + 술 = 효과 ↓.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '회식·술자리 못 거절 → 약 먹은 날 술 마심.\n자극제 (콘서타·메디키넷) + 술 = 술기운 덜 느껴짐 → 과음 위험.\n항우울제 (SSRI) + 술 = 다음 날 우울감 ↑.\n약 안 먹고 마시면 다음 날 재시작 어려움.' },
      { icon: '💡', title: '해결', body: '주치의와 자기 약 조합별 가이드 받기 (개인차 큼).\n일반 원칙: 자극제 + 술은 양 줄이고 천천히.\n약 + 술 같은 날 = 그날 약은 평소보다 일찍 (저녁엔 효과 빠짐).\n안 마실 환경 만들기가 더 쉬움 (협상 X).' },
      { icon: '🎯', title: '예시', body: '• 자극제 복용일 음주: 평소 양의 1/2, 천천히, 물 같이\n• 자극제 효과 도는 동안 (보통 6~10시간) = 술기운 마스킹 위험\n• SSRI·아빌리파이 + 술 = 다음 날 우울 ↑ → 평소 잘 알아두기\n• 술자리 알면: 그날 아침에 의사한테 문자 (체질에 맞는 가이드)\n• 회식 거절 멘트 미리: "약 때문에 오늘은 무알콜로요"\n• 무알콜 맥주·콤부차 = 사회적 분위기는 유지\n• 술 마신 다음 날 약 복용은 평소대로 (단 식사 후)\n• 단, 이건 일반 가이드 — 본인 약 조합은 반드시 의사와' },
    ],
    source: 'NIH NIAAA medication-alcohol interactions; Korean ADHD treatment guidelines',
    tags: ['약', '술', '안전'],
  },
  {
    id: 'med-supplements',
    title: '보충제 의논할 때 (마그네슘·오메가3)',
    category: 'body',
    summary: '인터넷 보고 X → 의사와 논의, 일부는 보조 효과 근거 있음.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '"마그네슘 ADHD에 좋다" SNS 보고 무작정 복용.\n보충제도 약과 상호작용 — 자극제 흡수 방해 가능.\n과량 복용 → 부작용 (마그네슘 과다 = 설사, 철분 과다 = 변비).\n돈만 쓰고 효과 없는 경우도 많음.' },
      { icon: '💡', title: '해결', body: '의사·약사와 의논 후 시작. 혈액 검사로 결핍 먼저 확인.\n근거 어느 정도 있는 것: 오메가3 (DHA/EPA), 마그네슘 (결핍 시), 철·아연 (결핍 시).\n근거 약함: 비타민D 단독 (전반적 건강엔 OK), 멀티비타민.\n복용 타이밍 — 자극제와 1시간 이상 띄우기 (흡수 방해 방지).' },
      { icon: '🎯', title: '예시', body: '• 시작 전 — 혈액 검사 (페리틴·마그네슘·비타민D·B12) → 결핍만 보충\n• 오메가3 = EPA + DHA 합쳐서 일 1g~ (식사 후) — 가장 근거 ↑\n• 마그네슘 글리시네이트 = 저녁, 잠 도움 — 시트레이트는 설사 가능\n• 철 = 페리틴 < 50 일 때만, 비타민C 같이 (흡수 ↑)\n• 비타민D = 한국 결핍 흔함, 겨울 1000~2000IU\n• 자극제 (콘서타) 와 비타민C·과일주스 = 1시간 띄우기 (흡수 방해)\n• 카페인·녹차 = 철·아연 흡수 방해 → 식사와 30분 띄우기\n• 효과 모호하면 = 3개월 시도 후 끊어보고 차이 비교' },
    ],
    source: 'Bloch & Qawasmi (2011) Omega-3 ADHD meta; Cochrane micronutrients ADHD',
    tags: ['약', '보충제', '영양'],
  },
  // ── 🌙 수면 (추가 2026-05-02) ──────────────────────
  {
    id: 'power-nap',
    title: '오후 졸음 때 power nap 정확히',
    category: 'sleep',
    summary: '20분 ↓ 알람 → 인지 회복, 30분 ↑ → 수면 관성 (역효과).',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '점심 후 2~3시 졸음 폭발 → 책상에서 30~60분 잠.\n깨면 더 멍, 머리 무거움 → 그 뒤 일 X = "수면 관성".\nADHD 약 효과 떨어지는 시간대 + 식후 = 졸음 최강.\n결국 그날 일 망치고 밤에 또 못 잠 → 악순환.' },
      { icon: '💡', title: '해결', body: 'Power nap = 정확히 10~20분, 깊은 잠 들어가기 전에 깨기.\n타이머 25분 (눕는 시간 5분 + 잠 20분) — 그 이상 X.\n앉은 자세 / 차에서 = 너무 깊이 안 빠짐.\n카페인 직전 마시고 자면 (caffeine nap) = 깰 때 카페인 효과 ↑.' },
      { icon: '🎯', title: '예시', body: '• 알람 정확히 20분 — 더 자고 싶어도 무조건 일어나기\n• 자세: 의자 기대거나 차 안 — 침대 X (너무 깊이 잠)\n• 안대 + 이어플러그 = 빠른 입면\n• Caffeine nap: 에스프레소 1샷 → 즉시 누움 → 20분 후 카페인 도착\n• 오후 3시 이전에만 — 늦으면 밤 수면 영향\n• 약 효과 떨어지는 시간 (콘서타 = 6~8시간 후) 직전 nap = 베스트\n• "잠 안 옴" → 그냥 눈 감고 쉬는 것도 회복 효과\n• 매일 같은 시간 = 몸이 자동 휴식 모드 진입' },
    ],
    source: 'Brooks & Lack (2006) brief nap study; NASA pilot nap research',
    tags: ['수면', '낮잠', '회복'],
  },
  {
    id: 'sleep-apnea-suspect',
    title: '코골이·수면무호흡 의심될 때',
    category: 'sleep',
    summary: '8시간 자도 피곤 = 수면 무호흡 의심, ADHD 증상 닮음.',
    addedAt: '2026-05-02',
    sections: [
      { icon: '😔', title: '문제', body: '8시간 잤는데 아침 두통 + 종일 졸림 + 집중 안 됨.\n파트너가 "코 자주 골고 숨 멈출 때 있어" 라고 함.\n수면 무호흡 = ADHD 증상과 똑같이 보임 (집중 ↓, 충동, 피로).\n많은 ADHD 진단 받은 사람이 사실 무호흡 동반 — 둘 다 치료해야.' },
      { icon: '💡', title: '해결', body: '의심되면 수면다원검사 (PSG) — 종합병원·수면 클리닉.\n간이 검사 (홈 슬립 테스트) = 1~2박, 비교적 부담 ↓.\n진단되면 CPAP·구강 장치·체중 감량으로 극적 개선.\n자기 수면 녹음 앱 = 1차 스크리닝.' },
      { icon: '🎯', title: '예시', body: '• 1차 자가 진단: 자기 수면 녹음 앱 (SnoreLab, ShutEye)\n• 코고는 소리 + 숨 멈춘 구간 시각화 = 의사한테 보여주기\n• Epworth 졸음 척도 = 10점 ↑ 이면 무호흡 의심 ↑\n• 수면 클리닉·이비인후과·신경과 → 검사 받기\n• 홈 검사 (Watch-PAT) = 집에서 1박 — 보험 적용 가능\n• PSG (수면다원검사) = 1박 입원, 가장 정확\n• 진단 = AHI (시간당 무호흡 횟수) 5↑ 면 경증\n• 치료 후 ADHD 약 용량 줄어드는 경우 많음 (둘이 겹친 거)\n• 체중 + 옆으로 자기 + 알코올 줄이기 = 자가 관리 보조' },
    ],
    source: 'Youssef et al. (2011) OSA & ADHD overlap; AASM sleep apnea guidelines',
    tags: ['수면', '무호흡', '검사'],
  },
]

export function getCategoryTips(category: TipCategory): AdhdTip[] {
  // Newest (with addedAt) first; legacy tips without addedAt keep their
  // original order at the bottom.
  return ADHD_TIPS.filter((t) => t.category === category).sort((a, b) => {
    if (a.addedAt && b.addedAt) return b.addedAt.localeCompare(a.addedAt)
    if (a.addedAt) return -1
    if (b.addedAt) return 1
    return 0
  })
}

const NEW_BADGE_DAYS = 7

export function isTipNew(tip: AdhdTip): boolean {
  if (!tip.addedAt) return false
  const ts = Date.parse(tip.addedAt + 'T00:00:00Z')
  if (!Number.isFinite(ts)) return false
  return Date.now() - ts < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000
}

export function getTip(id: string): AdhdTip | undefined {
  return ADHD_TIPS.find((t) => t.id === id)
}
