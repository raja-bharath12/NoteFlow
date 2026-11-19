/**
 * AuthContext.tsx  — Firebase-powered authentication context
 *
 * Strategy:
 *  1. Firebase Auth handles login / registration / Google sign-in.
 *  2. On every auth state change, the Firebase ID token is stored in
 *     localStorage and used as the Bearer token for the Spring Boot API.
 *  3. The user profile is persisted in Firestore (src/lib/firebaseDb.ts)
 *     so it can be enriched with app-specific data beyond what Firebase stores.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  firebaseLogin,
  firebaseRegister,
  firebaseSignOut,
  firebaseForgotPassword,
  firebaseGoogleSignIn,
  firebaseUpdateProfile,
  firebaseChangePassword,
  firebaseDeleteAccount,
} from '@/lib/firebaseAuth'
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
} from '@/lib/firebaseDb'
import { uploadAvatar } from '@/lib/firebaseStorage'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AppUser {
  uid: string
  email: string
  username: string
  avatarUrl?: string
  isEmailVerified: boolean
  createdAt?: string
  firebaseUser: FirebaseUser
}

interface AuthContextType {
  user: AppUser | null
  isLoading: boolean
  isAuthenticated: boolean
  // Core auth
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  // Profile management
  updateUser: (data: Partial<{ username: string; avatarUrl: string }>) => Promise<void>
  uploadUserAvatar: (file: File) => Promise<string>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  // Token access (for backend API calls)
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Build AppUser from Firebase user + Firestore profile
  const buildAppUser = useCallback(
    async (firebaseUser: FirebaseUser): Promise<AppUser> => {
      let profile: any = await getUserProfile(firebaseUser.uid)

      // Auto-create Firestore profile if first login
      if (!profile) {
        const username =
          firebaseUser.displayName ??
          firebaseUser.email?.split('@')[0] ??
          'User'
        await createUserProfile(firebaseUser.uid, {
          email: firebaseUser.email!,
          username,
          avatarUrl: firebaseUser.photoURL ?? undefined,
        })
        profile = { username, avatarUrl: firebaseUser.photoURL }
      }

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        username: profile.username ?? firebaseUser.displayName ?? 'User',
        avatarUrl: profile.avatarUrl ?? firebaseUser.photoURL ?? undefined,
        isEmailVerified: firebaseUser.emailVerified,
        createdAt: profile.createdAt?.toDate?.()?.toISOString(),
        firebaseUser,
      }
    },
    []
  )

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          localStorage.setItem('accessToken', idToken)
          const appUser = await buildAppUser(firebaseUser)
          setUser(appUser)
        } catch {
          setUser(null)
        }
      } else {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setUser(null)
      }
      setIsLoading(false)
    })

    // Refresh Firebase ID token every 50 minutes (expires at 60 min)
    const tokenRefreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken(true)
        localStorage.setItem('accessToken', token)
      }
    }, 50 * 60 * 1000)

    return () => {
      unsubscribe()
      clearInterval(tokenRefreshInterval)
    }
  }, [buildAppUser])

  // ─── Auth actions ──────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    await firebaseLogin(email, password)
    // onAuthStateChanged will update state
  }

  const loginWithGoogle = async () => {
    await firebaseGoogleSignIn()
  }

  const register = async (email: string, username: string, password: string) => {
    const fbUser = await firebaseRegister(email, password, username)
    // Write Firestore profile but don't block registration on it
    createUserProfile(fbUser.uid, { email, username }).catch(() => {})
  }


  const logout = async () => {
    await firebaseSignOut()
    setUser(null)
  }

  const forgotPassword = async (email: string) => {
    await firebaseForgotPassword(email)
    toast.success('Password reset email sent! Check your inbox.')
  }

  // ─── Profile actions ───────────────────────────────────────────────────────
  const updateUser = async (data: Partial<{ username: string; avatarUrl: string }>) => {
    if (!user) return
    await updateUserProfile(user.uid, data)
    if (data.username) await firebaseUpdateProfile(data.username, data.avatarUrl)
    setUser(prev => prev ? { ...prev, ...data } : null)
  }

  const uploadUserAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated')
    const url = await uploadAvatar(user.uid, file)
    await updateUserProfile(user.uid, { avatarUrl: url })
    await firebaseUpdateProfile(undefined, url)
    setUser(prev => prev ? { ...prev, avatarUrl: url } : null)
    return url
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await firebaseChangePassword(currentPassword, newPassword)
    toast.success('Password changed successfully')
  }

  const deleteAccount = async (password: string) => {
    await firebaseDeleteAccount(password)
    setUser(null)
  }

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null
    return auth.currentUser.getIdToken()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
        forgotPassword,
        updateUser,
        uploadUserAvatar,
        changePassword,
        deleteAccount,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
