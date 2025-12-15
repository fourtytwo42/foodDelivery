# API Specifications

**Complete API endpoint documentation, request/response formats, authentication, and error handling.**

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Customer Endpoints](#customer-endpoints)
4. [Menu Endpoints](#menu-endpoints)
5. [Order Endpoints](#order-endpoints)
6. [Payment Endpoints](#payment-endpoints)
7. [Gift Card Endpoints](#gift-card-endpoints)
8. [Coupon & Loyalty Endpoints](#coupon--loyalty-endpoints)
9. [Delivery Endpoints](#delivery-endpoints)
10. [Admin Endpoints](#admin-endpoints)
11. [POS Endpoints](#pos-endpoints)
12. [Driver Endpoints](#driver-endpoints)
13. [Analytics Endpoints](#analytics-endpoints)
14. [WebSocket Events](#websocket-events)
15. [Error Handling](#error-handling)

---

## API Overview

### Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`

### API Versioning

All endpoints are under `/api/v1/` (future versions will use `/api/v2/`, etc.)

### Response Format

All responses are JSON:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

### Rate Limiting

- **Public endpoints:** 100 requests/minute per IP
- **Authenticated endpoints:** 1000 requests/minute per user
- **Payment endpoints:** 10 requests/minute per user

---

## Authentication

### Register

**Endpoint:** `POST /api/v1/auth/register`

**Request:**
```json
{
  "email": "customer@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt_token_here",
    "expiresIn": 259200
  }
}
```

### Login

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "customer@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "customer@example.com",
      "roles": ["CUSTOMER"]
    },
    "token": "jwt_token_here",
    "expiresIn": 259200
  }
}
```

### Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 259200
  }
}
```

### Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Password Reset Request

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Request:**
```json
{
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Password Reset

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## Customer Endpoints

### Get Current User

**Endpoint:** `GET /api/v1/users/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "roles": ["CUSTOMER"],
    "loyaltyPoints": 150,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Update Profile

**Endpoint:** `PUT /api/v1/users/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }
}
```

### Get Addresses

**Endpoint:** `GET /api/v1/users/me/addresses`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "addr_123",
      "label": "Home",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "isDefault": true
    }
  ]
}
```

### Create Address

**Endpoint:** `POST /api/v1/users/me/addresses`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "label": "Work",
  "street": "456 Business Ave",
  "city": "New York",
  "state": "NY",
  "zipCode": "10002",
  "isDefault": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "addr_124",
    "label": "Work",
    "street": "456 Business Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002",
    "isDefault": false
  }
}
```

### Get Payment Methods

**Endpoint:** `GET /api/v1/users/me/payment-methods`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_123",
      "type": "STRIPE",
      "last4": "4242",
      "brand": "visa",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "isDefault": true
    }
  ]
}
```

---

## Menu Endpoints

### Get Menu

**Endpoint:** `GET /api/v1/menu`

**Query Parameters:**
- `category` (optional) - Filter by category ID
- `available` (optional) - Filter by availability (true/false)
- `time` (optional) - Check availability at specific time (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_123",
        "name": "Appetizers",
        "description": "Start your meal right",
        "image": "/images/categories/appetizers.jpg",
        "items": [
          {
            "id": "item_123",
            "name": "Mozzarella Sticks",
            "description": "Crispy fried mozzarella",
            "image": "/images/items/mozz-sticks.jpg",
            "price": 8.99,
            "featured": true,
            "dietaryTags": ["vegetarian"],
            "modifiers": [
              {
                "id": "mod_123",
                "name": "Sauce",
                "type": "SINGLE_CHOICE",
                "required": false,
                "options": [
                  {
                    "id": "opt_123",
                    "name": "Marinara",
                    "price": 0.0
                  },
                  {
                    "id": "opt_124",
                    "name": "Ranch",
                    "price": 0.0
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Get Menu Item

**Endpoint:** `GET /api/v1/menu/items/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "item_123",
    "categoryId": "cat_123",
    "name": "Mozzarella Sticks",
    "description": "Crispy fried mozzarella with your choice of sauce",
    "image": "/images/items/mozz-sticks.jpg",
    "price": 8.99,
    "featured": true,
    "popular": true,
    "dietaryTags": ["vegetarian"],
    "allergens": ["dairy"],
    "calories": 320,
    "modifiers": [ ... ]
  }
}
```

### Search Menu

**Endpoint:** `GET /api/v1/menu/search`

**Query Parameters:**
- `q` (required) - Search query
- `category` (optional) - Filter by category
- `dietaryTags` (optional) - Filter by dietary tags (comma-separated)
- `maxPrice` (optional) - Maximum price
- `minPrice` (optional) - Minimum price

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item_123",
        "name": "Mozzarella Sticks",
        "category": "Appetizers",
        "price": 8.99,
        "image": "/images/items/mozz-sticks.jpg"
      }
    ],
    "total": 1
  }
}
```

---

## Order Endpoints

### Create Order

**Endpoint:** `POST /api/v1/orders`

**Headers:**
```
Authorization: Bearer <token> (optional for guest)
```

**Request:**
```json
{
  "type": "DELIVERY",
  "items": [
    {
      "menuItemId": "item_123",
      "quantity": 2,
      "modifiers": [
        {
          "modifierOptionId": "opt_123",
          "quantity": 1
        }
      ],
      "specialInstructions": "Extra crispy"
    }
  ],
  "deliveryAddressId": "addr_123",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "tip": 5.00,
  "couponCode": "SAVE10",
  "specialInstructions": "Ring doorbell",
  "paymentMethod": {
    "type": "STRIPE",
    "paymentMethodId": "pm_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "orderNumber": "ORD-2025-001",
    "status": "CONFIRMED",
    "total": 32.98,
    "estimatedDeliveryTime": "2025-01-01T12:30:00Z",
    "trackingUrl": "/order/order_123"
  }
}
```

### Get Order

**Endpoint:** `GET /api/v1/orders/:id`

**Headers:**
```
Authorization: Bearer <token> (optional for guest with tracking URL)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "orderNumber": "ORD-2025-001",
    "status": "PREPARING",
    "type": "DELIVERY",
    "items": [ ... ],
    "subtotal": 27.98,
    "tax": 2.30,
    "deliveryFee": 3.00,
    "tip": 5.00,
    "total": 38.28,
    "estimatedDeliveryTime": "2025-01-01T12:30:00Z",
    "placedAt": "2025-01-01T12:00:00Z",
    "confirmedAt": "2025-01-01T12:00:01Z",
    "preparingAt": "2025-01-01T12:05:00Z"
  }
}
```

### Get Order History

**Endpoint:** `GET /api/v1/orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)
- `status` (optional) - Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### Get Order Tracking

**Endpoint:** `GET /api/v1/orders/:id/tracking`

**Public endpoint (no auth required if tracking token provided)**

**Query Parameters:**
- `token` (optional) - Tracking token for guest access

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD-2025-001",
    "status": "OUT_FOR_DELIVERY",
    "statusHistory": [
      {
        "status": "PENDING",
        "timestamp": "2025-01-01T12:00:00Z"
      },
      {
        "status": "CONFIRMED",
        "timestamp": "2025-01-01T12:00:01Z"
      },
      {
        "status": "PREPARING",
        "timestamp": "2025-01-01T12:05:00Z"
      },
      {
        "status": "OUT_FOR_DELIVERY",
        "timestamp": "2025-01-01T12:20:00Z"
      }
    ],
    "estimatedDeliveryTime": "2025-01-01T12:30:00Z",
    "delivery": {
      "driverName": "John Driver",
      "driverPhone": "+1234567890",
      "currentLocation": {
        "latitude": 40.7128,
        "longitude": -74.0060
      }
    }
  }
}
```

---

## Payment Endpoints

### Process Payment

**Endpoint:** `POST /api/v1/payments/process`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "orderId": "order_123",
  "paymentMethod": {
    "type": "STRIPE",
    "paymentMethodId": "pm_123"
  },
  "giftCard": {
    "cardNumber": "GC1234567890",
    "pin": "1234"
  },
  "loyaltyPoints": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_123",
    "status": "SUCCEEDED",
    "amount": 38.28,
    "orderId": "order_123"
  }
}
```

### Create Payment Intent (Stripe)

**Endpoint:** `POST /api/v1/payments/stripe/create-intent`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 38.28,
  "currency": "USD",
  "orderId": "order_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_123_secret_abc",
    "paymentIntentId": "pi_123"
  }
}
```

