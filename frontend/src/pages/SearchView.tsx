import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchService } from '../services/searchService'
import { SearchResult } from '../types'
import { formatDate } from '../utils/formatters'
import { Search, FileText, Folder, Clock, X, Loader2 } from 'lucide-react'

export const SearchView: React.FC = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches())
  }, [])

  const handleSearch = async (searchTerm: string) => {
    const q = searchTerm.trim()
    if (!q) {
      setResults([])
      return
    }

    try {
      setIsLoading(true)
      const data = await searchService.search(q)
      setResults(data || [])
      setRecentSearches(searchService.getRecentSearches())
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecentClick = (term: string) => {
    setQuery(term)
    handleSearch(term)
  }

  const handleClearRecent = () => {
    searchService.clearRecentSearches()
    setRecentSearches([])
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value) setResults([])
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch(query)
          }}
          placeholder="Search by keywords, notes content, tags..."
          autoFocus
          className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm shadow-md shadow-slate-200/40 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recent Searches Pill List */}
      {recentSearches.length > 0 && !query && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Recent Searches</span>
            <button
              onClick={handleClearRecent}
              className="hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, i) => (
              <button
                key={i}
                onClick={() => handleRecentClick(term)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Results */}
      {!isLoading && query && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Results ({results.length})
          </p>

          {results.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center border border-dashed border-slate-300 dark:border-slate-800">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching results found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with different terms or check for typos.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((res) => (
                <div
                  key={res.id}
                  onClick={() =>
                    navigate(res.type === 'folder' ? `/folder/${res.id}` : `/document/${res.id}`)
                  }
                  className="glass-card p-4 rounded-xl cursor-pointer hover:border-blue-400 flex items-start gap-3 transition-all"
                >
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    {res.type === 'folder' ? (
                      <Folder className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {res.title}
                    </h4>
                    {res.snippet && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {res.snippet}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <span>{formatDate(res.updatedAt)}</span>
                      {res.folderName && <span>in {res.folderName}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchView
