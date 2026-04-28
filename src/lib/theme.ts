import { THEMES, type ThemeName } from '../constants/themes'

export function applyTheme(name: ThemeName): void {
  const t = THEMES[name]
  if (!t) return
  const root = document.documentElement
  root.style.setProperty('--pink', t.pink)
  root.style.setProperty('--pl', t.pl)
  root.style.setProperty('--pd', t.pd)
  root.style.setProperty('--pt', t.pt)
  root.style.setProperty('--pm', t.pink)
  document.documentElement.style.background = t.pink
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', t.pink)
  localStorage.setItem('ff_theme', name)
}

export function getTheme(): ThemeName {
  return (localStorage.getItem('ff_theme') as ThemeName) || 'pink'
}

export function initTheme(): void {
  applyTheme(getTheme())
}