### Create PayPal Order

**Endpoint:** `POST /api/v1/payments/paypal/create-order`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 38.28,
  "currency": "USD",
  "orderId": "order_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "PAYPAL_ORDER_123",
    "approvalUrl": "https://www.paypal.com/checkoutnow?token=..."
  }
}
```

---

## Gift Card Endpoints

### Check Gift Card Balance

**Endpoint:** `POST /api/v1/gift-cards/check`

**Request:**
```json
{
  "cardNumber": "GC1234567890",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cardNumber": "GC1234567890",
    "balance": 25.50,
    "status": "ACTIVE"
  }
}
```

### Purchase Gift Card

**Endpoint:** `POST /api/v1/gift-cards/purchase`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 50.00,
  "type": "VIRTUAL",
  "recipientEmail": "recipient@example.com",
  "recipientName": "John Doe",
  "message": "Happy Birthday!",
  "paymentMethod": {
    "type": "STRIPE",
    "paymentMethodId": "pm_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "giftCardId": "gc_123",
    "cardNumber": "GC1234567890",
    "pin": "1234",
    "amount": 50.00,
    "type": "VIRTUAL"
  }
}
```

### Get User Gift Cards

**Endpoint:** `GET /api/v1/gift-cards`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "gc_123",
      "cardNumber": "GC1234567890",
      "balance": 25.50,
      "type": "VIRTUAL",
      "status": "ACTIVE"
    }
  ]
}
```

---

## Coupon & Loyalty Endpoints

### Validate Coupon

**Endpoint:** `POST /api/v1/coupons/validate`

**Headers:**
```
Authorization: Bearer <token> (optional)
```

**Request:**
```json
{
  "code": "SAVE10",
  "orderTotal": 50.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "couponId": "coupon_123",
    "code": "SAVE10",
    "discount": 5.00,
    "type": "PERCENTAGE",
    "value": 10
  }
}
```

### Get Loyalty Points

**Endpoint:** `GET /api/v1/loyalty/points`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 150,
    "pointsForFree": 100,
    "transactions": [
      {
        "id": "lp_123",
        "points": 25,
        "type": "EARNED",
        "description": "Order #ORD-2025-001",
        "createdAt": "2025-01-01T12:00:00Z"
      }
    ]
  }
}
```

