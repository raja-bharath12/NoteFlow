import api from './api'
import { SearchFilters, SearchResult } from '../types'

const RECENT_SEARCHES_KEY = 'noteflow_recent_searches'
const MAX_RECENT_SEARCHES = 10

export const searchService = {
  /**
   * Search documents and folders with optional filters
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    if (!query.trim()) return []

    // Record to local search history
    this.saveRecentSearch(query.trim())

    const response = await api.get('/search', {
      params: {
        q: query,
        ...filters,
      },
    })
    return response.data.data || response.data
  },

  /**
   * Retrieve recent search queries stored in localStorage
   */
  getRecentSearches(): string[] {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  /**
   * Save a search query to recent searches in localStorage
   */
  saveRecentSearch(query: string): void {
    if (!query || !query.trim()) return
    const trimmed = query.trim()
    try {
      const current = this.getRecentSearches().filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      )
      const updated = [trimmed, ...current].slice(0, MAX_RECENT_SEARCHES)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch {
      // Ignore localStorage errors
    }
  },

  /**
   * Clear all recent searches from localStorage
   */
  clearRecentSearches(): void {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore localStorage errors
    }
  },
}

export default searchService
