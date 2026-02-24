import { describe, it, expect, beforeEach, vi } from 'vitest'
import { formatDate, formatRelativeTime } from '@/lib/formatters'
import {
  applicationTableSchema,
  companyTableSchema,
  eventTableSchema,
  STATUS_COLORS,
  INTEREST_COLORS,
  EVENT_TYPE_LABELS,
  EVENT_STATUS_COLORS,
  capitalize
} from './table-schemas'

// Mock the Badge component
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => ({
    type: 'mock-badge',
    props: { variant, children }
  })
}))

// Mock formatters
vi.mock('@/lib/formatters', () => ({
  formatDate: vi.fn((date) => date ? 'Feb 23, 2024' : '-'),
  formatRelativeTime: vi.fn((date) => date ? '2 days ago' : 'just now')
}))

describe('table-schemas', () => {
  describe('STATUS_COLORS', () => {
    it('should have correct colors for each status', () => {
      expect(STATUS_COLORS).toEqual({
        applied: 'secondary',
        interview: 'default',
        offer: 'default',
        rejected: 'destructive',
        ghosted: 'secondary'
      })
    })
  })

  describe('INTEREST_COLORS', () => {
    it('should have correct colors for each interest level', () => {
      expect(INTEREST_COLORS).toEqual({
        low: 'secondary',
        medium: 'default',
        high: 'default'
      })
    })
  })

  describe('EVENT_TYPE_LABELS', () => {
    it('should map event types to human-readable labels', () => {
      expect(EVENT_TYPE_LABELS).toEqual({
        phone_screen: 'Phone Screen',
        technical: 'Technical',
        onsite: 'Onsite',
        follow_up: 'Follow-up',
        offer: 'Offer'
      })
    })
  })

  describe('EVENT_STATUS_COLORS', () => {
    it('should have correct colors for each event status', () => {
      expect(EVENT_STATUS_COLORS).toEqual({
        scheduled: 'default',
        completed: 'secondary',
        cancelled: 'destructive'
      })
    })
  })

  describe('applicationTableSchema', () => {
    it('should define 8 columns with correct properties', () => {
      expect(applicationTableSchema.columns).toHaveLength(8)

      const positionColumn = applicationTableSchema.columns.find(c => c.key === 'position')
      expect(positionColumn).toMatchObject({
        key: 'position',
        label: 'Position',
        type: 'text',
        sortable: true,
        grow: 2,
        minWidth: 200
      })

      const companyColumn = applicationTableSchema.columns.find(c => c.key === 'company.name')
      expect(companyColumn).toMatchObject({
        key: 'company.name',
        label: 'Company',
        type: 'relation',
        grow: 1.5,
        minWidth: 150
      })

      const statusColumn = applicationTableSchema.columns.find(c => c.key === 'status')
      expect(statusColumn).toMatchObject({
        key: 'status',
        label: 'Status',
        type: 'enum',
        minWidth: 100
      })

      const interestColumn = applicationTableSchema.columns.find(c => c.key === 'interest')
      expect(interestColumn).toMatchObject({
        key: 'interest',
        label: 'Interest',
        type: 'enum',
        minWidth: 100
      })

      const locationColumn = applicationTableSchema.columns.find(c => c.key === 'location')
      expect(locationColumn).toMatchObject({
        key: 'location',
        label: 'Location',
        type: 'text',
        grow: 1,
        minWidth: 150
      })

      const appliedAtColumn = applicationTableSchema.columns.find(c => c.key === 'applied_at')
      expect(appliedAtColumn).toMatchObject({
        key: 'applied_at',
        label: 'Applied Date',
        type: 'date',
        sortable: true,
        minWidth: 130
      })

      const updatedAtColumn = applicationTableSchema.columns.find(c => c.key === 'updated_at')
      expect(updatedAtColumn).toMatchObject({
        key: 'updated_at',
        label: 'Updated Date',
        type: 'datetime',
        sortable: true,
        minWidth: 140
      })
    })

    it('should have correct cell renderer for status', () => {
      const statusColumn = applicationTableSchema.columns.find(c => c.key === 'status')!
      const mockData = { status: 'applied' }

      const renderer = statusColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toEqual({
        type: 'mock-badge',
        props: { variant: STATUS_COLORS.applied, children: 'Applied' }
      })
    })

    it('should have correct cell renderer for interest', () => {
      const interestColumn = applicationTableSchema.columns.find(c => c.key === 'interest')!
      const mockData = { interest: 'high' }

      const renderer = interestColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toEqual({
        type: 'mock-badge',
        props: { variant: INTEREST_COLORS.high, children: 'High' }
      })
    })

    it('should have correct cell renderer for applied_at', () => {
      const appliedAtColumn = applicationTableSchema.columns.find(c => c.key === 'applied_at')!
      const mockData = { applied_at: '2024-02-23T00:00:00Z' }

      const renderer = appliedAtColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toBe('Feb 23, 2024')
    })

    it('should have correct cell renderer for updated_at', () => {
      const updatedAtColumn = applicationTableSchema.columns.find(c => c.key === 'updated_at')!
      const mockData = { updated_at: '2024-02-21T00:00:00Z' }

      const renderer = updatedAtColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toBe('2 days ago')
    })
  })

  describe('companyTableSchema', () => {
    it('should define 6 columns with correct properties', () => {
      expect(companyTableSchema.columns).toHaveLength(6)

      const nameColumn = companyTableSchema.columns.find(c => c.key === 'name')
      expect(nameColumn).toMatchObject({
        key: 'name',
        label: 'Company Name',
        type: 'text',
        grow: 2,
        minWidth: 200
      })

      const industryColumn = companyTableSchema.columns.find(c => c.key === 'industry')
      expect(industryColumn).toMatchObject({
        key: 'industry',
        label: 'Industry',
        type: 'text',
        grow: 1,
        minWidth: 150
      })

      const locationColumn = companyTableSchema.columns.find(c => c.key === 'location')
      expect(locationColumn).toMatchObject({
        key: 'location',
        label: 'Location',
        type: 'text',
        grow: 1,
        minWidth: 150
      })

      const sizeColumn = companyTableSchema.columns.find(c => c.key === 'size')
      expect(sizeColumn).toMatchObject({
        key: 'size',
        label: 'Size',
        type: 'text',
        grow: 0.5,
        minWidth: 120
      })

      const researchedColumn = companyTableSchema.columns.find(c => c.key === 'researched')
      expect(researchedColumn).toMatchObject({
        key: 'researched',
        label: 'Researched',
        type: 'enum',
        centered: true,
        minWidth: 100
      })

      const tagsColumn = companyTableSchema.columns.find(c => c.key === 'tags')
      expect(tagsColumn).toMatchObject({
        key: 'tags',
        label: 'Tags',
        type: 'text',
        grow: 1,
        minWidth: 150
      })
    })

    it('should have correct cell renderer for researched', () => {
      const researchedColumn = companyTableSchema.columns.find(c => c.key === 'researched')!
      const mockData = { researched: true }

      const renderer = researchedColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toBe('Yes')
    })

    it('should have correct cell renderer for tags with multiple tags', () => {
      const tagsColumn = companyTableSchema.columns.find(c => c.key === 'tags')!
      const mockData = {
        tags: ['tech', 'startup', 'remote', 'high-growth', 'engineering']
      }

      const renderer = tagsColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toBe('tech, startup, +3')
    })

    it('should have correct cell renderer for tags with single tag', () => {
      const tagsColumn = companyTableSchema.columns.find(c => c.key === 'tags')!
      const mockData = { tags: ['tech'] }

      const renderer = tagsColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toBe('tech')
    })

    it('should have correct cell renderer for tags with empty array', () => {
      const tagsColumn = companyTableSchema.columns.find(c => c.key === 'tags')!
      const mockData = { tags: [] }

      const renderer = tagsColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toBe('-')
    })
  })

  describe('eventTableSchema', () => {
    it('should define 5 columns with correct properties', () => {
      expect(eventTableSchema.columns).toHaveLength(5)

      const companyColumn = eventTableSchema.columns.find(c => c.key === 'application.company.name')
      expect(companyColumn).toMatchObject({
        key: 'application.company.name',
        label: 'Company',
        type: 'relation',
        grow: 1.5,
        minWidth: 180
      })

      const positionColumn = eventTableSchema.columns.find(c => c.key === 'application.position')
      expect(positionColumn).toMatchObject({
        key: 'application.position',
        label: 'Position',
        type: 'relation',
        grow: 2,
        minWidth: 200
      })

      const typeColumn = eventTableSchema.columns.find(c => c.key === 'type')
      expect(typeColumn).toMatchObject({
        key: 'type',
        label: 'Type',
        type: 'enum',
        minWidth: 120
      })

      const statusColumn = eventTableSchema.columns.find(c => c.key === 'status')
      expect(statusColumn).toMatchObject({
        key: 'status',
        label: 'Status',
        type: 'enum',
        minWidth: 140
      })

      const scheduledAtColumn = eventTableSchema.columns.find(c => c.key === 'scheduled_at')
      expect(scheduledAtColumn).toMatchObject({
        key: 'scheduled_at',
        label: 'Scheduled At',
        type: 'datetime',
        sortable: true,
        minWidth: 180
      })
    })

    it('should have correct cell renderer for type', () => {
      const typeColumn = eventTableSchema.columns.find(c => c.key === 'type')!
      const mockData = { type: 'phone_screen' }

      const renderer = typeColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toBe('Phone Screen')
    })

    it('should have correct cell renderer for status', () => {
      const statusColumn = eventTableSchema.columns.find(c => c.key === 'status')!
      const mockData = { status: 'scheduled' }

      const renderer = statusColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toEqual({
        type: 'mock-badge',
        props: { variant: EVENT_STATUS_COLORS.scheduled, children: 'Scheduled' }
      })
    })

    it('should have correct cell renderer for scheduled_at', () => {
      const scheduledAtColumn = eventTableSchema.columns.find(c => c.key === 'scheduled_at')!
      const mockData = { scheduled_at: '2024-02-25T10:00:00Z' }

      const renderer = scheduledAtColumn.cellRenderer!
      const rendered = renderer(mockData)

      expect(rendered).toBe('Feb 23, 2024')
    })
  })

  describe('capitalize helper', () => {
    it('should capitalize first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('WORLD')
      expect(capitalize('')).toBe('')
    })
  })
})