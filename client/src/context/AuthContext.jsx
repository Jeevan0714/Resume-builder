import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Load Firestore profile
        const ref  = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)
        setProfile(snap.exists() ? snap.data() : null)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Create Firestore user doc on first sign-up
  const createUserDoc = async (firebaseUser, extra = {}) => {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid:         firebaseUser.uid,
        email:       firebaseUser.email,
        displayName: firebaseUser.displayName || extra.displayName || '',
        photoURL:    firebaseUser.photoURL || '',
        createdAt:   serverTimestamp(),
        masterResume: null,
        ...extra,
      })
    }
  }

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const registerWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await createUserDoc(cred.user, { displayName })
    return cred
  }

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider)
    await createUserDoc(cred.user)
    return cred
  }

  const logout = () => signOut(auth)

  const getToken = () => user?.getIdToken()

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, registerWithEmail, loginWithGoogle, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
