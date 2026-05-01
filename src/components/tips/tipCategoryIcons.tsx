import type { ReactNode } from 'react'
import type { TipCategory } from '../../types/adhdTip'

const baseProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style: { flexShrink: 0 },
}

export function tipCategoryIcon(cat: TipCategory): ReactNode {
  switch (cat) {
    case 'bookmarks':
      // star
      return (
        <svg {...baseProps}>
          <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 16.5l-5.2 2.7 1-5.9-4.3-4.1 5.9-.9z" fill="currentColor" fillOpacity=".25" />
        </svg>
      )
    case 'start':
      // target / bullseye (matches main goal tab)
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </svg>
      )
    case 'study':
      // open book
      return (
        <svg {...baseProps}>
          <path d="M2 5h7a3 3 0 0 1 3 3v13a2.2 2.2 0 0 0-2-2H2z" fill="currentColor" fillOpacity=".22" />
          <path d="M22 5h-7a3 3 0 0 0-3 3v13a2.2 2.2 0 0 1 2-2h8z" fill="currentColor" fillOpacity=".22" />
        </svg>
      )
    case 'mood':
      // brain (organic curves)
      return (
        <svg {...baseProps}>
          <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-3 3v3a3 3 0 0 0 2 2.8V19a3 3 0 0 0 3 3h2V4z" fill="currentColor" fillOpacity=".22" />
          <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 3 3v3a3 3 0 0 1-2 2.8V19a3 3 0 0 1-3 3h-2V4z" fill="currentColor" fillOpacity=".22" />
        </svg>
      )
    case 'record':
      // notebook with lines
      return (
        <svg {...baseProps}>
          <rect x="4" y="3" width="16" height="18" rx="2" fill="currentColor" fillOpacity=".18" />
          <path d="M4 7h16M8 11h8M8 15h6" />
          <path d="M9 3v18" />
        </svg>
      )
    case 'social':
      // two heads
      return (
        <svg {...baseProps}>
          <circle cx="9" cy="8" r="3.2" fill="currentColor" fillOpacity=".22" />
          <circle cx="16" cy="9" r="2.5" fill="currentColor" fillOpacity=".22" />
          <path d="M3.5 19c.5-3 3-5 5.5-5s5 2 5.5 5" />
          <path d="M14 19c.4-2.2 2-3.5 4-3.5s3.6 1.3 4 3.5" />
        </svg>
      )
    case 'body':
      // capsule / pill
      return (
        <svg {...baseProps}>
          <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)" fill="currentColor" fillOpacity=".22" />
          <path d="M9.5 6.5l8 8" opacity=".7" />
        </svg>
      )
    case 'sleep':
      // crescent moon + zzz
      return (
        <svg {...baseProps}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor" fillOpacity=".25" />
          <path d="M16 4h3l-3 3h3" strokeWidth="1.4" />
        </svg>
      )
    case 'archive':
      // paperclip
      return (
        <svg {...baseProps}>
          <path d="M21 12.5l-8.6 8.6a5 5 0 0 1-7.07-7.07l8.6-8.6a3.5 3.5 0 0 1 4.95 4.95l-8.6 8.6a2 2 0 0 1-2.83-2.83l7.9-7.9" />
        </svg>
      )
    default:
      return null
  }
}
