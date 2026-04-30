import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/AppStore'
import { findUserByShareCode, setShareCode, pushGuestbook, loadUserDoc } from '../../lib/firestore'
import { todayStr, pad, fmtH } from '../../lib/date'
import { useBackClose } from '../../hooks/useBackClose'
import type { UserDoc } from '../../lib/firestore'

interface Friend {
  uid: string
  code: string
  name: string
}

function getMyShareCode(uid: string): string {
  let h = 0
  for (let i = 0; i < uid.length; i++) {
    h = ((h << 5) - h) + uid.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36).toUpperCase().slice(0, 6)
}

function loadFriends(): Friend[] {
  try { return JSON.parse(localStorage.getItem('ff_friends') || '[]') } catch { return [] }
}

function saveFriendsLocal(friends: Friend[]) {
  localStorage.setItem('ff_friends', JSON.stringify(friends))
}

interface FriendDetailProps {
  uid: string
  name: string
  myName: string
  myUid: string
  onBack: () => void
}

function FriendDetail({ uid, name, myName, myUid, onBack }: FriendDetailProps) {
  const [data, setData] = useState<UserDoc | null>(null)
  const [guestInput, setGuestInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserDoc(uid).then((d) => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [uid])

  async function postGuestbook() {
    if (!guestInput.trim()) return
    const now = new Date()
    const entry = {
      from: myName,
      text: guestInput.trim(),
      date: todayStr(),
      time: pad(now.getHours()) + ':' + pad(now.getMinutes()),
      ts: Date.now(),
      fromUid: myUid,
    }
    await pushGuestbook(uid, entry)
    setGuestInput('')
    // reload
    loadUserDoc(uid).then((d) => setData(d)).catch(() => {})
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>불러오는 중...</div>
  if (!data) return <div style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>데이터를 불러올 수 없어요</div>

  const today = todayStr()
  const tasks = (data.tasks || []).filter((b) => b.date === today && !b.isBuf && (b.type === 'timeline' || !b.type))
  const habits = data.habits || []
  const habitLogs: Record<string, Record<string, boolean>> = (data.habitLogs || {}) as Record<string, Record<string, boolean>>
  const doneCount = tasks.filter((b) => b.done).length
  const totalH = tasks.reduce((s, b) => s + (b.durHour || 0), 0)
  const guestbook = (data.guestbook as Array<{ from: string; text: string; date?: string; time?: string }>) || []

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--pd)' }}>{name}</div>
        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>오늘의 기록</div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        {[`📋 ${tasks.length}개`, `✅ ${doneCount}/${tasks.length}`, `⏱ ${totalH.toFixed(1)}h`].map((t) => (
          <div key={t} style={{ background: 'var(--pl)', borderRadius: 99, padding: '4px 12px', fontSize: 11, color: 'var(--pd)', fontWeight: 500 }}>{t}</div>
        ))}
      </div>

      {tasks.length > 0 && (
        <div style={{ height: 6, background: 'var(--pl)', borderRadius: 3, marginBottom: 14 }}>
          <div style={{ height: '100%', background: 'var(--pink)', borderRadius: 3, width: Math.round(doneCount / tasks.length * 100) + '%' }} />
        </div>
      )}

      {/* Tasks */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', marginBottom: 6 }}>📅 타임라인</div>
      {tasks.length === 0 ? (
        <div style={{ color: '#aaa', fontSize: 12, textAlign: 'center', padding: '12px 0', marginBottom: 12 }}>오늘 일정 없음</div>
      ) : (
        [...tasks].sort((a, b) => a.startHour - b.startHour).map((b) => (
          <div key={b.id} style={{ padding: 10, background: b.done ? '#f5f5f5' : 'var(--pl)', borderRadius: 10, marginBottom: 6, borderLeft: '3px solid ' + (b.done ? '#ccc' : 'var(--pink)'), opacity: b.done ? .6 : 1 }}>
            <div style={{ color: b.done ? '#aaa' : 'var(--pd)', fontWeight: 600, fontSize: 11 }}>{fmtH(b.startHour)} - {fmtH(b.startHour + b.durHour)}</div>
            <div style={{ color: b.done ? '#aaa' : '#333', marginTop: 2, textDecoration: b.done ? 'line-through' : 'none', fontSize: 12 }}>{b.done ? '✓ ' : ''}{b.name}</div>
          </div>
        ))
      )}

      {/* Habits */}
      {habits.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', margin: '14px 0 6px' }}>
            🌱 습관 ({habits.filter((h) => habitLogs[today]?.[String(h.id)]).length}/{habits.length})
          </div>
          {habits.map((h) => {
            const done = !!habitLogs[today]?.[String(h.id)]
            return (
              <div key={h.id} style={{ fontSize: 12, padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 14, opacity: done ? 1 : .3 }}>{done ? '🌸' : '○'}</span>
                <span style={{ opacity: done ? 1 : .6 }}>{h.name}</span>
              </div>
            )
          })}
        </>
      )}

      {/* Guestbook */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', margin: '14px 0 6px' }}>💌 방명록</div>
      {guestbook.length === 0 ? (
        <div style={{ color: '#ccc', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>아직 방명록이 없어. 첫 글을 남겨봐!</div>
      ) : (
        [...guestbook].reverse().slice(0, 10).map((g, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', marginBottom: 6, border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 10, color: '#aaa' }}>{g.from} · {g.date} {g.time}</div>
            <div style={{ fontSize: 12, color: '#333', marginTop: 2 }}>{g.text}</div>
          </div>
        ))
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          value={guestInput}
          onChange={(e) => setGuestInput(e.target.value)}
          placeholder="응원 한마디 남기기..."
          style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) postGuestbook() }}
        />
        <button onClick={postGuestbook} style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--pink)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>남기기</button>
      </div>

      <button onClick={onBack} style={{ marginTop: 16, width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--pl)', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--pd)' }}>← 돌아가기</button>
    </div>
  )
}

