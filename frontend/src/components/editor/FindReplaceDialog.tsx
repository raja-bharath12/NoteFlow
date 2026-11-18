import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Replace,
  ChevronDown,
  ChevronUp,
  X,
  CaseSensitive,
  WholeWord,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface MatchRange {
  from: number
  to: number
}

export interface FindReplaceDialogProps {
  isOpen: boolean
  onClose: () => void
  editor?: any
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
  isOpen,
  onClose,
  editor: propEditor,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [matches, setMatches] = useState<MatchRange[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const getEditor = useCallback(() => {
    return propEditor || (window as any).__noteflow_editor__ || null
  }, [propEditor])

  // Scan editor doc for matches
  const scanMatches = useCallback(() => {
    const editor = getEditor()
    if (!editor || !searchTerm) {
      setMatches([])
      setCurrentIndex(-1)
      return
    }

    const { doc } = editor.state
    const found: MatchRange[] = []

    let flags = matchCase ? 'g' : 'gi'
    let patternStr = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (wholeWord) {
      patternStr = `\\b${patternStr}\\b`
    }

    let regex: RegExp
    try {
      regex = new RegExp(patternStr, flags)
    } catch {
      return
    }

    doc.descendants((node: any, pos: number) => {
      if (node.isText && node.text) {
        let match: RegExpExecArray | null
        while ((match = regex.exec(node.text)) !== null) {
          const from = pos + match.index
          const to = from + match[0].length
          found.push({ from, to })
        }
      }
    })

    setMatches(found)
    if (found.length > 0) {
      if (currentIndex === -1 || currentIndex >= found.length) {
        setCurrentIndex(0)
        highlightMatch(found[0], editor)
      }
    } else {
      setCurrentIndex(-1)
    }
  }, [searchTerm, matchCase, wholeWord, getEditor, currentIndex])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
      scanMatches()
    }
  }, [isOpen, searchTerm, matchCase, wholeWord])

  const highlightMatch = (range: MatchRange, editor: any) => {
    if (!editor || !range) return
    try {
      editor.commands.setTextSelection({ from: range.from, to: range.to })
      editor.commands.scrollIntoView()
    } catch {
      // Ignore selection errors if doc modified
    }
  }

  const handleNext = () => {
    if (matches.length === 0) return
    const nextIdx = (currentIndex + 1) % matches.length
    setCurrentIndex(nextIdx)
    const editor = getEditor()
    highlightMatch(matches[nextIdx], editor)
  }

  const handlePrev = () => {
    if (matches.length === 0) return
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length
    setCurrentIndex(prevIdx)
    const editor = getEditor()
    highlightMatch(matches[prevIdx], editor)
  }

  const handleReplace = () => {
    const editor = getEditor()
    if (!editor || matches.length === 0 || currentIndex === -1) return

    const currentMatch = matches[currentIndex]
    try {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: currentMatch.from, to: currentMatch.to })
        .insertContent(replaceTerm)
        .run()

      // Rescan after replace
      setTimeout(() => scanMatches(), 50)
    } catch {
      toast.error('Failed to replace match')
    }
  }

  const handleReplaceAll = () => {
    const editor = getEditor()
    if (!editor || matches.length === 0) return

    const total = matches.length
    try {
      // Replace from end to beginning to preserve earlier position offsets
      const sortedDesc = [...matches].sort((a, b) => b.from - a.from)
      const tr = editor.state.tr

      for (const match of sortedDesc) {
        tr.replaceWith(
          match.from,
          match.to,
          editor.schema.text(replaceTerm)
        )
      }

      editor.view.dispatch(tr)
      toast.success(`Replaced ${total} occurrence${total === 1 ? '' : 's'}`)
      setTimeout(() => scanMatches(), 50)
    } catch {
      toast.error('Failed to replace all occurrences')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        handlePrev()
      } else {
        handleNext()
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute top-16 right-8 z-40 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-sm">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Find & Replace</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Search Input Row */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Find in note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-24 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-mono px-1">
                  {searchTerm
                    ? matches.length > 0
                      ? `${currentIndex + 1}/${matches.length}`
                      : '0/0'
                    : ''}
                </span>
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={matches.length === 0}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  title="Previous match (Shift+Enter)"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={matches.length === 0}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  title="Next match (Enter)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Replace Input Row */}
            <div className="relative">
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              <Replace className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Match Options */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setMatchCase(!matchCase)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                  matchCase
                    ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                    : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title="Match case"
              >
                <CaseSensitive className="w-3.5 h-3.5" />
                <span>Match Case</span>
              </button>

              <button
                type="button"
                onClick={() => setWholeWord(!wholeWord)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                  wholeWord
                    ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                    : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title="Whole word"
              >
                <WholeWord className="w-3.5 h-3.5" />
                <span>Whole Word</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleReplace}
                disabled={matches.length === 0}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleReplaceAll}
                disabled={matches.length === 0}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
              >
                Replace All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FindReplaceDialog
