# Implementation Details

**Complete implementation guide with code examples, file structure, and coding patterns.**

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Package Dependencies](#package-dependencies)
3. [Prisma Schema](#prisma-schema)
4. [Code Patterns](#code-patterns)
5. [State Management](#state-management)
6. [WebSocket Implementation](#websocket-implementation)
7. [Error Handling](#error-handling)
8. [Email Templates](#email-templates)
9. [Receipt Templates](#receipt-templates)
10. [Integration Examples](#integration-examples)

---

## Project Structure

### Complete Directory Layout

```
restaurant-order-delivery-app/
├── .env.example                 # Environment variables template
├── .env                         # Environment variables (gitignored)
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── prisma/
│   ├── schema.prisma            # Complete Prisma schema
│   └── migrations/            # Database migrations
├── public/
│   ├── images/
│   │   └── placeholders/       # Placeholder images folder
│   └── favicon.ico
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing page
│   │   ├── menu/
│   │   │   ├── page.tsx
│   │   │   └── [category]/
│   │   │       └── page.tsx
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   └── guest/
│   │   │       └── page.tsx
│   │   ├── order/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── menu/
│   │   │   ├── orders/
│   │   │   ├── settings/
│   │   │   └── analytics/
│   │   ├── pos/
│   │   │   └── page.tsx
│   │   ├── driver/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth/
│   │   │   │   ├── menu/
│   │   │   │   ├── orders/
│   │   │   │   ├── payments/
│   │   │   │   ├── gift-cards/
│   │   │   │   ├── admin/
│   │   │   │   └── ws/
│   │   │   └── health/
│   │   └── (auth)/
│   │       └── login/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ...
│   │   ├── customer/             # Customer-specific components
│   │   │   ├── MenuItemCard.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   └── ...
│   │   ├── admin/               # Admin components
│   │   │   ├── MenuEditor.tsx
│   │   │   ├── OrderManagement.tsx
│   │   │   └── ...
│   │   ├── pos/                 # POS components
│   │   │   ├── POSLayout.tsx
│   │   │   ├── OrderList.tsx
│   │   │   └── ...
│   │   └── driver/              # Driver components
│   │       ├── DeliveryList.tsx
│   │       ├── MapView.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── validations.ts       # Zod schemas
│   │   ├── utils.ts             # Utility functions
│   │   └── constants.ts         # Constants
│   ├── services/
│   │   ├── order-service.ts
│   │   ├── payment-service.ts
│   │   ├── menu-service.ts
│   │   ├── delivery-service.ts
│   │   ├── gift-card-service.ts
│   │   ├── notification-service.ts
│   │   └── analytics-service.ts
│   ├── stores/                  # Zustand stores
│   │   ├── cart-store.ts
│   │   ├── auth-store.ts
│   │   └── ui-store.ts
│   ├── types/
│   │   ├── order.ts
│   │   ├── menu.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── use-cart.ts
│   │   ├── use-orders.ts
│   │   └── use-websocket.ts
│   └── templates/
│       ├── emails/
│       │   ├── order-confirmation.tsx
│       │   ├── order-status-update.tsx
│       │   └── gift-card.tsx
│       └── receipts/
│           └── receipt-template.tsx
├── scripts/
│   ├── setup.sh                 # Initial setup script
│   ├── reset-demo.sh            # Daily reset script
│   ├── backup-db.sh             # Database backup
│   └── seed.ts                  # Database seed script
├── __tests__/
│   ├── unit/
│   ├── integration/
│   ├── components/
│   └── e2e/
├── docs/                        # Documentation
└── storage/                     # File uploads (gitignored)
    ├── images/
    ├── receipts/
    └── gift-cards/
```

---

## Package Dependencies

### package.json

```json
{
  "name": "restaurant-order-delivery-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx scripts/seed.ts",
    "db:reset": "prisma migrate reset && tsx scripts/seed.ts",
    "db:studio": "prisma studio",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.7.0",
    "prisma": "^5.7.0",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.2",
    "@hookform/resolvers": "^3.3.2",
    "zustand": "^4.4.7",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "stripe": "^14.7.0",
    "@paypal/checkout-server-sdk": "^1.0.3",
    "nodemailer": "^6.9.7",
    "ws": "^8.16.0",
    "date-fns": "^3.0.6",
    "lucide-react": "^0.303.0",
    "framer-motion": "^10.16.16",
    "recharts": "^2.10.3",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/ws": "^8.5.10",
    "@types/nodemailer": "^6.4.14",
    "typescript": "^5.3.3",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^16.0.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.40.1",
    "tsx": "^4.7.0"
  }
}
```

---

## Prisma Schema

### Complete Prisma Schema File

See [Database Schema](database-schema.md) for detailed table definitions. The Prisma schema file (`prisma/schema.prisma`) should include all tables with exact field types, relationships, and indexes.

**Key Configuration:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// All models from database-schema.md
```

---

## Code Patterns

### API Route Pattern

```typescript
// app/api/v1/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations'
import { createOrder } from '@/services/order-service'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Validate input
    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    // Business logic
    const order = await createOrder({
      userId: user.id,
      ...validated
    })

    // Return response
    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors } },
        { status: 400 }
      )
    }

    console.error('Order creation error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

### Service Layer Pattern

```typescript
// services/order-service.ts
import { prisma } from '@/lib/prisma'
import type { Order, OrderStatus } from '@/types/order'

export async function createOrder(data: CreateOrderInput): Promise<Order> {
  // Validate business rules
  // Calculate totals
  // Create order in database
  // Return order
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId: string
): Promise<Order> {
  // Check permissions
  // Update status
  // Create audit log
  // Emit WebSocket event
  // Return updated order
}
```

### Component Pattern

```typescript
// components/customer/MenuItemCard.tsx
'use client'

import { useState } from 'react'
import { useCartStore } from '@/stores/cart-store'
import type { MenuItem } from '@/types/menu'

interface MenuItemCardProps {
  item: MenuItem
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const addToCart = useCartStore((state) => state.addItem)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      await addToCart(item)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="menu-item-card">
      {/* Component JSX */}
    </div>
  )
}
```

---

## State Management

### Zustand Store Example

```typescript
// stores/cart-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types/order'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),
      removeItem: (itemId) => set((state) => ({
        items: state.items.filter(item => item.id !== itemId)
      })),
      updateQuantity: (itemId, quantity) => set((state) => ({
        items: state.items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      })),
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        const { items } = get()
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }
    }),
    {
      name: 'cart-storage',
      skipHydration: true
    }
  )
)
```

---

## WebSocket Implementation

### WebSocket Server

```typescript
// lib/websocket-server.ts
import { WebSocketServer, WebSocket } from 'ws'
import { verifyToken } from '@/lib/auth'

export class WebSocketService {
  private wss: WebSocketServer
  private clients: Map<string, WebSocket> = new Map()

  constructor(server: any) {
    this.wss = new WebSocketServer({ server, path: '/api/ws' })
    this.setupHandlers()
  }

  private setupHandlers() {
    this.wss.on('connection', async (ws: WebSocket, req) => {
      // Authenticate
      const token = this.extractToken(req)
      if (!token) {
        ws.close(1008, 'Unauthorized')
        return
      }

      const payload = verifyToken(token)
      if (!payload) {
        ws.close(1008, 'Invalid token')
        return
      }

      const clientId = payload.userId
      this.clients.set(clientId, ws)

      ws.on('message', async (data) => {
        await this.handleMessage(clientId, data)
      })

      ws.on('close', () => {
        this.clients.delete(clientId)
      })
    })
  }

  async broadcast(event: string, data: any, userIds?: string[]) {
    const targets = userIds || Array.from(this.clients.keys())
    targets.forEach(userId => {
      const client = this.clients.get(userId)
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, data }))
      }
    })
  }
}
```

### WebSocket Client Hook

```typescript
// hooks/use-websocket.ts
'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'

export function useWebSocket(event: string, callback: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!token) return

    const ws = new WebSocket(`ws://localhost:3000/api/ws?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (message) => {
      const { event: msgEvent, data } = JSON.parse(message.data)
      if (msgEvent === event) {
        callback(data)
      }
    }

    return () => {
      ws.close()
    }
  }, [token, event, callback])
}
```

---

## Error Handling

### Error Handling Pattern

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors
        }
      },
      { status: 400 }
    )
  }

  console.error('Unexpected error:', error)
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    },
    { status: 500 }
  )
}
```

---

## Email Templates

### Email Template Structure

```typescript
// templates/emails/order-confirmation.tsx
export function OrderConfirmationEmail({ order }: { order: Order }) {
  return {
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order.</p>
          <p>Order Number: ${order.orderNumber}</p>
          <p>Total: $${order.total.toFixed(2)}</p>
          <p>Estimated Delivery: ${order.estimatedDeliveryTime}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/order/${order.id}">Track Your Order</a>
        </body>
      </html>
    `,
    text: `Order Confirmed - ${order.orderNumber}...`
  }
}
```

---

## Receipt Templates

### Receipt Template

```typescript
// templates/receipts/receipt-template.tsx
export function generateReceipt(order: Order): string {
  return `
    RECEIPT
    ====================
    Order: ${order.orderNumber}
    Date: ${order.placedAt.toLocaleDateString()}
    
    Items:
    ${order.items.map(item => `
      ${item.name} x${item.quantity} - $${item.price.toFixed(2)}
    `).join('')}
    
    Subtotal: $${order.subtotal.toFixed(2)}
    Tax: $${order.tax.toFixed(2)}
    Delivery: $${order.deliveryFee.toFixed(2)}
    Tip: $${order.tip.toFixed(2)}
    Total: $${order.total.toFixed(2)}
    
    Thank you!
  `
}
```

---

## Integration Examples

### Stripe Integration

```typescript
// services/payment-service.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function createStripePaymentIntent(
  amount: number,
  orderId: string
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    metadata: { orderId }
  })

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  }
}
```

### PayPal Integration

```typescript
// services/payment-service.ts
import paypal from '@paypal/checkout-server-sdk'

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_CLIENT_SECRET!
)
const client = new paypal.core.PayPalHttpClient(environment)

export async function createPayPalOrder(amount: number, orderId: string) {
  const request = new paypal.orders.OrdersCreateRequest()
  request.prefer('return=representation')
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount.toFixed(2)
      },
      custom_id: orderId
    }]
  })

  const order = await client.execute(request)
  return {
    orderId: order.result.id,
    approvalUrl: order.result.links.find(link => link.rel === 'approve')?.href
  }
}
```

---

This implementation guide provides concrete code examples and patterns for building the restaurant ordering system.