interface Props {
  onClose: () => void
}

export function FriendsPanel({ onClose }: Props) {
  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const [friends, setFriends] = useState<Friend[]>(loadFriends)
  const [viewingFriend, setViewingFriend] = useState<Friend | null>(null)
  useBackClose(true, onClose)

  const myCode = uid ? getMyShareCode(uid) : null
  const myName = localStorage.getItem('ff_nickname') || displayName || '익명'

  async function addFriend() {
    const code = prompt('친구의 공유 코드를 입력해:')
    if (!code?.trim()) return
    const trimmed = code.trim().toUpperCase()
    if (!uid) { alert('로그인이 필요해요!'); return }
    try {
      const result = await findUserByShareCode(trimmed)
      if (!result) { alert('해당 코드의 사용자를 찾을 수 없어요'); return }
      if (result.uid === uid) { alert('자기 자신은 추가할 수 없어!'); return }
      const current = loadFriends()
      if (current.find((f) => f.uid === result.uid)) { alert('이미 추가된 친구야!'); return }
      const name = (result.data.displayName as string) || '친구'
      const newFriends = [...current, { uid: result.uid, code: trimmed, name }]
      saveFriendsLocal(newFriends)
      setFriends(newFriends)
      await setShareCode(uid, myCode!)
    } catch (e) {
      alert('에러: ' + String(e))
    }
  }

  function removeFriend(friendUid: string) {
    const updated = friends.filter((f) => f.uid !== friendUid)
    saveFriendsLocal(updated)
    setFriends(updated)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '90%', maxWidth: 340, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--pd)', marginBottom: 16, textAlign: 'center' }}>👥 친구</div>

        {viewingFriend ? (
          <FriendDetail
            uid={viewingFriend.uid}
            name={viewingFriend.name}
            myName={myName}
            myUid={uid || ''}
            onBack={() => setViewingFriend(null)}
          />
        ) : (
          <>
            {!uid ? (
              <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '20px 0' }}>로그인하면 친구와 공유할 수 있어!</div>
            ) : (
              <>
                {/* My code */}
                <div style={{ background: 'var(--pl)', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>내 공유 코드</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--pd)', letterSpacing: 4 }}>{myCode}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>친구에게 이 코드를 알려줘!</div>
                </div>

                {/* Friend list */}
                {friends.length === 0 ? (
                  <div style={{ color: '#bbb', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>아직 친구가 없어.<br />코드로 친구를 추가해봐!</div>
                ) : (
                  friends.map((f) => (
                    <div key={f.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--pl)', borderRadius: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>🧸</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--pd)' }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: '#bbb' }}>{f.code}</div>
                      </div>
                      <button onClick={() => setViewingFriend(f)} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 11, cursor: 'pointer' }}>보기</button>
                      <button onClick={() => removeFriend(f.uid)} style={{ background: '#FFF0F0', border: 'none', color: '#E24B4A', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  ))
                )}

                <button
                  onClick={addFriend}
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}
                >+ 친구 추가</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
