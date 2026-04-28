import type { Block, BlockColor } from '../types/block'
import type { RecurringTask } from '../types/recurring'

/**
 * 주어진 날짜에 해당하는 반복 작업들을 가상 블록으로 생성한다.
 * - recurDoneId가 있는 실제 블록(완료된 반복)이 있으면 해당 반복은 제외
 * - exceptions에 해당 날짜가 포함된 반복도 제외
 */
export function generateRecurringBlocks(
  date: string,
  recurring: RecurringTask[],
  blocks: Block[],
): Block[] {
  const dow = new Date(date + 'T12:00:00').getDay()

  return recurring
    .filter((r) => {
      if (!r.days.includes(dow)) return false
      if (r.exceptions && r.exceptions.includes(date)) return false
      // 이 날짜에 이미 완료된 반복 블록이 있으면 제외
      const isDone = blocks.some((b) => b.recurDoneId === String(r.id) && b.date === date)
      return !isDone
    })
    .map((r) => ({
      id: 'rec_' + r.id + '_' + date,
      recurId: String(r.id),
      type: 'timeline' as const,
      name: r.name,
      date,
      startHour: r.startHour,
      durHour: r.durHour,
      color: (r.color || 'pink') as BlockColor,
      done: false,
      memo: r.memo || '',
      category: r.category || '',
      deadline: null,
      priority: null,
      reward: r.reward || null,
      isRecurring: true,
    }))
}

/**
 * 블록 배열과 반복 작업을 합산해서 해당 날짜의 전체 타임라인 블록을 반환한다.
 */
export function getTimelineBlocksForDate(
  date: string,
  blocks: Block[],
  recurring: RecurringTask[],
): Block[] {
  const real = blocks.filter(
    (b) => (b.type === 'timeline' || (!b.type && !b.isBuf)) && b.date === date && !b.isBuf,
  )
  const recurBlocks = generateRecurringBlocks(date, recurring, blocks)
  return [...real, ...recurBlocks].sort((a, b) => a.startHour - b.startHour)
}

/**
 * 블록 배열 기준으로 빈 시간 슬롯을 찾는다.
 */
export function freeSlot(blocks: Block[], date: string, dur: number, fixed: number | null): number {
  if (fixed !== null && fixed !== undefined) return fixed
  const used = blocks
    .filter((b) => (b.type === 'timeline' || (!b.type && !b.isBuf)) && b.date === date && !b.isBuf)
    .map((b) => ({ s: b.startHour, e: b.startHour + b.durHour }))
    .sort((a, b) => a.s - b.s)
  let c = 9
  for (const u of used) {
    if (u.s >= c + dur) break
    if (u.e > c) c = u.e
  }
  return Math.min(c, 23)
}
