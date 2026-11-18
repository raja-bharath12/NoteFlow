import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

/**
 * Formats a date string to 'MMM d, yyyy' (e.g. 'Nov 18, 2024')
 */
export function formatDate(dateString?: string | number | Date | null): string {
  if (!dateString) return '—'
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
  if (!isValid(date)) return '—'
  return format(date, 'MMM d, yyyy')
}

/**
 * Formats a date string to relative time (e.g. '2 hours ago', 'yesterday')
 */
export function formatRelativeTime(dateString?: string | number | Date | null): string {
  if (!dateString) return '—'
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
  if (!isValid(date)) return '—'
  return formatDistanceToNow(date, { addSuffix: true })
}

/**
 * Formats bytes to human-readable size string (e.g. '1.5 MB', '450 KB')
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0 || !bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Truncates text with ellipsis if it exceeds maxLength
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}...`
}

/**
 * Extracts initials from a user's full name (e.g. 'John Doe' -> 'JD')
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Returns an icon identifier corresponding to a mimeType or file extension
 */
export function getFileIcon(mimeType: string): string {
  if (!mimeType) return 'File'
  const lower = mimeType.toLowerCase()

  if (lower.includes('pdf')) return 'FileText'
  if (lower.includes('word') || lower.includes('docx') || lower.includes('doc')) return 'FileText'
  if (lower.includes('sheet') || lower.includes('csv') || lower.includes('excel')) return 'FileSpreadsheet'
  if (lower.includes('image')) return 'Image'
  if (lower.includes('video')) return 'Video'
  if (lower.includes('audio')) return 'Music'
  if (lower.includes('zip') || lower.includes('tar') || lower.includes('compressed')) return 'Archive'
  if (lower.includes('json') || lower.includes('javascript') || lower.includes('typescript') || lower.includes('html')) {
    return 'FileCode'
  }
  return 'File'
}

/**
 * Counts words in a string, stripping HTML tags if present
 */
export function countWords(text: string): number {
  if (!text) return 0
  // Strip HTML tags if any
  const clean = text.replace(/<[^>]*>/g, ' ').trim()
  if (!clean) return 0
  const words = clean.split(/\s+/).filter(Boolean)
  return words.length
}
