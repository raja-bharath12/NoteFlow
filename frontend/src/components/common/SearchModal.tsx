import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  FileText,
  Folder as FolderIcon,
  Clock,
  X,
  ArrowRight,
  CornerDownLeft,
  Loader2,
  Trash2,
} from 'lucide-react'
import { searchService } from '@/services/searchService'
import { SearchResult } from '@/types'

export interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Load recent searches on open
  useEffect(() => {
    if (open) {
      setRecentSearches(searchService.getRecentSearches())
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Global shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const handler = setTimeout(async () => {
      try {
        const data = await searchService.search(query.trim())
        setResults(data)
        setSelectedIndex(0)
      } catch (err) {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [query])

  const handleSelectResult = useCallback(
    (item: SearchResult) => {
      searchService.saveRecentSearch(query.trim() || item.title)
      onClose()
      if (item.type === 'folder') {
        navigate(`/folders/${item.id}`)
      } else {
        navigate(`/documents/${item.id}`)
      }
    },
    [navigate, onClose, query]
  )

  const handleSelectRecent = (term: string) => {
    setQuery(term)
  }

  const handleClearRecents = (e: React.MouseEvent) => {
    e.stopPropagation()
    searchService.clearRecentSearches()
    setRecentSearches([])
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex])
        }
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[80vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search documents, folders, tags..."
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none"
              />
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results / Recents List */}
            <div ref={listRef} className="overflow-y-auto p-3 space-y-1 flex-1">
              {/* Active Search Results */}
              {query.trim() ? (
                results.length > 0 ? (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Results ({results.length})
                    </div>
                    {results.map((result, index) => {
                      const isSelected = index === selectedIndex
                      const isFolder = result.type === 'folder'

                      return (
                        <div
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isFolder
                                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                                  : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {isFolder ? (
                                <FolderIcon className="w-5 h-5" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate flex items-center gap-2">
                                <span>{result.title}</span>
                                {result.folderName && (
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                    {result.folderName}
                                  </span>
                                )}
                              </div>
                              {result.snippet && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {result.snippet}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <span className="text-[11px] text-slate-400 capitalize">
                              {result.type}
                            </span>
                            {isSelected && (
                              <CornerDownLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : !isLoading ? (
                  <div className="py-12 text-center">
                    <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      No results found for "{query}"
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try searching for different keywords or check spelling
                    </p>
                  </div>
                ) : null
              ) : (
                /* Recent Searches View */
                <div>
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={handleClearRecents}
                          className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear all
                        </button>
                      </div>

                      <div className="space-y-0.5">
                        {recentSearches.map((term) => (
                          <div
                            key={term}
                            onClick={() => handleSelectRecent(term)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-slate-700 dark:text-slate-300 group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                              <span className="text-sm">{term}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Shortcuts / Quick Tips */}
                  <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Navigation
                    </span>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">
                          ↑↓
                        </kbd>
                        to navigate
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">
                          ↵
                        </kbd>
                        to select
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">
                          ESC
                        </kbd>
                        to close
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default SearchModal
