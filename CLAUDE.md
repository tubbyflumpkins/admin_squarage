# Squarage Admin Dashboard - Project Documentation

## ⚠️ IMPORTANT: Authentication Documentation
**Before making any authentication changes, ALWAYS refer to `AUTHENTICATION.md` for:**
- Complete authentication implementation details
- User management and session handling
- Password change functionality
- Security considerations and best practices
- Troubleshooting guide for auth issues
- Mobile vs Desktop authentication differences

## Project Overview
An admin dashboard for Squarage company built with Next.js 15, React 19, TypeScript, and Tailwind CSS. The dashboard features a modular widget-based design with todo list, sales tracker, calendar, notes, quick links, and expenses. The system includes NextAuth.js authentication with role-based access control.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **React**: React 19
- **Authentication**: NextAuth.js v4 with credentials provider
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS with custom Squarage brand colors
- **State Management**: Zustand 5 with store factory pattern (`createEntityStoreSlice`)
- **Drag & Drop**: @dnd-kit/sortable
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Password Hashing**: bcryptjs
- **Testing**: Playwright (E2E)
- **Deployment**: Vercel with Neon integration

## Project Structure
```
admin_squarage/
├── app/                       # Next.js 15 app directory
│   ├── layout.tsx            # Root layout with fonts
│   ├── globals.css           # Global styles & Tailwind
│   ├── page.tsx              # Dashboard homepage
│   ├── api/
│   │   ├── todos/neon/route.ts     # Todo CRUD (uses API helpers)
│   │   ├── sales/neon/route.ts     # Sales CRUD (uses API helpers)
│   │   ├── calendar/neon/route.ts  # Calendar CRUD (uses API helpers)
│   │   ├── expenses/neon/route.ts  # Expenses CRUD (uses API helpers)
│   │   ├── quick-links/neon/route.ts # Quick links CRUD (uses API helpers)
│   │   ├── notes/neon/route.ts     # Notes CRUD (per-record, no helpers)
│   │   ├── dashboard/route.ts      # Unified dashboard data endpoint
│   │   ├── emails/                 # Email sending system
│   │   ├── email-capture/          # Email subscriber capture
│   │   └── notifications/          # Push notification system
│   ├── todo/page.tsx          # Full-page todo view
│   ├── sales/page.tsx         # Full-page sales view
│   ├── calendar/page.tsx      # Full-page calendar view
│   ├── notes/page.tsx         # Full-page notes view
│   ├── quick-links/page.tsx   # Full-page quick links view
│   └── expenses/page.tsx      # Full-page expenses view
├── components/
│   ├── Dashboard/
│   │   ├── DashboardLayout.tsx    # Main dashboard grid
│   │   └── WidgetContainer.tsx    # Shared widget wrapper (overlay/interactive modes)
│   ├── TodoList/                  # Todo components
│   ├── SalesList/                 # Sales components
│   ├── Calendar/                  # Calendar components (month/week/day views)
│   ├── Notes/                     # Notes components
│   ├── QuickLinks/                # Quick links components
│   ├── ExpensesList/              # Expenses components
│   ├── Email/                     # Email management components
│   ├── Mobile/                    # Mobile PWA components
│   │   ├── Layout/                # Mobile layout, header, tab bar
│   │   ├── Todo/                  # Mobile todo cards
│   │   ├── Sales/                 # Mobile sales cards
│   │   └── Calendar/              # Mobile calendar views
│   └── UI/
│       ├── Header.tsx             # Site header with nav
│       ├── Button.tsx             # Reusable button component
│       ├── SubtaskItem.tsx        # Shared subtask component (used by Todo & Sales)
│       ├── CustomDropdown.tsx     # Generic dropdown (uses useDropdown hook)
│       ├── PriorityDropdown.tsx   # Priority selector (uses useDropdown hook)
│       ├── StatusDropdown.tsx     # Status selector (uses useDropdown hook)
│       └── ColorPicker.tsx        # Color picker component
├── hooks/
│   ├── useDropdown.ts         # Shared dropdown hook (portal/inline positioning, click-outside)
│   ├── useInlineEdit.ts       # Shared inline edit hook (click-outside, Enter/Escape)
│   ├── useIsMobile.ts         # Mobile detection
│   ├── usePWA.ts              # PWA utilities
│   └── useDashboardData.ts    # Dashboard data loading
├── lib/
│   ├── createEntityStore.ts   # Zustand store factory (shared load/save/debounce)
│   ├── loadingCoordinator.ts  # Request dedup & caching singleton
│   ├── store.ts               # Todo store (uses createEntityStoreSlice)
│   ├── salesStore.ts          # Sales store (uses createEntityStoreSlice)
│   ├── calendarStore.ts       # Calendar store (uses createEntityStoreSlice)
│   ├── expenseStore.ts        # Expenses store (uses createEntityStoreSlice)
│   ├── quickLinksStore.ts     # Quick links store (uses createEntityStoreSlice)
│   ├── notesStore.ts          # Notes store (per-note save, different pattern)
│   ├── dashboardStore.ts      # Unified dashboard data management
│   ├── api/
│   │   └── helpers.ts         # Shared API route helpers (requireAuth, getDb, etc.)
│   ├── db/
│   │   ├── index.ts           # Neon database connection (singleton)
│   │   └── schema.ts          # Drizzle ORM schema
│   ├── types.ts               # Todo TypeScript interfaces
│   ├── salesTypes.ts          # Sales TypeScript interfaces
│   ├── calendarTypes.ts       # Calendar TypeScript interfaces
│   ├── notesTypes.ts          # Notes TypeScript interfaces
│   ├── quickLinksTypes.ts     # Quick links TypeScript interfaces
│   ├── expenseTypes.ts        # Expense TypeScript interfaces
│   └── utils.ts               # Utility functions
├── scripts/                   # Database migration & seed scripts
├── data/                      # JSON fallback storage
├── tests/                     # Playwright E2E tests
├── drizzle.config.ts          # Drizzle ORM configuration
├── playwright.config.ts       # Playwright test configuration
├── Style/                     # Branding assets
│   ├── STYLE_GUIDE.md         # Complete style guide
│   └── fonts/                 # Neue Haas Grotesk fonts
└── public/
    └── images/                # Logo and assets
```

