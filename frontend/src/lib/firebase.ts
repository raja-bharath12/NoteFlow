// Firebase configuration for NoteFlow
// Project: onlinenotes-9035d
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyD1tTTEW5LF4sD2CV7oX7hkwUwlFHJG2Rk",
  authDomain: "onlinenotes-9035d.firebaseapp.com",
  projectId: "onlinenotes-9035d",
  storageBucket: "onlinenotes-9035d.firebasestorage.app",
  messagingSenderId: "737131596435",
  appId: "1:737131596435:web:308e655879cca20d78db66",
  measurementId: "G-V7SCP9G98T"
}

// Avoid duplicate app initialisation in hot-reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Core Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Analytics - only in browser
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null)

export default app
