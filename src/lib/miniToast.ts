export function showMiniToast(msg: string): void {
  window.dispatchEvent(new CustomEvent('ff-mini-toast', { detail: msg }))
}
