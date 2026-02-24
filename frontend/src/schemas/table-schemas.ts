import { Badge } from '@/components/ui/badge'
import { formatDate, formatRelativeTime } from '@/lib/formatters'

// Constants
export const STATUS_COLORS = {
  applied: 'secondary',
  interview: 'default',
  offer: 'default',
  rejected: 'destructive',
  ghosted: 'secondary'
} as const

export const INTEREST_COLORS = {
  low: 'secondary',
  medium: 'default',
  high: 'default'
} as const

export const EVENT_TYPE_LABELS = {
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  onsite: 'Onsite',
  follow_up: 'Follow-up',
  offer: 'Offer'
} as const

export const EVENT_STATUS_COLORS = {
  scheduled: 'default',
  completed: 'secondary',
  cancelled: 'destructive'
} as const

// Helper function
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Application table schema
export const applicationTableSchema = {
  columns: [
    {
      key: 'position',
      label: 'Position',
      type: 'text' as const,
      sortable: true,
      grow: 2,
      minWidth: 200,
      cellRenderer: (data: { position: string }) => data.position || '-'
    },
    {
      key: 'company.name',
      label: 'Company',
      type: 'relation' as const,
      grow: 1.5,
      minWidth: 150,
      cellRenderer: (data: { company?: { name: string } }) => data.company?.name || '-'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'enum' as const,
      minWidth: 100,
      cellRenderer: (data: { status: keyof typeof STATUS_COLORS }) => ({
        type: 'mock-badge',
        props: { variant: STATUS_COLORS[data.status], children: capitalize(data.status) }
      })
    },
    {
      key: 'interest',
      label: 'Interest',
      type: 'enum' as const,
      minWidth: 100,
      cellRenderer: (data: { interest: keyof typeof INTEREST_COLORS }) => ({
        type: 'mock-badge',
        props: { variant: INTEREST_COLORS[data.interest], children: capitalize(data.interest) }
      })
    },
    {
      key: 'location',
      label: 'Location',
      type: 'text' as const,
      grow: 1,
      minWidth: 150,
      cellRenderer: (data: { location: string }) => data.location || '-'
    },
    {
      key: 'applied_at',
      label: 'Applied Date',
      type: 'date' as const,
      sortable: true,
      minWidth: 130,
      cellRenderer: (data: { applied_at: string | null }) => formatDate(data.applied_at)
    },
    {
      key: 'updated_at',
      label: 'Updated Date',
      type: 'datetime' as const,
      sortable: true,
      minWidth: 140,
      cellRenderer: (data: { updated_at: string | null }) => formatRelativeTime(data.updated_at || '')
    },
    {
      key: 'source',
      label: 'Source',
      type: 'text' as const,
      minWidth: 120,
      cellRenderer: (data: { source: string }) => data.source || '-'
    }
  ]
}

// Company table schema
export const companyTableSchema = {
  columns: [
    {
      key: 'name',
      label: 'Company Name',
      type: 'text' as const,
      grow: 2,
      minWidth: 200,
      cellRenderer: (data: { name: string }) => data.name || '-'
    },
    {
      key: 'industry',
      label: 'Industry',
      type: 'text' as const,
      grow: 1,
      minWidth: 150,
      cellRenderer: (data: { industry: string }) => data.industry || '-'
    },
    {
      key: 'location',
      label: 'Location',
      type: 'text' as const,
      grow: 1,
      minWidth: 150,
      cellRenderer: (data: { location: string }) => data.location || '-'
    },
    {
      key: 'size',
      label: 'Size',
      type: 'text' as const,
      grow: 0.5,
      minWidth: 120,
      cellRenderer: (data: { size: string }) => data.size || '-'
    },
    {
      key: 'researched',
      label: 'Researched',
      type: 'enum' as const,
      centered: true,
      minWidth: 100,
      cellRenderer: (data: { researched: boolean }) => data.researched ? 'Yes' : 'No'
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'text' as const,
      grow: 1,
      minWidth: 150,
      cellRenderer: (data: { tags: string[] }) => {
        if (!data.tags || data.tags.length === 0) return '-'
        if (data.tags.length <= 2) return data.tags.join(', ')
        return `${data.tags.slice(0, 2).join(', ')}, +${data.tags.length - 2}`
      }
    }
  ]
}

// Event table schema
export const eventTableSchema = {
  columns: [
    {
      key: 'application.company.name',
      label: 'Company',
      type: 'relation' as const,
      grow: 1.5,
      minWidth: 180,
      cellRenderer: (data: { application?: { company?: { name: string } } }) =>
        data.application?.company?.name || '-'
    },
    {
      key: 'application.position',
      label: 'Position',
      type: 'relation' as const,
      grow: 2,
      minWidth: 200,
      cellRenderer: (data: { application?: { position: string } }) =>
        data.application?.position || '-'
    },
    {
      key: 'type',
      label: 'Type',
      type: 'enum' as const,
      minWidth: 120,
      cellRenderer: (data: { type: keyof typeof EVENT_TYPE_LABELS }) =>
        EVENT_TYPE_LABELS[data.type]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'enum' as const,
      minWidth: 140,
      cellRenderer: (data: { status: keyof typeof EVENT_STATUS_COLORS }) => ({
        type: 'mock-badge',
        props: { variant: EVENT_STATUS_COLORS[data.status], children: capitalize(data.status) }
      })
    },
    {
      key: 'scheduled_at',
      label: 'Scheduled At',
      type: 'datetime' as const,
      sortable: true,
      minWidth: 180,
      cellRenderer: (data: { scheduled_at: string | null }) =>
        formatDate(data.scheduled_at)
    }
  ]
}