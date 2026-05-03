// Photo upload for team check-ins. Compresses client-side then pushes to
// Firebase Storage at team-photos/{teamId}/{postId}.jpg. Returns download
// URL to embed into the Firestore post.
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseApp } from './firebase'

// Compress an image File to a JPEG blob, max edge `maxDim`px, quality `q`.
// Mobile photos can be 5MB+ — we never want to upload that raw.
// If `watermark` is set, burn a cute timestamp into the top-right corner.
// If `caption` is set, burn the user's text into a gradient at the bottom.
export async function compressImage(
  file: File,
  maxDim = 800,
  q = 0.7,
  watermark?: string,
  caption?: string,
): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const longer = Math.max(img.width, img.height)
    const scale = longer > maxDim ? maxDim / longer : 1
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    ctx.drawImage(img, 0, 0, w, h)
    if (caption) drawCaption(ctx, w, h, caption)
    if (watermark) drawWatermark(ctx, w, h, watermark)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('compress failed'))), 'image/jpeg', q)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

const KOREAN_FONT = '-apple-system, "Apple SD Gothic Neo", system-ui, "Noto Sans KR", sans-serif'

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Top-right cute pill — soft white-pink bg + flower prefix + pink text.
function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, text: string): void {
  const fontSize = Math.max(11, Math.round(Math.min(w, h) * 0.034))
  const padX = Math.round(fontSize * 0.8)
  const padY = Math.round(fontSize * 0.45)
  const margin = Math.round(fontSize * 0.7)
  const stamp = '🌸 ' + text
  ctx.font = `700 ${fontSize}px ${KOREAN_FONT}`
  const tw = Math.ceil(ctx.measureText(stamp).width)
  const boxW = tw + padX * 2
  const boxH = fontSize + padY * 2
  const x = w - boxW - margin
  const y = margin
  const r = boxH / 2
  // soft drop shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.18)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  ctx.fillStyle = 'rgba(255,255,255,.92)'
  roundedRect(ctx, x, y, boxW, boxH, r)
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = '#D04574'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(stamp, x + padX, y + boxH / 2)
}

// Center caption — sticker-style white text dead-center on the photo.
// Uses a heavy stroke + soft shadow so it stays readable on bright/dark
// backgrounds without needing a gradient overlay.
function drawCaption(ctx: CanvasRenderingContext2D, w: number, h: number, text: string): void {
  if (!text.trim()) return
  const fontSize = Math.max(18, Math.round(Math.min(w, h) * 0.062))
  const lineHeight = Math.round(fontSize * 1.3)
  const margin = Math.round(fontSize * 1.0)
  ctx.font = `800 ${fontSize}px ${KOREAN_FONT}`
  const maxW = w - margin * 2
  const lines: string[] = []
  let cur = ''
  for (const ch of text) {
    const trial = cur + ch
    if (ctx.measureText(trial).width > maxW && cur) {
      lines.push(cur)
      cur = ch
      if (lines.length === 2) break
    } else {
      cur = trial
    }
  }
  if (lines.length < 2 && cur) lines.push(cur)
  if (lines.length === 2 && cur && cur !== lines[1]) {
    let last = lines[1]
    while (ctx.measureText(last + '…').width > maxW && last.length > 1) last = last.slice(0, -1)
    lines[1] = last + '…'
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Dark stroke + drop shadow → readable on any backdrop, no gradient needed.
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.18))
  ctx.strokeStyle = 'rgba(0,0,0,.6)'
  ctx.shadowColor = 'rgba(0,0,0,.45)'
  ctx.shadowBlur = 6
  ctx.fillStyle = '#fff'
  const cy = h / 2
  const startY = cy - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, i) => {
    const y = startY + i * lineHeight
    ctx.strokeText(line, w / 2, y)
    ctx.fillText(line, w / 2, y)
  })
  ctx.shadowBlur = 0
  ctx.lineWidth = 1
}

// Format current time for the watermark stamp: "5/4 (월) 02:13"
export function watermarkStamp(d = new Date()): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = days[d.getDay()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} (${dow}) ${hh}:${mm}`
}

export async function uploadTeamPhoto(teamId: string, postId: string, blob: Blob): Promise<string> {
  const storage = getStorage(getFirebaseApp())
  const path = `team-photos/${teamId}/${postId}.jpg`
  const r = storageRef(storage, path)
  await uploadBytes(r, blob, { contentType: 'image/jpeg' })
  return await getDownloadURL(r)
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error || new Error('FileReader failed'))
    r.readAsDataURL(blob)
  })
}

// Race a promise against a timeout. Used to fail Storage uploads fast
// when bucket isn't configured yet, so we can fall back to base64.
export function withTimeout<T>(p: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(label)), ms)),
  ])
}
