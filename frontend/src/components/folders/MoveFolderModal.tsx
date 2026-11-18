import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Folder as FolderIcon,
  FolderInput,
  Home,
  Check,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Folder, Document } from '@/types'
import { folderService } from '@/services/folderService'
import { documentService } from '@/services/documentService'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

export interface MoveFolderModalProps {
  isOpen: boolean
  onClose: () => void
  item: Folder | Document | null
  itemType: 'folder' | 'document'
  onSuccess: () => void
}

interface TreeNode {
  folder: Folder
  children: TreeNode[]
}

export const MoveFolderModal: React.FC<MoveFolderModalProps> = ({
  isOpen,
  onClose,
  item,
  itemType,
  onSuccess,
}) => {
  const [allFolders, setAllFolders] = useState<Folder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [isLoadingTree, setIsLoadingTree] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const loadAllFolders = async () => {
      setIsLoadingTree(true)
      try {
        const folders = await folderService.getFolders()
        setAllFolders(folders || [])
      } catch (err) {
        console.error('Failed to load folders for moving', err)
      } finally {
        setIsLoadingTree(false)
      }
    }

    loadAllFolders()

    // Default selection: root or existing parent
    if (itemType === 'folder' && item) {
      setSelectedFolderId((item as Folder).parentId || null)
    } else if (itemType === 'document' && item) {
      setSelectedFolderId((item as Document).folderId || null)
    } else {
      setSelectedFolderId(null)
    }
  }, [isOpen, item, itemType])

  if (!isOpen || !item) return null

  // Prevent moving a folder into itself or its descendants
  const isDescendant = (folderId: string, targetId: string): boolean => {
    if (folderId === targetId) return true
    const childFolders = allFolders.filter((f) => f.parentId === folderId)
    return childFolders.some((child) => isDescendant(child.id, targetId))
  }

  const handleMove = async () => {
    setIsSubmitting(true)
    try {
      if (itemType === 'folder') {
        if (selectedFolderId === item.id) {
          toast.error('Cannot move a folder into itself')
          setIsSubmitting(false)
          return
        }
        if (selectedFolderId && isDescendant(item.id, selectedFolderId)) {
          toast.error('Cannot move a folder into one of its subfolders')
          setIsSubmitting(false)
          return
        }
        await folderService.moveFolder(item.id, selectedFolderId)
        toast.success(`Folder "${(item as Folder).name}" moved successfully`)
      } else {
        await documentService.moveDocument(item.id, selectedFolderId)
        toast.success(`Document "${(item as Document).title}" moved successfully`)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to move item'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Build tree hierarchy
  const buildTree = (parentId: string | null = null): TreeNode[] => {
    return allFolders
      .filter((f) => (f.parentId || null) === parentId)
      .map((f) => ({
        folder: f,
        children: buildTree(f.id),
      }))
  }

  const rootNodes = buildTree(null)

  const renderTreeNodes = (nodes: TreeNode[], level: number = 0) => {
    return nodes.map(({ folder, children }) => {
      const isSelected = selectedFolderId === folder.id
      const isCurrentItem = itemType === 'folder' && item.id === folder.id
      const isInvalidTarget = itemType === 'folder' && isDescendant(item.id, folder.id)

      return (
        <div key={folder.id}>
          <div
            onClick={() => {
              if (!isInvalidTarget && !isCurrentItem) {
                setSelectedFolderId(folder.id)
              }
            }}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
              isInvalidTarget || isCurrentItem
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : isSelected
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
            )}
            style={{ paddingLeft: `${level * 18 + 12}px` }}
          >
            <div className="flex items-center gap-2.5 truncate">
              <FolderIcon
                className="h-4 w-4 shrink-0"
                style={{ color: folder.color || '#3b82f6' }}
              />
              <span className="truncate">{folder.name}</span>
            </div>

            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
          </div>

          {children.length > 0 && renderTreeNodes(children, level + 1)}
        </div>
      )
    })
  }

  const itemName = itemType === 'folder' ? (item as Folder).name : (item as Document).title

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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <FolderInput className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Move {itemType === 'folder' ? 'Folder' : 'Document'}
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[240px]">
                  Choose destination for &quot;{itemName || 'Untitled'}&quot;
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Folder Tree Selector */}
          <div className="p-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Destination
            </label>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2 space-y-1">
              {isLoadingTree ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading folders...
                </div>
              ) : (
                <>
                  {/* Root / Home Item */}
                  <div
                    onClick={() => setSelectedFolderId(null)}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer',
                      selectedFolderId === null
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Home className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>Root / Home</span>
                    </div>
                    {selectedFolderId === null && (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </div>

                  {/* Render recursive folder nodes */}
                  {renderTreeNodes(rootNodes)}
                </>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleMove}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Move Here
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default MoveFolderModal
