import { useState } from 'react'
import { useMedStore } from '../../store/MedStore'
import { todayStr } from '../../lib/date'
import { useBackClose } from '../../hooks/useBackClose'
import { GearIcon } from '../ui/GearIcon'
import { showMiniToast } from '../../lib/miniToast'
import type { MedItem } from '../../types/med'

// ── MED DB ────────────────────────────────────────────────────────────────────
interface MedDbEntry {
  name: string; generic: string; cat: string
  doses: string[]; duration: number
  doseHours?: Record<string, number>; peak: string; timing: '아침' | '저녁' | '수시'
  effects: string[]; sides: string[]; note: string
}

const MED_DB: MedDbEntry[] = [
  // ── ADHD (가나다순) ─────────────────────────────────────────
  { name: '메디키넷', generic: '메틸페니데이트 서방', cat: 'ADHD', doses: ['5mg','10mg','20mg','30mg','40mg'], duration: 8, peak: '1~2시간', timing: '아침', effects: ['집중력 향상','충동 억제'], sides: ['식욕감소','불면','어지러움'], note: '아침 식후 복용' },
  { name: '스트라테라', generic: '아토목세틴', cat: 'ADHD', doses: ['10mg','18mg','25mg','40mg','60mg','80mg'], duration: 24, peak: '1~2주(축적형)', timing: '아침', effects: ['집중력 향상','감정 조절','불안 감소'], sides: ['메스꺼움','식욕감소','졸림','입마름'], note: '매일 복용, 2~4주 후 효과. 남용 위험 없음' },
  { name: '아토목세틴', generic: '아토목세틴(스트라테라 제네릭)', cat: 'ADHD', doses: ['10mg','18mg','25mg','40mg','60mg','80mg'], duration: 24, peak: '1~2주(축적형)', timing: '아침', effects: ['집중력 향상','감정 조절','불안 감소'], sides: ['메스꺼움','식욕감소','졸림','입마름'], note: '매일 복용, 2~4주 후 효과. 남용 위험 없음' },
  { name: '인튜니브', generic: '구안파신 서방', cat: 'ADHD', doses: ['1mg','2mg','3mg','4mg'], duration: 24, peak: '축적형', timing: '저녁', effects: ['과잉행동 감소','감정 조절','충동 억제'], sides: ['졸림','저혈압','어지러움','피로'], note: '취침 전 복용 권장. 갑자기 중단 금지' },
  { name: '콘서타', generic: '메틸페니데이트 서방', cat: 'ADHD', doses: ['18mg','27mg','36mg','54mg'], duration: 10, doseHours: {'18mg':8,'27mg':9,'36mg':10,'54mg':12}, peak: '1~2시간', timing: '아침', effects: ['집중력 향상','충동 억제','작업 지속력 증가'], sides: ['식욕감소','불면','두통','심박수 증가'], note: '아침 식후 복용. 오후 늦게 먹으면 수면 방해' },
  { name: '페니드', generic: '메틸페니데이트 속방', cat: 'ADHD', doses: ['5mg','10mg','20mg'], duration: 4, peak: '30분~1시간', timing: '아침', effects: ['빠른 집중력 향상'], sides: ['식욕감소','불면','반동효과'], note: '하루 2~3회 복용. 효과가 빠르게 올라오고 빨리 떨어짐' },

  // ── 기분조절 (가나다순) ────────────────────────────────────
  { name: '데파코트', generic: '발프로산', cat: '기분조절', doses: ['250mg','500mg','750mg','1000mg'], duration: 24, peak: '축적형', timing: '저녁', effects: ['조증 억제','기분 안정'], sides: ['체중증가','졸림','탈모','소화불량'], note: '혈중농도 검사 필요. 임신 시 금기' },
  { name: '라믹탈', generic: '라모트리진', cat: '기분조절', doses: ['25mg','50mg','100mg','200mg'], duration: 24, peak: '축적형', timing: '아침', effects: ['기분 안정','우울 삽화 예방'], sides: ['두통','어지러움','발진(주의!)','메스꺼움'], note: '서서히 증량 필수. 발진 생기면 즉시 병원' },
  { name: '리튬', generic: '탄산리튬', cat: '기분조절', doses: ['300mg','600mg','900mg'], duration: 24, peak: '축적형', timing: '저녁', effects: ['조증/우울 예방','자살충동 감소'], sides: ['갈증','손떨림','체중증가','갑상선 기능저하'], note: '혈중농도 모니터링 필수. 수분 섭취 중요' },

  // ── 항우울 (가나다순) ──────────────────────────────────────
  { name: '레메론', generic: '미르타자핀', cat: '항우울', doses: ['7.5mg','15mg','30mg','45mg'], duration: 24, peak: '1~2시간', timing: '저녁', effects: ['우울감 감소','수면 개선','식욕 증가'], sides: ['졸림','체중증가','입마름','어지러움'], note: '저용량일수록 졸림 강함. 취침 전 복용' },
  { name: '렉사프로', generic: '에스시탈로프람(SSRI)', cat: '항우울', doses: ['5mg','10mg','20mg'], duration: 24, peak: '축적형(2~4주)', timing: '아침', effects: ['우울감 감소','불안 완화'], sides: ['메스꺼움','졸림','성기능장애','체중변화'], note: '부작용 적은 편. 아침 또는 저녁 복용' },
  { name: '웰부트린', generic: '부프로피온', cat: '항우울', doses: ['150mg','300mg'], duration: 24, peak: '축적형', timing: '아침', effects: ['우울감 감소','집중력 향상','금연 보조'], sides: ['불면','두통','입마름','경련위험(고용량)'], note: 'ADHD+우울 동반 시 많이 처방. 식욕억제 효과' },
  { name: '이펙사', generic: '벤라팍신(SNRI)', cat: '항우울', doses: ['37.5mg','75mg','150mg','225mg'], duration: 24, peak: '축적형(2~4주)', timing: '아침', effects: ['우울감 감소','불안 완화','통증 완화'], sides: ['메스꺼움','어지러움','발한','혈압상승'], note: '갑자기 중단 시 금단증상 심함' },
  { name: '졸로푸트', generic: '설트랄린(SSRI)', cat: '항우울', doses: ['25mg','50mg','100mg','200mg'], duration: 24, peak: '축적형(2~4주)', timing: '아침', effects: ['우울감 감소','불안 완화','강박 완화'], sides: ['메스꺼움','성기능장애','두통','불면/졸림'], note: '아침 복용 권장. 2~4주 후 효과' },
  { name: '프로작', generic: '플루옥세틴(SSRI)', cat: '항우울', doses: ['10mg','20mg','40mg','60mg'], duration: 24, peak: '축적형(2~4주)', timing: '아침', effects: ['우울감 감소','강박 완화','불안 완화'], sides: ['메스꺼움','불면','두통','식욕감소'], note: '반감기 매우 길어 안정적. 아침 복용 권장' },

  // ── 항불안 (가나다순) ──────────────────────────────────────
  { name: '아티반', generic: '로라제팜(벤조)', cat: '항불안', doses: ['0.5mg','1mg','2mg'], duration: 8, peak: '30분~1시간', timing: '수시', effects: ['불안 완화','수면 유도'], sides: ['졸림','의존성','어지러움'], note: '⚠️ 의존성 주의' },
  { name: '자낙스', generic: '알프라졸람(벤조)', cat: '항불안', doses: ['0.25mg','0.5mg','1mg'], duration: 5, peak: '30분', timing: '수시', effects: ['불안 즉시 완화','공황 억제','근육 이완'], sides: ['졸림','의존성','기억력 저하','반동불안'], note: '⚠️ 의존성 주의. 단기 사용 권장' },

  // ── 수면 ────────────────────────────────────────────────
  { name: '스틸녹스', generic: '졸피뎀', cat: '수면', doses: ['5mg','10mg'], duration: 6, peak: '30분', timing: '저녁', effects: ['수면 유도'], sides: ['몽유병','기억상실','어지러움','의존성'], note: '취침 직전 복용. 7~8시간 수면 확보' },

  // ── 항정신병 (가나다순) ────────────────────────────────────
  { name: '세로퀠', generic: '쿠에티아핀', cat: '항정신병', doses: ['25mg','100mg','200mg','300mg'], duration: 8, peak: '1~2시간', timing: '저녁', effects: ['수면 유도(저용량)','기분 안정','조증 억제'], sides: ['졸림','체중증가','어지러움','대사증후군'], note: '저용량은 수면보조로 많이 사용' },
  { name: '아빌리파이', generic: '아리피프라졸', cat: '항정신병', doses: ['2mg','5mg','10mg','15mg'], duration: 72, peak: '축적형', timing: '아침', effects: ['기분 안정','망상/환각 억제','우울 보조'], sides: ['불안','불면','체중변화','좌불안석'], note: '반감기 매우 길어 안정적' },
]

