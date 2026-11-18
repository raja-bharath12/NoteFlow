import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

// Public Auth Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Protected Application Pages
import Dashboard from './pages/Dashboard'
import FolderView from './pages/FolderView'
import DocumentEditor from './pages/DocumentEditor'
import SharedView from './pages/SharedView'
import RecentView from './pages/RecentView'
import StarredView from './pages/StarredView'
import TrashView from './pages/TrashView'
import SearchView from './pages/SearchView'
import SettingsView from './pages/SettingsView'
import NotificationsView from './pages/NotificationsView'
import NotFound from './pages/NotFound'

import { Loader2 } from 'lucide-react'

/**
 * Handles root '/' redirection based on authentication state
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes (nested inside AppLayout and ProtectedRoute) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/folder/:folderId" element={<FolderView />} />
        <Route path="/folders/:folderId" element={<FolderView />} />
        <Route path="/document/:documentId" element={<DocumentEditor />} />
        <Route path="/documents/:documentId" element={<DocumentEditor />} />
        <Route path="/shared" element={<SharedView />} />
        <Route path="/recent" element={<RecentView />} />
        <Route path="/starred" element={<StarredView />} />
        <Route path="/trash" element={<TrashView />} />
        <Route path="/search" element={<SearchView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/notifications" element={<NotificationsView />} />
      </Route>

      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
