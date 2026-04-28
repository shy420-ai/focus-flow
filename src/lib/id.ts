export function nid(): string {
  return String(Date.now()) + String(Math.random()).slice(2, 6)
}