## Site Map
```
/                   # Dashboard home with 5 widgets (Todo, Sales, Calendar, Notes, Quick Links)
├── /todo           # Full-page todo list with drag-and-drop, filters, subtasks
├── /sales          # Full-page sales tracker with product management
├── /calendar       # Full-page calendar (month/week/day views)
├── /notes          # Full-page notes with deep link sharing
├── /quick-links    # Full-page quick links with drag-and-drop
├── /expenses       # Full-page expense tracker with tags
├── /email          # Email subscriber database + email management
├── /settings       # User settings, notifications, password change
└── /login          # Authentication page
```

## Key Features

### Todo List System
- **CRUD Operations**: Create, read, update, delete tasks
- **Task Properties**:
  - Title (required)
  - Category (dropdown with color coding)
  - Owner (dropdown with color coding)
  - Priority (Low/Medium/High with color indicators)
  - Due Date
  - Status (Not Started/In Progress/Completed/Dead)
  - Subtasks (lightweight checkbox items)
  - Notes (free-form text area)
- **Drag & Drop**: Reorder tasks with visual feedback
- **Sorting**: By due date, priority, category, owner, or creation date
- **Filtering**: By status, category, owner, priority
- **Auto-organization**: Completed tasks move to bottom
- **Persistent Storage**: Neon PostgreSQL with automatic fallback to JSON

### Subtask & Notes System
- **Expandable Interface**: Click on task title or subtask counter to expand
- **Two-Column Layout**:
  - Left: Subtasks (title column width)
  - Right: Notes (category + owner + priority width)
- **Subtask Features**:
  - Simple checkbox completion
  - Double-click to edit text
  - Add/delete subtasks dynamically
  - Counter display (X/Y format) left of category
- **Notes Features**:
  - Clean, borderless textarea
  - Auto-save on change
  - Transparent background for minimal visual noise
- **Visual Design**:
  - Lighter background for expanded area
  - Column separator lines maintain grid structure
  - Background color inherits from task category

### Inline Editing
- **TodoItemEditable Component**:
  - Auto-save on blur or Enter key
  - Click anywhere outside to save changes
  - No confirmation buttons (removed checkmark/X)
  - Escape key to cancel editing
- **Double-Click Editing**:
  - Title and due date fields in TodoItem
  - Subtask text in SubtaskItem

