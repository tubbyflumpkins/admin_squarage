// Client-safe permission constants (no DB imports)

export const ALL_PERMISSIONS = [
  'todo',
  'sales',
  'calendar',
  'notes',
  'quick-links',
  'expenses',
  'email',
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]

export const ADMIN_ROLE = 'admin'

export const NAV_LINKS: { href: string; label: string; permission: Permission | null }[] = [
  { href: '/', label: 'Dashboard', permission: null },
  { href: '/todo', label: 'Todo List', permission: 'todo' },
  { href: '/sales', label: 'Sales Tracker', permission: 'sales' },
  { href: '/expenses', label: 'Expenses', permission: 'expenses' },
  { href: '/calendar', label: 'Calendar', permission: 'calendar' },
  { href: '/notes', label: 'Notes', permission: 'notes' },
  { href: '/quick-links', label: 'Quick Links', permission: 'quick-links' },
  { href: '/email', label: 'Email', permission: 'email' },
]

export const ROUTE_TO_PERMISSION: Record<string, Permission> = {
  '/todo': 'todo',
  '/sales': 'sales',
  '/calendar': 'calendar',
  '/notes': 'notes',
  '/quick-links': 'quick-links',
  '/expenses': 'expenses',
  '/email': 'email',
}

export const WIDGET_PERMISSION: Record<string, Permission> = {
  todo: 'todo',
  sales: 'sales',
  calendar: 'calendar',
  notes: 'notes',
  quickLinks: 'quick-links',
}
