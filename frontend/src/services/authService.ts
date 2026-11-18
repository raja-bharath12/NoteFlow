import api from './api'
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from '../types'

export const authService = {
  /**
   * Log in user with credentials
   */
  async login(credentialsOrEmail: LoginRequest | string, password?: string, rememberMe?: boolean): Promise<AuthResponse> {
    const payload: LoginRequest = typeof credentialsOrEmail === 'string'
      ? { email: credentialsOrEmail, password: password || '', rememberMe }
      : credentialsOrEmail
    const response = await api.post('/auth/login', payload)
    const result: AuthResponse = response.data.data || response.data
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    localStorage.setItem('user', JSON.stringify(result.user))
    return result
  },

  /**
   * Register a new user
   */
  async register(dataOrName: RegisterRequest | string, emailOrName?: string, password?: string): Promise<AuthResponse> {
    let payload: RegisterRequest
    if (typeof dataOrName === 'string') {
      if (dataOrName.includes('@')) {
        payload = { email: dataOrName, name: emailOrName || '', password: password || '' }
      } else {
        payload = { name: dataOrName, email: emailOrName || '', password: password || '' }
      }
    } else {
      payload = dataOrName
    }
    const response = await api.post('/auth/register', payload)
    const result: AuthResponse = response.data.data || response.data
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    localStorage.setItem('user', JSON.stringify(result.user))
    return result
  },

  /**
   * Log out user and clear local session
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      // Ignore network errors on logout to allow local cleanup
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  },

  /**
   * Request a new access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await api.post('/auth/refresh', { refreshToken })
    const result = response.data.data || response.data
    localStorage.setItem('accessToken', result.accessToken)
    if (result.refreshToken) {
      localStorage.setItem('refreshToken', result.refreshToken)
    }
    return result
  },

  /**
   * Send password reset email instructions
   */
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },

  /**
   * Reset password with reset token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post('/auth/reset-password', data)
  },

  /**
   * Fetch current authenticated user's profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me')
    const user: User = response.data.data || response.data
    localStorage.setItem('user', JSON.stringify(user))
    return user
  },

  /**
   * Update profile information
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/auth/profile', data)
    const user: User = response.data.data || response.data
    localStorage.setItem('user', JSON.stringify(user))
    return user
  },

  /**
   * Upload user avatar image
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const result = response.data.data || response.data
    const currentUser = localStorage.getItem('user')
    if (currentUser) {
      const parsed = JSON.parse(currentUser)
      parsed.avatarUrl = result.avatarUrl
      localStorage.setItem('user', JSON.stringify(parsed))
    }
    return result
  },
}

export default authService
