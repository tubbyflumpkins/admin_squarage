# Mobile PWA Implementation - Squarage Admin Dashboard

> **NOTE**: This file is a duplicate of `/mobile.md` at the project root. See the root file for the canonical version. This file will be removed.

## Overview
Complete mobile Progressive Web App (PWA) implementation for the Squarage Admin Dashboard, featuring native-like interactions, offline capabilities, and optimized mobile UI/UX.

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **State Management**: Zustand with API persistence
- **Styling**: Tailwind CSS with glassmorphism design
- **Touch Interactions**: Native touch events with pull-to-refresh
- **PWA**: Service worker, manifest, iOS/Android optimization

## Key Features

### 1. Add/Edit System (Revolutionary Design)
Instead of traditional modal forms, the mobile implementation uses an innovative inline card system:

#### Add New Item Flow
- Tap the `+` button in the header
- A new editable card appears at the top of the list with placeholder text
- Card has a white glowing effect to indicate edit mode
- All fields are interactive dropdowns except title/name (typeable)
- Clicking outside the card saves it to the database (if title exists)
- Delete button removes unsaved cards instantly

#### Edit Existing Item Flow
- Tap the menu (⋮) and select "Edit" to enter edit mode
- Card glows white to indicate editability
- Double-tap title/name to make it editable inline
- All dropdowns become active for editing
- Tap "Done" in menu or click outside to save changes

#### Key Implementation Details
```typescript
// Click-outside detection with dropdown awareness
useEffect(() => {
  if (!editableTodoId) return
  
  const handleDocumentClick = (e: MouseEvent) => {
    // Don't save if dropdown is open
    if (hasOpenDropdown) return
    
    // Check if clicked inside editable card
    const editableCard = document.querySelector(`[data-todo-id="${editableTodoId}"]`)
    if (editableCard && editableCard.contains(target)) return
    
    // Save new item if it has required fields
    if (newTodo && newTodo.title.trim()) {
      const { id, ...todoData } = newTodo
      addTodo(todoData)
    }
    
    setNewTodo(null)
    setEditableTodoId(null)
  }
}, [editableTodoId, newTodo, addTodo, hasOpenDropdown])
```

### 2. Visual Design System

#### Tag Standardization
All tags use consistent styling:
- **Padding**: `px-1.5 py-0.5`
- **Corners**: `rounded` (not `rounded-full`)
- **Font**: `text-xs font-medium`
- **Colors**: Status-based or priority-based backgrounds

#### White Glow Effect
Editable cards have a prominent white glow animation:
```css
@keyframes glow-white {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.5),
                0 0 30px rgba(255, 255, 255, 0.3),
                0 10px 30px -5px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.7),
                0 0 40px rgba(255, 255, 255, 0.5),
                0 10px 40px -5px rgba(255, 255, 255, 0.4);
  }
}
```

### 3. Touch Interactions

#### Pull-to-Refresh
- Natural iOS/Android-style pull gesture
- Visual feedback with spinning icon
- Smooth elastic animation
- Handles passive event listeners correctly:
```typescript
// CSS touch-action for performance
style={{ touchAction: pullDistance > 0 ? 'none' : 'auto' }}
```

#### Tap-to-Expand
- Single tap on card expands subtasks/notes section
- Works in both edit and view modes
- Ignores taps on interactive elements (buttons, inputs)
- Smooth accordion-style animation

### 4. Status Management

#### Always-Accessible Status
- Status dropdown is **always** clickable, not just in edit mode
- Critical for quick workflow updates
- Visual feedback with color-coded badges
- Tracks selection state for new items

#### Selection State Tracking
```typescript
const [hasSelectedStatus, setHasSelectedStatus] = useState(!isNew)
const [hasSelectedPriority, setHasSelectedPriority] = useState(!isNew)

// Display logic
{isNew && !hasSelectedStatus ? 'Status' : statusLabels[todo.status]}
```

### 5. Dropdown System

#### Z-Index Hierarchy
- Backdrop: `z-40` (blocks interaction)
- Dropdown menus: `z-50` (above backdrop)
- Prevents accidental saves when selecting options

#### Event Propagation Control
- All dropdown clicks stop propagation
- Parent component tracks open dropdown state
- Click-outside respects dropdown state

### 6. Data Safety

#### Required Field Validation
- Title/name must exist before saving
- Priority must be selected for todos
- Empty cards can be deleted without confirmation

#### State Management
- Temporary IDs for unsaved items (`temp-${Date.now()}`)
- Clean separation between new and existing items
- Automatic cleanup on cancel/delete

## Component Architecture

### TodoListMobile.tsx
- Main container for todo list
- Manages add/edit state
- Handles click-outside detection
- Pull-to-refresh implementation
- Stats bar with open task count

### TodoCardMobile.tsx
- Individual todo card component
- Inline editing capabilities
- Dropdown menus for all fields
- Expandable subtasks/notes section
- Double-tap to edit title

### SalesListMobile.tsx
- Sales tracker container
- Revenue statistics display
- Similar add/edit flow as todos
- Product/collection management

### SalesCardMobile.tsx
- Individual sale card
- Product selection with revenue
- Delivery method tracking
- Status workflow management

## Mobile-Specific Optimizations

### Performance
- Debounced saves
- Optimistic UI updates
- Minimal re-renders
- Touch-optimized event handlers

### Accessibility
- Large touch targets (44x44px minimum)
- High contrast colors
- Clear visual feedback
- Semantic HTML structure

### iOS Compatibility
- Safe area insets respected
- Smooth scrolling
- Native-feeling interactions
- Home screen installation support

### Android Compatibility
- Material Design principles
- System UI color theming
- Native sharing capabilities
- Push notification ready

## Known Issues & Solutions

### Fixed Issues
1. **Passive Event Listener Warning**: Resolved by using CSS `touch-action` instead of `preventDefault()`
2. **Dropdown Click-Through**: Fixed with proper z-index hierarchy and event propagation control
3. **Status Display Bug**: Added selection state tracking to show correct labels
4. **Expand/Collapse Not Working**: Removed overly broad `.relative` selector check
5. **Function Name Mismatches**: Corrected store method names (`addSaleSubtask`, `toggleSaleSubtask`, etc.)

### Current Behavior
- Status is always editable (by design)
- Cards expand on tap except on interactive elements
- White glow indicates edit mode
- Click-outside saves new items with validation

## Testing Checklist

### Core Functionality
- [ ] Add new todo/sale with all fields
- [ ] Edit existing items inline
- [ ] Delete items (new and existing)
- [ ] Change status without edit mode
- [ ] Expand/collapse subtasks

### Touch Interactions
- [ ] Pull-to-refresh works smoothly
- [ ] Tap-to-expand functions correctly
- [ ] Dropdowns don't trigger saves
- [ ] Click-outside saves properly

### Visual Design
- [ ] White glow on editable cards
- [ ] Consistent tag shapes
- [ ] Proper color coding
- [ ] Smooth animations

### Data Integrity
- [ ] Required fields enforced
- [ ] No accidental data loss
- [ ] Proper state cleanup
- [ ] API persistence working

## Future Enhancements
- Offline mode with service workers
- Push notifications for task reminders
- Gesture controls (swipe to delete/complete)
- Voice input for task creation
- Camera integration for receipts (sales)
- Barcode scanning for products
- Location-based reminders
- Collaborative real-time updates