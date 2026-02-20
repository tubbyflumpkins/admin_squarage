# Architecture Overview

This document describes the shared infrastructure introduced in the February 2026 streamline update. The goal was to eliminate duplication across dropdowns, stores, API routes, editable components, and widgets by extracting common patterns into shared hooks, factories, and helpers.

## Data Flow

```
User Interaction
       ↓
Component (React)
       ↓
Zustand Store (uses createEntityStoreSlice factory)
       ↓
Loading Coordinator (dedup & cache)
       ↓
API Route (uses lib/api/helpers.ts)
       ↓
Neon PostgreSQL (via Drizzle ORM)
```

## Shared Hooks

### `hooks/useDropdown.ts`

Replaces 10 separate dropdown implementations with a single hook.

**Two modes:**
- **Portal mode** (default): Uses `buttonRef` and `dropdownRef` with fixed positioning. Handles scroll/resize repositioning automatically. Best for dropdowns that need to escape overflow containers.
- **Inline mode**: Uses a single `containerRef` wrapper with click-outside detection. Simpler for dropdowns that don't need portals.

**Usage:**
```tsx
const { isOpen, toggle, close, buttonRef, dropdownRef, position } = useDropdown()

// Button
<button ref={buttonRef} onClick={toggle}>Select</button>

// Portal dropdown
{isOpen && createPortal(
  <div ref={dropdownRef} style={{ position: 'fixed', top: position?.top, left: position?.left }}>
    {/* options */}
  </div>,
  document.body
)}
```

**Components using this hook:**
- `UI/CustomDropdown.tsx`, `UI/PriorityDropdown.tsx`, `UI/StatusDropdown.tsx`
- `SalesList/SalesStatusDropdown.tsx`, `SalesList/DeliveryMethodDropdown.tsx`
- `SalesList/ChannelDropdown.tsx`, `SalesList/ProductDropdown.tsx`
- `SalesList/SalesFilterDropdown.tsx`
- `TodoList/FilterDropdown.tsx`
- `ExpensesList/ExpenseDropdown.tsx`

### `hooks/useInlineEdit.ts`

Replaces duplicated save-on-blur, Enter-to-save, Escape-to-cancel logic in editable row components.

