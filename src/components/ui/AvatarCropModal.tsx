// Drag-and-zoom crop UI before saving an uploaded avatar. Outputs a 96x96
// JPEG dataURL — same constraints as fileToAvatarDataUrl.
import { useEffect, useRef, useState } from 'react'

interface Props {
  file: File
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}

const VIEWPORT = 240
const OUT_SIZE = 96
const QUALITY = 0.8

export function AvatarCropModal({ file, onCancel, onConfirm }: Props) {
  const [src, setSrc] = useState<string>('')
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null)
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null)

  useEffect(() => {
    if (!file.type.startsWith('image/')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('이미지 파일만 가능해요')
      return
    }
    const url = URL.createObjectURL(file)
     
    setSrc(url)
    const im = new Image()
    im.onload = () => {
      // Default scale: shorter edge fills the viewport
      const minSide = Math.min(im.naturalWidth, im.naturalHeight)
      const initial = VIEWPORT / minSide
      setImgSize({ w: im.naturalWidth, h: im.naturalHeight })
      setScale(initial)
      setTx(0)
      setTy(0)
    }
    im.onerror = () => setError('이미지를 읽지 못했어요')
    im.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  function clampPan(nx: number, ny: number, s: number) {
    const w = imgSize.w * s
    const h = imgSize.h * s
    const maxX = Math.max(0, (w - VIEWPORT) / 2)
    const maxY = Math.max(0, (h - VIEWPORT) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny)),
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'touch' && (e.target as HTMLElement).hasPointerCapture) {
      // single-finger drag handled here; pinch handled by touchmove handler
    }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startTx: tx, startTy: ty }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const next = clampPan(dragRef.current.startTx + dx, dragRef.current.startTy + dy, scale)
    setTx(next.x)
    setTy(next.y)
  }

  function onPointerUp() {
    dragRef.current = null
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length !== 2) return
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    if (!pinchRef.current) {
      pinchRef.current = { startDist: dist, startScale: scale }
    } else {
      const ratio = dist / pinchRef.current.startDist
      const next = Math.max(0.2, Math.min(5, pinchRef.current.startScale * ratio))
      setScale(next)
    }
  }

  function onTouchEnd() {
    pinchRef.current = null
  }

  async function confirm() {
    try {
      const im = new Image()
      const url = src
      await new Promise<void>((resolve, reject) => {
        im.onload = () => resolve()
        im.onerror = () => reject(new Error('이미지 로드 실패'))
        im.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = OUT_SIZE
      canvas.height = OUT_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 컨텍스트 실패')
      // The visible portion of the image inside the viewport corresponds to:
      //   center of image is at (W/2 + tx/scale, H/2 + ty/scale) in image coords
      //   the viewport shows VIEWPORT/scale image-pixels around that center.
      const imgCenterX = imgSize.w / 2 - tx / scale
      const imgCenterY = imgSize.h / 2 - ty / scale
      const sourceSide = VIEWPORT / scale
      ctx.drawImage(
        im,
        imgCenterX - sourceSide / 2,
        imgCenterY - sourceSide / 2,
        sourceSide,
        sourceSide,
        0, 0, OUT_SIZE, OUT_SIZE,
      )
      const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
      if (dataUrl.length > 200_000) throw new Error('이미지가 너무 커요')
      onConfirm(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : '실패')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, width: '100%', maxWidth: 320 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', marginBottom: 10, textAlign: 'center' }}>📷 사진 조정</div>

        {error ? (
          <div style={{ color: '#E24B4A', fontSize: 12, padding: 12, textAlign: 'center' }}>{error}</div>
        ) : (
          <>
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{
                width: VIEWPORT,
                height: VIEWPORT,
                margin: '0 auto',
                borderRadius: VIEWPORT / 2,
                overflow: 'hidden',
                background: '#000',
                position: 'relative',
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
              }}
            >
              {src && imgSize.w > 0 && (
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: imgSize.w,
                    height: imgSize.h,
                    transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scale})`,
                    transformOrigin: 'center',
                    pointerEvents: 'none',
                    maxWidth: 'none',
                  }}
                />
              )}
            </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#888' }}>🔍</span>
              <input
                type="range"
                min="0.2"
                max="5"
                step="0.05"
                value={scale}
                onChange={(e) => {
                  const next = parseFloat(e.target.value)
                  setScale(next)
                  const clamped = clampPan(tx, ty, next)
                  setTx(clamped.x)
                  setTy(clamped.y)
                }}
                style={{ flex: 1 }}
              />
            </div>

            <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 6 }}>
              드래그해서 위치 조정 · 슬라이더로 줌
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={onCancel} style={{ flex: 1, padding: 10, borderRadius: 10, border: '1.5px solid #ddd', background: '#fff', color: '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
              <button onClick={confirm} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