---

## Delivery Endpoints

### Calculate Delivery Fee

**Endpoint:** `POST /api/v1/delivery/calculate-fee`

**Request:**
```json
{
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "orderTotal": 50.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deliveryFee": 3.00,
    "freeDeliveryThreshold": 25.00,
    "eligibleForFreeDelivery": true,
    "zone": {
      "id": "zone_123",
      "name": "Zone 1",
      "radius": 5.0
    }
  }
}
```

---

## Admin Endpoints

### Get Dashboard Stats

**Endpoint:** `GET /api/v1/admin/dashboard`

**Headers:**
```
Authorization: Bearer <token> (Admin only)
```

**Query Parameters:**
- `dateRange` (optional) - "today" | "week" | "month" | "year" | custom dates

**Response:**
```json
{
  "success": true,
  "data": {
    "sales": {
      "today": 1250.50,
      "week": 8750.00,
      "month": 35000.00
    },
    "orders": {
      "today": 45,
      "week": 320,
      "month": 1250
    },
    "popularItems": [ ... ],
    "recentOrders": [ ... ]
  }
}
```

### Get All Orders

**Endpoint:** `GET /api/v1/admin/orders`

**Headers:**
```
Authorization: Bearer <token> (Admin/Staff)
```

**Query Parameters:**
- `status` (optional) - Filter by status
- `type` (optional) - Filter by type
- `dateFrom` (optional) - Start date
- `dateTo` (optional) - End date
- `page` (optional) - Page number
- `limit` (optional) - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [ ... ],
    "pagination": { ... }
  }
}
```

### Update Order Status

**Endpoint:** `PUT /api/v1/admin/orders/:id/status`

**Headers:**
```
Authorization: Bearer <token> (Admin/Staff)
```

**Request:**
```json
{
  "status": "PREPARING",
  "notes": "Started preparing"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "status": "PREPARING",
    "updatedAt": "2025-01-01T12:05:00Z"
  }
}
```

### Cancel Order

**Endpoint:** `POST /api/v1/admin/orders/:id/cancel`

**Headers:**
```
Authorization: Bearer <token> (Admin/Staff)
```

**Request:**
```json
{
  "reason": "Customer requested cancellation",
  "refund": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "status": "CANCELLED",
    "refundStatus": "PROCESSING"
  }
}
```

---

## POS Endpoints

### Create Order (POS)

**Endpoint:** `POST /api/v1/pos/orders`

**Headers:**
```
Authorization: Bearer <token> (Staff)
```

**Request:**
```json
{
  "type": "PICKUP",
  "items": [ ... ],
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "paymentMethod": {
    "type": "CASH"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "orderNumber": "ORD-2025-001",
    "total": 32.98,
    "receiptUrl": "/api/v1/pos/orders/order_123/receipt"
  }
}
```

### Generate Gift Card (POS)

**Endpoint:** `POST /api/v1/pos/gift-cards`

**Headers:**
```
Authorization: Bearer <token> (Staff)
```

**Request:**
```json
{
  "amount": 50.00,
  "type": "VIRTUAL",
  "customerEmail": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "gc_123",
    "cardNumber": "GC1234567890",
    "pin": "1234",
    "amount": 50.00
  }
}
```

### Print Receipt

**Endpoint:** `GET /api/v1/pos/orders/:id/receipt`

**Headers:**
```
Authorization: Bearer <token> (Staff)
```

**Response:** PDF file

---

## Driver Endpoints

### Get Assigned Deliveries

**Endpoint:** `GET /api/v1/driver/deliveries`

**Headers:**
```
Authorization: Bearer <token> (Driver)
```

**Query Parameters:**
- `status` (optional) - Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "delivery_123",
      "orderId": "order_123",
      "orderNumber": "ORD-2025-001",
      "status": "ASSIGNED",
      "deliveryAddress": { ... },
      "estimatedDeliveryTime": "2025-01-01T12:30:00Z",
      "distance": 2.5
    }
  ]
}
```

