// Round flat-design profile icons for each team room. Each icon is a
// hand-drawn SVG that re-tints itself based on the team color so all 4
// teams feel like a coherent set with their own theme tone.
import { getTeamMeta, type TeamId } from '../../lib/teamCheckin'

interface Props {
  teamId: TeamId
  size?: number
}

export function TeamAvatar({ teamId, size = 56 }: Props) {
  const meta = getTeamMeta(teamId)
  const c = meta.color
  // Soft pad bg = mid-tone between team color and white.
  const pad = `color-mix(in srgb, ${c} 16%, #fff)`
  const padDark = `color-mix(in srgb, ${c} 24%, #fff)`
  const iconBox = Math.round(size * 0.62)

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: pad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `inset 0 -2px 4px ${padDark}, 0 1px 3px rgba(0,0,0,.06)`,
      flexShrink: 0,
    }}>
      <svg
        width={iconBox}
        height={iconBox}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        {iconFor(teamId, c)}
      </svg>
    </div>
  )
}

// Icon paths — drawn at viewBox 32x32, single accent color `c`.
// Designed to read at 35-45px rendered size on the card.
function iconFor(teamId: TeamId, c: string) {
  switch (teamId) {
    case 'job':
      // 취준생: 서류가방 — 면접·취직 활동 상징, 깔끔한 단일 오브젝트
      return (
        <g>
          {/* handle */}
          <path d="M12 9 V7 a2 2 0 0 1 2 -2 h4 a2 2 0 0 1 2 2 V9"
                stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* body */}
          <rect x="5" y="9" width="22" height="17" rx="2.5"
                fill={c} fillOpacity="0.22" stroke={c} strokeWidth="2" />
          {/* horizontal seam */}
          <line x1="5" y1="15" x2="27" y2="15" stroke={c} strokeWidth="1.8" />
          {/* lock catch */}
          <rect x="13.5" y="14" width="5" height="3" rx="0.6" fill={c} />
        </g>
      )

    case 'college':
      // 대학생: 졸업 모자 + 술 (viewBox 더 채워서 키움)
      return (
        <g>
          <polygon points="16,3 30,9 16,15 2,9" fill={c} />
          <path d="M5 11 L5 20 Q16 25 27 20 L27 11"
                stroke={c} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
          <line x1="29" y1="10" x2="29" y2="25" stroke={c} strokeWidth="2" strokeLinecap="round" />
          <circle cx="29" cy="27" r="2.2" fill={c} />
        </g>
      )

    case 'student':
      // 수험생: 책 더미 + 펜 위
      return (
        <g>
          <rect x="4" y="20" width="24" height="6" rx="1" fill={c} />
          <rect x="6" y="14" width="20" height="6" rx="1" fill={c} fillOpacity="0.7" />
          <rect x="8" y="8" width="16" height="6" rx="1" fill={c} fillOpacity="0.5" />
          <line x1="10" y1="11" x2="22" y2="11" stroke="#fff" strokeWidth="0.9" strokeOpacity="0.8" />
          <line x1="10" y1="17" x2="22" y2="17" stroke="#fff" strokeWidth="0.9" strokeOpacity="0.8" />
          <line x1="10" y1="23" x2="22" y2="23" stroke="#fff" strokeWidth="0.9" strokeOpacity="0.8" />
          {/* pen on top */}
          <g transform="rotate(-22 16 7)">
            <rect x="11" y="5" width="10" height="2.4" fill={c} />
            <polygon points="21,5 23,6.2 21,7.4" fill={c} />
          </g>
        </g>
      )

    case 'athlete':
      // 운동인: 케틀벨 + 덤벨 (viewBox 더 채워서 키움)
      return (
        <g>
          {/* handle bar (top) */}
          <rect x="11" y="3" width="10" height="2.5" rx="1" fill={c} fillOpacity="0.7" />
          {/* kettlebell body */}
          <path d="M10 5 Q10 3 12 3 L20 3 Q22 3 22 5 L22 6 Q27 8 27 14 Q27 22 16 22 Q5 22 5 14 Q5 8 10 6 Z"
                fill={c} />
          <ellipse cx="16" cy="12" rx="6" ry="2" fill="#fff" fillOpacity="0.16" />
          {/* dumbbell tilt across bottom */}
          <g transform="translate(4 26) rotate(-10)">
            <rect x="0" y="1.5" width="20" height="3" rx="1" fill={c} />
            <rect x="-2" y="0" width="3" height="6" rx="1" fill={c} />
            <rect x="19" y="0" width="3" height="6" rx="1" fill={c} />
          </g>
        </g>
      )
  }
}
