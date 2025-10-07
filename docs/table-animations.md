# Table Row Animations Implementation

## Overview
Smooth animations have been added to all table rows across the application when rows are added or deleted. This enhances the user experience with fluid transitions that make data changes more visually appealing and easier to track.

## Implementation Details

### 1. Animation Component
- **File**: `src/components/ui/animated-table-row.tsx`
- **Technology**: Framer Motion for React animations
- **Features**:
  - Smooth slide-in animation for new rows (from top with opacity fade)
  - Height collapse animation for deleted rows
  - Layout ID support for complex animations
  - Customizable animation parameters

### 2. Animation Properties
```typescript
// New row animation
initial: { opacity: 0, y: -20, height: 0 }
animate: { opacity: 1, y: 0, height: "auto" }
transition: { duration: 0.3, ease: "easeOut" }

// Delete row animation
exit: { 
  opacity: 0, 
  y: -20, 
  height: 0,
  transition: { duration: 0.2, ease: "easeIn" }
}
```

### 3. Updated Tables

#### Admin Management Table
- **File**: `src/app/[lang]/(dashboard)/settings/admins/page.tsx`
- **Animation**: Smooth transitions when admins are added/removed
- **Layout ID**: `admin-{id}` for unique identification

#### Maintenance Requests Table
- **File**: `src/app/[lang]/(dashboard)/maintenance/page.tsx`
- **Animation**: Fluid updates when requests are created/resolved
- **Layout ID**: `maintenance-{id}`

#### Properties Management Table
- **File**: `src/app/[lang]/(dashboard)/properties/management/page.tsx`
- **Animation**: Smooth property additions and deletions
- **Layout ID**: `property-{id}`

#### Documents Table
- **File**: `src/app/[lang]/(dashboard)/documents/page.tsx`
- **Animation**: Clean transitions for document uploads/deletions
- **Layout ID**: `document-{id}`

#### Tenants Table
- **File**: `src/app/[lang]/(dashboard)/tenants/page.tsx`
- **Animation**: Smooth tenant onboarding and removal animations
- **Layout ID**: `tenant-{id}`

### 4. Implementation Pattern

Each table follows this consistent pattern:

```tsx
// 1. Import the animation components
import { AnimatedTableRow } from "@/components/ui/animated-table-row";
import { AnimatePresence } from "framer-motion";

// 2. Wrap table body with AnimatePresence
<TableBody>
  <AnimatePresence mode="popLayout">
    {items.map((item) => (
      // 3. Replace TableRow with AnimatedTableRow
      <AnimatedTableRow key={item.id} layoutId={`type-${item.id}`}>
        {/* table cells content */}
      </AnimatedTableRow>
    ))}
  </AnimatePresence>
</TableBody>
```

### 5. Animation Features

#### Entry Animation (New Rows)
- **Duration**: 300ms
- **Effect**: Slides down from above with opacity fade-in
- **Easing**: `easeOut` for natural feel
- **Height**: Expands from 0 to auto

#### Exit Animation (Deleted Rows)
- **Duration**: 200ms (faster than entry)
- **Effect**: Slides up while fading out
- **Easing**: `easeIn` for quick removal
- **Height**: Collapses to 0

#### Layout Animations
- Uses Framer Motion's `layoutId` for advanced animations
- Prevents layout shifts during transitions
- Maintains smooth performance with `mode="popLayout"`

### 6. Performance Considerations

- **Efficient Rendering**: Uses `AnimatePresence` with `popLayout` mode
- **Unique Keys**: Each row has a unique `layoutId` for optimal tracking
- **Minimal Re-renders**: Animations don't trigger unnecessary component updates
- **Smooth 60fps**: Optimized animation properties for consistent performance

### 7. User Experience Benefits

- **Visual Feedback**: Clear indication when data changes
- **Reduced Jarring**: Smooth transitions instead of sudden appearance/disappearance
- **Professional Feel**: Modern, polished interface animations
- **Better Tracking**: Easier to follow changes in dynamic content
- **Consistent Behavior**: Same animation pattern across all tables

### 8. Browser Support
- **Modern Browsers**: Full support with hardware acceleration
- **Fallback**: Graceful degradation to instant transitions if animations fail
- **Performance**: GPU-accelerated transforms for smooth animations

## Usage in Future Tables

To add animations to new tables:

1. Import the animation components
2. Wrap your map function with `AnimatePresence`
3. Replace `TableRow` with `AnimatedTableRow`
4. Provide unique `layoutId` for each row
5. Test addition and deletion scenarios

The animation system is now ready to enhance any new table components added to the application.