### Accept Delivery

**Endpoint:** `POST /api/v1/driver/deliveries/:id/accept`

**Headers:**
```
Authorization: Bearer <token> (Driver)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "delivery_123",
    "status": "ACCEPTED"
  }
}
```

### Update Driver Location

**Endpoint:** `POST /api/v1/driver/location`

**Headers:**
```
Authorization: Bearer <token> (Driver)
```

**Request:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "updatedAt": "2025-01-01T12:15:00Z"
  }
}
```

### Mark Delivery Complete

**Endpoint:** `POST /api/v1/driver/deliveries/:id/complete`

**Headers:**
```
Authorization: Bearer <token> (Driver)
```

**Request:**
```json
{
  "notes": "Delivered successfully"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "delivery_123",
    "status": "DELIVERED",
    "deliveredAt": "2025-01-01T12:30:00Z"
  }
}
```

---

## Analytics Endpoints

### Get Sales Analytics

**Endpoint:** `GET /api/v1/admin/analytics/sales`

**Headers:**
```
Authorization: Bearer <token> (Admin)
```

**Query Parameters:**
- `dateFrom` (required) - Start date
- `dateTo` (required) - End date
- `groupBy` (optional) - "day" | "week" | "month"

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 12500.00,
    "totalOrders": 450,
    "averageOrderValue": 27.78,
    "byPeriod": [
      {
        "period": "2025-01-01",
        "sales": 1250.50,
        "orders": 45
      }
    ]
  }
}
```

