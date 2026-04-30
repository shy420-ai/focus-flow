import type { ReactNode } from 'react'
import type { CurView } from '../store/AppStore'

const sharedProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style: { flexShrink: 0 },
}

export function tabIcon(id: CurView): ReactNode {
  switch (id) {
    case 'tl':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity=".25" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )
    case 'week':
      return (
        <svg {...sharedProps}>
          <rect x="2.5" y="6" width="19" height="12" rx="3" />
          <line x1="6.4" y1="10" x2="6.4" y2="14" />
          <line x1="9.3" y1="10" x2="9.3" y2="14" />
          <line x1="12" y1="10" x2="12" y2="14" />
          <line x1="14.7" y1="10" x2="14.7" y2="14" />
          <line x1="17.6" y1="10" x2="17.6" y2="14" />
          <rect x="9.5" y="9" width="5" height="6" rx="1" fill="currentColor" fillOpacity=".25" stroke="none" />
        </svg>
      )
    case 'cal':
      return (
        <svg {...sharedProps}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18M8 3v4M16 3v4" />
          <circle cx="8" cy="15" r="1.5" fill="currentColor" />
          <circle cx="13" cy="15" r="1.5" fill="currentColor" fillOpacity=".4" />
        </svg>
      )
    case 'habit':
      return (
        <svg {...sharedProps}>
          <path d="M12 22V12" />
          <path d="M12 12c0-3 2-5 5-5 0 3-2 5-5 5z" fill="currentColor" fillOpacity=".3" />
          <path d="M12 14c0-3-2-5-5-5 0 3 2 5 5 5z" fill="currentColor" fillOpacity=".3" />
          <path d="M9 22h6" />
        </svg>
      )
    case 'goal':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'drop':
      return (
        <svg {...sharedProps}>
          <path d="M12 2.5c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11z" fill="currentColor" fillOpacity=".25" />
          <circle cx="9.5" cy="14" r="1.2" fill="currentColor" />
        </svg>
      )
    case 'stats':
      return (
        <svg {...sharedProps}>
          <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)" />
          <path d="M9.5 6.5l8 8" opacity=".7" />
        </svg>
      )
    default:
      return null
  }
}
