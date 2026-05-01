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

        {/* Quick start — 한 눈에 보는 흐름 */}
        <div style={{ background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 50%, #fff))', borderRadius: 12, padding: 14, marginBottom: 16, border: '1.5px solid var(--pink)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>⚡ 5초 가이드</div>
          <div style={{ fontSize: 12, color: '#444', lineHeight: 1.7 }}>
            <div>📅 <b>일간</b>: 회의·약속 같은 <b>고정된 시간</b>만</div>
            <div>🎯 <b>목표</b>: "운동 12회 / 1주" 같은 <b>양</b></div>
            <div>🪣 <b>드롭</b>: <b>단발</b> 할 일</div>
            <div>🌱 <b>습관</b>: <b>매일 반복</b> 작은 거</div>
          </div>
        </div>

        {/* Mini cards — 핵심만 */}
        <Card emoji="🧠" title="ADHD 뇌는 평범한 계획앱이 안 맞아">
          시간맹 + 결정 피로 + 미래자기 괴리 → 일정 짜는 것 자체가 부담.
          그래서 이 앱은 <b>안 짜도 되게</b> 만들어졌어
        </Card>

        <Card emoji="📅" title="일간 — 외부 강제만">
          회의·강의·약속·약 시간만. <b>비어있어도 정상</b>이야
        </Card>

        <Card emoji="🎯" title="목표 챌린지 — 양만 추적">
          "운동 12회"처럼 양/횟수 정해두고 행동할 때 +N 누르기.
          시간 안 정해도 되고, 망한 날에도 streak 안 깨짐
        </Card>

        <Card emoji="🪣" title="드롭 — 시간 없는 잡일">
          답장, 정리, 청소같이 시간 안 정하는 단발 todo
        </Card>

        <Card emoji="🌱" title="습관 — 매일 작은 anchor">
          약·물·명상 같은 거. 이미 하는 일에 끼워 넣기 = 잘 정착됨
        </Card>

        <Card emoji="💊" title="메디 — 약 + 컨디션">
          약 효과 시간 + 수면 + PMS 다 같이 추적. 자기 패턴 인지 도움
        </Card>

        {/* Concrete try */}
        <div style={{ background: 'var(--pl)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>🎁 오늘 한번 시도해봐</div>
          <div style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>
            <div>1. 일간엔 <b>고정 약속만</b> 등록</div>
            <div>2. "내일 책 140p" → <b>챌린지</b></div>
            <div>3. "친구 답장" → <b>드롭</b></div>
            <div>4. "약 먹기" → <b>메디</b></div>
            <div>5. 그 외엔 <b>안 짜도 OK</b></div>
          </div>
        </div>

        <Card emoji="🛡" title="망한 날에도 self-compassion">
          미루는 거에 자기비난 더하면 더 미룸.
          "미뤘네" → "다음 5분만 해보자" 로 전환 (Sirois 2014: 자기친절 = 미루기 50%↓)
        </Card>

        {/* Optional details */}
        <details style={{ marginBottom: 12, background: '#FAFAFA', borderRadius: 10, padding: 10 }}>
          <summary style={{ fontSize: 11, fontWeight: 700, color: '#666', cursor: 'pointer', userSelect: 'none' }}>📚 과학 근거 (펼치기)</summary>
          <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8, marginTop: 8 }}>
            <div>• 시간맹 — Barkley 1997: ADHD 시간 추정 정확도 ~50%</div>
            <div>• 미래자기 괴리 — Hershfield 2011: 미래자기를 타인 영역으로 처리</div>
            <div>• 짧은 사이클 — Schultz 도파민 연구: ADHD에 long-delay 보상 효과 ↓</div>
            <div>• 정체성 기반 — Wood &amp; Neal 2007: 정체성 변화가 행동 변화보다 retention 3배</div>
            <div>• Implementation Intentions — Gollwitzer 1999: 외부 트리거 + if-then 효과크기 d=0.65</div>
            <div>• 자기비교 — Tesser 1988: 과거 자기 비교는 자존감↑, 타인 비교는 ↓</div>
            <div>• 자기친절 — Neff &amp; Vonk 2009 / Sirois 2014: 정신건강·미루기 둘 다 개선</div>
            <div>• Habit Stacking — Wood &amp; Neal: 기존 행동 anchor가 새 습관 정착 3배 빠름</div>
          </div>
        </details>

        <div style={{ fontSize: 9, color: '#bbb', textAlign: 'center', padding: '8px 0 4px' }}>
          의료 조언 X · 일반화된 ADHD 신경학 + 행동심리 연구 기반 ❤️
        </div>
      </div>
    </div>
  )
}

function Card({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 4 }}>
        {emoji} {title}
      </div>
      <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}
