# Component Library

**Reusable UI component specifications and patterns.**

---

## Table of Contents

1. [Component Philosophy](#component-philosophy)
2. [Base Components](#base-components)
3. [Form Components](#form-components)
4. [Layout Components](#layout-components)
5. [Feature Components](#feature-components)
6. [Component Patterns](#component-patterns)

---

## Component Philosophy

### Design Principles

- **Reusability:** Components should be reusable across the app
- **Composability:** Build complex components from simple ones
- **Accessibility:** WCAG 2.1 AA compliance
- **Mobile-First:** Responsive by default
- **Type Safety:** Full TypeScript support

### Component Structure

```typescript
// Standard component structure
'use client' // If needed

import { ... } from '...'

interface ComponentProps {
  // Props with JSDoc
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
  return (...)
}
```

---

## Base Components

### Button

**Location:** `components/ui/Button.tsx`

**Props:**
```typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}
```

**Usage:**
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Add to Cart
</Button>
```

### Input

**Location:** `components/ui/Input.tsx`

**Props:**
```typescript
interface InputProps {
  label?: string
  name: string
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  disabled?: boolean
}
```

### Modal

**Location:** `components/ui/Modal.tsx`

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}
```

### Toast

**Location:** `components/ui/Toast.tsx`

**Props:**
```typescript
interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose?: () => void
}
```

---

## Form Components

### FormField

**Location:** `components/forms/FormField.tsx`

**Features:**
- Label
- Input
- Error message
- Help text
- Required indicator

### Select

**Location:** `components/forms/Select.tsx`

**Features:**
- Dropdown select
- Searchable (optional)
- Multi-select (optional)
- Custom options

### Checkbox

**Location:** `components/forms/Checkbox.tsx`

**Features:**
- Single checkbox
- Checkbox group
- Indeterminate state

### RadioGroup

**Location:** `components/forms/RadioGroup.tsx`

**Features:**
- Radio button group
- Single selection
- Horizontal/vertical layout

---

## Layout Components

### Header

**Location:** `components/layout/Header.tsx`

**Features:**
- Logo
- Navigation menu
- Cart icon with count
- User menu
- Mobile hamburger menu

### Sidebar

**Location:** `components/layout/Sidebar.tsx`

**Features:**
- Navigation links
- Collapsible sections
- Active state
- Mobile responsive

### Footer

**Location:** `components/layout/Footer.tsx`

**Features:**
- Links
- Contact info
- Social media
- Copyright

---

## Feature Components

### MenuItemCard

**Location:** `components/customer/MenuItemCard.tsx`

**Features:**
- Item image
- Name and description
- Price
- Dietary tags
- Add to cart button
- Quick view

### Cart

**Location:** `components/customer/Cart.tsx`

**Features:**
- Item list
- Quantity controls
- Remove items
- Totals display
- Checkout button
- Empty state

### OrderTracking

**Location:** `components/customer/OrderTracking.tsx`

**Features:**
- Status timeline
- Estimated delivery time
- Order details
- Driver info (if delivery)
- Refresh button

### POSLayout

**Location:** `components/pos/POSLayout.tsx`

**Features:**
- Touch-optimized
- Large buttons
- Order list
- Quick actions
- Receipt printing

---

## Component Patterns

### Loading States

```typescript
{isLoading ? (
  <SkeletonLoader />
) : (
  <Content />
)}
```

### Error States

```typescript
{error ? (
  <ErrorMessage error={error} onRetry={handleRetry} />
) : (
  <Content />
)}
```

### Empty States

```typescript
{items.length === 0 ? (
  <EmptyState message="No items found" />
) : (
  <ItemList items={items} />
)}
```

---

This component library provides reusable, consistent UI components throughout the application.

