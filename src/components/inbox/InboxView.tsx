import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/AppStore'
import { daysFromNow, todayStr } from '../../lib/date'
import { nid } from '../../lib/id'
import type { Block, Priority } from '../../types/block'
import { getCategories } from '../../lib/categories'

// D-day 라벨 계산
interface DdayResult {
  text: string
  cls: 'urgent' | 'soon' | 'normal'
}

function ddayLabel(deadline: string | null): DdayResult | null {
  if (!deadline) return null
  const d = daysFromNow(deadline)
  if (d < 0) return { text: 'D+' + Math.abs(d), cls: 'urgent' }
  if (d === 0) return { text: 'D-DAY', cls: 'urgent' }
  if (d <= 3) return { text: 'D-' + d, cls: 'soon' }
  return { text: 'D-' + d, cls: 'normal' }
}

function catColor(name: string): string {
  return getCategories().find((c) => c.name === name)?.color || 'var(--pink)'
}

interface InboxItemRowProps {
  block: Block
  onToggle: (id: string) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
  onPriority: (id: string, p: Priority) => void
}

function InboxItemRow({ block, onToggle, onMove, onDelete, onPriority }: InboxItemRowProps) {
  const dd = ddayLabel(block.deadline)

  return (
    <div className={'inbox-item' + (block.done ? ' done-item' : '')}>
      <button
        className={'inbox-check' + (block.done ? ' checked' : '')}
        onClick={() => onToggle(block.id)}
      >
        {block.done ? '✓' : ''}
      </button>

      <div className="inbox-body">
        <div className="inbox-name">
          {block.category && (
            <span className="b-cat-tag" style={{ background: catColor(block.category) }}>
              {block.category}
            </span>
          )}
          {block.name}
        </div>
        <div className="inbox-meta">
          {dd && <span className={'inbox-dday ' + dd.cls}>{dd.text}</span>}
          {block.deadline && <span>{block.deadline}</span>}
        </div>
        {!block.done && (
          <div className="inbox-priority-pills">
            {(['today', 'tomorrow', 'week', 'someday'] as Priority[]).map((p) => (
              <button
                key={p ?? 'null'}
                className={'inbox-pri-pill' + (block.priority === p ? ' active' : '')}
                onClick={(e) => { e.stopPropagation(); onPriority(block.id, p) }}
              >
                {p === 'today' ? '오늘' : p === 'tomorrow' ? '내일' : p === 'week' ? '이번주' : '언젠가'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="inbox-actions">
        {!block.done && (
          <button
            className="inbox-act inbox-act-sched"
            title="오늘 배치"
            onClick={() => onMove(block.id)}
          >
            📅
          </button>
        )}
        <button
          className="inbox-act inbox-act-del"
          title="삭제"
          onClick={() => onDelete(block.id)}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

interface SectionProps {
  label: string
  items: Block[]
  onToggle: (id: string) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
  onPriority: (id: string, p: Priority) => void
}

function InboxSection({ label, items, onToggle, onMove, onDelete, onPriority }: SectionProps) {
  if (!items.length) return null
  return (
    <div className="inbox-section">
      <div className="inbox-section-title">
        {label}
        <span className="count">{items.length}</span>
      </div>
      {items.map((b) => (
        <InboxItemRow
          key={b.id}
          block={b}
          onToggle={onToggle}
          onMove={onMove}
          onDelete={onDelete}
          onPriority={onPriority}
        />
      ))}
    </div>
  )
}

export function InboxView() {
  const blocks = useAppStore((s) => s.blocks)
  const addBlock = useAppStore((s) => s.addBlock)
  const deleteBlock = useAppStore((s) => s.deleteBlock)
  const toggleDone = useAppStore((s) => s.toggleDone)
  const setPriority = useAppStore((s) => s.setPriority)
  const moveToTimeline = useAppStore((s) => s.moveToTimeline)

  const [quickInput, setQuickInput] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [categories, setCategories] = useState(getCategories)

  useEffect(() => {
    function onCatsChanged() { setCategories(getCategories()) }
    window.addEventListener('ff-cats-changed', onCatsChanged)
    return () => window.removeEventListener('ff-cats-changed', onCatsChanged)
  }, [])

  function handleAddItem() {
    const name = quickInput.trim()
    if (!name) return
    addBlock({
      id: nid(),
      type: 'inbox',
      name,
      category: newCategory,
      deadline: newDeadline || null,
      priority: null,
      done: false,
      memo: '',
      date: '',
      startHour: 0,
      durHour: 1,
      color: 'pink',
    })
    setQuickInput('')
    setNewDeadline('')
    setNewCategory('')
  }

  // 오늘 우선순위 설정 시 타임라인으로 자동 이동
  function handlePriority(id: string, p: Priority) {
    if (p === 'today') {
      moveToTimeline(id)
      return
    }
    setPriority(id, p)
  }

  const inboxItems = blocks.filter((b) => b.type === 'inbox')
  const filtered = catFilter ? inboxItems.filter((b) => b.category === catFilter) : inboxItems

  // Smart Today: 미완료 + 마감 3일 이내
  const smartItems = inboxItems
    .filter((b) => !b.done && b.deadline && daysFromNow(b.deadline) <= 3)
    .sort((a, b) => daysFromNow(a.deadline) - daysFromNow(b.deadline))

  const groups = [
    { key: 'tomorrow', label: '내일', items: filtered.filter((b) => b.priority === 'tomorrow' && !b.done) },
    { key: 'week', label: '이번주', items: filtered.filter((b) => b.priority === 'week' && !b.done) },
    { key: 'someday', label: '언젠가', items: filtered.filter((b) => b.priority === 'someday' && !b.done) },
    { key: 'none', label: '분류 안됨', items: filtered.filter((b) => !b.priority && !b.done) },
    { key: 'done', label: '완료', items: filtered.filter((b) => b.done) },
  ]

  const today = todayStr()

  return (
    <div className="inbox-wrap">
      {/* 빠른 입력 */}
      <div className="inbox-input-row">
        <input
          className="inbox-input"
          placeholder="빠르게 할일 추가... (Enter)"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              handleAddItem()
            }
          }}
        />
        <button className="inbox-add-btn" onClick={handleAddItem}>
          +
        </button>
      </div>

      {/* 마감일 + 카테고리 */}
      <div className="inbox-extra-row">
        <label>마감일</label>
        <input
          type="date"
          value={newDeadline}
          min={today}
          onChange={(e) => setNewDeadline(e.target.value)}
        />
        <label style={{ marginLeft: '8px' }}>카테고리</label>
      </div>
      <div className="cat-pills" style={{ marginBottom: '12px' }}>
        {categories.map((c) => (
          <button
            key={c.name}
            className={'cat-pill' + (newCategory === c.name ? ' active' : '')}
            style={newCategory === c.name ? { background: c.color, borderColor: c.color } : undefined}
            onClick={() => setNewCategory(newCategory === c.name ? '' : c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 카테고리 필터 */}
      <div className="inbox-filter-row">
        <button
          className={'cat-pill' + (catFilter === '' ? ' active' : '')}
          style={catFilter === '' ? { background: 'var(--pink)', color: '#fff', borderColor: 'var(--pink)' } : undefined}
          onClick={() => setCatFilter('')}
        >
          전체
        </button>
        {categories.map((c) => (
          <button
            key={c.name}
            className={'cat-pill' + (catFilter === c.name ? ' active' : '')}
            style={
              catFilter === c.name
                ? { background: c.color, borderColor: c.color }
                : { color: c.color, borderColor: c.color }
            }
            onClick={() => setCatFilter(catFilter === c.name ? '' : c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Smart Today */}
      {smartItems.length > 0 && (
        <div className="smart-today">
          <div className="smart-today-title">
            🔴 오늘 추천{' '}
            <span style={{ fontWeight: 400, fontSize: '10px', color: '#aaa' }}>마감 임박!</span>
          </div>
          {smartItems.map((b) => {
            const dd = ddayLabel(b.deadline)
            return (
              <div key={b.id} className="smart-today-item">
                <span className="smart-today-dday">{dd?.text}</span>
                <span className="smart-today-name">
                  {b.category && (
                    <span className="b-cat-tag" style={{ background: catColor(b.category) }}>
                      {b.category}
                    </span>
                  )}
                  {b.name}
                </span>
                <button className="smart-today-btn" onClick={() => moveToTimeline(b.id)}>
                  오늘 배치
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 그룹별 목록 */}
      {groups.map((g) => (
        <InboxSection
          key={g.key}
          label={g.label}
          items={g.items}
          onToggle={toggleDone}
          onMove={moveToTimeline}
          onDelete={deleteBlock}
          onPriority={handlePriority}
        />
      ))}

      {inboxItems.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: '#ccc',
            fontSize: '13px',
            padding: '40px 0',
            lineHeight: '22px',
          }}
        >
          아직 할일이 없어
          <br />
          위에서 빠르게 추가해봐
        </div>
      )}
    </div>
  )
}
