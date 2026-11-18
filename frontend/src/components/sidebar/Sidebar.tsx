import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Clock,
  Star,
  Users,
  Folder as FolderIcon,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  X,
  Loader2,
  FolderPlus,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { folderService } from '@/services/folderService'
import { notificationService } from '@/services/notificationService'
import { Folder } from '@/types'
import SidebarNavItem from './SidebarNavItem'
import toast from 'react-hot-toast'

export interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

interface FolderNode extends Folder {
  children: FolderNode[]
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
}) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [folders, setFolders] = useState<Folder[]>([])
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set())
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // New folder inline prompt/dialog state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null)

  // Fetch folders and notification counts
  const loadFolders = useCallback(async () => {
    setIsLoadingFolders(true)
    try {
      const data = await folderService.getFolders()
      setFolders(data || [])
    } catch {
      // In case offline or backend not yet populated
      setFolders([])
    } finally {
      setIsLoadingFolders(false)
    }
  }, [])

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadNotifications(count)
    } catch {
      // Ignore
    }
  }, [])

  useEffect(() => {
    loadFolders()
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [loadFolders, loadUnreadCount])

  // Build tree from flat folders list
  const folderTree = useMemo(() => {
    const map = new Map<string, FolderNode>()
    const roots: FolderNode[] = []

    folders.forEach((f) => {
      map.set(f.id, { ...f, children: [] })
    })

    folders.forEach((f) => {
      const node = map.get(f.id)
      if (node) {
        if (f.parentId && map.has(f.parentId)) {
          map.get(f.parentId)!.children.push(node)
        } else {
          roots.push(node)
        }
      }
    })

    return roots
  }, [folders])

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    try {
      const newFolder = await folderService.createFolder({
        name: newFolderName.trim(),
        parentId: creatingParentId,
      })
      setFolders((prev) => [...prev, newFolder])
      setNewFolderName('')
      setIsCreatingFolder(false)
      setCreatingParentId(null)
      toast.success('Folder created')
      if (creatingParentId) {
        setExpandedFolderIds((prev) => new Set(prev).add(creatingParentId))
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create folder')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  // Recursive folder renderer
  const renderFolderItem = (folder: FolderNode, depth = 0) => {
    const isExpanded = expandedFolderIds.has(folder.id)
    const hasChildren = folder.children.length > 0
    const isActive = location.pathname === `/folders/${folder.id}`

    return (
      <div key={folder.id} className="select-none">
        <div
          onClick={() => {
            navigate(`/folders/${folder.id}`)
            if (mobileOpen) onMobileClose()
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Toggle arrow */}
            <button
              type="button"
              onClick={(e) => toggleFolderExpand(folder.id, e)}
              className={`p-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-400 transition-transform ${
                !hasChildren ? 'opacity-0 cursor-default' : ''
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            <FolderIcon
              className="w-4 h-4 flex-shrink-0"
              style={{ color: folder.color || (isActive ? '#2563eb' : '#94a3b8') }}
            />

            <span className="truncate text-xs sm:text-sm">{folder.name}</span>
          </div>

          {/* Quick add subfolder button on hover */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              type="button"
              title="Add subfolder"
              onClick={(e) => {
                e.stopPropagation()
                setCreatingParentId(folder.id)
                setIsCreatingFolder(true)
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subfolders */}
        {isExpanded && hasChildren && (
          <div className="space-y-0.5 mt-0.5">
            {folder.children.map((child) => renderFolderItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300">
      {/* Top Header & Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0">
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 overflow-hidden ${
            collapsed ? 'justify-center w-full' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-500/20 flex-shrink-0">
            N
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                NoteFlow
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-blue-600 dark:text-blue-400">
                Workspace
              </span>
            </div>
          )}
        </Link>

        {/* Collapse button (Desktop only) */}
        {!collapsed && (
          <button
            type="button"
            onClick={() => onCollapse(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <div className="hidden lg:flex justify-center py-2 border-b border-slate-100 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => onCollapse(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Nav Items Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div className="space-y-1">
          <SidebarNavItem
            to="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            collapsed={collapsed}
            onClick={() => mobileOpen && onMobileClose()}
          />
          <SidebarNavItem
            to="/recent"
            icon={Clock}
            label="Recent"
            collapsed={collapsed}
            onClick={() => mobileOpen && onMobileClose()}
          />
          <SidebarNavItem
            to="/starred"
            icon={Star}
            label="Starred"
            collapsed={collapsed}
            onClick={() => mobileOpen && onMobileClose()}
          />
          <SidebarNavItem
            to="/shared"
            icon={Users}
            label="Shared with me"
            collapsed={collapsed}
            onClick={() => mobileOpen && onMobileClose()}
          />
        </div>

        {/* Workspace / Folders Section */}
        <div className="pt-2">
          {!collapsed ? (
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Folders
              </span>
              <button
                type="button"
                onClick={() => {
                  setCreatingParentId(null)
                  setIsCreatingFolder(true)
                }}
                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                title="Create folder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-100 dark:border-slate-800 my-2" />
          )}

          {/* New Folder Inline Form */}
          {isCreatingFolder && !collapsed && (
            <form onSubmit={handleCreateFolder} className="p-2 mb-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                {creatingParentId ? 'New Subfolder' : 'New Folder'}
              </div>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingFolder(false)
                    setNewFolderName('')
                  }}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-[11px] bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* Folders List */}
          {!collapsed && (
            <div className="space-y-0.5">
              {isLoadingFolders ? (
                <div className="flex items-center gap-2 py-3 px-2 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  Loading folders...
                </div>
              ) : folderTree.length > 0 ? (
                folderTree.map((rootFolder) => renderFolderItem(rootFolder))
              ) : (
                <div className="py-2 px-2 text-xs text-slate-400 italic">
                  No folders yet. Click + to add one.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Other Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
          {!collapsed && (
            <div className="px-2 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Manage
            </div>
          )}
          <SidebarNavItem
            to="/notifications"
            icon={Bell}
            label="Notifications"
            collapsed={collapsed}
            badge={unreadNotifications > 0 ? unreadNotifications : undefined}
            badgeVariant="primary"
            onClick={() => mobileOpen && onMobileClose()}
          />
          <SidebarNavItem
            to="/trash"
            icon={Trash2}
            label="Trash"
            collapsed={collapsed}
            onClick={() => mobileOpen && onMobileClose()}
          />
          <SidebarNavItem
            to="/settings"
            icon={Settings}
            label="Settings"
            collapsed={collapsed}
            onClick={() => mobileOpen && onMobileClose()}
          />
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-white dark:hover:bg-slate-800 ${
            collapsed ? 'justify-center p-1' : ''
          }`}
        >
          {/* Avatar */}
          <div className="relative">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User avatar'}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/20"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || 'NoteFlow User'}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {user?.email || 'user@example.com'}
              </div>
            </div>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:block h-screen flex-shrink-0 overflow-hidden select-none z-30"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Drawer Pane */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
