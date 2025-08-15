# Style Guide - Glassmorphism Design System

This style guide defines the glassmorphism design system for Squarage Studio - a modern, elegant approach using translucent glass effects, subtle depth, and refined typography.

## Design Philosophy

### Core Principles
- **Glassmorphism**: Translucent layers creating depth and hierarchy
- **Subtle Elegance**: Refined use of transparency and blur effects
- **Layered Depth**: Multiple glass panes at different opacity levels
- **Clean Minimalism**: Focus on content with glass as enhancement
- **Natural Lighting**: Soft shadows and highlights suggesting real glass

## Brand Colors

### Primary Color
- **Squarage Green**: `#4A9B4E` - The foundation gradient color
  - Used as background gradient base
  - Accent color for interactive elements

### Glass Palette
- **Glass White 20**: `rgba(255, 255, 255, 0.20)` - Heavy glass
- **Glass White 25**: `rgba(255, 255, 255, 0.25)` - Standard glass
- **Glass White 35**: `rgba(255, 255, 255, 0.35)` - Light glass
- **Glass White 50**: `rgba(255, 255, 255, 0.50)` - Lightest glass (buttons/overlays)
- **Glass White 65**: `rgba(255, 255, 255, 0.65)` - Hover state

### Supporting Colors
- **Pure White**: `#FFFFFF` - Text on dark backgrounds
- **Squarage Black**: `#333333` - Text on glass surfaces
- **Squarage White**: `#fffaf4` - Warm off-white for non-glass areas

### Accent Colors (Used Sparingly)
- **Squarage Orange**: `#F7901E` - Important CTAs only
- **Squarage Blue**: `#01BAD5` - Information states
- **Squarage Red**: `#F04E23` - Error/warning states
- **Squarage Yellow**: `#F5B74C` - Highlight/attention

## Typography

### Font Family
**Neue Haas Grotesk Display** - Clean geometric sans-serif

### Font Weights
- **Light (300)**: Glass overlay text
- **Regular (400)**: Body text on glass
- **Medium (500)**: Subheadings
- **Bold (700)**: Headers on glass backgrounds

### Type Scale
- **Hero**: 48px (Bold) - White with drop-shadow
- **H1**: 36px (Bold) - Primary headers
- **H2**: 28px (Medium) - Section headers
- **H3**: 20px (Medium) - Subsection headers
- **Body**: 16px (Regular) - Content text
- **Small**: 14px (Regular) - Secondary text
- **Caption**: 12px (Light) - Fine print

### Text Colors
- **On gradients**: White with `drop-shadow-lg`
- **On glass**: `#333333` (Squarage Black)
- **Muted text**: `rgba(51, 51, 51, 0.7)`

## Glass Effects

### Backdrop Filters
```css
/* Light blur - for outer containers */
backdrop-filter: blur(12px);  /* backdrop-blur-md */

/* Standard blur - for main content areas */
backdrop-filter: blur(16px);  /* backdrop-blur-lg */

/* Heavy blur - for overlays */
backdrop-filter: blur(24px);  /* backdrop-blur-xl */

/* Subtle blur - for nested elements */
backdrop-filter: blur(8px);   /* backdrop-blur-sm */
```

### Glass Layers
1. **Background**: Gradient base
2. **Primary Glass**: 35% white opacity + medium blur
3. **Secondary Glass**: 50% white opacity + subtle blur
4. **Hover Glass**: 65% white opacity + enhanced shadow

### Border Styles
- **Primary Glass**: `border: 1px solid rgba(255, 255, 255, 0.40)`
- **Secondary Glass**: `border: 1px solid rgba(255, 255, 255, 0.60)`
- **Subtle Glass**: `border: 1px solid rgba(255, 255, 255, 0.20)`

## Component Patterns

### Glass Containers
```css
/* Main container */
.glass-container {
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.40);
  border-radius: 1rem;  /* rounded-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Nested glass */
.glass-nested {
  background: rgba(255, 255, 255, 0.50);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.60);
  border-radius: 0.75rem;  /* rounded-xl */
}
```

### Glass Buttons
```css
/* Default state */
.glass-button {
  background: rgba(255, 255, 255, 0.50);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.60);
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
  color: #333333;
  font-weight: 500;
  transition: all 200ms;
}

/* Hover state - feels like glass lifting */
.glass-button:hover {
  background: rgba(255, 255, 255, 0.65);
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.25);
}
```

### Glass Input Fields
```css
.glass-input {
  background: rgba(255, 255, 255, 0.30);
  border: 1px solid rgba(255, 255, 255, 0.50);
  backdrop-filter: blur(4px);
  color: #333333;
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.40);
  border-color: rgba(255, 255, 255, 0.70);
}
```