### Get Popular Items

**Endpoint:** `GET /api/v1/admin/analytics/popular-items`

**Headers:**
```
Authorization: Bearer <token> (Admin)
```

**Query Parameters:**
- `dateFrom` (optional)
- `dateTo` (optional)
- `limit` (optional) - Number of items (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "menuItemId": "item_123",
      "name": "Mozzarella Sticks",
      "quantitySold": 125,
      "revenue": 1123.75
    }
  ]
}
```

### Export Report

**Endpoint:** `GET /api/v1/admin/analytics/export`

**Headers:**
```
Authorization: Bearer <token> (Admin)
```

**Query Parameters:**
- `type` (required) - "sales" | "orders" | "items" | "gift-cards"
- `format` (required) - "csv" | "pdf"
- `dateFrom` (optional)
- `dateTo` (optional)

**Response:** File download (CSV or PDF)

---

## WebSocket Events

### Connection

**Endpoint:** `ws://your-domain.com/api/ws`

**Authentication:**
- Send JWT token in query parameter: `?token=jwt_token`

### Client Events

**Subscribe to Order Updates:**
```json
{
  "event": "order:subscribe",
  "data": {
    "orderId": "order_123"
  }
}
```

**Unsubscribe from Order Updates:**
```json
{
  "event": "order:unsubscribe",
  "data": {
    "orderId": "order_123"
  }
}
```

**Update Driver Location:**
```json
{
  "event": "driver:location",
  "data": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

### Server Events

**Order Created:**
```json
{
  "event": "order:created",
  "data": {
    "orderId": "order_123",
    "orderNumber": "ORD-2025-001",
    "status": "CONFIRMED"
  }
}
```

**Order Status Updated:**
```json
{
  "event": "order:updated",
  "data": {
    "orderId": "order_123",
    "status": "PREPARING",
    "updatedAt": "2025-01-01T12:05:00Z"
  }
}
```

**Delivery Assigned:**
```json
{
  "event": "delivery:assigned",
  "data": {
    "deliveryId": "delivery_123",
    "orderId": "order_123",
    "driverId": "driver_123"
  }
}
```

**Notification:**
```json
{
  "event": "notification",
  "data": {
    "id": "notif_123",
    "type": "ORDER_CONFIRMED",
    "title": "Order Confirmed",
    "message": "Your order #ORD-2025-001 has been confirmed",
    "link": "/order/order_123"
  }
}
```

---

## Error Handling

### Error Codes

- `AUTHENTICATION_REQUIRED` - User must be authenticated
- `AUTHORIZATION_DENIED` - User doesn't have permission
- `VALIDATION_ERROR` - Request validation failed
- `RESOURCE_NOT_FOUND` - Resource doesn't exist
- `PAYMENT_FAILED` - Payment processing failed
- `ORDER_NOT_FOUND` - Order doesn't exist
- `INVALID_COUPON` - Coupon code invalid or expired
- `INSUFFICIENT_BALANCE` - Gift card/loyalty points insufficient
- `DELIVERY_OUT_OF_RANGE` - Address outside delivery zone
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

---

This API specification provides complete documentation for all endpoints in the restaurant order and delivery system.

