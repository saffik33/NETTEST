import { format, formatDistanceToNow } from 'date-fns'

function toUTC(iso: string): Date {
  return new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z')
}

export function formatDateTime(iso: string): string {
  return format(toUTC(iso), 'MMM d, yyyy HH:mm')
}

export function formatTimeAgo(iso: string): string {
  return formatDistanceToNow(toUTC(iso), { addSuffix: true })
}

export function formatTime(iso: string): string {
  return format(toUTC(iso), 'HH:mm')
}
