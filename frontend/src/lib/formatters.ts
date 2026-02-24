import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

export function formatDate(dateString: string | null): string {
  if (!dateString) return '-'

  const date = parseISO(dateString)
  if (!isValid(date)) return '-'

  return format(date, 'MMM d, yyyy')
}

export function formatDateTime(isoString: string | null): string {
  if (!isoString) return 'TBD'

  const date = parseISO(isoString)
  if (!isValid(date)) return 'TBD'

  return format(date, 'MMM d, yyyy h:mm a')
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'just now'

  const date = parseISO(dateString)
  if (!isValid(date)) return 'just now'

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Return "just now" for dates within the last 60 seconds
  if (Math.abs(diffInSeconds) < 60) {
    return 'just now'
  }

  const distance = formatDistanceToNow(date, { addSuffix: true })

  // Remove "in " prefix for future dates and add "ago" suffix
  if (distance.startsWith('in ')) {
    return distance.slice(3) + ' ago'
  }

  return distance
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '--'

  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m`
}