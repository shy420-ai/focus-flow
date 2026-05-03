import { useState } from 'react'
import { useMedStore } from '../../store/MedStore'
import { todayStr } from '../../lib/date'
import { useBackClose } from '../../hooks/useBackClose'
import { GearIcon } from '../ui/GearIcon'
import { showMiniToast } from '../../lib/miniToast'
import { isDevMode } from '../../lib/devMode'
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

// MedGuideCard / fmtHourMin 은 DrugCard 와 중복이라 제거됨 — DrugCard 가
// 단일 카드로 약 상태(progress bar) + 약 정보 접힘 모두 처리.

// ── ⏰ 시간 흐름 view (개발자 모드 only) — 약·수면·컨디션을 시간순 한 흐름으로 ────
function TimelineHealthView() {
  const config = useMedStore((s) => s.config)
  const logs = useMedStore((s) => s.logs)
  const logTake = useMedStore((s) => s.logTake)
  const clearTake = useMedStore((s) => s.clearTake)
  const logWakeup = useMedStore((s) => s.logWakeup)
  const removeWakeup = useMedStore((s) => s.removeWakeup)
  const logBedtime = useMedStore((s) => s.logBedtime)
  const removeBedtime = useMedStore((s) => s.removeBedtime)

  const today = todayStr()
  const meds = config?.meds || []
  const bedGoal = config?.bedGoal ?? 23
  const wakeGoal = config?.wakeGoal ?? 7
  const todayBedLog = logs.filter((l) => l.date === today && l.type === 'bed').sort((a, b) => (a.time ?? 0) - (b.time ?? 0))[0]
  const todayWakeup = logs.find((l) => l.date === today && l.type === 'wakeup')
  const todayWakeMood = logs.find((l) => l.date === today && l.type === 'wake')
  // 실제 기상 시각 = wakeup 명시적 기록 우선 → wake mood 의 time → 가장 빠른 약 복용 시각 → goal
  const todayTakes = logs.filter((l) => l.date === today && l.type === 'take' && l.time != null).sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
  const wakeActualH = todayWakeup?.time ?? todayWakeMood?.time ?? todayTakes[0]?.time ?? null
  const wakeH = wakeActualH ?? wakeGoal
  const now = new Date()
  const nowH = now.getHours() + now.getMinutes() / 60

  // 이벤트 시간순 빌드
  type MedRow = {
    name: string
    dose: string
    cat: string
    color: string
    info: string
  }
  type Ev = {
    time: number
    emoji: string
    title: string
    sub?: string
    color?: string
    actionable?: boolean
    actionLabel?: string  // 버튼 라벨 (기본 "먹었어")
    onTake?: () => void
    onUntake?: () => void
    taken?: boolean
    // 그룹 카드 — 같은 timing 의 약들 묶어서 보여줌
    medRows?: MedRow[]
  }
  const events: Ev[] = []

  // 1) 기상 — 명시적 버튼으로 시각 기록 가능
  events.push({
    time: wakeH,
    emoji: '🌅',
    title: '기상',
    sub: todayWakeup
      ? `✅ 기상 ${fmtHM(wakeH)}`
      : wakeActualH != null
        ? `약 복용으로 추정 ${fmtHM(wakeH)}`
        : `목표 ${fmtHM(wakeH)} (예정)`,
    color: '#F5BD3C',
    actionable: !todayWakeup,
    actionLabel: '🌅 지금 기상',
    onTake: () => { logWakeup(); showMiniToast('🌅 기상 시각 기록됨') },
    onUntake: todayWakeup ? () => { removeWakeup(todayWakeup.id); showMiniToast('🗑 기상 기록 취소') } : undefined,
    taken: !!todayWakeup,
  })

  // 2) 약 복용 — 같은 timing 끼리 그룹핑 (아침약·점심약·저녁약 카드 1개씩)
  const TIMING_LIST: Array<'아침' | '점심' | '저녁' | '수시'> = ['아침', '점심', '저녁', '수시']
  const TIMING_EMOJI: Record<string, string> = { 아침: '☀️', 점심: '🥪', 저녁: '🌙', 수시: '⏱' }
  for (const timing of TIMING_LIST) {
    const groupMeds = meds.filter((m) => m.timing === timing)
    if (groupMeds.length === 0) continue
    const take = (timing === '수시')
      ? undefined
      : logs.find((l) => l.date === today && l.type === 'take' && l.timing === timing)

    let plannedH: number
    if (timing === '아침') plannedH = wakeH + 0.5
    else if (timing === '점심') plannedH = 12
    else if (timing === '저녁') {
      const hasSleepy = groupMeds.some((m) => {
        const db = MED_DB.find((d) => d.name === m.name)
        return db && (db.cat === '수면' || db.cat === '항정신병')
      })
      plannedH = hasSleepy ? bedGoal - 1 : bedGoal - 3
    }
    else plannedH = nowH

    const actualH = take?.time ?? plannedH
    const medRows: MedRow[] = groupMeds.map((m) => {
      const db = MED_DB.find((d) => d.name === m.name)
      if (!db) return { name: m.name, dose: m.dose, cat: '?', color: '#aaa', info: '' }
      return {
        name: m.name,
        dose: m.dose,
        cat: db.cat,
        color: CAT_COLORS[db.cat] || 'var(--pink)',
        info: `${db.duration}h · 피크 ${db.peak}`,
      }
    })
    events.push({
      time: actualH,
      emoji: TIMING_EMOJI[timing],
      title: `${timing} 약 (${groupMeds.length}개)`,
      sub: take ? '✅ 복용 ' + fmtHM(actualH) : '⏳ 복용 예정 ' + fmtHM(plannedH),
      color: 'var(--pink)',
      actionable: !take && timing !== '수시',
      onTake: () => {
        if (timing === '아침' || timing === '점심' || timing === '저녁') {
          logTake(timing)
          showMiniToast(`💊 ${timing}약 복용 기록됨`)
        }
      },
      onUntake: take && (timing === '아침' || timing === '점심' || timing === '저녁') ? () => {
        clearTake(timing)
        showMiniToast(`🗑 ${timing}약 기록 취소`)
      } : undefined,
      taken: !!take,
      medRows,
    })

    // 효과 종료 마커 — 약별 (단기 자극제만)
    if (take) {
      for (const gm of groupMeds) {
        const db = MED_DB.find((d) => d.name === gm.name)
        if (!db || db.duration >= 24) continue
        events.push({
          time: actualH + db.duration * 0.7,
          emoji: '🟡',
          title: `${gm.name} 약해짐`,
          sub: `복용 ${(db.duration * 0.7).toFixed(1)}h 후`,
          color: '#EF9F27',
        })
        events.push({
          time: actualH + db.duration,
          emoji: '🔴',
          title: `${gm.name} 종료`,
          sub: `복용 ${db.duration}h 후`,
          color: '#E24B4A',
        })
      }
    }
  }

  // 3) 취침 — 명시적 버튼
  const bedH = todayBedLog?.time ?? bedGoal
  events.push({
    time: bedH,
    emoji: '🌙',
    title: '취침',
    sub: todayBedLog ? `✅ 취침 ${fmtHM(bedH)}` : `목표 ${fmtHM(bedH)} (예정)`,
    color: '#9B7BB5',
    actionable: !todayBedLog,
    actionLabel: '🌙 지금 취침',
    onTake: () => {
      const now = new Date()
      const h = now.getHours() + now.getMinutes() / 60
      logBedtime(h)
      showMiniToast('🌙 취침 시각 기록됨')
    },
    onUntake: todayBedLog ? () => { removeBedtime(todayBedLog.id); showMiniToast('🗑 취침 기록 취소') } : undefined,
    taken: !!todayBedLog,
  })

  // 시간순 정렬
  events.sort((a, b) => a.time - b.time)

  // 🎯 지금 다음 액션 — 가장 가까운 미복용 약 또는 가장 최근 복용 결과 기반 친근한 안내
  const upcomingMed = meds
    .filter((m) => !logs.some((l) => l.date === today && l.type === 'take' && l.timing === m.timing))
    .map((m) => {
      const db = MED_DB.find((d) => d.name === m.name)
      if (!db) return null
      let target: number
      if (m.timing === '아침') target = wakeH + 0.5
      else if (m.timing === '점심') target = 12
      else if (m.timing === '저녁') {
        target = (db.cat === '수면' || db.cat === '항정신병') ? bedGoal - 1 : bedGoal - 3
      }
      else target = nowH
      return { med: m, db, target }
    })
    .filter((x): x is { med: MedItem; db: typeof MED_DB[0]; target: number } => x !== null)
    .sort((a, b) => a.target - b.target)[0]

  const lastTake = logs.filter((l) => l.date === today && l.type === 'take' && l.time != null).sort((a, b) => (b.time ?? 0) - (a.time ?? 0))[0]
  const lastMedDb = lastTake ? MED_DB.find((d) => d.name === meds.find((m) => m.timing === lastTake.timing)?.name) : null

  let actionMsg = ''
  if (lastTake && lastMedDb && lastMedDb.duration < 24) {
    const endH = lastTake.time! + lastMedDb.duration
    const remaining = endH - nowH
    if (remaining > 0) {
      actionMsg = `${lastMedDb.name} 효과 ${fmtHM(endH)}까지 (남은 ${remaining.toFixed(1)}h). `
    }
  }
  if (upcomingMed) {
    const diffH = upcomingMed.target - nowH
    if (diffH > 0 && diffH < 4) {
      actionMsg += `다음: ${upcomingMed.med.name} ${fmtHM(upcomingMed.target)} (${diffH.toFixed(1)}h 후) 권장`
    } else if (diffH <= 0) {
      actionMsg += `🚨 ${upcomingMed.med.name} 지금 복용 권장 (${(-diffH).toFixed(1)}h 지났어)`
    } else {
      actionMsg += `다음: ${upcomingMed.med.name} ${fmtHM(upcomingMed.target)} 권장`
    }
  } else if (lastTake) {
    actionMsg += `오늘 등록 약 다 먹었어 ✅`
  }

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* 🎯 다음 액션 — 가장 prominent */}
      {actionMsg && (
        <div style={{
          background: 'linear-gradient(135deg, var(--pink), color-mix(in srgb, var(--pink) 80%, #fff))',
          color: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 12,
          fontSize: 12, fontWeight: 700, lineHeight: 1.6,
        }}>
          🎯 {actionMsg}
        </div>
      )}
      <div style={{ position: 'relative', paddingLeft: 14 }}>
        {/* vertical guide line */}
        <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'var(--pl)' }} />
        {events.map((ev, i) => {
          const isPast = ev.time < nowH
          const isNow = Math.abs(ev.time - nowH) < 0.5
          return (
            <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
              {/* dot */}
              <div style={{
                position: 'absolute', left: -14 + 7 - 5,
                width: 10, height: 10, borderRadius: '50%',
                background: isNow ? 'var(--pink)' : (ev.color || 'var(--pink)'),
                boxShadow: isNow ? '0 0 0 4px color-mix(in srgb, var(--pink) 30%, transparent)' : 'none',
                opacity: isPast && !isNow ? 0.4 : 1,
              }} />
              {/* time */}
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--pd)',
                minWidth: 42, fontFeatureSettings: '"tnum"',
                opacity: isPast && !isNow ? 0.5 : 1,
              }}>{fmtHM(ev.time)}</div>
              {/* card */}
              <div style={{
                flex: 1, background: '#fff', borderRadius: 10,
                padding: '8px 10px', border: '1px solid #f0f0f0',
                opacity: isPast && !isNow ? 0.55 : 1,
                ...(isNow ? { borderColor: 'var(--pink)', borderWidth: 1.5, background: 'color-mix(in srgb, var(--pl) 70%, #fff)' } : {}),
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{ev.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', flex: 1 }}>{ev.title}</span>
                  {ev.actionable && !ev.taken && (
                    <button
                      onClick={ev.onTake}
                      style={{
                        background: 'var(--pink)', color: '#fff', border: 'none',
                        padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                      }}>{ev.actionLabel || '먹었어'}</button>
                  )}
                  {ev.taken && ev.onUntake && (
                    <button
                      onClick={ev.onUntake}
                      title="복용 기록 되돌리기"
                      style={{
                        background: 'none', border: '1px solid #eee',
                        color: '#aaa', padding: '3px 8px', borderRadius: 99,
                        fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      }}>↺</button>
                  )}
                </div>
                {ev.sub && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{ev.sub}</div>}
                {/* 그룹 카드 — 같은 timing 약들 함께 노출 */}
                {ev.medRows && ev.medRows.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {ev.medRows.map((mr, mi) => (
                      <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', background: 'var(--pl)', borderRadius: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: mr.color, color: '#fff' }}>{mr.cat}</span>
                        <span style={{ fontSize: 11, color: 'var(--pd)', fontWeight: 700 }}>{mr.name}</span>
                        <span style={{ fontSize: 10, color: '#888' }}>{mr.dose}</span>
                        {mr.info && <span style={{ fontSize: 9, color: '#aaa', marginLeft: 'auto' }}>{mr.info}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 📊 주간 분석 — 누적 패턴 기반 조언 */}
      <PatternAdviceCard logs={logs} meds={meds} bedGoal={bedGoal} wakeGoal={wakeGoal} />

      <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center', padding: '12px 0' }}>
        🧪 개발자 미리보기 — 시간 흐름 view
      </div>
    </div>
  )
}

// ── 📊 7일 / 30일 패턴 분석 카드 ─────────────────────────────────────────────
interface PatternProps {
  logs: ReturnType<typeof useMedStore.getState>['logs']
  meds: MedItem[]
  bedGoal: number
  wakeGoal: number  // 인터페이스에는 남겨 호출부 안 깨지게
}
function PatternAdviceCard({ logs, meds, bedGoal }: PatternProps) {
  const [range, setRange] = useState<7 | 30>(7)

  const dateSet = (() => {
    const out = new Set<string>()
    for (let i = 0; i < range; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      out.add(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))
    }
    return out
  })()

  const fmt = (h: number) => {
    const adj = ((h % 24) + 24) % 24
    const hh = Math.floor(adj)
    const mm = Math.round((adj % 1) * 60)
    return hh + ':' + String(mm).padStart(2, '0')
  }

  // 평균 헬퍼
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const stddev = (arr: number[]) => {
    if (arr.length < 2) return 0
    const m = avg(arr)!
    const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length
    return Math.sqrt(v)
  }

  const bedTimes = logs.filter((l) => l.type === 'bed' && l.time != null && dateSet.has(l.date)).map((l) => l.time!)
  const takeByTiming = (timing: string) => logs.filter((l) => l.type === 'take' && l.timing === timing && l.time != null && dateSet.has(l.date)).map((l) => l.time!)
  const wakeMoods = logs.filter((l) => l.type === 'wake' && l.level != null && dateSet.has(l.date)).map((l) => l.level!)

  const avgBed = avg(bedTimes)
  const avgWake = avg(takeByTiming('아침'))
  const avgWakeMood = avg(wakeMoods)
  const bedVar = stddev(bedTimes)

  // 조언 생성
  const advices: { emoji: string; title: string; body: string; tone: 'good' | 'warn' | 'info' }[] = []

  if (avgBed != null) {
    const diff = avgBed - bedGoal
    if (Math.abs(diff) > 1) {
      advices.push({
        emoji: '🛏',
        title: `실제 취침 평균 ${fmt(avgBed)}`,
        body: `목표 ${fmt(bedGoal)}보다 ${diff > 0 ? '+' : ''}${diff.toFixed(1)}h. 매일 30분씩 당기는 게 현실적.`,
        tone: 'warn',
      })
    } else {
      advices.push({ emoji: '🛏', title: `취침 안정 (평균 ${fmt(avgBed)})`, body: '목표 ±1h 안 — 좋은 패턴', tone: 'good' })
    }
  }

  if (bedVar > 1.5 && bedTimes.length >= 4) {
    advices.push({
      emoji: '🌊',
      title: `취침 변동 ±${bedVar.toFixed(1)}h`,
      body: '들쭉날쭉 → 매일 같은 시각이 ADHD 멜라토닌 안정에 도움',
      tone: 'warn',
    })
  }

  if (avgBed != null && avgWake != null) {
    const sleepH = avgWake > avgBed ? avgWake - avgBed : (24 - avgBed) + avgWake
    if (sleepH < 7) {
      advices.push({
        emoji: '⚠️',
        title: `평균 수면 ${sleepH.toFixed(1)}h`,
        body: `ADHD 권장 8-9h 미달. 컨디션 부족 영향 큼. 취침 ${fmt(bedGoal - (8 - sleepH))} 권장.`,
        tone: 'warn',
      })
    } else {
      advices.push({ emoji: '✅', title: `평균 수면 ${sleepH.toFixed(1)}h`, body: 'ADHD 권장 충족', tone: 'good' })
    }
  }

  if (avgWakeMood != null) {
    const lbl = avgWakeMood < 1.5 ? '낮음' : avgWakeMood < 2.5 ? '보통' : '좋음'
    advices.push({
      emoji: avgWakeMood < 1.5 ? '😵' : avgWakeMood < 2.5 ? '😐' : '🙂',
      title: `아침 컨디션 평균 ${lbl}`,
      body: avgWakeMood < 1.5 ? '수면 부족·약 늦은 복용·취침 늦음 등 원인 가능' : '꾸준히 좋게 유지',
      tone: avgWakeMood < 1.5 ? 'warn' : avgWakeMood < 2.5 ? 'info' : 'good',
    })
  }

  // 약별 조언
  for (const m of meds) {
    const takes = takeByTiming(m.timing)
    if (takes.length < 3) continue
    const avgTake = avg(takes)!
    const v = stddev(takes)
    const db = MED_DB.find((d) => d.name === m.name)
    if (!db) continue
    if (v > 1.5) {
      advices.push({
        emoji: '💊',
        title: `${m.name} 복용 시각 변동 ±${v.toFixed(1)}h`,
        body: `평균 ${fmt(avgTake)} — 일정한 시각이 ${db.cat === '기분조절' || db.cat === '항우울' ? '혈중농도 안정에' : '효과 일관성에'} 중요`,
        tone: 'warn',
      })
    }
    // ADHD 자극제: 늦게 먹으면 수면 방해
    if (db.cat === 'ADHD' && db.duration < 24) {
      const endH = avgTake + db.duration
      if (endH > bedGoal - 4) {
        advices.push({
          emoji: '🚨',
          title: `${m.name} 효과가 취침에 가까움`,
          body: `평균 ${fmt(avgTake)} 복용 → ${fmt(endH)} 종료. 취침 ${fmt(bedGoal)}까지 ${(bedGoal - endH).toFixed(1)}h. 더 일찍 복용 추천.`,
          tone: 'warn',
        })
      }
    }
  }

  if (advices.length === 0 && bedTimes.length === 0 && Object.values(takeByTiming('아침')).length === 0) {
    return (
      <div style={{ background: '#fafafa', borderRadius: 12, padding: 14, marginTop: 12, fontSize: 11, color: '#888', lineHeight: 1.6, textAlign: 'center' }}>
        📊 패턴 분석 — 기록이 3일 이상 쌓이면 조언이 자동으로 나타나
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginTop: 12, border: '1.5px solid var(--pl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--pd)' }}>📊 패턴 분석 ({range}일)</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {([7, 30] as const).map((r) => (
            <button key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '3px 10px', borderRadius: 99,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: range === r ? 'var(--pink)' : '#f3f3f3',
                color: range === r ? '#fff' : '#777',
                fontSize: 10, fontWeight: 700,
              }}>{r}일</button>
          ))}
        </div>
      </div>
      {advices.map((a, i) => {
        const bg = a.tone === 'good' ? '#E8F5EE' : a.tone === 'warn' ? '#FFF1E0' : '#F0F4FF'
        const fg = a.tone === 'good' ? '#1F9D5C' : a.tone === 'warn' ? '#D88532' : '#5B7FFF'
        return (
          <div key={i} style={{ background: bg, borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: fg, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{a.emoji}</span>
              <span>{a.title}</span>
            </div>
            <div style={{ fontSize: 10, color: '#555', lineHeight: 1.6 }}>{a.body}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── 🧠 인사이트 카드 — 신체 정보·수면 목표 기반으로 약 복용 권장 시각 + 수면 분석 ────
function InsightsCard() {
  const config = useMedStore((s) => s.config)
  const logs = useMedStore((s) => s.logs)
  const meds = config?.meds || []
  const bedGoal = config?.bedGoal ?? 23
  const wakeGoal = config?.wakeGoal ?? 7
  const height = config?.height
  const weight = config?.weight

  // 실제 기록 7일 평균 — 3건 이상 모이면 목표 대신 실제 사용
  const last7Days: Set<string> = (() => {
    const out = new Set<string>()
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      out.add(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))
    }
    return out
  })()
  const bedTimes = logs.filter((l) => l.type === 'bed' && l.time != null && last7Days.has(l.date)).map((l) => l.time!)
  const wakeTimes = logs.filter((l) => l.type === 'take' && l.timing === '아침' && l.time != null && last7Days.has(l.date)).map((l) => l.time!)
  const avgBedActual = bedTimes.length >= 3 ? bedTimes.reduce((a, b) => a + b, 0) / bedTimes.length : null
  const avgWakeActual = wakeTimes.length >= 3 ? wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length : null
  const usingActual = avgBedActual != null || avgWakeActual != null
  const effBed = avgBedActual != null ? avgBedActual : bedGoal
  const effWake = avgWakeActual != null ? avgWakeActual : wakeGoal

  // 취침 → 기상 사이 시간 (자정 넘어가면 +24) — 실제 기록 우선, 없으면 목표
  const sleepHours = effWake > effBed ? effWake - effBed : (24 - effBed) + effWake
  // ADHD 권장 8-9시간
  const sleepStatus = sleepHours >= 8 ? 'ok' : 'short'

  // BMI
  const bmi = (height && weight && Number(height) > 0)
    ? (Number(weight) / Math.pow(Number(height) / 100, 2))
    : null
  const bmiLabel = bmi == null ? null
    : bmi < 18.5 ? '저체중' : bmi < 23 ? '정상' : bmi < 25 ? '과체중' : '비만'

  // 약별 권장 시각 — 각 약의 duration·peak·timing·note·name 을 모두 고려.
  const recs = meds.map((m) => {
    const db = MED_DB.find((d) => d.name === m.name)
    if (!db) return null
    let when: string
    let reason: string

    // 카테고리·timing·duration·name 조합으로 개별 약 맞춤 권장
    const isStimShort = db.cat === 'ADHD' && db.duration < 24  // 자극제 단기형
    const isStimLong = db.cat === 'ADHD' && db.duration >= 24  // 누적형 ADHD (스트라테라·인튜니브 등)
    const isSleep = db.cat === '수면'
    const isAntipsych = db.cat === '항정신병'
    const isAntidep = db.cat === '항우울'
    const isMood = db.cat === '기분조절'
    const isAnxiolytic = db.cat === '항불안'

    if (isStimShort) {
      const endByH = effBed - 6
      const latestTake = endByH - db.duration
      const ideal = Math.min(latestTake, effWake + 0.5)
      const take = Math.max(effWake, ideal)
      const endTime = take + db.duration
      const buffer = effBed - endTime
      when = fmtHM(take) + ' (식후)'
      if (db.duration <= 5) {
        reason = `${db.peak} 빠른 효과·짧음 (${db.duration}h) — 필요 시 ${fmtHM(take + db.duration)} 추가 복용`
      } else {
        reason = `효과 ${fmtHM(endTime)} 종료 — 취침 ${fmtHM(effBed)}까지 ${buffer.toFixed(1)}h 여유`
      }
    } else if (isStimLong) {
      const isEvening = db.timing === '저녁'
      const take = isEvening ? effBed - 1 : effWake + 0.5
      when = fmtHM(take) + (isEvening ? ' (취침 1h 전)' : ' (기상 직후 식후)')
      reason = `누적형 ${db.duration}h · ${db.peak} — 매일 같은 시각 복용 (효과는 2~4주 후)`
    } else if (isSleep) {
      const take = effBed - 0.5
      when = fmtHM(take)
      reason = `취침 ${fmtHM(effBed)} 30분 전 — 7~8h 수면 확보 후 다음 날 영향 X`
    } else if (isAntipsych) {
      // 세로켈/아빌리파이
      if (db.timing === '저녁') {
        const take = effBed - 1
        when = fmtHM(take)
        reason = `취침 1h 전 — 졸림 효과로 수면 보조`
      } else {
        when = fmtHM(effWake + 0.5) + ' (식후)'
        reason = `누적 ${db.duration}h — 매일 같은 시각 (반감기 길어 안정적)`
      }
    } else if (isAntidep) {
      const isEvening = db.timing === '저녁'
      const take = isEvening ? effBed - 0.5 : effWake + 0.5
      when = fmtHM(take) + (isEvening ? ' (취침 30분 전)' : ' (식후)')
      const isInsomniaRisk = /(부프로피온|sertraline|에스시탈로프람)/i.test(db.generic) || db.sides.some((s) => s.includes('불면'))
      reason = isEvening
        ? '졸림 부작용 → 저녁 복용 (취침 보조)'
        : isInsomniaRisk ? '아침 복용 권장 — 저녁 X (불면 부작용)' : '대부분 누적형 — 아침에 매일 같은 시각'
    } else if (isMood) {
      const isEvening = db.timing === '저녁'
      const take = isEvening ? effBed - 1 : effWake + 0.5
      when = fmtHM(take) + (isEvening ? '' : ' (식후)')
      reason = `누적 ${db.duration}h · ${db.peak} — 매일 같은 시각 (혈중농도 안정 중요)`
    } else if (isAnxiolytic) {
      when = '필요할 때만'
      reason = `의존성 위험 — 매일 X. 증상(불안·공황) 있을 때 ${db.peak}로 빠른 효과`
    } else {
      when = m.timing || '?'
      reason = `${db.duration}h 지속 · ${db.peak}`
    }
    return { name: m.name, dose: m.dose, when, reason, cat: db.cat }
  }).filter(Boolean) as Array<{ name: string; dose: string; when: string; reason: string; cat: string }>

  return (
    <div style={{ background: 'linear-gradient(135deg, #FFF6F8 0%, #fff 100%)', border: '1.5px solid var(--pink)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--pd)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        🧠 너의 인사이트
        <span style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>· 목표·신체 기반</span>
      </div>

      {/* 수면 분석 */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          🛏 수면
          <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: usingActual ? '#56C6A0' : '#ddd', color: '#fff' }}>
            {usingActual ? '실제 7일 평균' : '목표 시간'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
          취침 <b>{fmtHM(effBed)}</b> → 기상 <b>{fmtHM(effWake)}</b> = <b>{sleepHours.toFixed(1)}시간</b>
        </div>
        {sleepStatus === 'short' ? (
          <div style={{ fontSize: 10, color: '#E24B4A', marginTop: 4 }}>
            ⚠️ ADHD 권장 8-9시간 미달 — {(8 - sleepHours).toFixed(1)}h 부족
          </div>
        ) : (
          <div style={{ fontSize: 10, color: '#56C6A0', marginTop: 4 }}>✅ ADHD 권장 8-9시간 만족</div>
        )}
        {!usingActual && (
          <div style={{ fontSize: 9, color: '#aaa', marginTop: 4 }}>
            💡 취침·아침약 기록 3건 이상 쌓이면 실제 평균으로 자동 전환
          </div>
        )}
      </div>

      {/* BMI */}
      {bmi != null && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 4 }}>📐 BMI</div>
          <div style={{ fontSize: 11, color: '#555' }}>
            {bmi.toFixed(1)} <span style={{ color: '#888' }}>· {bmiLabel}</span>
          </div>
          <div style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>
            의사가 약 용량 결정할 때 참고할 수 있는 정보 (자가 판단 X)
          </div>
        </div>
      )}

      {/* 약별 권장 시각 */}
      {recs.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 6 }}>💊 약별 권장 시각</div>
          {recs.map((r, i) => {
            const cc = CAT_COLORS[r.cat] || 'var(--pink)'
            return (
              <div key={i} style={{ marginBottom: i === recs.length - 1 ? 0 : 6, paddingBottom: i === recs.length - 1 ? 0 : 6, borderBottom: i === recs.length - 1 ? 'none' : '1px dashed #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: cc, color: '#fff' }}>{r.cat}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)' }}>{r.name} {r.dose}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: 'var(--pink)' }}>{r.when}</span>
                </div>
                {r.reason && <div style={{ fontSize: 10, color: '#888', lineHeight: 1.5 }}>{r.reason}</div>}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
        💡 권장 시각은 일반적 가이드 — 실제 복용은 의사 처방 따르세요
      </div>
    </div>
  )
}

function fmtHM(h: number): string {
  const adj = ((h % 24) + 24) % 24
  const hh = Math.floor(adj)
  const mm = Math.round((adj % 1) * 60)
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
  const devOn = isDevMode()
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
      ) : devOn ? (
        // 🧪 개발자 모드: 시간 흐름 view 미리보기
        <TimelineHealthView />
      ) : (
        <>
          {/* 인사이트 — 신체·수면 목표 + 등록된 약 기반으로 권장 시각 계산 */}
          <InsightsCard />
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
