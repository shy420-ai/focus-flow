import type { Block } from '../types/block'

export function migrateBlocks(blocks: Block[]): Block[] {
  return blocks.map((b) => ({
    ...b,
    type: b.type ?? (b.isBuf ? 'buffer' : 'timeline'),
    category: b.category ?? '',
    deadline: b.deadline !== undefined ? b.deadline : null,
    priority: b.priority !== undefined ? b.priority : null,
  }))
}
