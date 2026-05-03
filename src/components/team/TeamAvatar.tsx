// Round flat-design profile icons for each team room. Each icon is a
// hand-drawn SVG that re-tints itself based on the team color so all 4
// teams feel like a coherent set with their own theme tone.
import { TEAMS, type TeamId } from '../../lib/teamCheckin'

interface Props {
  teamId: TeamId
  size?: number
}

export function TeamAvatar({ teamId, size = 56 }: Props) {
  const meta = TEAMS.find((t) => t.id === teamId) ?? TEAMS[0]
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
      // 자소서: 종이 + 연필
      return (
        <g>
          <rect x="6" y="5" width="14" height="20" rx="2"
                fill={c} fillOpacity="0.22" stroke={c} strokeWidth="1.6" />
          <line x1="9" y1="11" x2="17" y2="11" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="9" y1="15" x2="17" y2="15" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="9" y1="19" x2="14" y2="19" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
          {/* pencil tilted */}
          <g transform="rotate(40 23 18)">
            <rect x="20.5" y="11" width="3" height="11" fill={c} />
            <polygon points="20.5,22 23.5,22 22,25" fill={c} />
            <rect x="20.5" y="9" width="3" height="2" fill={c} fillOpacity="0.6" />
          </g>
        </g>
      )

    case 'college':
      // 대학생: 졸업 모자 + 술
      return (
        <g>
          <polygon points="16,6 28,11 16,16 4,11" fill={c} />
          <path d="M8 13 L8 19 Q16 22 24 19 L24 13"
                stroke={c} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
          <line x1="27" y1="12" x2="27" y2="20" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="27" cy="22" r="1.6" fill={c} />
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
      // 운동인: 케틀벨 + 덤벨
      return (
        <g>
          {/* kettlebell */}
          <path d="M11 7 Q11 5 13 5 L15 5 Q17 5 17 7 Q21 9 21 14 Q21 19 14 19 Q7 19 7 14 Q7 9 11 7 Z"
                fill={c} />
          <rect x="11" y="7" width="6" height="2" fill={c} fillOpacity="0.55" />
          {/* dumbbell */}
          <g transform="translate(14 22)">
            <rect x="0" y="2" width="12" height="3" rx="1" fill={c} />
            <rect x="-2" y="0.5" width="3" height="6" rx="1" fill={c} />
            <rect x="11" y="0.5" width="3" height="6" rx="1" fill={c} />
          </g>
        </g>
      )
  }
}