const CAT_COLORS: Record<string, string> = {
  'ADHD': '#E8849D', '기분조절': '#5B7FFF', '항우울': '#56C6A0',
  '항불안': '#EF9F27', '수면': '#9B7BB5', '항정신병': '#378ADD',
}
const STATUS_EMOJI = ['😵', '😐', '🙂', '😊', '🤩']
const STATUS_LABEL = ['최악', '별로', '보통', '좋음', '최고']
const WAKE_LABEL = ['최악', '별로', '보통', '잘잤어', '완벽']
const SLEEP_OPTS = [
  { label: '바로 잠듦', icon: '💤', val: 0 },
  { label: '30분 이내', icon: '😊', val: 1 },
  { label: '30분~1시간', icon: '😐', val: 2 },
  { label: '1시간+', icon: '😵', val: 3 },
  { label: '못 잤어', icon: '🫠', val: 4 },
]
const SLEEP_LABEL = ['💤 바로 잠듦', '😊 30분 이내', '😐 30분~1시간', '😵 1시간+', '🫠 못 잤어']

// ── MedSetup ──────────────────────────────────────────────────────────────────
function MedSetup({ onClose }: { onClose: () => void }) {
  useBackClose(true, onClose)
  const config = useMedStore((s) => s.config)
  const addMed = useMedStore((s) => s.addMed)
  const removeMed = useMedStore((s) => s.removeMed)
  const setConfig = useMedStore((s) => s.setConfig)

  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [timing, setTiming] = useState<'아침' | '점심' | '저녁' | '수시'>('아침')
  const [dur, setDur] = useState('10')
  const [height, setHeight] = useState(String(config?.height || ''))
  const [weight, setWeight] = useState(String(config?.weight || ''))
  const [selectedDb, setSelectedDb] = useState<MedDbEntry | null>(null)

  const meds = config?.meds || []
  const bmi = height && weight ? (parseFloat(weight) / (parseFloat(height) / 100) ** 2).toFixed(1) : null

  function handleSelectDb(med: MedDbEntry) {
    setName(med.name); setDose(med.doses[0]); setTiming(med.timing); setDur(String(med.duration))
    setSelectedDb(med)
  }

  function handleAdd() {
    if (!name.trim()) return
    addMed({ name: name.trim(), dose: dose.trim(), timing, duration: parseInt(dur) || 10 })
    setName(''); setDose(''); setTiming('아침'); setDur('10'); setSelectedDb(null)
  }

  function handleBodySave() {
    setConfig({ ...(config || { meds: [] }), height: parseFloat(height) || undefined, weight: parseFloat(weight) || undefined })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 600, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pd)', marginBottom: 14, textAlign: 'center' }}>💊 약 설정</div>

        {/* Existing meds — 아침/점심/저녁/수시 별로 분리해서 표시 */}
        {meds.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {(['아침', '점심', '저녁', '수시'] as const).map((slot) => {
              const slotMeds = meds.filter((m) => m.timing === slot)
              if (slotMeds.length === 0) return null
              const slotEmoji = slot === '아침' ? '☀️' : slot === '점심' ? '🍱' : slot === '저녁' ? '🌙' : '⏱'
              return (
                <div key={slot} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#888', marginBottom: 4, letterSpacing: -0.2 }}>
                    {slotEmoji} {slot}
                  </div>
                  {slotMeds.map((m) => {
                    const db = MED_DB.find((d) => d.name === m.name)
                    const cc = CAT_COLORS[db?.cat || ''] || 'var(--pink)'
                    return (
                      <div key={m.name + m.timing} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--pl)', borderRadius: 10, marginBottom: 4 }}>
                        {db && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: cc, color: '#fff' }}>{db.cat}</span>}
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--pd)', fontWeight: 600 }}>{m.name} {m.dose} <span style={{ fontSize: 10, color: '#999', fontWeight: 500 }}>· {m.duration}h</span></span>
                        <button onClick={() => removeMed(m.name, m.timing)} style={{ background: '#FFF0F0', border: 'none', color: '#E24B4A', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* DB Quick select — 색상 의미 범례 + 카테고리별 그룹화 */}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 6 }}>💊 약 빠른 선택</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {(Object.keys(CAT_COLORS) as (keyof typeof CAT_COLORS)[]).map((cat) => (
            <span key={cat} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 700, color: CAT_COLORS[cat],
              padding: '2px 6px', borderRadius: 4,
              border: '1px solid ' + CAT_COLORS[cat],
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: CAT_COLORS[cat] }} />
              {cat}
            </span>
          ))}
        </div>
        {(['ADHD', '항우울', '기분조절', '항정신병', '항불안', '수면'] as const).map((cat) => {
          const inCat = MED_DB.filter((m) => m.cat === cat)
          if (inCat.length === 0) return null
          return (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: CAT_COLORS[cat], marginBottom: 4 }}>{cat}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {inCat.map((m) => (
                  <button key={m.name + m.timing} onClick={() => handleSelectDb(m)}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid ' + CAT_COLORS[m.cat], background: selectedDb?.name === m.name && selectedDb?.timing === m.timing ? CAT_COLORS[m.cat] : '#fff', color: selectedDb?.name === m.name && selectedDb?.timing === m.timing ? '#fff' : CAT_COLORS[m.cat], fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        {selectedDb && (
          <div style={{ background: 'var(--pl)', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 11, color: '#555', lineHeight: 1.7 }}>
            <div><b>{selectedDb.name}</b> — {selectedDb.generic}</div>
            <div>⏱ 지속 {selectedDb.duration}h · 📈 피크 {selectedDb.peak}</div>
            <div>📌 {selectedDb.note}</div>
          </div>
        )}

        {/* Manual add */}
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', marginBottom: 6 }}>직접 입력</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름"
            style={{ flex: '2', minWidth: 100, padding: '8px 10px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          {selectedDb ? (
            <select value={dose} onChange={(e) => setDose(e.target.value)}
              style={{ flex: '1', minWidth: 70, padding: '8px 6px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
              {selectedDb.doses.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          ) : (
            <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="용량"
              style={{ flex: '1', minWidth: 70, padding: '8px 10px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
          {(['아침', '점심', '저녁', '수시'] as const).map((t) => (
            <button key={t} onClick={() => setTiming(t)}
              style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1.5px solid ' + (timing === t ? 'var(--pink)' : 'var(--pl)'), background: timing === t ? 'var(--pink)' : '#fff', color: timing === t ? '#fff' : 'var(--pd)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t}
            </button>
          ))}
          <input type="number" value={dur} onChange={(e) => setDur(e.target.value)} placeholder="시간"
            style={{ width: 50, padding: '6px 8px', border: '1.5px solid var(--pl)', borderRadius: 8, fontSize: 12, textAlign: 'center', fontFamily: 'inherit', outline: 'none' }} />
          <span style={{ fontSize: 11, color: '#aaa' }}>h</span>
          <button onClick={handleAdd}
            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>추가</button>
        </div>

        {/* Body info */}
        <div style={{ borderTop: '1px solid var(--pl)', paddingTop: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 6 }}>🧍 신체 정보 (용량 참고용)</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="키(cm)"
              style={{ flex: 1, padding: '6px 8px', border: '1.5px solid var(--pl)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="몸무게(kg)"
              style={{ flex: 1, padding: '6px 8px', border: '1.5px solid var(--pl)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
            {bmi && <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>BMI {bmi}</span>}
            <button onClick={handleBodySave}
              style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--pl)', border: 'none', color: 'var(--pd)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
          </div>
        </div>

        {/* Goals */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>⏰ 목표 기상</div>
            <select defaultValue={config?.wakeGoal ?? 7}
              onChange={(e) => setConfig({ ...(config || { meds: [] }), wakeGoal: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--pl)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
              {Array.from({ length: 7 }, (_, i) => i + 5).map((h) => <option key={h} value={h}>{h}시</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>🌙 목표 취침</div>
            <select defaultValue={config?.bedGoal ?? 23}
              onChange={(e) => setConfig({ ...(config || { meds: [] }), bedGoal: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--pl)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
              {Array.from({ length: 8 }, (_, i) => i + 20).map((h) => <option key={h} value={h}>{h >= 24 ? (h - 24) + '시(익일)' : h + '시'}</option>)}
            </select>
          </div>
        </div>

        <button onClick={onClose}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>완료</button>
      </div>
    </div>
  )
}

// ── Drug card header (used in morning/evening tab) ───────────────────────────
function DrugCard({ med, todayTake, curH }: { med: MedItem; todayTake: ReturnType<typeof useMedStore.getState>['logs'][0] | undefined; curH: number }) {
  const db = MED_DB.find((d) => d.name === med.name)
  const cc = CAT_COLORS[db?.cat || ''] || 'var(--pink)'
  const [open, setOpen] = useState(false)

  let effectBar = null
  if (todayTake && db && db.duration < 48) {
    const takeH = todayTake.time!
    const elapsed = curH - takeH
    const pct = Math.min(Math.max(elapsed / db.duration * 100, 0), 100)
    const gp = Math.min(pct, 70); const yp = Math.min(Math.max(pct - 70, 0), 20); const rp = Math.max(pct - 90, 0)
    const endH = takeH + db.duration
    const remaining = Math.max(endH - curH, 0)
    const endTime = Math.floor(endH) + ':' + String(Math.round((endH % 1) * 60)).padStart(2, '0')
    effectBar = (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textAlign: 'center' }}>
          {Math.floor(takeH)}:{String(Math.round((takeH % 1) * 60)).padStart(2, '0')} 복용 · 예상 ~{endTime} · 남은 {Math.round(remaining)}시간
        </div>
        <div style={{ position: 'relative', height: 20, background: '#f0f0f0', borderRadius: 10, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: gp + '%', background: '#56C6A0' }} />
          <div style={{ position: 'absolute', left: gp + '%', top: 0, height: '100%', width: yp + '%', background: '#EF9F27' }} />
          <div style={{ position: 'absolute', left: (gp + yp) + '%', top: 0, height: '100%', width: rp + '%', background: '#E24B4A' }} />
          <div style={{ position: 'absolute', left: Math.max(pct - 1, 0) + '%', top: '50%', transform: 'translateY(-50%)', fontSize: 11 }}>💊</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, border: '1.5px solid var(--pl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: effectBar ? 8 : 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: cc, color: '#fff' }}>{db?.cat || '기타'}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>{med.name} {med.dose}</span>
        {todayTake && <span style={{ fontSize: 11, color: '#56C6A0' }}>✅ {Math.floor(todayTake.time!)}:{String(Math.round((todayTake.time! % 1) * 60)).padStart(2, '0')}</span>}
      </div>
      {effectBar}
      {db && (
        <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
          <summary style={{ fontSize: 11, color: 'var(--pd)', cursor: 'pointer', userSelect: 'none' }}>📋 약 정보 보기</summary>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.8, marginTop: 6 }}>
            <div>🧬 {db.generic}</div>
            <div>⏱ 지속 {db.duration}h · 📈 피크 {db.peak}</div>
            <div>✅ {db.effects.join(', ')}</div>
            <div style={{ color: '#E24B4A' }}>⚠️ {db.sides.join(', ')}</div>
            <div>📌 {db.note}</div>
          </div>
        </details>
      )}
    </div>
  )
}

// 약 가이드 카드 — 시간대별로 같은 모양 재사용. 동적(액션) + 정적(약 정보 접힘).
interface GuideCardProps {
  med: { name: string; dose: string; duration: number; timing: string }
  take?: { time?: number } | undefined
  fmt: (h: number) => string
}
function MedGuideCard({ med, take, fmt }: GuideCardProps) {
  const db = MED_DB.find((d) => d.name === med.name)
  if (!db) {
    return (
      <div style={{ padding: '8px 10px', background: 'var(--pl)', borderRadius: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)' }}>{med.name} {med.dose}</div>
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>등록된 정보가 없는 약</div>
      </div>
    )
  }
  const isLongActing = db.duration >= 24
  const cc = CAT_COLORS[db.cat] || 'var(--pink)'
  return (
    <div style={{ padding: '10px 12px', background: 'var(--pl)', borderRadius: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: cc, color: '#fff' }}>{db.cat}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>{med.name}</span>
        <span style={{ fontSize: 11, color: '#888' }}>{med.dose}</span>
      </div>

      {/* 🕐 오늘 액션 — 동적 */}
      {!isLongActing && take && (
        <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', marginBottom: 6 }}>
          <div style={{ fontSize: 9, color: '#888', fontWeight: 700, marginBottom: 2 }}>🕐 오늘 액션</div>
          <div style={{ fontSize: 11, color: '#56C6A0' }}>🟢 복용 {fmt(take.time!)}</div>
          <div style={{ fontSize: 11, color: '#EF9F27' }}>🟡 효과 약해짐 {fmt(take.time! + db.duration * 0.7)}</div>
          <div style={{ fontSize: 11, color: '#E24B4A' }}>🔴 효과 종료 {fmt(take.time! + db.duration)}</div>
        </div>
      )}
      {!isLongActing && !take && (
        <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', marginBottom: 6, fontSize: 11, color: '#888' }}>
          💡 복용하면 약발 떨어지는 시간 알려줄게
        </div>
      )}
      {isLongActing && (
        <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', marginBottom: 6, fontSize: 11, color: '#888' }}>
          🌀 누적형 약 — 매일 일정 시간에 복용 (시간별 효과 계산 X)
        </div>
      )}

      {/* 📋 약 정보 — 정적 (접힘) */}
      <details style={{ fontSize: 10, color: '#666' }}>
        <summary style={{ cursor: 'pointer', fontSize: 10, color: '#888', fontWeight: 600, padding: '2px 0' }}>📋 약 정보</summary>
        <div style={{ marginTop: 6, padding: '6px 10px', background: '#fff', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 3, lineHeight: 1.5 }}>
          <div><b>일반명</b> · {db.generic}</div>
          <div>⏱ 지속 {db.duration}h · 📈 피크 {db.peak}</div>
          {db.note && <div>📌 {db.note}</div>}
          <div>💚 효과 · {db.effects.join(', ')}</div>
          <div style={{ color: '#B23939' }}>⚠️ 부작용 · {db.sides.join(', ')}</div>
        </div>
      </details>
    </div>
  )
}

function fmtHourMin(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h % 1) * 60)
  return hh + ':' + String(mm).padStart(2, '0')
}

// ── Sleep Tab ─────────────────────────────────────────────────────────────────
// 약과 분리된 독립 영역 — 어젯밤 수면 컨디션 / 잠드는 시간 / 취침 기록 +
// (앞으로) 수면-약 상관 분석.
function SleepTab() {
  const config = useMedStore((s) => s.config)
  const logs = useMedStore((s) => s.logs)
  const logWake = useMedStore((s) => s.logWake)
  const logSleepTime = useMedStore((s) => s.logSleepTime)
  const logBedtime = useMedStore((s) => s.logBedtime)
  const removeBedtime = useMedStore((s) => s.removeBedtime)

  const today = todayStr()
  const todayWakeLog = logs.find((l) => l.date === today && l.type === 'wake')
  const todaySleepLog = logs.find((l) => l.date === today && l.type === 'sleeptime')
  const todayBedLogs = logs.filter((l) => l.date === today && l.type === 'bed').sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
  const bedGoal = config?.bedGoal ?? 23
  const wakeGoal = config?.wakeGoal ?? 7
  const [staged, setStaged] = useState<number>(bedGoal)

  // 최근 7일 평균 수면·기상 컨디션 — 간단 분석
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  })
  const wakeScores = last7.map((d) => logs.find((l) => l.date === d && l.type === 'wake')?.level ?? null).filter((x): x is number => x !== null)
  const avgWake = wakeScores.length ? wakeScores.reduce((a, b) => a + b, 0) / wakeScores.length : null
  const recordedDays = wakeScores.length

  return (
    <div>
      {/* 오늘 컨디션 입력 — 안 했으면 노출 */}
      {(!todayWakeLog || !todaySleepLog) && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
          {!todayWakeLog && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>🌅 어젯밤 수면 어땠어?</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
                {STATUS_EMOJI.map((e, i) => (
                  <button key={i} onClick={() => { logWake(i); showMiniToast('🌅 컨디션 기록됨') }} style={{ fontSize: 26, padding: '6px 8px', borderRadius: 12, border: '2px solid transparent', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span>{e}</span><span style={{ fontSize: 9, color: '#aaa' }}>{WAKE_LABEL[i]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {!todaySleepLog && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>💤 어젯밤 잠드는 데 얼마나 걸렸어?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {SLEEP_OPTS.map((o) => (
                  <button key={o.val} onClick={() => { logSleepTime(o.val); showMiniToast('💤 수면 시간 기록됨') }} style={{ padding: '6px 12px', borderRadius: 10, border: '1.5px solid var(--pl)', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
                    {o.icon} {o.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {todayWakeLog && todaySleepLog && (
        <div style={{ background: 'var(--pl)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: 'var(--pd)', fontWeight: 600 }}>
          오늘 컨디션: {STATUS_EMOJI[todayWakeLog.level!]} {WAKE_LABEL[todayWakeLog.level!]} · {SLEEP_LABEL[todaySleepLog.level!] || ''}
        </div>
      )}

      {/* 취침 기록 — 슬라이더 + 저장 버튼 (누적 기록) */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 10 }}>
          😴 취침 기록
        </div>
        {(() => {
          // 19시(저녁 7시)부터 익일 새벽 5시까지
          const min = Math.min(19, bedGoal - 2)
          const max = Math.max(bedGoal + 6, 29)
          const fmt = (h: number) => {
            const hh = Math.floor(h)
            const mm = Math.round((h % 1) * 60)
            const day = hh >= 24 ? hh - 24 : hh
            return day + ':' + String(mm).padStart(2, '0') + (hh >= 24 ? ' (익일)' : '')
          }
          return (
            <>
              <div style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: 'var(--pink)', marginBottom: 8, letterSpacing: -1, fontFeatureSettings: '"tnum"' }}>
                {fmt(staged)}
              </div>
              <input
                type="range"
                min={min} max={max} step={0.5}
                value={staged}
                onChange={(e) => setStaged(parseFloat(e.target.value))}
                onPointerUp={() => { logBedtime(staged); showMiniToast('😴 ' + fmt(staged) + ' 기록됨') }}
                onTouchEnd={() => { logBedtime(staged); showMiniToast('😴 ' + fmt(staged) + ' 기록됨') }}
                onKeyUp={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { logBedtime(staged); showMiniToast('😴 ' + fmt(staged) + ' 기록됨') } }}
                style={{ width: '100%', accentColor: 'var(--pink)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#aaa', marginTop: 2, marginBottom: 10, fontWeight: 600 }}>
                <span>{fmt(min)}</span>
                <span style={{ color: 'var(--pink)' }}>목표 {bedGoal}:00</span>
                <span>{fmt(max)}</span>
              </div>
              <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center', marginBottom: 8 }}>
                💡 슬라이더 놓으면 자동 저장 (누적)
              </div>
              {/* 오늘 누적 기록 */}
              {todayBedLogs.length > 0 && (
                <div style={{ borderTop: '1px solid var(--pl)', paddingTop: 8 }}>
                  <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginBottom: 4 }}>오늘 기록 {todayBedLogs.length}건</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {todayBedLogs.map((log) => (
                      <span key={log.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 4px 4px 10px', borderRadius: 99,
                        background: 'var(--pl)', fontSize: 11, color: 'var(--pd)', fontWeight: 600,
                      }}>
                        ✅ {fmt(log.time!)}
                        <button
                          onClick={() => { removeBedtime(log.id); showMiniToast('🗑 기록 삭제') }}
                          style={{
                            background: '#fff', border: 'none', borderRadius: '50%',
                            width: 18, height: 18, fontSize: 10, color: '#aaa',
                            cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                            lineHeight: 1,
                          }}
                          aria-label="삭제"
                        >×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>

      {/* 7일 평균 분석 */}
      {recordedDays > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>📈 최근 7일 패턴</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#555' }}>
            <span style={{ fontSize: 22 }}>{avgWake != null ? STATUS_EMOJI[Math.round(avgWake)] : '—'}</span>
            <div style={{ flex: 1 }}>
              <div>평균 컨디션: <b>{avgWake != null ? WAKE_LABEL[Math.round(avgWake)] : '기록 없음'}</b></div>
              <div style={{ fontSize: 10, color: '#aaa' }}>{recordedDays}일 기록 · 목표 기상 {wakeGoal}시 / 취침 {bedGoal}시</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', padding: '4px 0', lineHeight: 1.6 }}>
        💡 수면-약 상관 분석은 곧 추가될 예정 (예: "스틸녹스 먹은 날 평균 수면 점수")
      </div>
    </div>
  )
}

// ── Morning Tab ───────────────────────────────────────────────────────────────
function MorningTab() {
  const config = useMedStore((s) => s.config)
  const logs = useMedStore((s) => s.logs)
  const logTake = useMedStore((s) => s.logTake)
  const clearTake = useMedStore((s) => s.clearTake)
  const logStatus = useMedStore((s) => s.logStatus)

  const today = todayStr()
  const now = new Date()
  const nowHour = now.getHours()

  const morningMeds = (config?.meds || []).filter((m) => m.timing === '아침' || m.timing === '수시')
  const todayMorningTake = logs.find((l) => l.date === today && l.type === 'take' && l.timing === '아침')
  const todayWakeLog = logs.find((l) => l.date === today && l.type === 'wake')
  const todayStatuses = logs.filter((l) => l.date === today && l.type === 'status').sort((a, b) => (a.hour ?? 0) - (b.hour ?? 0))
  const curStatus = todayStatuses.find((s) => s.hour === nowHour)

  return (
    <div>
      {/* 수면·취침 기록은 이제 🌙 수면 sub-tab 으로 분리. 짧은 미리보기만 남김. */}
      {todayWakeLog && (
        <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginBottom: 8 }}>
          🌅 아침 컨디션: {STATUS_EMOJI[todayWakeLog.level!]} {WAKE_LABEL[todayWakeLog.level!]}
        </div>
      )}

      {/* Drug cards */}
      {morningMeds.map((m) => (
        <DrugCard key={m.name} med={m} todayTake={todayMorningTake} curH={nowHour} />
      ))}

      {/* Take button */}
      {morningMeds.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {!todayMorningTake ? (
            <button onClick={() => { logTake('아침'); showMiniToast('☀️ 아침약 복용 기록됨') }}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ☀️ 아침약 먹었어!</button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { logTake('아침'); showMiniToast('🕐 지금 시각으로 갱신됨') }} style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px dashed var(--pl)', background: '#fff', color: '#aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🕐 지금으로 갱신</button>
              <button onClick={() => { clearTake('아침'); showMiniToast('🗑 기록 삭제됨') }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px dashed #eee', background: '#fff', color: '#ccc', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 기록 삭제</button>
            </div>
          )}
        </div>
      )}

      {/* 아침약 가이드 */}
      {morningMeds.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>☀️ 아침약 가이드</div>
          {morningMeds.map((m) => (
            <MedGuideCard key={m.name} med={m} take={todayMorningTake} fmt={fmtHourMin} />
          ))}
        </div>
      )}

      {/* Status check */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>지금 상태 어때?</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {STATUS_EMOJI.map((e, i) => (
            <button key={i} onClick={() => logStatus(i)}
              style={{ fontSize: 28, padding: '6px 8px', borderRadius: 12, border: '2px solid ' + (curStatus?.level === i ? 'var(--pink)' : 'transparent'), background: curStatus?.level === i ? 'var(--pl)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span>{e}</span><span style={{ fontSize: 9, color: '#aaa' }}>{STATUS_LABEL[i]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today log */}
      {(todayStatuses.length > 0 || todayMorningTake) && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>오늘 기록</div>
          {todayMorningTake && (
            <div style={{ fontSize: 12, color: '#555', padding: '4px 0' }}>
              💊 {Math.floor(todayMorningTake.time!)}:{String(Math.round(((todayMorningTake.time! % 1) * 60))).padStart(2, '0')} 아침약 복용
            </div>
          )}
          {todayStatuses.map((s) => (
            <div key={s.id} style={{ fontSize: 12, color: '#555', padding: '4px 0' }}>
              {STATUS_EMOJI[s.level!]} {s.hour}:00 — {STATUS_LABEL[s.level!]}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Evening Tab ───────────────────────────────────────────────────────────────
function EveningTab({ onSetup }: { onSetup: () => void }) {
  const config = useMedStore((s) => s.config)
  const logs = useMedStore((s) => s.logs)
  const logTake = useMedStore((s) => s.logTake)
  const clearTake = useMedStore((s) => s.clearTake)

  const today = todayStr()
  const now = new Date()
  const nowHour = now.getHours()
  const nightMeds = (config?.meds || []).filter((m) => m.timing === '저녁')
  const todayNightTake = logs.find((l) => l.date === today && l.type === 'take' && l.timing === '저녁')
  const todayBedLog = logs.find((l) => l.date === today && l.type === 'bed')
  const wakeGoal = config?.wakeGoal ?? 7

  const sleepMeds = nightMeds.filter((m) => {
    const db = MED_DB.find((d) => d.name === m.name)
    return db && (db.cat === '수면' || db.cat === '항정신병')
  })

  if (!nightMeds.length) {
    return (
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 12, border: '1.5px solid var(--pl)', textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>🌙</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>등록된 저녁약이 없어</div>
        <button onClick={onSetup}
          style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#5B7FFF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          저녁약 추가하기</button>
      </div>
    )
  }

  return (
    <div>
      {/* Drug cards */}
      {nightMeds.map((m) => (
        <DrugCard key={m.name} med={m} todayTake={todayNightTake} curH={nowHour} />
      ))}

      {/* Take button */}
      <div style={{ marginBottom: 12 }}>
        {!todayNightTake ? (
          <button onClick={() => { logTake('저녁'); showMiniToast('🌙 저녁약 복용 기록됨') }}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#5B7FFF', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🌙 저녁약 먹었어!</button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { logTake('저녁'); showMiniToast('🕐 지금 시각으로 갱신됨') }} style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px dashed var(--pl)', background: '#fff', color: '#aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🕐 지금으로 갱신</button>
            <button onClick={() => { clearTake('저녁'); showMiniToast('🗑 기록 삭제됨') }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px dashed #eee', background: '#fff', color: '#ccc', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 기록 삭제</button>
          </div>
        )}
      </div>

      {/* 저녁약 가이드 — 일반 약 (모든 night meds 노트·지속 표시) */}
      {nightMeds.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>🌙 저녁약 가이드</div>
          {nightMeds.map((m) => (
            <MedGuideCard key={m.name} med={m} take={todayNightTake} fmt={fmtHourMin} />
          ))}
        </div>
      )}

      {/* 취침약 가이드 — 수면·항정신병 약만 별도 권장 시각 계산 */}
      {sleepMeds.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>😴 취침약 권장 시각</div>
          {sleepMeds.map((m) => {
            const db = MED_DB.find((d) => d.name === m.name)
            if (!db) return null
            const dur = db.duration
            const cycleH = 7.5
            const optimalBed = wakeGoal - cycleH
            const latestBed = wakeGoal - dur
            return (
              <div key={m.name} style={{ padding: '6px 10px', background: 'var(--pl)', borderRadius: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', marginBottom: 2 }}>{m.name} — 지속 {dur}h</div>
                <div style={{ fontSize: 11, color: '#555' }}>
                  💤 수면 사이클 기준 취침 권장: {Math.floor(optimalBed)}:{String(Math.round((optimalBed % 1) * 60)).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 11, color: '#E24B4A' }}>
                  ⚠️ 목표 기상({wakeGoal}시) 기준 최대 취침: {Math.floor(latestBed)}:{String(Math.round((latestBed % 1) * 60)).padStart(2, '0')}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 😴 취침 기록은 🌙 수면 sub-tab 으로 분리 */}
      {todayBedLog && (
        <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginBottom: 8 }}>
          ✅ 오늘 취침 {Math.floor(todayBedLog.time!)}:{String(Math.round((todayBedLog.time! % 1) * 60)).padStart(2, '0')} 기록됨
        </div>
      )}
    </div>
  )
}

// ── Lunch Tab ─────────────────────────────────────────────────────────────────
function LunchTab({ onSetup }: { onSetup: () => void }) {
  const config = useMedStore((s) => s.config)
  const logs = useMedStore((s) => s.logs)
  const logTake = useMedStore((s) => s.logTake)
  const clearTake = useMedStore((s) => s.clearTake)
  const logStatus = useMedStore((s) => s.logStatus)

  const today = todayStr()
  const now = new Date()
  const nowHour = now.getHours()

  const lunchMeds = (config?.meds || []).filter((m) => m.timing === '점심')
  const todayLunchTake = logs.find((l) => l.date === today && l.type === 'take' && l.timing === '점심')
  const todayStatuses = logs.filter((l) => l.date === today && l.type === 'status').sort((a, b) => (a.hour ?? 0) - (b.hour ?? 0))
  const curStatus = todayStatuses.find((s) => s.hour === nowHour)

  if (!lunchMeds.length) {
    return (
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 12, border: '1.5px solid var(--pl)', textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>🥪</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>등록된 점심약이 없어</div>
        <button onClick={onSetup}
          style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#F4A261', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          점심약 추가하기</button>
      </div>
    )
  }

  return (
    <div>
      {/* Drug cards */}
      {lunchMeds.map((m) => (
        <DrugCard key={m.name} med={m} todayTake={todayLunchTake} curH={nowHour} />
      ))}

      {/* Take button */}
      <div style={{ marginBottom: 12 }}>
        {!todayLunchTake ? (
          <button onClick={() => { logTake('점심'); showMiniToast('🥪 점심약 복용 기록됨') }}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#F4A261', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🥪 점심약 먹었어!</button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { logTake('점심'); showMiniToast('🕐 지금 시각으로 갱신됨') }} style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px dashed var(--pl)', background: '#fff', color: '#aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🕐 지금으로 갱신</button>
            <button onClick={() => { clearTake('점심'); showMiniToast('🗑 기록 삭제됨') }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px dashed #eee', background: '#fff', color: '#ccc', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 기록 삭제</button>
          </div>
        )}
      </div>

      {/* 점심약 가이드 */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>🥪 점심약 가이드</div>
        {lunchMeds.map((m) => (
          <MedGuideCard key={m.name} med={m} take={todayLunchTake} fmt={fmtHourMin} />
        ))}
      </div>

      {/* Status check */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>지금 상태 어때?</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {STATUS_EMOJI.map((e, i) => (
            <button key={i} onClick={() => logStatus(i)}
              style={{ fontSize: 28, padding: '6px 8px', borderRadius: 12, border: '2px solid ' + (curStatus?.level === i ? 'var(--pink)' : 'transparent'), background: curStatus?.level === i ? 'var(--pl)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span>{e}</span><span style={{ fontSize: 9, color: '#aaa' }}>{STATUS_LABEL[i]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today log */}
      {todayLunchTake && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1.5px solid var(--pl)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>오늘 점심 기록</div>
          <div style={{ fontSize: 12, color: '#555', padding: '4px 0' }}>
            💊 {Math.floor(todayLunchTake.time!)}:{String(Math.round(((todayLunchTake.time! % 1) * 60))).padStart(2, '0')} 점심약 복용
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main StatsView ─────────────────────────────────────────────────────────────
export function StatsView() {
  const config = useMedStore((s) => s.config)
  const [tab, setTab] = useState<'morning' | 'lunch' | 'night' | 'sleep'>(() => {
    const saved = localStorage.getItem('ff_medi_tab')
    return (saved === 'morning' || saved === 'lunch' || saved === 'night' || saved === 'sleep') ? saved : 'morning'
  })
  const [showSetup, setShowSetup] = useState(false)

  function setTabPersist(t: typeof tab) {
    setTab(t); localStorage.setItem('ff_medi_tab', t)
  }

  const meds = config?.meds || []
  const hasMeds = meds.length > 0
  const hasMorning = meds.some((m) => m.timing === '아침' || m.timing === '수시')
  const hasLunch = meds.some((m) => m.timing === '점심')
  const hasNight = meds.some((m) => m.timing === '저녁')
  const ALL_TABS = [
    { id: 'morning' as const, label: '☀️ 아침약', visible: hasMorning },
    { id: 'lunch'   as const, label: '🥪 점심약', visible: hasLunch },
    { id: 'night'   as const, label: '🌙 저녁약', visible: hasNight },
    { id: 'sleep'   as const, label: '😴 수면',   visible: true },  // 항상 보임
  ]
  // Show only tabs with meds (수면은 항상); if none set up, show all so user can pick where to add
  const TABS = hasMeds ? ALL_TABS.filter((t) => t.visible) : ALL_TABS

  const visibleIds = TABS.map((t) => t.id)
  const effectiveTab = hasMeds && !visibleIds.includes(tab) ? (TABS[0]?.id ?? tab) : tab

  return (
    <div style={{ padding: '16px', paddingBottom: 120 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--pd)' }}>💊 메디 트래커</div>
        <button onClick={() => setShowSetup(true)}
          aria-label="메디 설정"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center', color: 'var(--pink)', fontFamily: 'inherit' }}>
          <GearIcon size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Tabs (only show ones with meds) */}
      {TABS.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTabPersist(t.id)}
              style={{ flex: 1, padding: 8, borderRadius: 10, border: '1.5px solid ' + (effectiveTab === t.id ? 'var(--pink)' : 'var(--pl)'), background: effectiveTab === t.id ? 'var(--pink)' : '#fff', color: effectiveTab === t.id ? '#fff' : 'var(--pd)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {!hasMeds ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 12, border: '1.5px solid var(--pl)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💊</div>
          <div style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>약 정보를 설정하면<br />복용 기록 + 상태 트래킹을 시작할 수 있어!</div>
          <button onClick={() => setShowSetup(true)}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            약 설정하기</button>
        </div>
      ) : (
        <>
          {effectiveTab === 'morning' && <MorningTab />}
          {effectiveTab === 'lunch' && <LunchTab onSetup={() => setShowSetup(true)} />}
          {effectiveTab === 'night' && <EveningTab onSetup={() => setShowSetup(true)} />}
          {effectiveTab === 'sleep' && <SleepTab />}
        </>
      )}

      {showSetup && <MedSetup onClose={() => setShowSetup(false)} />}

      <div style={{ fontSize: 9, color: '#ccc', textAlign: 'center', padding: '8px 0' }}>
        ⚠️ 이 기능은 기록 도구이며 의료 조언이 아닙니다. 약 복용은 반드시 의사와 상담하세요.
      </div>
    </div>
  )
}
