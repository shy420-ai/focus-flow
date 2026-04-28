export interface ThemeColors {
  pink: string
  pl: string
  pd: string
  pt: string
}

export type ThemeName = 'pink' | 'yellow' | 'sky' | 'purple' | 'mint'

export const THEMES: Record<ThemeName, ThemeColors> = {
  pink: { pink: '#E8849D', pl: '#FDE8EF', pd: '#C45A78', pt: '#7A2A42' },
  yellow: { pink: '#F0D264', pl: '#FFFAED', pd: '#C49E20', pt: '#6B5A10' },
  sky: { pink: '#8DC8E8', pl: '#EAF5FB', pd: '#5A9ABF', pt: '#1A4A6B' },
  purple: { pink: '#C4A6D7', pl: '#FAF5FF', pd: '#9B7BB5', pt: '#5A3370' },
  mint: { pink: '#7ECDB0', pl: '#F0FBF6', pd: '#4EA88A', pt: '#1A5040' },
}

export const THEME_LABELS: Record<ThemeName, string> = {
  pink: '🌸 핑크',
  yellow: '🌻 노랑',
  sky: '🌊 하늘',
  purple: '🔮 보라',
  mint: '🍃 민트',
}
