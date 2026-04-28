import { useState, useEffect } from 'react'

const MSGS = [
  { e: '🌸', m: '완료!', s: '잘했어, 진짜로' },
  { e: '✨', m: '해냈다!', s: '오늘도 한 걸음 앞으로' },
  { e: '🎁', m: '굿잡!', s: '너 생각보다 대단해' },
  { e: '💖', m: '완벽해!', s: '이 기세 그대로' },
  { e: '🦄', m: '클리어!', s: '뇌가 도파민 분비 중' },
  { e: '🌟', m: '브라보!', s: 'ADHD 어디감' },
  { e: '🍰', m: '달콤해!', s: '이건 너한테 주는 케이크' },
  { e: '🎉', m: '파티!', s: '작은 승리도 승리야' },
  { e: '🐱', m: '냐옹!', s: '고양이도 너 칭찬해' },
  { e: '🌈', m: '무지개!', s: '힘든 뒤에 오는 보상' },
  { e: '🧁', m: '맛있다!', s: '이 기분 저장해두자' },
  { e: '🎵', m: '띵동!', s: '한 개 더 클리어' },
  { e: '💪', m: '강해졌다!', s: '이 페이스 유지해' },
  { e: '🫧', m: '뽀글!', s: '기분 좋은 거 맞지?' },
  { e: '🌻', m: '해바라기!', s: '너를 향해 피었어' },
  { e: '☕', m: '커피타임!', s: '잠깐 쉬어도 돼' },
  { e: '🎀', m: '리본!', s: '예쁘게 마무리 완료' },
  { e: '🍓', m: '딸기!', s: '오늘의 달콤한 성과' },
  { e: '🦋', m: '나비!', s: '변화하고 있는 너' },
  { e: '🌷', m: '튤립!', s: '한 송이 선물할게' },
  { e: '🍀', m: '행운!', s: '네가 한 거야, 운이 아니라' },
  { e: '⭐', m: '스타!', s: '오늘의 MVP는 너' },
  { e: '🐻', m: '곰돌이!', s: '안아줄게 잘했어' },
  { e: '🎈', m: '풍선!', s: '기분이 둥둥 떠오른다' },
  { e: '🌙', m: '달님!', s: '오늘 밤은 편히 쉬어' },
  { e: '🔥', m: '불타올라!', s: '멈출 수 없는 기세' },
  { e: '🏆', m: '트로피!', s: '이건 네 거야' },
  { e: '💎', m: '다이아!', s: '너는 빛나는 존재' },
]

interface DoneToastProps {
  blockId: string | null
  onClose: () => void
}

export function DoneToast({ blockId: _blockId, onClose }: DoneToastProps) {
  const [msg] = useState(() => MSGS[Math.floor(Math.random() * MSGS.length)])
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger CSS transition on next frame
    const frameId = requestAnimationFrame(() => setShow(true))
    const hideTimer = setTimeout(() => setShow(false), 400)
    // After transition out (.22s), call onClose
    const closeTimer = setTimeout(onClose, 400 + 250)
    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(hideTimer)
      clearTimeout(closeTimer)
    }
  }, [onClose])

  return (
    <div
      className={'toast' + (show ? ' show' : '')}
      onClick={() => { setShow(false); setTimeout(onClose, 250) }}
    >
      <span className="te">{msg.e}</span>
      <div className="tm">{msg.m}</div>
      <div className="ts">{msg.s}</div>
    </div>
  )
}
