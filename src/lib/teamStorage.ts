// Photo upload for team check-ins. Compresses client-side then pushes to
// Firebase Storage at team-photos/{teamId}/{postId}.jpg. Returns download
// URL to embed into the Firestore post.
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseApp } from './firebase'

// Compress an image File to a JPEG blob, max edge `maxDim`px, quality `q`.
// Mobile photos can be 5MB+ — we never want to upload that raw.
// If `watermark` is set, burn the text into the bottom-right corner before
// encoding so it survives upload (used to stamp the check-in time).
export async function compressImage(file: File, maxDim = 800, q = 0.7, watermark?: string): Promise<Blob> {
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
    if (watermark) drawWatermark(ctx, w, h, watermark)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('compress failed'))), 'image/jpeg', q)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Bottom-right pill stamp — semi-transparent black bg + white text. Scales
// with the image so it stays readable at thumbnail size too.
function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, text: string): void {
  const fontSize = Math.max(12, Math.round(Math.min(w, h) * 0.038))
  const padX = Math.round(fontSize * 0.7)
  const padY = Math.round(fontSize * 0.4)
  const margin = Math.round(fontSize * 0.6)
  ctx.font = `700 ${fontSize}px -apple-system, "Apple SD Gothic Neo", system-ui, sans-serif`
  const metrics = ctx.measureText(text)
  const tw = Math.ceil(metrics.width)
  const th = fontSize
  const boxW = tw + padX * 2
  const boxH = th + padY * 2
  const x = w - boxW - margin
  const y = h - boxH - margin
  // rounded rect bg
  const r = Math.round(boxH / 2)
  ctx.fillStyle = 'rgba(0,0,0,.55)'
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + boxW, y, x + boxW, y + boxH, r)
  ctx.arcTo(x + boxW, y + boxH, x, y + boxH, r)
  ctx.arcTo(x, y + boxH, x, y, r)
  ctx.arcTo(x, y, x + boxW, y, r)
  ctx.closePath()
  ctx.fill()
  // text
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + boxH / 2)
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
