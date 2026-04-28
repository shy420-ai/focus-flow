import { useState } from 'react'
import { showConfirm } from '../../lib/showConfirm'
import {
  useGoalStore,
  getCurrentQ,
  getQProgress,
  goalKey,
  Q_LABELS,
  Q_EMOJI,
  Q_COLORS,
} from '../../store/GoalStore'

function GoalSection({ type, icon, label }: { type: string; icon: string; label: string }) {
  const goals = useGoalStore((s) => s.goals)
  const addGoalEntry = useGoalStore((s) => s.addGoalEntry)
  const toggleGoalEntry = useGoalStore((s) => s.toggleGoalEntry)
  const deleteGoalEntry = useGoalStore((s) => s.deleteGoalEntry)

  const [inputVal, setInputVal] = useState('')
  const key = goalKey(type)
  const list = goals[key] || []
  const limit = type === 'week' ? 3 : 5

  function doAdd() {
    addGoalEntry(type, inputVal)
    setInputVal('')
  }

  return (
    <div className="goal-section">
      <div className="goal-header" style={{ cursor: 'default' }}>
        <span className="goal-header-title">{icon} {label}</span>
        <span className="goal-progress">{list.filter((e) => e.done).length}/{list.length}</span>
      </div>
      {list.map((entry) => (
        <div key={entry.id} className="goal-item">
          <button
            className={'goal-check' + (entry.done ? ' done' : '')}
            onClick={() => toggleGoalEntry(type, entry.id)}
          >{entry.done ? '✓' : ''}</button>
          <div className={'goal-text' + (entry.done ? ' done' : '')}>{entry.text}</div>
          <button className="goal-del" onClick={() => deleteGoalEntry(type, entry.id)}>✕</button>
        </div>
      ))}
      {list.length < limit && (
        <div className="goal-add-row">
          <input
            className="goal-add-input"
            placeholder={label + ' 추가... (' + list.length + '/' + limit + ')'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) doAdd()
            }}
          />
          <button className="goal-add-btn" onClick={doAdd}>+</button>
        </div>
      )}
    </div>
  )
}

interface QuarterContentProps {
  goalId: string
  qi: number
  isCur: boolean
}

