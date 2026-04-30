import type { Block } from '../../types/block'
import { useAppStore } from '../../store/AppStore'
import { showConfirm } from '../../lib/showConfirm'
import { showPrompt } from '../../lib/showPrompt'

interface BlockMenuProps {
  block: Block
  onClose: () => void
  onMemo: (id: string) => void
  onEdit: (id: string) => void
}

export function BlockMenu({ block, onClose, onMemo, onEdit }: BlockMenuProps) {
  const toggleDone = useAppStore((s) => s.toggleDone)
  const deleteBlock = useAppStore((s) => s.deleteBlock)
  const completeRecurring = useAppStore((s) => s.completeRecurring)
  const skipRecurring = useAppStore((s) => s.skipRecurring)
  const deleteRecurring = useAppStore((s) => s.deleteRecurring)
  const updateRecurringName = useAppStore((s) => s.updateRecurringName)
  const recurring = useAppStore((s) => s.recurring)

  const isRecurring = !!block.recurId
  const recurTask = isRecurring ? recurring.find((r) => String(r.id) === String(block.recurId)) : null

  function stop(e: React.MouseEvent) { e.stopPropagation() }

  if (isRecurring) {
    const isDone = !!block.done
    return (
      <div className="block-menu">
        {!isDone && (
          <button className="bmb bmb-done" onClick={(e) => { stop(e); completeRecurring(block.recurId!, block.date); onClose(); window.dispatchEvent(new CustomEvent('ff-block-done', { detail: block.id })) }}>
            ✓ 완료
          </button>
        )}
        <button className="bmb" onClick={async (e) => { stop(e); const n = await showPrompt({ msg: '이름 수정', defaultValue: recurTask?.name || block.name }); if (n?.trim()) updateRecurringName(block.recurId!, n.trim()); onClose() }}>
          수정
        </button>
        <button className="bmb bmb-del" onClick={(e) => { stop(e); skipRecurring(block.recurId!, block.date); onClose() }}>
          이번만 삭제
        </button>
        <button className="bmb bmb-del" onClick={(e) => { stop(e); showConfirm('반복 작업 전체 삭제?').then((ok) => { if (ok) deleteRecurring(String(block.recurId!)) }); onClose() }}>
          완전 삭제
        </button>
      </div>
    )
  }

  return (
    <div className="block-menu">
      <button
        className={'bmb bmb-done' + (block.done ? ' undone' : '')}
        onClick={(e) => { stop(e); toggleDone(block.id); onClose() }}
      >
        {block.done ? '↺ 되돌리기' : '✓ 완료'}
      </button>
      <button className="bmb bmb-memo" onClick={(e) => { stop(e); onEdit(block.id); onClose() }}>
        수정
      </button>
      <button className="bmb bmb-memo" onClick={(e) => { stop(e); onMemo(block.id); onClose() }}>
        메모
      </button>
      <button className="bmb bmb-del" onClick={(e) => { stop(e); deleteBlock(block.id); onClose() }}>
        삭제
      </button>
    </div>
  )
}