### Category & Owner Management
- **Dynamic Lists**: Add/edit/delete categories and owners
- **Color Coding**: 16 colors (8 bold + 8 pastel)
- **Visual Editor**: Click color squares to change colors
- **Inline Editing**: Edit names directly in the list

### Visual Enhancements
- **Full-Width Strikethrough**: For completed/dead tasks
- **Enhanced Color Fading**: All elements fade when task is completed/dead
- **Grid Layout**: `[14px_110px_1fr_30px_100px_100px_80px_120px_32px]`
  - Drag handle (14px)
  - Status (110px)
  - Title (1fr)
  - Subtask counter (30px)
  - Category (100px)
  - Owner (100px)
  - Priority (80px)
  - Due Date (120px)
  - Actions (32px)

### Glassmorphism Design System
- **Glass Effects**:
  - Backdrop blur for depth
  - Semi-transparent backgrounds (white/35-50%)
  - Subtle borders with white/40-60% opacity
  - Hover animations with scale and shadow
- **Brand Colors**:
  - Squarage Green: `#4A9B4E`
  - Squarage Orange: `#F7901E`
  - Squarage Blue: `#01BAD5`
  - Squarage Red: `#F04E23`
  - Squarage Yellow: `#F5B74C`
  - Squarage White: `#fffaf4`
  - Squarage Black: `#333333`
- **Typography**: Neue Haas Grotesk Display
- **Layout**: Responsive grid with widget containers

## Important Implementation Details

### Data Persistence & Safety (CRITICAL)
The application uses Neon PostgreSQL with multiple layers of data loss protection:

#### Protection Mechanisms
1. **UPSERT Pattern**: Database uses safe UPSERT operations, not DELETE-then-INSERT
2. **Empty State Validation**: Server blocks any attempt to delete all data
3. **Loading State Management**: Client won't save until data is loaded from server
4. **Save Debouncing**: 1-second delay prevents rapid successive saves
5. **State-Based Flags**: `isLoading` and `hasLoadedFromServer` tracked in store state

```typescript
// lib/createEntityStore.ts - Shared store factory
const loadSave = createEntityStoreSlice<MyStore>({
  coordinatorKey: 'my-data',       // dedup key for loadingCoordinator
  endpoint: '/api/my-entity/neon', // API route
  debounceMs: 5000,                // save debounce delay
  parseResponse: (data, state) => ({ /* map API data to store state */ }),
  serializeState: (state) => ({ /* map store state to POST body */ }),
  afterLoad: (get, set) => { /* optional: create defaults, trigger follow-ups */ },
  afterSave: () => { /* optional: clear caches */ },
})

// Usage in store:
const useMyStore = create<MyStore>((set, get) => ({
  ...loadSave(set, get),  // provides loadFromServer, saveToServer, isLoading, hasLoadedFromServer
  // entity-specific state & actions...
}))
```

**Protection mechanisms built into the factory:**
1. Won't save while `isLoading` is true
2. Won't save before initial `loadFromServer` completes
3. Debounced saves (default 5s) prevent rapid successive writes
4. Auth redirect on 401 responses
5. Empty state guard on API routes blocks wiping existing data

### Database Schema (Neon PostgreSQL)
```sql
- categories (id, name, color, created_at)
- owners (id, name, color, created_at)
- todos (id, title, category, owner, priority, status, due_date, completed, notes, created_at, updated_at)
- subtasks (id, todo_id, text, completed, created_at)
```

**Database Connection**: Configured via `DATABASE_URL` environment variable
**Fallback**: Automatically uses JSON file if database is unavailable

### Todo Data Structure
```typescript
interface Todo {
  id: string
  title: string
  category: string
  owner: string
  priority: 'low' | 'medium' | 'high'
  status: TodoStatus  // 'not_started' | 'in_progress' | 'completed' | 'dead'
  dueDate: Date | null
  completed: boolean  // Legacy, kept for backwards compatibility
  subtasks?: Subtask[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface Subtask {
  id: string
  text: string
  completed: boolean
}
```

### Hydration Fix
The TodoWidget component includes hydration handling to prevent SSR/CSR mismatches:
```typescript
const [isHydrated, setIsHydrated] = useState(false)
useEffect(() => {
  setIsHydrated(true)
}, [])
// Use isHydrated to conditionally render client-side data
```

