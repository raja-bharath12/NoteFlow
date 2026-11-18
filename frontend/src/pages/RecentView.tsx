import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentService } from '../services/documentService'
import { Document } from '../types'
import { formatDate, formatRelativeTime } from '../utils/formatters'
import { Clock, FileText, Loader2, Plus } from 'lucide-react'

export const RecentView: React.FC = () => {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadRecent = async () => {
      try {
        const data = await documentService.getRecentDocuments(25)
        if (isMounted) {
          setDocs(data || [])
        }
      } catch {
        if (isMounted) setDocs([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadRecent()
    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Recent Notes</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Notes sorted by most recently accessed or modified
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/document/new')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center border border-dashed border-slate-300 dark:border-slate-800">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No recent activity
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Create or edit notes to see your history here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate(`/document/${doc.id}`)}
              className="glass-card p-5 rounded-2xl cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                  {doc.title || 'Untitled Note'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {doc.content ? doc.content.replace(/<[^>]*>/g, '') : 'No content...'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{formatRelativeTime(doc.updatedAt)}</span>
                <span>{doc.wordCount || 0} words</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentView
