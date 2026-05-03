// Fullscreen permanent-ban lock. Banned uids see this and can't access
// any app functionality.
import type { BanRecord } from '../../lib/banList'

interface Props {
  ban: BanRecord
}

export function BanScreen({ ban }: Props) {
  const date = new Date(ban.ts).toLocaleString('ko-KR')
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #2C1F2A, #1A1219)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', padding: 24, textAlign: 'center', userSelect: 'none',
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>이용 영구 정지</div>
      <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6, maxWidth: 360, marginBottom: 20 }}>
        커뮤니티 가이드라인 위반으로 이 계정의 FocusFlow 사용이 영구 정지됐습니다.
      </div>
      <div style={{
        background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: 16,
        maxWidth: 360, width: '100%', textAlign: 'left',
        fontSize: 12, lineHeight: 1.7,
      }}>
        <div style={{ opacity: 0.6, marginBottom: 4, fontWeight: 700 }}>사유</div>
        <div style={{ marginBottom: 12 }}>{ban.reason || '커뮤니티 가이드라인 위반'}</div>
        <div style={{ opacity: 0.6, marginBottom: 4, fontWeight: 700 }}>처리 시각</div>
        <div>{date}</div>
      </div>
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 24, lineHeight: 1.6 }}>
        문의: atheist2197@gmail.com
      </div>
    </div>
  )
}
