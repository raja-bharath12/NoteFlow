/**
 * firebaseAuth.ts
 * Firebase Authentication service — wraps Firebase Auth SDK so the
 * rest of the app never imports Firebase directly.
 *
 * Used by AuthContext alongside (or instead of) the Spring Boot JWT API.
 * When a user signs in via Firebase, the Firebase ID token is forwarded to
 * the Spring Boot backend to exchange for an application JWT (optional).
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  deleteUser,
} from 'firebase/auth'
import { auth } from './firebase'

// ─── Auth state listener ────────────────────────────────────────────────────
export function onFirebaseAuthChange(cb: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, cb)
}

// ─── Get current Firebase user ───────────────────────────────────────────────
export function getCurrentFirebaseUser(): FirebaseUser | null {
  return auth.currentUser
}

// ─── Get Firebase ID token (for backend auth) ────────────────────────────────
export async function getFirebaseIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

// ─── Register with email & password ─────────────────────────────────────────
export async function firebaseRegister(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  await sendEmailVerification(credential.user)
  return credential.user
}

// ─── Sign in with email & password ───────────────────────────────────────────
export async function firebaseLogin(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

// ─── Google sign-in ──────────────────────────────────────────────────────────
export async function firebaseGoogleSignIn(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider()
  provider.addScope('email')
  provider.addScope('profile')
  const result = await signInWithPopup(auth, provider)
  return result.user
}

// ─── Sign out ─────────────────────────────────────────────────────────────────
export async function firebaseSignOut(): Promise<void> {
  return signOut(auth)
}

// ─── Send password reset email ───────────────────────────────────────────────
export async function firebaseForgotPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email)
}

// ─── Update display name / photo ─────────────────────────────────────────────
export async function firebaseUpdateProfile(
  displayName?: string,
  photoURL?: string
): Promise<void> {
  if (!auth.currentUser) throw new Error('Not authenticated')
  return updateProfile(auth.currentUser, {
    ...(displayName !== undefined && { displayName }),
    ...(photoURL !== undefined && { photoURL }),
  })
}

// ─── Change password (requires recent login) ─────────────────────────────────
export async function firebaseChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Not authenticated')
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  return updatePassword(user, newPassword)
}

// ─── Delete account ───────────────────────────────────────────────────────────
export async function firebaseDeleteAccount(password: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Not authenticated')
  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)
  return deleteUser(user)
}
