import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { notificationService } from '@/services/notificationService'
import SearchModal from '@/components/common/SearchModal'
import toast from 'react-hot-toast'

export interface TopBarProps {
  onMobileMenuToggle: () => void
}

export const TopBar: React.FC<TopBarProps> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread notifications
  useEffect(() => {
    let isMounted = true
    const fetchUnread = async () => {
      try {
        const count = await notificationService.getUnreadCount()
        if (isMounted) setUnreadCount(count)
      } catch {
        // Ignore
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Dynamic page title / breadcrumbs
  const getPageInfo = () => {
    const path = location.pathname
    if (path.startsWith('/dashboard')) return { title: 'Dashboard', category: 'Overview' }
    if (path.startsWith('/recent')) return { title: 'Recent Documents', category: 'Activity' }
    if (path.startsWith('/starred')) return { title: 'Starred', category: 'Favorites' }
    if (path.startsWith('/shared')) return { title: 'Shared with me', category: 'Collaboration' }
    if (path.startsWith('/folders')) return { title: 'Folder View', category: 'Workspace' }
    if (path.startsWith('/documents')) return { title: 'Document Editor', category: 'Editor' }
    if (path.startsWith('/notifications')) return { title: 'Notifications', category: 'Activity' }
    if (path.startsWith('/trash')) return { title: 'Trash', category: 'Workspace' }
    if (path.startsWith('/settings')) return { title: 'Settings', category: 'Account' }
    return { title: 'NoteFlow', category: 'App' }
  }

  const pageInfo = getPageInfo()

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false)
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 z-20 flex-shrink-0">
        {/* Left: Mobile hamburger & Dynamic page title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                {pageInfo.category}
              </span>
              <span className="text-xs text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {pageInfo.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar trigger */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs sm:text-sm font-medium">Quick search anything...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Action Icons: Search (mobile), Theme toggle, Notifications, Avatar Menu */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Notifications button */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Divider */}
          <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* User Avatar + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline max-w-[100px] truncate">
                {user?.name || 'Account'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email || 'user@example.com'}
                  </p>
                  {user?.role && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {user.role}
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div className="p-1 space-y-0.5">
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme()
                      setUserMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>Appearance</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400 capitalize">
                      {isDark ? 'Dark' : 'Light'}
                    </span>
                  </button>
                </div>

                {/* Logout row */}
                <div className="p-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

export default TopBar