function QuarterContent({ goalId, qi, isCur }: QuarterContentProps) {
  const roadmap = useGoalStore((s) => s.roadmap)
  const goals = useGoalStore((s) => s.goals)
  const addQTask = useGoalStore((s) => s.addQTask)
  const toggleQTask = useGoalStore((s) => s.toggleQTask)
  const deleteQTask = useGoalStore((s) => s.deleteQTask)
  const editQTitle = useGoalStore((s) => s.editQTitle)
  const addGoalEntry = useGoalStore((s) => s.addGoalEntry)
  const toggleGoalEntry = useGoalStore((s) => s.toggleGoalEntry)
  const deleteGoalEntry = useGoalStore((s) => s.deleteGoalEntry)

  const [taskInput, setTaskInput] = useState('')
  const monthInputs: Record<string, string> = {}
  const [mInputs, setMInputs] = useState<Record<string, string>>({})
  const [wInput, setWInput] = useState('')

  const g = roadmap.goals.find((g) => g.id === goalId)
  if (!g) return null
  const q = g.quarters[qi]
  const qTitle = q.title || ''

  function doAddTask() {
    addQTask(goalId, qi, taskInput)
    setTaskInput('')
  }

  function editTitle() {
    const v = prompt(Q_LABELS[qi] + ' 목표:', qTitle)
    if (v !== null) editQTitle(goalId, qi, v.trim())
  }

  const now = new Date()
  const curMonth = now.getMonth() + 1
  const qMonths = [qi * 3 + 1, qi * 3 + 2, qi * 3 + 3]
  const wKey = goalKey('week')

  return (
    <div style={{ padding: '6px 8px', marginTop: 2 }}>
      <div
        onClick={editTitle}
        style={{ fontSize: 10, color: qTitle ? '#888' : '#ccc', cursor: 'pointer', marginBottom: 4, padding: '2px 0' }}
      >✏️ {qTitle ? '분기 목표: ' + qTitle : '분기 목표 제목 설정'}</div>

      {q.tasks.length === 0 && (
        <div style={{ color: '#ccc', fontSize: 11, padding: '4px 0', textAlign: 'center' }}>할 일을 추가해봐!</div>
      )}
      {q.tasks.map((t) => (
        <div key={t.id} className="goal-item" style={{ padding: '3px 0' }}>
          <button
            className={'goal-check' + (t.done ? ' done' : '')}
            style={{ width: 18, height: 18, fontSize: 10 }}
            onClick={() => toggleQTask(goalId, qi, t.id)}
          >{t.done ? '✓' : ''}</button>
          <div className={'goal-text' + (t.done ? ' done' : '')} style={{ fontSize: 12 }}>{t.text}</div>
          <button className="goal-del" onClick={() => deleteQTask(goalId, qi, t.id)}>✕</button>
        </div>
      ))}
      {q.tasks.length < 5 && (
        <div className="goal-add-row" style={{ marginTop: 4 }}>
          <input
            className="goal-add-input"
            placeholder="할 일 추가..."
            style={{ fontSize: 11, padding: '6px 8px' }}
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) doAddTask()
            }}
          />
          <button className="goal-add-btn" style={{ width: 26, height: 26, fontSize: 14 }} onClick={doAddTask}>+</button>
        </div>
      )}

      {/* Current quarter: month/week hierarchy */}
      {isCur && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #e8e8e8' }}>
          {qMonths.map((mo) => {
            const mKey = 'm' + now.getFullYear() + '-' + String(mo).padStart(2, '0')
            const mGoals = goals[mKey] || []
            const mDone = mGoals.filter((x) => x.done).length
            const isCurMonth = mo === curMonth
            const mInputVal = mInputs[String(mo)] || ''

            function setMInput(val: string) {
              setMInputs((prev) => ({ ...prev, [String(mo)]: val }))
            }
            function addMonthGoal() {
              addGoalEntry('month_' + mo, mInputVal)
              setMInput('')
            }
            void monthInputs

            return (
              <div key={mo} style={{ marginBottom: 8, marginLeft: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: isCurMonth ? 'var(--pd)' : '#aaa', marginBottom: 4 }}>
                  📅 {mo}월{isCurMonth ? ' ← 이번 달' : ''}{mGoals.length > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 400, color: '#aaa' }}> {mDone}/{mGoals.length}</span>
                  )}
                </div>
                {mGoals.map((mg) => (
                  <div key={mg.id} className="goal-item" style={{ padding: '2px 0', marginLeft: 8 }}>
                    <button
                      className={'goal-check' + (mg.done ? ' done' : '')}
                      style={{ width: 16, height: 16, fontSize: 9 }}
                      onClick={() => toggleGoalEntry('month_' + mo, mg.id)}
                    >{mg.done ? '✓' : ''}</button>
                    <div className={'goal-text' + (mg.done ? ' done' : '')} style={{ fontSize: 11 }}>{mg.text}</div>
                    <button className="goal-del" style={{ fontSize: 11 }} onClick={() => deleteGoalEntry('month_' + mo, mg.id)}>✕</button>
                  </div>
                ))}
                {mGoals.length < 5 && (
                  <div className="goal-add-row" style={{ marginLeft: 8, marginTop: 2 }}>
                    <input
                      className="goal-add-input"
                      placeholder={mo + '월 목표...'}
                      style={{ fontSize: 10, padding: '5px 7px' }}
                      value={mInputVal}
                      onChange={(e) => setMInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) addMonthGoal()
                      }}
                    />
                    <button className="goal-add-btn" style={{ width: 22, height: 22, fontSize: 12 }} onClick={addMonthGoal}>+</button>
                  </div>
                )}

                {/* Week goals for current month */}
                {isCurMonth && (
                  <div style={{ marginLeft: 16, marginTop: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pd)', marginBottom: 3 }}>
                      ⭐ 이번 주 목표 <span style={{ fontSize: 9, color: '#aaa', fontWeight: 400 }}>최대 3개</span>
                    </div>
                    {(goals[wKey] || []).map((wg) => (
                      <div key={wg.id} className="goal-item" style={{ padding: '2px 0' }}>
                        <button
                          className={'goal-check' + (wg.done ? ' done' : '')}
                          style={{ width: 14, height: 14, fontSize: 8 }}
                          onClick={() => toggleGoalEntry('week', wg.id)}
                        >{wg.done ? '✓' : ''}</button>
                        <div className={'goal-text' + (wg.done ? ' done' : '')} style={{ fontSize: 10 }}>{wg.text}</div>
                        <button className="goal-del" style={{ fontSize: 10 }} onClick={() => deleteGoalEntry('week', wg.id)}>✕</button>
                      </div>
                    ))}
                    {(goals[wKey] || []).length < 3 && (
                      <div className="goal-add-row" style={{ marginTop: 2 }}>
                        <input
                          className="goal-add-input"
                          placeholder="이번 주 목표..."
                          style={{ fontSize: 10, padding: '4px 6px' }}
                          value={wInput}
                          onChange={(e) => setWInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                              addGoalEntry('week', wInput)
                              setWInput('')
                            }
                          }}
                        />
                        <button
                          className="goal-add-btn"
                          style={{ width: 20, height: 20, fontSize: 11 }}
                          onClick={() => { addGoalEntry('week', wInput); setWInput('') }}
                        >+</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function GoalsView() {
  const roadmap = useGoalStore((s) => s.roadmap)
  const openTree = useGoalStore((s) => s.openTree)
  const addYearGoal = useGoalStore((s) => s.addYearGoal)
  const deleteYearGoal = useGoalStore((s) => s.deleteYearGoal)
  const editYearGoalText = useGoalStore((s) => s.editYearGoalText)
  const toggleTreeQ = useGoalStore((s) => s.toggleTreeQ)

  const [yearInput, setYearInput] = useState('')
  const curQ = getCurrentQ()
  const qp = getQProgress()
  const now = new Date()

  function doAddYearGoal() {
    addYearGoal(yearInput)
    setYearInput('')
  }

  return (
    <div style={{ padding: '16px', paddingBottom: 120 }}>
      {/* Q Sprint progress */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', marginBottom: 12, border: '1.5px solid var(--pl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)' }}>🏃‍♀️ Q{curQ + 1} 스프린트</span>
          <span style={{ fontSize: 10, color: '#888' }}>{qp.week}주차/{qp.totalWeeks}주 · 남은 {qp.remain}일</span>
        </div>
        <div style={{ position: 'relative', height: 20, background: '#f0f0f0', borderRadius: 10, overflow: 'visible' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: qp.pct + '%', background: 'linear-gradient(90deg,' + Q_COLORS[curQ] + ',var(--pd))', borderRadius: 10 }} />
          <div style={{ position: 'absolute', left: 'calc(' + Math.max(qp.pct - 2, 0) + '% - 8px)', top: '50%', transform: 'translateY(-50%) scaleX(-1)', fontSize: 16, zIndex: 1 }}>🏃‍♀️</div>
          <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>🏁</div>
        </div>
      </div>

      {/* Year goal tree heading */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 10, textAlign: 'center' }}>
        🎯 {now.getFullYear()}년 목표 트리 <span style={{ fontSize: 10, color: '#aaa', fontWeight: 400 }}>최대 3개</span>
      </div>

      {roadmap.goals.map((g) => {
        let totalTasks = 0
        let doneTasks = 0
        g.quarters.forEach((q) => q.tasks.forEach((t) => { totalTasks++; if (t.done) doneTasks++ }))
        const allDone = totalTasks > 0 && doneTasks === totalTasks
        const pct = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0

        return (
          <div key={g.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1.5px solid var(--pl)' }}>
            {/* Goal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => {
                const v = prompt('올해 목표:', g.text)
                if (v !== null && v.trim()) editYearGoalText(g.id, v.trim())
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', ...(allDone ? { textDecoration: 'line-through', opacity: .5 } : {}) }}>{g.text}</div>
                {totalTasks > 0 && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{doneTasks}/{totalTasks} 완료 ({pct}%)</div>}
              </div>
              {allDone && <span style={{ fontSize: 9, background: '#56C6A0', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>달성!</span>}
              <button onClick={() => { showConfirm(g.text + ' 목표를 삭제할까요?').then((ok) => { if (ok) deleteYearGoal(g.id) }) }} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 14, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Progress bar */}
            {totalTasks > 0 && (
              <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: 'var(--pink)', borderRadius: 2, transition: 'width .3s' }} />
              </div>
            )}

            {/* Quarters */}
            {[0, 1, 2, 3].map((qi) => {
              const q = g.quarters[qi]
              const isCur = qi === curQ
              const isPast = qi < curQ
              const isOpen = openTree[g.id]?.[qi]
              const qDone = q.tasks.filter((t) => t.done).length
              const qTotal = q.tasks.length
              const qAllDone = qTotal > 0 && qDone === qTotal
              const qTitle = q.title || ''

              return (
                <div key={qi} style={{ display: 'flex', gap: 0, marginLeft: 6 }}>
                  {/* Tree line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: qAllDone ? '#56C6A0' : isCur ? 'var(--pink)' : isPast ? Q_COLORS[qi] : '#e0e0e0',
                      border: '2px solid ' + (isCur ? 'var(--pd)' : 'transparent'),
                      flexShrink: 0, zIndex: 1,
                    }} />
                    {qi < 3 && <div style={{ width: 1.5, flex: 1, background: '#e8e8e8' }} />}
                  </div>
                  {/* Quarter content */}
                  <div style={{ flex: 1, marginBottom: 4, marginLeft: 6 }}>
                    <div
                      onClick={() => toggleTreeQ(g.id, qi)}
                      style={{
                        padding: '6px 8px', borderRadius: 8,
                        background: isCur ? 'var(--pl)' : '#fafafa',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        border: '1px solid ' + (isCur ? 'var(--pink)' : 'transparent'),
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 600, color: isCur ? 'var(--pd)' : '#888' }}>
                        {Q_EMOJI[qi]} {Q_LABELS[qi]}{qTitle ? ': ' : ''}
                        {qTitle && <span style={{ fontWeight: 400, color: '#666' }}>{qTitle}</span>}
                        {qTotal > 0 && <span style={{ fontSize: 9, color: '#aaa', fontWeight: 400 }}> {qDone}/{qTotal}</span>}
                      </span>
                      <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {isCur && <span style={{ fontSize: 8, background: 'var(--pink)', color: '#fff', padding: '1px 5px', borderRadius: 99, fontWeight: 600 }}>NOW</span>}
                        {qAllDone && <span style={{ fontSize: 8, background: '#56C6A0', color: '#fff', padding: '1px 5px', borderRadius: 99 }}>✓</span>}
                        <span style={{ fontSize: 9, color: '#ccc', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>▼</span>
                      </span>
                    </div>
                    {isOpen && <QuarterContent goalId={g.id} qi={qi} isCur={isCur} />}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Add year goal */}
      {roadmap.goals.length < 3 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', marginBottom: 12, border: '1.5px dashed #e0e0e0' }}>
          <div className="goal-add-row">
            <input
              className="goal-add-input"
              placeholder={'올해 핵심 목표 추가... (' + roadmap.goals.length + '/3)'}
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) doAddYearGoal()
              }}
            />
            <button className="goal-add-btn" onClick={doAddYearGoal}>+</button>
          </div>
        </div>
      )}

      {/* Standalone month/week if no year goals */}
      {roadmap.goals.length === 0 && (
        <>
          <GoalSection type="month" icon="📅" label={(now.getMonth() + 1) + '월 목표'} />
          <GoalSection type="week" icon="⭐" label="이번 주 목표" />
        </>
      )}
    </div>
  )
}