### State Management Pattern
Zustand 5 stores using a shared factory (`createEntityStoreSlice`):
- **Store Factory** (`lib/createEntityStore.ts`): Provides `loadFromServer`, `saveToServer`, debounce, loading guards, and auth redirect. Each store passes config for its endpoint, parser, serializer, and optional hooks (`afterLoad`, `afterSave`).
- **Loading Coordinator** (`lib/loadingCoordinator.ts`): Deduplicates concurrent API calls and caches responses. All stores use this to prevent connection storms on dashboard load.
- 5 stores use the factory: todos, sales, calendar, expenses, quick links
- 1 store uses a different pattern: notes (per-note save)
- Categories and owners are stored with color associations
- Filters and sorting preferences persist in store state
- Store methods for subtasks: `addSubtask`, `updateSubtask`, `deleteSubtask`, `toggleSubtask`
- Store method for notes: `updateNotes`

### Color System
- 16 predefined colors (8 bold + 8 pastel variants)
- Color picker appears when clicking color squares
- New items can have pre-selected colors
- Pastel conversion utility: `hexToPastel()` in utils.ts

### Responsive Design
- Mobile-first approach
- Widgets stack vertically on mobile
- Horizontal scrolling prevented
- Touch-friendly interaction targets

## Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint

# Database commands
npm run db:push         # Push schema to Neon
npm run db:studio       # Open Drizzle Studio
npm run db:migrate-data # Migrate JSON to database
npx tsx scripts/seed-test-data.ts  # Seed test data
```

## Deployment
The project is configured for Vercel deployment with Neon:
1. Create Neon account at https://neon.tech
2. Add `DATABASE_URL` to Vercel environment variables
3. Push to GitHub
4. Connect repository to Vercel
5. Deploy automatically with database support

### Environment Variables
```bash
# .env.local
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
```

## Implemented Features (All Widget Placeholders Filled)
- **Notes**: Full CRUD with deep link sharing and per-user isolation
- **Calendar**: Month/week/day views with event types, desktop + mobile
- **Expenses**: Expense tracking with tags and inline editing
- **Quick Links**: Drag-and-drop link management with search/sort
- **Email**: Subscriber database with CSV export + email sending system
- **Notifications**: Push notifications (browser + iOS PWA) with real-time bell

## Shared Hooks & Infrastructure

### `hooks/useDropdown.ts`
Shared hook for all 10 dropdown components. Two modes:
- **Portal mode** (default): Fixed positioning with `buttonRef`/`dropdownRef`. Handles scroll/resize repositioning.
- **Inline mode**: Click-outside via `containerRef` wrapper.
Returns: `{ isOpen, open, close, toggle, buttonRef, dropdownRef, containerRef, position }`

### `hooks/useInlineEdit.ts`
Shared hook for 4 editable row components (TodoItemEditable, SalesItemEditable, ExpenseRowEditable, QuickLinkItemEditable).
- Click-outside detection (100ms delay, dropdown-portal exclusion)
- Enter to submit, Escape to cancel
Returns: `{ containerRef, handleKeyDown }`

### `lib/api/helpers.ts`
Shared API route helpers used by 4 authenticated entity routes:
- `requireAuth()` - Returns session or 401 response
- `getDb()` - Returns db instance or null
- `deleteByIds()` - Batch delete by ID array
- `readJsonFallback()` / `writeJsonFallback()` - JSON file fallback
- `guardEmptyState()` - Prevents wiping data with empty saves

### `components/Dashboard/WidgetContainer.tsx`
Shared glassmorphism widget wrapper for all 5 dashboard widgets:
- **overlay mode** (default): Entire widget clickable, navigates to full page
- **interactive mode**: Inner content remains interactive (e.g., Calendar widget)

## Known Considerations
1. **Hydration**: Widgets use `isHydrated` state to prevent SSR/CSR mismatches
2. **Color Management**: Colors are stored in both store.ts and CategoryOwnerEditModal
3. **Data Persistence**: Uses Neon PostgreSQL with automatic JSON fallback
4. **Font Loading**: Custom fonts loaded via local files in Style/fonts
5. **Database Transactions**: Neon HTTP driver doesn't support transactions
6. **Dropdown Portals**: All dropdowns use `useDropdown` hook with React portals
7. **Priority-based Colors**: Task backgrounds use priority colors instead of category
8. **Next.js 15 Async Params**: Dynamic route `params` are Promises that must be awaited
9. **React 19 RefObject**: `RefObject<T>` now includes `null` in the type

## Component Communication
- **Props Flow**: Minimal prop drilling, most state in Zustand
- **Modal Pattern**: Modals manage their own open/close state
- **Widget Pattern**: Widgets can be clicked to navigate to full-page views
- **Auto-save Pattern**: Changes save immediately without confirmation

## Testing Approach
- **E2E Tests**: Playwright test suite in `tests/` directory
- **Config**: `playwright.config.ts` at project root
- **Run**: `npx playwright test` (requires `npm run dev` running)
- Coverage: smoke tests for auth, dashboard navigation, and page loading

## Performance Optimizations
- Lazy loading for modals
- Optimized font loading with Next.js local fonts
- Minimal re-renders with Zustand selective subscriptions
- CSS-based animations for smooth interactions
- Auto-save debouncing for notes

## Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- Color contrast meets WCAG AA standards
- Focus indicators on all interactive elements
- Escape key to cancel editing operations

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile/tablet/desktop
- No IE11 support

---

This dashboard is production-ready and deployed on Vercel. The todo list is fully functional with advanced features like drag-and-drop, color-coded categories, subtasks with notes, and persistent API-based storage.

## Recent Major Updates

### Subtask & Notes System (August 2025)
- Added expandable subtask system with lightweight checkbox items
- Integrated notes functionality with auto-save
- Two-column layout: subtasks on left, notes on right
- Clean, borderless design for notes textarea
- Subtask counter positioned left of category column

### Inline Editing Improvements (August 2025)
- Removed checkmark/X buttons from editing mode
- Implemented auto-save on blur and Enter key
- Added click-outside detection for saving
- Enhanced user experience with immediate saves

### API Storage Implementation (August 2025)
- Switched from localStorage to file-based API storage
- Created `/api/todos` endpoint for data persistence
- Data stored in `data/todos.json` for server persistence
- CRITICAL: Never switch back to localStorage

### Visual Enhancements (August 2025)
- Full-width strikethrough for completed/dead tasks
- Enhanced color fading for better visual hierarchy
- Improved grid layout with precise column widths
- Background colors based on task priority (not category)
- Glassmorphism design with backdrop blur and transparency
- Glass pane buttons with hover effects
- Solid green header (gradient removed)

### Neon Database Integration (August 2025)
- Migrated from JSON file storage to Neon PostgreSQL
- Serverless database with automatic scaling
- Drizzle ORM for type-safe database operations
- Automatic fallback to JSON if database unavailable
- Database branching support for preview deployments
- Connection pooling via Neon pooler endpoint

### Sorting & Filtering Improvements (August 2025)
- Primary sort by selected column (priority by default)
- Secondary sort always by due date (soonest to latest)
- Tasks without due dates appear after tasks with dates
- Maintains separation of active/completed/dead tasks

### Sales Tracker Implementation (August 2025)
- Complete sales management system mirroring Todo List functionality
- **Database Schema**:
  - `sales` table with name, productId, revenue, placementDate, deliveryMethod, status, notes
  - `collections` table for product grouping with color coding
  - `products` table with revenue defaults linked to collections
  - `sale_subtasks` table for sale-specific subtasks
- **Features**:
  - Drag-and-drop reordering
  - Inline editing for name, date, and revenue
  - Product selection with automatic revenue population
  - Custom revenue override per sale (double-click to edit)
  - Collections/Products management via Settings modal
  - Status tracking: not_started, in_progress, fulfilled, dead
  - Delivery methods: shipping, local
  - Subtasks and notes with expandable interface
- **Revenue System**:
  - Products have default revenue amounts
  - Sales inherit product revenue when selected
  - Revenue can be customized per sale
  - Stored in cents, displayed in dollars
- **Visual Design**:
  - Matches Todo List glassmorphism and styling
  - Status-based color coding with pastel backgrounds
  - Bold product names with increased column width
  - Grid layout: `[14px_110px_1fr_200px_80px_120px_100px_30px_32px]`
- **API Integration**:
  - `/api/sales/neon` endpoint with UPSERT pattern
  - Same protection mechanisms as Todo List
  - Automatic fallback to JSON if database unavailable