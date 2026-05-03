// 12-spoke 톱니바퀴 — 일간 / 그룹 / 메디 등 개별 탭 설정 진입 아이콘 통일.
// currentColor 사용 → 부모의 color 로 색이 결정됨 (테마톤 진한 색 적용용).
interface Props { size?: number; strokeWidth?: number }

export function GearIcon({ size = 16, strokeWidth = 2 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      {/* 12 spokes — 30° apart */}
      <line x1="12" y1="2"     x2="12"    y2="4.4" />
      <line x1="17"   y1="3.34"  x2="15.8"  y2="5.42" />
      <line x1="20.66" y1="7"    x2="18.58" y2="8.2" />
      <line x1="22"   y1="12"   x2="19.6"  y2="12" />
      <line x1="20.66" y1="17"   x2="18.58" y2="15.8" />
      <line x1="17"   y1="20.66" x2="15.8"  y2="18.58" />
      <line x1="12"   y1="22"   x2="12"    y2="19.6" />
      <line x1="7"    y1="20.66" x2="8.2"   y2="18.58" />
      <line x1="3.34"  y1="17"   x2="5.42"  y2="15.8" />
      <line x1="2"    y1="12"   x2="4.4"   y2="12" />
      <line x1="3.34"  y1="7"    x2="5.42"  y2="8.2" />
      <line x1="7"    y1="3.34"  x2="8.2"   y2="5.42" />
    </svg>
  )
}
