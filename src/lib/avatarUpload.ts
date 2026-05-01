// Reads an image file, square-crops the center, resizes to 96x96, and returns a
// JPEG data URL at quality 0.75 — small enough to live inside the user's
// Firestore doc (~10KB) without needing Firebase Storage.
const MAX_SIDE = 96
const QUALITY = 0.75

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 가능해요')
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = () => reject(new Error('이미지를 읽지 못했어요'))
      im.src = url
    })

    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const sx = (img.naturalWidth - side) / 2
    const sy = (img.naturalHeight - side) / 2

    const canvas = document.createElement('canvas')
    canvas.width = MAX_SIDE
    canvas.height = MAX_SIDE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 컨텍스트를 만들지 못했어요')
    ctx.drawImage(img, sx, sy, side, side, 0, 0, MAX_SIDE, MAX_SIDE)

    const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
    if (dataUrl.length > 200_000) {
      throw new Error('이미지가 너무 커요')
    }
    return dataUrl
  } finally {
    URL.revokeObjectURL(url)
  }
}
