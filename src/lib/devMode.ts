const KEY = 'ff_dev_mode'

export function isDevMode(): boolean {
  return localStorage.getItem(KEY) === '1'
}

export function setDevMode(on: boolean): void {
  if (on) localStorage.setItem(KEY, '1')
  else localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('ff-dev-mode-changed'))
}
