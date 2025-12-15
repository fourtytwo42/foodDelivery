# Menu Management Feature

**Complete menu management system with categories, items, and modifiers.**

---

## Overview

The menu management system allows admins to create and manage menu categories, items, modifiers, and availability times.

---

## Features

### Categories

- Create custom categories
- Set category order
- Upload category images
- Set availability times (per category)
- Activate/deactivate categories

### Menu Items

- Create items in categories
- Set name, description, price
- Upload item images
- Set featured/popular flags
- Add dietary tags
- Add allergen information
- Add nutrition info (optional)
- Set availability times (per item)

### Modifiers

- **Types:**
  - Single choice (radio buttons)
  - Multiple choice (checkboxes)
  - Text input
  - Number input

- **Configuration:**
  - Required or optional
  - Min/max selections
  - Per-item configuration

### Modifier Options

- Create options for modifiers
- Set option prices (fixed or percentage)
- Set option order
- Activate/deactivate options

### Availability

- Time-based availability
- Per item or per category
- Multiple time slots (morning, lunch, dinner)
- Day-based availability

---

## Menu Display

### Public Menu

- Browse by category
- Search items
- Filter by dietary tags, price
- View item details
- Customize items
- Add to cart

### Admin Menu Management

- Full CRUD operations
- Drag-and-drop ordering
- Bulk operations
- Image management
- Modifier configuration

---

## Database Schema

See [Database Schema](../database-schema.md) for complete schema.

Key tables:
- `menu_categories`
- `menu_items`
- `modifiers`
- `modifier_options`
- `menu_item_modifiers`

---

## API Endpoints

See [API Specifications](../api-specifications.md) for complete API docs.

Key endpoints:
- `GET /api/v1/menu` - Get menu
- `GET /api/v1/menu/items/:id` - Get item
- `GET /api/v1/menu/search` - Search menu

---

This feature provides flexible menu management for any restaurant type.

