// Detects whether the page is running inside an in-app webview (KakaoTalk,
// Naver, Instagram, Facebook, Line, etc.). Google blocks OAuth in these
// — disallowed_useragent — so the login button has to fall back to a
// "open in real browser" hint.

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // Common in-app browser tokens. KAKAOTALK / NAVER are the dominant
  // ones in Korea; the rest cover global apps so we don't have to add
  // them later.
  return /KAKAOTALK|NAVER|FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Twitter|TikTok|Snapchat|Pinterest|DaumApps|;wv\)|Version\/.*Chrome.*Mobile.*; wv/i.test(ua)
}

export function inAppBrowserName(): string | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent || ''
  if (/KAKAOTALK/i.test(ua)) return '카카오톡'
  if (/NAVER/i.test(ua)) return '네이버 앱'
  if (/Instagram/i.test(ua)) return '인스타그램'
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return '페이스북'
  if (/Line\//i.test(ua)) return '라인'
  if (/Twitter/i.test(ua)) return '트위터'
  if (/TikTok/i.test(ua)) return '틱톡'
  if (/DaumApps/i.test(ua)) return '다음 앱'
  if (/MicroMessenger/i.test(ua)) return '위챗'
  if (/Snapchat/i.test(ua)) return '스냅챗'
  if (/Pinterest/i.test(ua)) return '핀터레스트'
  return null
}
