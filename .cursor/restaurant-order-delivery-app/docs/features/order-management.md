# Order Management Feature

**Complete order management system documentation.**

---

## Overview

The order management system handles the complete order lifecycle from creation to delivery, including status tracking, modifications, cancellations, and refunds.

---

## Order Flow

### Order Statuses

1. **PENDING** - Order created, awaiting payment
2. **PENDING_PAYMENT** - Payment processing
3. **CONFIRMED** - Payment successful, order confirmed
4. **PREPARING** - Kitchen preparing order
5. **READY** - Order ready for pickup/delivery
6. **OUT_FOR_DELIVERY** - Driver en route
7. **DELIVERED** - Order delivered
8. **CANCELLED** - Order cancelled
9. **REFUNDED** - Order refunded

### Order Types

- **DELIVERY** - Delivery to customer address
- **PICKUP** - Customer picks up at restaurant

---

## Features

### Order Creation

- Customer places order via website
- Staff creates order via POS
- Guest checkout supported
- Authenticated checkout supported

### Order Tracking

- Real-time status updates
- Estimated delivery time
- Driver tracking (if delivery)
- Status history timeline

### Order Modifications

- Staff can modify orders (before preparation)
- Staff can cancel orders
- Customers cannot cancel (must call)
- Automatic refunds on cancellation

### Order Management

- View all orders (admin/staff)
- Filter by status, date, type
- Search orders
- Update order status
- Print receipts
- Export orders

---

## Database Schema

See [Database Schema](../database-schema.md) for complete schema.

Key tables:
- `orders`
- `order_items`
- `order_modifiers`
- `deliveries`

---

## API Endpoints

See [API Specifications](../api-specifications.md) for complete API docs.

Key endpoints:
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order
- `PUT /api/v1/admin/orders/:id/status` - Update status
- `POST /api/v1/admin/orders/:id/cancel` - Cancel order

---

## Real-Time Updates

- WebSocket events for status changes
- Push notifications
- Email notifications
- SMS notifications (optional)

---

## Estimated Delivery Time

Calculated based on:
- Current order queue
- Preparation time
- Delivery distance
- Driver availability

Formula: `prepTime + queueTime + deliveryTime`

---

This feature provides complete order management from creation to delivery.

