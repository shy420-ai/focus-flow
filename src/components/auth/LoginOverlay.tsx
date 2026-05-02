import { useState } from 'react'
import { signInWithGoogle, signInWithEmail } from '@/lib/auth'
import { useAppStore } from '@/store/AppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isInAppBrowser, inAppBrowserName } from '@/lib/inAppBrowser'

export function LoginOverlay() {
  const setSkipLogin = useAppStore((s) => s.setSkipLogin)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inApp = isInAppBrowser()
  const inAppName = inAppBrowserName()

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setError('주소 복사됨 — Chrome / Safari 에 붙여넣어줘')
    } catch {
      setError('주소 복사 실패. 직접 주소창 복사해줘: ' + window.location.href)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // ignore
      } else if (err.code === 'auth/popup-blocked') {
        setError('팝업이 차단됐어요. 브라우저에서 팝업 허용 후 다시 시도해주세요.')
      } else {
        setError('로그인 실패: ' + (err.message || '알 수 없는 에러'))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailLogin() {
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 해요'); return }
    setLoading(true)
    setError('')
    try {
      await signInWithEmail(email, password)
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      const msgs: Record<string, string> = {
        'auth/invalid-email': '이메일 형식이 올바르지 않아요',
        'auth/wrong-password': '비밀번호가 틀렸어요',
        'auth/email-already-in-use': '이미 가입된 이메일이에요',
        'auth/weak-password': '비밀번호가 너무 짧아요 (6자 이상)',
        'auth/too-many-requests': '너무 많이 시도했어요. 잠시 후 다시 해주세요',
        'auth/invalid-credential': '비밀번호가 틀렸어요',
      }
      setError(msgs[err.code ?? ''] ?? '로그인 실패: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--pl)] flex flex-col items-center justify-center gap-4 p-6 z-[9999]">
      <div className="text-6xl mb-2">💗</div>
      <h1 className="text-3xl font-bold text-[var(--pink)]">Focus Flow</h1>
      <p className="text-sm text-muted-foreground">ADHD 집중 플래너</p>

      <div className="flex flex-col gap-3 w-full max-w-[280px] mt-2">
        {inApp && (
          <div style={{ background: '#FFF6E5', border: '1.5px solid #FFD580', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#7A5A00', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>⚠️ 구글 로그인 안 돼요</div>
            <div style={{ marginBottom: 8 }}>
              {inAppName ? `${inAppName} 안에서` : '이 앱 안에서'}는 구글 정책상 막혀있어요. 우상단 <b>⋮</b> → <b>"Chrome으로 열기"</b> 또는 <b>"외부 브라우저로 열기"</b> 눌러서 열어주세요.
            </div>
            <button onClick={copyUrl}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #FFD580', background: '#fff', color: '#7A5A00', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              📋 주소 복사하기
            </button>
            <div style={{ fontSize: 10, color: '#A07A20', marginTop: 6 }}>
              아니면 아래 이메일·비번으로 시작해도 OK ↓
            </div>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full gap-2 h-12"
          onClick={handleGoogle}
          disabled={loading || inApp}
          style={inApp ? { opacity: 0.5 } : undefined}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} height={18} alt="Google" />
          Google로 시작하기
        </Button>

        <div className="flex flex-col gap-2">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
          />
          <Button
            className="w-full h-12 bg-[var(--pink)] hover:bg-[var(--pd)] text-white"
            onClick={handleEmailLogin}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인 / 회원가입'}
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full h-12 border-[var(--pd)] text-[var(--pd)] hover:bg-[var(--pl)]"
          onClick={() => setSkipLogin(true)}
        >
          로그인 없이 바로 시작
        </Button>

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          로그인 = 기기 간 싱크<br />
          바로 시작 = 이 기기에서만 저장
        </p>

        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
      </div>
    </div>
  )
}
