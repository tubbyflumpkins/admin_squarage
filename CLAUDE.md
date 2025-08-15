# Squarage Admin Dashboard - Project Documentation

## Project Overview
An admin dashboard for Squarage company built with Next.js 14, TypeScript, and Tailwind CSS. The dashboard features a modular widget-based design with a fully functional todo list system as the primary feature.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Squarage brand colors
- **State Management**: Zustand with persistence
- **Drag & Drop**: @dnd-kit/sortable
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Deployment**: Vercel-ready configuration

## Project Structure
```
admin_squarage/
├── app/                       # Next.js app directory
│   ├── layout.tsx            # Root layout with fonts
│   ├── globals.css           # Global styles & Tailwind
│   ├── page.tsx              # Dashboard homepage
│   ├── api/
│   │   └── todos/
│   │       └── route.ts      # API endpoint for todo persistence
│   └── todo/
│       └── page.tsx          # Full-page todo view
├── components/
│   ├── Dashboard/
│   │   ├── DashboardLayout.tsx
│   │   └── WidgetContainer.tsx  # Reusable widget wrapper
│   ├── TodoList/
│   │   ├── TodoWidget.tsx       # Dashboard widget version
│   │   ├── TodoFullPage.tsx     # Full page version
│   │   ├── TodoItem.tsx         # Individual todo item
│   │   ├── TodoItemEditable.tsx # Inline editing component
│   │   ├── TodoFilters.tsx      # Filter controls
│   │   ├── AddTodoModal.tsx     # Add/Edit todo modal
│   │   ├── CategoryOwnerEditModal.tsx  # Manage categories/owners
│   │   ├── SubtaskList.tsx      # Expandable subtasks & notes
│   │   └── SubtaskItem.tsx      # Individual subtask component
│   └── UI/
│       ├── Header.tsx            # Site header with nav
│       └── Button.tsx            # Reusable button component
├── lib/
│   ├── store.ts                 # Zustand store configuration
│   ├── types.ts                 # TypeScript interfaces
│   └── utils.ts                 # Utility functions
├── data/
│   └── todos.json              # File-based data storage
├── Style/                       # Branding assets
│   ├── STYLE_GUIDE.md          # Complete style guide
│   └── fonts/                  # Neue Haas Grotesk fonts
└── public/
    └── images/                  # Logo and assets
```

## Site Map
```
/                   # Dashboard home with todo widget and placeholder widgets
├── /todo           # Full-page todo list view with advanced features
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
- **Persistent Storage**: Uses API endpoint with file-based storage

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

### Design System
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

### Data Persistence (API Storage)
The application uses a file-based API for data persistence:
```typescript
// lib/store.ts - Custom API storage
const apiStorage = {
  getItem: async (name: string) => {
    const response = await fetch('/api/todos')
    // Fetches from data/todos.json
  },
  setItem: async (name: string, value: string) => {
    await fetch('/api/todos', {
      method: 'POST',
      // Saves to data/todos.json
    })
  }
}
```
**CRITICAL**: Always use API storage for server persistence. Never switch to localStorage.

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
Zustand store with persistence:
- Categories and owners are stored with color associations
- Todos reference categories/owners by name
- Filters and sorting preferences persist across sessions
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
```

## Deployment
The project is configured for Vercel deployment:
1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically (vercel.json included)

## Future Enhancements (Placeholders Exist)
- **Notes Widget**: Quick notes and documentation
- **Events Widget**: Calendar and event management
- **Financial Widget**: Revenue and expense tracking
- **Quick Stats**: User metrics and analytics

## Known Considerations
1. **Hydration**: TodoWidget uses `isHydrated` state to prevent SSR/CSR mismatches
2. **Color Management**: Colors are stored in both store.ts and CategoryOwnerEditModal
3. **Data Persistence**: Uses API endpoint that saves to `data/todos.json`
4. **Font Loading**: Custom fonts loaded via local files in Style/fonts
5. **Sample Data**: When todos are lost, restore from backup in conversation history

## Component Communication
- **Props Flow**: Minimal prop drilling, most state in Zustand
- **Modal Pattern**: Modals manage their own open/close state
- **Widget Pattern**: Widgets can be clicked to navigate to full-page views
- **Auto-save Pattern**: Changes save immediately without confirmation

## Testing Approach
Currently no tests implemented. For future testing:
- Unit tests for store functions
- Component tests for TodoItem interactions
- E2E tests for todo CRUD operations

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
- Background color inheritance from task categories