## Background Patterns

### Primary Gradient
```css
background: linear-gradient(to bottom right, #4A9B4E, #3d7e41, #4A9B4E);
/* Tailwind: bg-gradient-to-br from-squarage-green via-green-600 to-squarage-green */
```

### Alternative Gradients
```css
/* Subtle variation */
background: linear-gradient(135deg, #4A9B4E 0%, #5cb85f 50%, #4A9B4E 100%);

/* Darker mood */
background: linear-gradient(to bottom, #3d7e41, #4A9B4E);
```

## Animation & Interaction

### Hover Effects
- **Scale**: 1.05 for buttons, 1.02 for cards
- **Translation**: -2px Y-axis for "lifting" effect
- **Opacity**: Increase by 10-15% on hover
- **Shadow**: Deepen shadow to enhance depth
- **Duration**: 200ms with ease-out

### Transitions
```css
/* Standard transition */
transition: all 200ms ease-out;

/* Glass morphing */
transition: background-color 200ms, 
            backdrop-filter 200ms,
            transform 200ms,
            box-shadow 200ms;
```

### Loading States
- Use glass skeleton screens with animated opacity
- Subtle pulse effect on glass surfaces
- Progress bars with glass appearance

## Spacing System

### Base Unit: 8px
- **xs**: 8px (0.5rem)
- **sm**: 16px (1rem)
- **md**: 24px (1.5rem)
- **lg**: 32px (2rem)
- **xl**: 48px (3rem)
- **2xl**: 64px (4rem)

### Glass-Specific Spacing
- **Container padding**: 24-32px
- **Glass border radius**: 16-32px
- **Element spacing**: 16px minimum between glass layers
- **Button padding**: 16px horizontal, 8px vertical

## Implementation Examples

### Tailwind Classes
```html
<!-- Main glass container -->
<div className="backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">

<!-- Nested glass element -->
<div className="backdrop-blur-sm bg-white/50 rounded-xl border border-white/60 p-4">

<!-- Glass button -->
<button className="backdrop-blur-sm bg-white/50 rounded-xl border border-white/60 
                   hover:bg-white/65 hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5 
                   transition-all duration-200 px-4 py-2">

<!-- Text on gradient -->
<h1 className="text-white drop-shadow-lg">

<!-- Text on glass -->
<p className="text-squarage-black">
```

### CSS Variables
```css
:root {
  --glass-light: rgba(255, 255, 255, 0.35);
  --glass-medium: rgba(255, 255, 255, 0.50);
  --glass-heavy: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.40);
  --blur-light: 8px;
  --blur-medium: 12px;
  --blur-heavy: 24px;
}
```

## Responsive Design

### Breakpoints
- **Mobile**: 0-768px - Single column, reduced blur
- **Tablet**: 768-1024px - Adjust glass opacity for readability
- **Desktop**: 1024px+ - Full glass effects

### Mobile Considerations
- Reduce blur intensity (performance)
- Increase glass opacity for better contrast
- Simplify layering (max 2 glass layers)
- Touch targets minimum 44x44px

## Accessibility

### Contrast Requirements
- **Text on glass**: Minimum 4.5:1 ratio
- **Increase opacity** if contrast is insufficient
- **Add subtle shadows** to improve text legibility
- **Test with reduced transparency** preference

### Focus States
```css
.glass-element:focus {
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  .glass-element {
    transition: none;
    transform: none;
  }
}
```

## Performance Guidelines

### Optimization Tips
1. **Limit blur layers**: Maximum 3 nested blur effects
2. **Use will-change**: For frequently animated glass elements
3. **GPU acceleration**: Use transform3d for smooth animations
4. **Lazy load**: Glass effects on scroll for performance
5. **Fallbacks**: Solid colors for non-supporting browsers

### Browser Support
- Modern browsers with backdrop-filter support
- Fallback to semi-transparent backgrounds
- Progressive enhancement approach

## Do's and Don'ts

### Do's
- ✅ Layer glass effects thoughtfully
- ✅ Maintain consistent opacity levels
- ✅ Use shadows to enhance depth
- ✅ Keep text highly legible
- ✅ Test on various backgrounds

### Don'ts
- ❌ Over-blur (reduces readability)
- ❌ Stack too many glass layers
- ❌ Use glass on glass without borders
- ❌ Forget fallbacks for older browsers
- ❌ Compromise accessibility for aesthetics

---

This glassmorphism design system creates a sophisticated, modern interface that feels premium and refined while maintaining excellent usability and performance.