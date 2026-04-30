const PREF_KEY = 'ff_leaderboard_on'

export function isLeaderboardOn(): boolean {
  return localStorage.getItem(PREF_KEY) === '1'
}

export function setLeaderboardOn(on: boolean): void {
  if (on) localStorage.setItem(PREF_KEY, '1')
  else localStorage.removeItem(PREF_KEY)
  window.dispatchEvent(new Event('ff-leaderboard-changed'))
}
