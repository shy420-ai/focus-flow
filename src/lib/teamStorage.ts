// Photo upload for team check-ins. Compresses client-side then pushes to
// Firebase Storage at team-photos/{teamId}/{postId}.jpg. Returns download
// URL to embed into the Firestore post.
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseApp } from './firebase'

// Compress an image File to a JPEG blob, max edge `maxDim`px, quality `q`.
// Mobile photos can be 5MB+ — we never want to upload that raw.
export async function compressImage(file: File, maxDim = 800, q = 0.7): Promise<Blob> {
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
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('compress failed'))), 'image/jpeg', q)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function uploadTeamPhoto(teamId: string, postId: string, blob: Blob): Promise<string> {
  const storage = getStorage(getFirebaseApp())
  const path = `team-photos/${teamId}/${postId}.jpg`
  const r = storageRef(storage, path)
  await uploadBytes(r, blob, { contentType: 'image/jpeg' })
  return await getDownloadURL(r)
}
