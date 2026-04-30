import { useBackClose } from '../../hooks/useBackClose'

interface Props {
  onClose: () => void
}

export function AdhdGuideModal({ onClose }: Props) {
  useBackClose(true, onClose)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 9200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,.15)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--pd)' }}>📖 ADHD 친화 사용법</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
        </div>

        <Section title="🧠 왜 ADHD엔 평범한 계획앱이 안 맞나">
          <Bullet>시간맹 (Barkley 1997) — 시간 추정 정확도 ~50% 이하. 계획 짜도 어차피 빗나감</Bullet>
          <Bullet>미래자기 괴리 (Hershfield 2011) — 미래의 나를 타인처럼 인식. 1주일 뒤 일정이 안 와닿음</Bullet>
          <Bullet>결정 피로 — 블록 하나에 시간/길이/카테고리 결정 N개 → 시작도 전에 지침</Bullet>
          <Bullet>양극 컨디션 — 같은 일이 어떤 날 10분, 어떤 날 4시간. 고정 시간 자체가 거짓말 같음</Bullet>
        </Section>

        <Section title="📅 일간 (타임라인) — 외부에서 강제된 시간만">
          <Hint>회의, 강의, 약속, 출퇴근, 약 먹는 시간만 등록</Hint>
          <Bullet>"오후에 운동" 같은 자율 시간은 X — 어차피 그 시간에 시작 안 함</Bullet>
          <Bullet>비어있어도 OK. 비어있는 게 정상</Bullet>
          <Note>근거: Implementation Intentions (Gollwitzer 1999) — "X 시간에 Y" 구조는 외부 트리거(회의 등)에서만 효과 있음</Note>
        </Section>

        <Section title="🎯 목표 챌린지 — 시간 X, 양만 추적">
          <Hint>"운동 12회 / 1주", "독서 140p / 1주" 같은 양/횟수 목표</Hint>
          <Bullet>시간 안 정해도 됨 — 행동했을 때 [내가 해냄 +N] 한 번 누르면 끝</Bullet>
          <Bullet>1주 단위 (Barkley의 ADHD 시간 horizon에 맞춤)</Bullet>
          <Bullet>망한 날 있어도 streak 유지 (자기 비교)</Bullet>
          <Note>근거: Goal Setting Theory (Locke) — 구체적·근접한 목표 + 진척 시각화 효과 입증</Note>
        </Section>

        <Section title={'🪣 드롭 — 시간 없이 "오늘/이번주 할 일"'}>
          <Hint>답장 보내기, 영수증 정리, 청소 같은 단발 todo</Hint>
          <Bullet>완료 체크만 — 시간 X, 양 추적 X</Bullet>
          <Bullet>잡생각 메모도 OK (later 처리)</Bullet>
        </Section>

        <Section title="🌱 습관 — 매일 반복할 작은 행동">
          <Hint>약 먹기, 물 1L, 명상 5분 같은 anchor</Hint>
          <Bullet>매일 같은 일이라 결정 부담 X</Bullet>
          <Bullet>이미 하는 일 (양치, 점심 등)에 끼워 넣기 = 정착 잘 됨</Bullet>
          <Note>근거: Habit Stacking (Wood &amp; Neal 2007) — 기존 행동에 anchor한 습관이 retention 3배</Note>
        </Section>

        <Section title="💊 메디 — 약 + 컨디션 트래킹">
          <Hint>아침/점심/저녁 약 시간 + 복용 후 효과 추적</Hint>
          <Bullet>약 효과 패턴 학습 → 자기 약발 시간 인지</Bullet>
          <Bullet>수면시간 + PMS도 같이 → 컨디션 변동 원인 추적</Bullet>
        </Section>

        <Section title="🎁 시도해볼 만한 흐름">
          <Bullet><b>1.</b> 타임라인엔 "내일 회의 3시" 같은 고정 약속만 등록</Bullet>
          <Bullet><b>2.</b> "내일 책 140p" → 챌린지 보드에 등록</Bullet>
          <Bullet><b>3.</b> "친구 답장" → 드롭에 등록</Bullet>
          <Bullet><b>4.</b> "약 먹기" → 메디 또는 습관에</Bullet>
          <Bullet><b>5.</b> 그 외 일정 짜는 시도 → 안 함. 비어있어도 OK</Bullet>
        </Section>

        <Section title="🛡 자기 비난 차단">
          <Bullet>망한 날에도 streak 유지 — 자기 비교만 (Tesser 1988)</Bullet>
          <Bullet>완벽 X, 1점이라도 진전 (Self-compassion, Neff &amp; Vonk 2009)</Bullet>
          <Bullet>"오늘 망함" 인정 → 내일 다시 시작 (학습된 무력감 차단)</Bullet>
        </Section>

        <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', padding: '12px 0 4px', borderTop: '1px solid var(--pl)', marginTop: 12 }}>
          이 가이드는 의료 조언이 아니야. 일반화된 ADHD 신경학 + 행동심리 연구 기반의 사용 권장사항이지 모든 사람한테 맞는 건 아님 ❤️
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingLeft: 14, position: 'relative', marginBottom: 4 }}>
      <span style={{ position: 'absolute', left: 0, color: 'var(--pink)' }}>•</span>
      {children}
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--pl)', borderRadius: 8, padding: '6px 10px', marginBottom: 6, fontSize: 12, color: 'var(--pd)', fontWeight: 600 }}>
      💡 {children}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic', marginTop: 4 }}>{children}</div>
  )
}
