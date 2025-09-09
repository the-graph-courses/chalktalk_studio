# Component Documentation

## Main Components

### EphemeralChatPanel

Located: `app/_components/EphemeralChatPanel.tsx`

A chat interface for AI assistance with slide creation and editing.

**Props:**
```typescript
interface EphemeralChatPanelProps {
  projectId?: string;
  onSlideUpdate?: (slides: any[]) => void;
}
```

**Features:**
- Real-time chat with AI
- Slide creation and editing commands
- Context-aware responses
- Message history

### SlideThumbnailPanel

Located: `app/_components/SlideThumbnailPanel.tsx`

Displays thumbnail previews of all slides in the current deck.

**Props:**
```typescript
interface SlideThumbnailPanelProps {
  slides: any[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onSlideUpdate: (slides: any[]) => void;
}
```

**Features:**
- Thumbnail generation from slide content
- Drag and drop reordering
- Context menu actions
- Current slide highlighting

### SlideContextMenu

Located: `app/_components/SlideContextMenu.tsx`

Right-click context menu for slide operations.

**Props:**
```typescript
interface SlideContextMenuProps {
  slideIndex: number;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onInsertBefore: (index: number) => void;
  onInsertAfter: (index: number) => void;
}
```

**Available Actions:**
- Duplicate slide
- Delete slide
- Insert new slide before/after
- Move slide up/down

### Header

Located: `app/_components/Header.tsx`

Main application header with navigation and user controls.

**Features:**
- User authentication status
- Navigation menu
- Project title display
- Save/export actions

### Sidebar

Located: `app/_components/Sidebar.tsx`

Collapsible sidebar for navigation and tools.

**Features:**
- Project navigation
- Tool palette
- Settings access
- Responsive design

## UI Components

### Button

Located: `components/ui/button.tsx`

Reusable button component with variants.

**Variants:**
- `default`: Primary button style
- `secondary`: Secondary button style
- `outline`: Outlined button
- `ghost`: Transparent button

### Input

Located: `components/ui/input.tsx`

Styled input field component.

### Textarea

Located: `components/ui/textarea.tsx`

Multi-line text input component.

### Tooltip

Located: `components/ui/tooltip.tsx`

Hover tooltip component using Radix UI.

## Layout Components

### LayoutWrapper

Located: `app/_components/LayoutWrapper.tsx`

Main layout wrapper that provides the overall application structure.

**Features:**
- Responsive layout
- Sidebar integration
- Header positioning
- Content area management

## Usage Examples

### Creating a New Slide

```typescript
import { createSlide } from '@/lib/slide-tools';
import { SlideFormat } from '@/lib/slide-formats';

const newSlide = createSlide(SlideFormat.TITLE, {
  title: "My New Slide",
  subtitle: "Subtitle text"
});
```

### Using the Chat Panel

```tsx
<EphemeralChatPanel 
  projectId={projectId}
  onSlideUpdate={(slides) => {
    // Handle slide updates
    setSlides(slides);
  }}
/>
```

### Implementing Context Menu

```tsx
<SlideContextMenu
  slideIndex={selectedSlideIndex}
  onDuplicate={handleDuplicate}
  onDelete={handleDelete}
  onInsertBefore={handleInsertBefore}
  onInsertAfter={handleInsertAfter}
/>
```
