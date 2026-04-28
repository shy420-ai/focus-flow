// 사주 일간 계산 + 별자리 시스템
import { todayStr } from './date'

const STEMS_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const BRANCHES_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
const ELEM5_KO = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수']
const ELEM5_EMOJI: Record<string, string> = { 木: '🌿', 火: '🔥', 土: '🏔️', 金: '⚡', 水: '💧' }
const ELEM5 = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']

function dateToJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
}

function getDayStem(y: number, m: number, d: number): number {
  return (dateToJDN(y, m, d) + 49) % 60 % 10
}

function getDayBranch(y: number, m: number, d: number): number {
  return (dateToJDN(y, m, d) + 49) % 60 % 12
}

function sajuRelation(myStemIdx: number, todayStemIdx: number): string {
  const myElem = Math.floor(myStemIdx / 2)
  const todayElem = Math.floor(todayStemIdx / 2)
  const gen = [[1], [2], [3], [4], [0]]
  const over = [[2], [3], [4], [0], [1]]
  if (myElem === todayElem) return '비겁'
  if (gen[myElem][0] === todayElem) return '식상'
  if (over[myElem][0] === todayElem) return '재성'
  if (gen[todayElem] && gen[todayElem][0] === myElem) return '인성'
  return '관성'
}

const SAJU_MSGS: Record<string, string[]> = {
  '비겁': ['동료나 친구에게서 힘을 얻는 날', '나와 비슷한 에너지! 자신감 있게 밀어붙여', '경쟁보다 협력이 빛나는 하루', '내 페이스대로 가면 되는 날', '같은 목표를 가진 사람을 만나면 시너지가 나', '오늘은 혼자보다 함께가 나은 날', '네 존재감이 빛나는 하루야', '자존감이 올라가는 에너지가 있어'],
  '식상': ['창의력 폭발! 아이디어가 쏟아지는 날', '표현하고 싶은 게 많아지는 하루', '글쓰기, 말하기, 만들기에 좋은 날', '감성이 풍부해지는 하루, 기록해둬', '머릿속에 떠오르는 거 바로 메모해', '말솜씨가 빛나는 날, 발표나 미팅 추천', '예술적 감각이 살아나는 하루', '평소 안 하던 표현을 해봐, 의외로 잘 먹혀'],
  '재성': ['재물운 UP! 작은 수입이 생길 수 있어', '실질적인 성과를 낼 수 있는 날', '현실적인 계획을 세우면 잘 풀려', '노력한 만큼 보상받는 하루', '돈 관련 결정을 내리기 좋은 날', '일한 만큼 인정받는 하루가 될 거야', '현실 감각이 살아나는 날, 예산 정리해봐', '실용적인 결정이 빛을 발하는 하루'],
  '관성': ['계획적으로 움직이면 좋은 날', '규칙적인 루틴이 힘을 발휘해', '책임감 있게 행동하면 인정받아', '조금 긴장되지만 성장하는 하루', '체계적으로 정리하면 머리가 맑아져', '오늘은 딴짓 줄이고 집중하면 효과 2배', '구조화된 업무 방식이 효율을 높여', '자기 관리에 신경 쓰면 컨디션 UP'],
  '인성': ['배움과 충전의 날! 책이나 강의 추천', '직감이 잘 맞는 하루, 느낌을 믿어봐', '쉬어가도 괜찮아, 에너지 충전 중', '새로운 걸 배우면 쏙쏙 들어오는 날', '명상이나 산책이 최고의 보약인 날', '혼자만의 시간이 필요한 하루야', '영감이 떠오르면 바로 메모해둬', '내면의 목소리에 귀 기울여봐'],
}

export interface FortuneResult {
  text: string
  relation: string
}

export function loadSajuFortune(): FortuneResult | null {
  const bday = localStorage.getItem('ff_birthday')
  const byear = parseInt(localStorage.getItem('ff_birthyear') || '0')
  if (!bday || !byear) return null
  const [m, d] = bday.split('-').map(Number)
  const myStem = getDayStem(byear, m, d)
  const now = new Date()
  const todayStem = getDayStem(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const todayBranch = getDayBranch(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const rel = sajuRelation(myStem, todayStem)
  const myElem = ELEM5[myStem]
  const todayElem = ELEM5[todayStem]
  const seed = (now.getFullYear() * 1000 + now.getMonth() * 100 + now.getDate() + myStem) % 4
  const msgs = SAJU_MSGS[rel] || SAJU_MSGS['비겁']
  const msg = msgs[seed % msgs.length]
  const text = `🔮 <b>${STEMS_KO[myStem]}${ELEM5_KO[myStem]}일간</b> ${ELEM5_EMOJI[todayElem] || ''} 오늘(${STEMS_KO[todayStem]}${BRANCHES_KO[todayBranch]}) ${rel}의 날<br><span style="font-size:13px">${msg}</span>`
  void myElem
  return { text, relation: rel }
}

export function getHoroscopeText(): string | null {
  const bday = localStorage.getItem('ff_birthday')
  if (!bday) return null

  const cacheKey = 'ff_horo_' + todayStr()
  const cached = localStorage.getItem(cacheKey)
  if (cached) return cached

  const fortune = loadSajuFortune()
  if (!fortune) return null
  localStorage.setItem(cacheKey, fortune.text)
  return fortune.text
}

// Zodiac signs
const ZODIAC_SIGNS = [
  { name: 'capricorn', ko: '염소자리', from: [1, 1], to: [1, 19] },
  { name: 'aquarius', ko: '물병자리', from: [1, 20], to: [2, 18] },
  { name: 'pisces', ko: '물고기자리', from: [2, 19], to: [3, 20] },
  { name: 'aries', ko: '양자리', from: [3, 21], to: [4, 19] },
  { name: 'taurus', ko: '황소자리', from: [4, 20], to: [5, 20] },
  { name: 'gemini', ko: '쌍둥이자리', from: [5, 21], to: [6, 21] },
  { name: 'cancer', ko: '게자리', from: [6, 22], to: [7, 22] },
  { name: 'leo', ko: '사자자리', from: [7, 23], to: [8, 22] },
  { name: 'virgo', ko: '처녀자리', from: [8, 23], to: [9, 22] },
  { name: 'libra', ko: '천칭자리', from: [9, 23], to: [10, 23] },
  { name: 'scorpio', ko: '전갈자리', from: [10, 24], to: [11, 21] },
  { name: 'sagittarius', ko: '사수자리', from: [11, 22], to: [12, 21] },
  { name: 'capricorn2', ko: '염소자리', from: [12, 22], to: [12, 31] },
]

export function getZodiac(m: number, d: number): string | null {
  const v = m * 100 + d
  const z = ZODIAC_SIGNS.find((z) => v >= z.from[0] * 100 + z.from[1] && v <= z.to[0] * 100 + z.to[1])
  return z ? z.ko : null
}
