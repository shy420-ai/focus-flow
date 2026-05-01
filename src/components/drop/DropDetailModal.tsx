// Rich-edit modal for a single drop: title, multi-line note, tags,
// optional photo, template choice. Photo uses the same canvas resize
// path as avatar uploads so the data URL stays under ~30KB.
import { useState, useEffect } from 'react'
import { useBackClose } from '../../hooks/useBackClose'
import { showConfirm } from '../../lib/showConfirm'
import { TemplateEditModal } from './TemplateEditModal'
import { loadTemplates, type DropTemplate } from './dropTemplates'
import type { DropItem } from '../../types/drop'

interface Props {
  item: DropItem
  onSave: (patch: Partial<DropItem>) => void
  onDelete: () => void
  onClose: () => void
}

const MAX_IMG_SIDE = 480
const IMG_QUALITY = 0.7

async function fileToImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 가능해요')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = () => reject(new Error('이미지 로드 실패'))
      im.src = url
    })
    const ratio = Math.min(1, MAX_IMG_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * ratio)
    const h = Math.round(img.naturalHeight * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 실패')
    ctx.drawImage(img, 0, 0, w, h)
    const dataUrl = canvas.toDataURL('image/jpeg', IMG_QUALITY)
    if (dataUrl.length > 250_000) throw new Error('이미지가 너무 커요')
    return dataUrl
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function DropDetailModal({ item, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(item.name)
  const [note, setNote] = useState(item.note || '')
  const [tagsStr, setTagsStr] = useState((item.tags || []).join(' '))
  const [imageUrl, setImageUrl] = useState(item.imageUrl || '')
  const [template, setTemplate] = useState(item.template || '')
  const [imgError, setImgError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<DropTemplate[]>(() => loadTemplates())
  const [showTemplateEdit, setShowTemplateEdit] = useState(false)
  useBackClose(true, onClose)

  useEffect(() => {
    function refresh() { setTemplates(loadTemplates()) }
    window.addEventListener('ff-drop-templates-changed', refresh)
    return () => window.removeEventListener('ff-drop-templates-changed', refresh)
  }, [])

  // Auto-save on close — drops are casual, no separate save button needed.
  useEffect(() => {
    return () => {
      onSave({
        name: name.trim() || item.name,
        note: note || undefined,
        tags: parseTagString(tagsStr),
        imageUrl: imageUrl || undefined,
        template: template || undefined,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, note, tagsStr, imageUrl, template])

  async function handleFile(file: File | null) {
    if (!file) return
    setImgError(null)
    try {
      const url = await fileToImageDataUrl(file)
      setImageUrl(url)
    } catch (err) {
      setImgError(err instanceof Error ? err.message : '실패')
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)', zIndex: 9300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>📦 메모 편집</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Template picker */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>템플릿</div>
              <button
                onClick={() => setShowTemplateEdit(true)}
                style={{ fontSize: 10, color: '#aaa', background: 'none', border: '1px solid #eee', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
              >편집</button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {templates.map((t) => {
                const active = template === t.id
                return (
                  <button
                    key={t.id || 'none'}
                    onClick={() => setTemplate(t.id)}
                    style={{ padding: '6px 12px', borderRadius: 99, border: '1.5px solid ' + (active ? 'var(--pink)' : '#eee'), background: active ? 'var(--pl)' : '#fff', color: active ? 'var(--pd)' : '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >{t.emoji} {t.label}</button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 6 }}>제목</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Note */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 6 }}>메모 / 본문</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="여러 줄도 가능. 떠오르는 거 다 적어둬"
              rows={6}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Tags */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 6 }}>태그 (#아이디어 #생각 ...)</div>
            <input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="#책추천 #ADHD"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Image */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 6 }}>📷 사진</div>
            {imageUrl ? (
              <div style={{ position: 'relative' }}>
                <img src={imageUrl} alt="" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                <button
                  onClick={() => setImageUrl('')}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 99, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
                >✕</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px', border: '1.5px dashed #ddd', borderRadius: 10, color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                📷 사진 추가
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { handleFile(e.target.files?.[0] || null); e.target.value = '' }} />
              </label>
            )}
            {imgError && <div style={{ fontSize: 10, color: '#E24B4A', marginTop: 4 }}>{imgError}</div>}
          </div>

          <button
            onClick={async () => {
              if (await showConfirm('이 메모 삭제할까?')) { onDelete(); onClose() }
            }}
            style={{ marginTop: 4, padding: 10, borderRadius: 10, border: '1.5px solid #FFE5E5', background: '#FFF6F6', color: '#E24B4A', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >🗑 메모 삭제</button>
        </div>
      </div>

      {showTemplateEdit && <TemplateEditModal onClose={() => setShowTemplateEdit(false)} />}
    </div>
  )
}

function parseTagString(s: string): string[] | undefined {
  // Accept "#a #b" or "a, b" — strip leading # and split on whitespace/commas.
  const parts = s
    .replace(/#/g, '')
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : undefined
}