**Features:**
- `containerRef` for click-outside detection (100ms delay to avoid triggering on the opening click)
- Ignores clicks on `[data-dropdown-portal="true"]` elements (so dropdown selections don't trigger save)
- `handleKeyDown` for Enter (submit) and Escape (cancel) keyboard handling

**Usage:**
```tsx
const { containerRef, handleKeyDown } = useInlineEdit({
  onSubmit: () => saveTodo(),
  onCancel: () => cancelEdit(),
})

<div ref={containerRef}>
  <input onKeyDown={handleKeyDown} />
</div>
```

**Components using this hook:**
- `TodoList/TodoItemEditable.tsx`
- `SalesList/SalesItemEditable.tsx`
- `ExpensesList/ExpenseRowEditable.tsx`
- `QuickLinks/QuickLinkItemEditable.tsx`

## Store Factory

### `lib/createEntityStore.ts`

Factory function that generates the `loadFromServer`, `saveToServer`, `isLoading`, and `hasLoadedFromServer` boilerplate shared by all entity stores.

**Config options:**
| Option | Type | Description |
|--------|------|-------------|
| `coordinatorKey` | `string` | Key for `loadingCoordinator` request dedup |
| `endpoint` | `string` | API route path (e.g., `/api/todos/neon`) |
| `credentials` | `boolean` | Include credentials in fetch (default: `true`) |
| `debounceMs` | `number` | Save debounce delay in ms (default: `5000`) |
| `parseResponse` | `(data, state) => Partial<TState>` | Map API GET response to store state |
| `serializeState` | `(state) => Record<string, any>` | Map store state to POST body |
| `afterLoad` | `(get, set) => void` | Optional: run after successful load |
| `afterSave` | `() => void` | Optional: run after successful save |

**Usage:**
```ts
const loadSave = createEntityStoreSlice<MyStore>({
  coordinatorKey: 'my-data',
  endpoint: '/api/my-entity/neon',
  parseResponse: (data) => ({ items: data.items }),
  serializeState: (state) => ({ items: state.items }),
})

const useMyStore = create<MyStore>((set, get) => ({
  ...loadSave(set, get),
  items: [],
  addItem: (item) => { set({ items: [...get().items, item] }); get().saveToServer() },
}))
```

**Stores using this factory:**
| Store | Coordinator Key | Notable Config |
|-------|----------------|----------------|
| `lib/store.ts` (todos) | `todos-data` | Custom notification handling |
| `lib/salesStore.ts` | `sales-data` | `afterSave` clears dashboard cache, pending channel merge |
| `lib/calendarStore.ts` | `calendar-data` | `afterLoad` creates default calendar types |
| `lib/expenseStore.ts` | `expenses-data` | Straightforward |
| `lib/quickLinksStore.ts` | `quicklinks-data` | Straightforward |

**Not using factory:** `lib/notesStore.ts` — uses per-note save pattern (different paradigm).

### `lib/loadingCoordinator.ts`

Singleton service that prevents connection storms when multiple components request the same data simultaneously. Features:
- Deduplicates concurrent requests for the same coordinator key
- 1-second response cache to prevent rapid reloads
- `clearCache()` method for invalidation after saves

## API Route Helpers

### `lib/api/helpers.ts`

Shared helpers for the 4 authenticated entity API routes:

| Helper | Purpose |
|--------|---------|
| `requireAuth()` | Returns authenticated session or 401 response |
| `getDb()` | Returns database instance or `null` if not configured |
| `deleteByIds(table, idColumn, ids)` | Batch delete by ID array using raw SQL |
| `readJsonFallback(filename, emptyState)` | Read from `data/` JSON file |
| `writeJsonFallback(filename, data)` | Write to `data/` JSON file |
| `guardEmptyState(hasData, checkExisting)` | Block saves that would wipe all data |

**Routes using helpers:**
- `app/api/todos/neon/route.ts` (also has notification trigger logic)
- `app/api/sales/neon/route.ts` (also has color normalization)
- `app/api/calendar/neon/route.ts`
- `app/api/expenses/neon/route.ts`
- `app/api/quick-links/neon/route.ts`

**Not using helpers:** `app/api/notes/neon/route.ts` — per-record CRUD, different pattern.

## Dashboard Widget System

### `components/Dashboard/WidgetContainer.tsx`

All 5 dashboard widgets use this shared container for consistent glass morphism styling and navigation.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string?` | — | Route to navigate on click |
| `mode` | `'overlay' \| 'interactive'` | `'overlay'` | Click behavior |
| `className` | `string?` | — | Additional CSS classes |

**Modes:**
- **overlay**: Entire widget clickable. An invisible overlay blocks inner content interaction. Used by Todo, Sales, Notes, Quick Links widgets.
- **interactive**: Inner content remains interactive. Widget header/border is the navigation target. Used by Calendar widget (which has clickable events).

## Shared Components

### `components/UI/SubtaskItem.tsx`

Generic subtask component used by both Todo and Sales subtask lists. Accepts callback props instead of coupling to a specific store:

```tsx
interface SubtaskItemProps {
  subtask: { id: string; text: string; completed: boolean }
  onToggle: () => void
  onUpdate: (text: string) => void
  onDelete: () => void
  backgroundColor?: string
}
```

## How to Add a New Entity

1. **Define types** in `lib/myEntityTypes.ts`
2. **Create store** in `lib/myEntityStore.ts` using `createEntityStoreSlice`
3. **Create API route** in `app/api/my-entity/neon/route.ts` using helpers from `lib/api/helpers.ts`
4. **Create components** in `components/MyEntity/`
5. **Add page** in `app/my-entity/page.tsx`
6. **Add dashboard widget** using `WidgetContainer`
7. **Add nav link** in `components/UI/Header.tsx`

## Key Patterns

### Data Safety
All entity stores and API routes share these protections:
- **UPSERT** (not DELETE-then-INSERT) for database writes
- **Empty state guard** — API blocks saves when incoming data is empty but DB has data
- **Loading state guard** — stores won't save while loading or before initial load
- **Save debouncing** — 5-second delay (configurable) prevents rapid successive saves
- **Auth redirect** — 401 responses redirect to `/login`

### Dropdown Portal Pattern
All dropdowns use `data-dropdown-portal="true"` attribute on their portal container. This attribute is checked by `useInlineEdit` to avoid triggering save when a user clicks a dropdown option inside an editable row.

---

Last Updated: February 2026
