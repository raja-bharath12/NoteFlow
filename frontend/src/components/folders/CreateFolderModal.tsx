import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Folder as FolderIcon,
  Briefcase,
  User,
  Layout,
  Archive,
  Book,
  Check,
  FolderPlus,
  Loader2,
} from 'lucide-react'
import { Folder } from '@/types'
import { folderService } from '@/services/folderService'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

export interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (folder: Folder) => void
  parentFolderId?: string | null
  folderToEdit?: Folder | null
  availableFolders?: Folder[]
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
]

const PRESET_ICONS = [
  { id: 'folder', label: 'Default', icon: FolderIcon },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'project', label: 'Project', icon: Layout },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'book', label: 'Notes', icon: Book },
]

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentFolderId = null,
  folderToEdit = null,
  availableFolders = [],
}) => {
  const isEditing = !!folderToEdit
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState('folder')
  const [selectedParentId, setSelectedParentId] = useState<string | null>(parentFolderId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name || '')
      setSelectedColor(folderToEdit.color || PRESET_COLORS[0])
      setSelectedIcon(folderToEdit.icon || 'folder')
      setSelectedParentId(folderToEdit.parentId || null)
    } else {
      setName('')
      setSelectedColor(PRESET_COLORS[0])
      setSelectedIcon('folder')
      setSelectedParentId(parentFolderId)
    }
    setError(null)
  }, [folderToEdit, parentFolderId, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Folder name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditing && folderToEdit) {
        const updated = await folderService.updateFolder(folderToEdit.id, {
          name: trimmed,
          color: selectedColor,
          icon: selectedIcon,
          parentId: selectedParentId,
        })
        toast.success('Folder updated successfully')
        onSuccess(updated)
      } else {
        const created = await folderService.createFolder({
          name: trimmed,
          color: selectedColor,
          icon: selectedIcon,
          parentId: selectedParentId,
        })
        toast.success('Folder created successfully')
        onSuccess(created)
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save folder'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter out the folder itself when choosing parent in edit mode
  const validParentOptions = availableFolders.filter(
    (f) => !folderToEdit || f.id !== folderToEdit.id
  )

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
              >
                <FolderPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {isEditing ? 'Rename Folder' : 'New Folder'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEditing ? 'Modify folder details' : 'Create a workspace to organize your notes'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Folder Name Input */}
            <div>
              <label
                htmlFor="folder-name-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Folder Name
              </label>
              <input
                id="folder-name-input"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="e.g. Design Systems, Project Alpha"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                maxLength={100}
              />
            </div>

            {/* Color Swatches */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Color Theme
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {PRESET_COLORS.map((color) => {
                  const isSelected = selectedColor === color
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={cn(
                        'relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        isSelected ? 'ring-2 ring-slate-800 dark:ring-white scale-105 shadow-md' : 'opacity-90'
                      )}
                      title={color}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white stroke-[3]" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Folder Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_ICONS.map((item) => {
                  const IconComp = item.icon
                  const isSelected = selectedIcon === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl p-2.5 transition-all text-xs border',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      <IconComp className="h-5 w-5 mb-1" />
                      <span className="text-[10px] truncate max-w-full">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Optional Parent Folder Picker */}
            {validParentOptions.length > 0 && (
              <div>
                <label
                  htmlFor="parent-folder-select"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
                >
                  Location (Parent Folder)
                </label>
                <select
                  id="parent-folder-select"
                  value={selectedParentId || ''}
                  onChange={(e) => setSelectedParentId(e.target.value || null)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Root / Home</option>
                  {validParentOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-all"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Folder'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CreateFolderModal
