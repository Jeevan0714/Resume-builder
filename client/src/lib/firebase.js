import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAM8eX9TYkwsNm7aKp6wTvzXtngPMpn4Lg",
  authDomain: "farmfit-3f119.firebaseapp.com",
  databaseURL: "https://farmfit-3f119-default-rtdb.firebaseio.com",
  projectId: "farmfit-3f119",
  storageBucket: "farmfit-3f119.firebasestorage.app",
  messagingSenderId: "322363305754",
  appId: "1:322363305754:web:7801f195f5dbad20aac6a3"
};

const app      = initializeApp(firebaseConfig)
export const auth     = getAuth(app)
export const db       = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
