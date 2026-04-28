import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { getFirebaseApp } from './firebase'

function getAuthInstance() {
  return getAuth(getFirebaseApp())
}

export async function signInWithGoogle(): Promise<void> {
  const auth = getAuthInstance()
  const provider = new GoogleAuthProvider()
  await signInWithPopup(auth, provider)
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const auth = getAuthInstance()
  try {
    await signInWithEmailAndPassword(auth, email, password)
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      await createUserWithEmailAndPassword(auth, email, password)
    } else {
      throw e
    }
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getAuthInstance()
  await signOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  const auth = getAuthInstance()
  return onAuthStateChanged(auth, callback)
}
