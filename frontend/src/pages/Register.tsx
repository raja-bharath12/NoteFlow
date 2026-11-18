import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
  Share2,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' }
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' }
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' }
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' }
      default:
        return { score: 0, label: '', color: 'bg-slate-200', text: 'text-slate-400' }
    }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (!agreeTerms) {
      toast.error('Please agree to the Terms of Service')
      return
    }

    setIsLoading(true)
    try {
      await register(email, name, password)
      toast.success('Account created! Welcome to NoteFlow 🎉')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      // Map Firebase error codes to friendly messages
      const code = err?.code || ''
      if (code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists. Try signing in.')
      } else if (code === 'auth/invalid-email') {
        toast.error('Invalid email address.')
      } else if (code === 'auth/weak-password') {
        toast.error('Password is too weak. Use at least 6 characters.')
      } else if (code === 'auth/network-request-failed') {
        toast.error('Network error. Check your internet connection.')
      } else {
        toast.error(err.message || 'Failed to create account')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Left side - Blue gradient branding */}
      <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 text-white p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

        <div className="relative z-10 my-auto max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl shadow-lg">
              N
            </div>
            <span className="text-2xl font-bold tracking-tight">NoteFlow</span>
          </div>

          <h1 className="text-4xl font-extrabold mb-4 leading-tight tracking-tight">
            Start organizing
            <br />
            with clarity & speed
          </h1>
          <p className="text-blue-100 text-lg mb-12 leading-relaxed">
            Join thousands of professionals, writers, and teams capturing knowledge without limits.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: Sparkles,
                title: 'Clean, Distraction-Free UI',
                desc: 'A modern design focused on speed, readability, and delight',
              },
              {
                icon: Share2,
                title: 'Seamless Sharing & Export',
                desc: 'Export to Markdown, PDF, or share instantly with permissions',
              },
              {
                icon: ShieldCheck,
                title: 'Security & Version History',
                desc: 'Automatic version backups and granular access controls',
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.4 }}
                className="flex items-start gap-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-sm hover:bg-white/15 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-base">{feature.title}</div>
                  <div className="text-blue-100 text-sm leading-snug">{feature.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md py-4"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              N
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">NoteFlow</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Create your account
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Start your free 14-day workspace trial today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Alex Morgan"
                  required
                  id="register-name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Work or personal email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="alex@example.com"
                  required
                  id="register-email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12"
                  placeholder="At least 8 characters"
                  required
                  id="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          step <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Strength:</span>
                    <span className={`font-semibold ${passwordStrength.text}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-12 pr-12"
                  placeholder="Re-type password"
                  required
                  id="register-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && password === confirmPassword && (
                <p className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                </p>
              )}
            </div>

            {/* Terms of Service Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  id="register-terms"
                />
                <span>
                  I agree to the{' '}
                  <span className="text-blue-600 hover:underline">Terms of Service</span> and{' '}
                  <span className="text-blue-600 hover:underline">Privacy Policy</span>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base shadow-lg shadow-blue-500/25 mt-2"
              id="register-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
