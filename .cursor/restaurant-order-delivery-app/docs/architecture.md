# System Architecture

**Complete system architecture, component design, and technology specifications for the Restaurant Order & Delivery App.**

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Component Architecture](#component-architecture)
4. [Data Architecture](#data-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [Real-Time Communication](#real-time-communication)
7. [Payment Processing Architecture](#payment-processing-architecture)
8. [Delivery System Architecture](#delivery-system-architecture)
9. [File Storage Architecture](#file-storage-architecture)
10. [Security Architecture](#security-architecture)
11. [Performance Considerations](#performance-considerations)
12. [Scalability Strategy](#scalability-strategy)
13. [Deployment Architecture](#deployment-architecture)

---

## System Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Customer   │  │    Staff     │  │   Delivery   │          │
│  │   Interface  │  │    POS       │  │   Driver     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                    ┌───────▼────────┐                            │
│                    │  Next.js App   │                            │
│                    │  (App Router)  │                            │
│                    └───────┬────────┘                            │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    ┌─────────┴─────────┐
                    │                   │
         ┌──────────▼────────┐  ┌───────▼──────────┐
         │   API Routes     │  │  Server          │
         │   (Backend)      │  │  Components     │
         └──────────┬────────┘  └──────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐  ┌──────▼──────┐  ┌───▼──────┐
│Prisma  │  │  File System│  │  External│
│Client  │  │  Storage    │  │  APIs    │
└───┬────┘  └─────────────┘  └─────┬────┘
    │                              │
┌───▼──────────┐          ┌────────▼────────┐
│  PostgreSQL  │          │ Stripe/PayPal/   │
│  Database    │          │ Email/Maps/etc  │
└──────────────┘          └──────────────────┘
```

### Component Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  - Next.js App Router (React Server Components)              │
│  - Client Components (Customer, POS, Driver, Admin)          │
│  - Tailwind CSS + Responsive Design                          │
│  - WebSocket Client (Real-time updates)                      │
│  - PWA Support (Installable, push notifications)            │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Application Layer                         │
│  - Next.js API Routes (REST endpoints)                       │
│  - WebSocket Server (Real-time communication)                │
│  - Authentication Middleware (JWT)                            │
│  - Permission Middleware (RBAC)                               │
│  - Rate Limiting & Security                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Business Logic Layer                      │
│  - Order Management Service                                  │
│  - Payment Processing Service                                │
│  - Menu Management Service                                   │
│  - Delivery Management Service                               │
│  - Gift Card Service                                         │
│  - Loyalty Points Service                                    │
│  - Coupon Service                                            │
│  - Analytics Service                                         │
│  - Notification Service                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Data Access Layer                         │
│  - Prisma ORM (Database queries)                             │
│  - File System Access (File storage/retrieval)               │
│  - External API Clients (Stripe, PayPal, Email, Maps)        │
│  - Cache Layer (Redis or in-memory)                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Data Storage Layer                        │
│  - PostgreSQL (Relational data, audit logs)                  │
│  - Filesystem (Images, receipts, documents)                 │
│  - External APIs (Stripe, PayPal, Email, Maps)               │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

- **Framework:** Next.js 16.x (App Router) - Latest stable version
- **UI Library:** React 19.x
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x
- **Icons:** Lucide React or Heroicons
- **Forms:** React Hook Form 7.x + Zod 3.x
- **State Management:** 
  - Zustand 4.x (client state)
  - React Server Components (server state)
- **Real-Time:** 
  - WebSocket: Native browser WebSocket API (client)
  - WebSocket Server: `ws` library (server-side)
- **Maps:** 
  - Google Maps API (for delivery driver)
  - Browser Geolocation API (for GPS tracking)
- **PWA:** Next.js PWA plugin
- **Animations:** Framer Motion (optional, for smooth transitions)
- **Date/Time:** date-fns
- **HTTP Client:** Native `fetch` API

### Backend

- **Runtime:** Node.js 20.x LTS
- **Framework:** Next.js API Routes
- **ORM:** Prisma 5.x
- **Database:** PostgreSQL 15+
- **Authentication:** JWT (custom implementation with jsonwebtoken)
- **Password Hashing:** bcryptjs
- **File Upload:** formidable or multer
- **Email:** nodemailer (SMTP)
- **Real-Time:** WebSocket (ws library)
- **Job Queue:** BullMQ + Redis (for background jobs like email sending)
- **Rate Limiting:** express-rate-limit or similar

### External Services

- **Payments:**
  - Stripe API
  - PayPal API
  - Apple Pay (via Stripe)
  - Google Pay (via Stripe/PayPal)
- **Email:** SMTP (configurable - Gmail, SendGrid, etc.)
- **Maps:** Google Maps API
- **CAPTCHA:** Google reCAPTCHA (optional, default off)
- **Delivery:** DoorDash API (future integration, placeholder)

### Infrastructure

- **Hosting:** Self-hosted on VPS (Ubuntu 22.04 LTS)
- **Database:** PostgreSQL on same VM
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
- **Cache/Queue:** Redis (optional, for job queue)
- **File Storage:** Local filesystem
- **SSL/TLS:** Let's Encrypt (certbot)
- **Monitoring:** PM2 monitoring, custom health checks

---

## Component Architecture

### Frontend Components

#### Customer Interface

**Pages:**
- `/` - Landing page (SaaS + menu demo)
- `/menu` - Menu browsing
- `/menu/[category]` - Category view
- `/menu/item/[id]` - Item detail with customization
- `/cart` - Shopping cart
- `/checkout` - Checkout process
- `/checkout/guest` - Guest checkout
- `/order/[id]` - Order tracking
- `/account` - Customer account
- `/account/orders` - Order history
- `/account/addresses` - Saved addresses
- `/account/payment-methods` - Saved payment methods
- `/account/loyalty` - Loyalty points
- `/account/gift-cards` - Gift card balance
- `/gift-cards` - Purchase gift card
- `/gift-cards/check` - Check gift card balance

**Components:**
- `Header` - Navigation, cart icon, user menu
- `MenuCategoryList` - Category navigation
- `MenuItemCard` - Menu item display
- `MenuItemDetail` - Item customization modal/page
- `ModifierGroup` - Modifier selection UI
- `Cart` - Shopping cart sidebar/page
- `CartItem` - Individual cart item
- `CheckoutForm` - Checkout form with address, payment
- `OrderTracking` - Real-time order status
- `OrderHistory` - List of past orders
- `AddressForm` - Address input/editing
- `PaymentMethodForm` - Payment method input
- `GiftCardForm` - Gift card purchase/check
- `CouponInput` - Coupon code input
- `RatingForm` - Order/item rating

#### Staff POS Interface

**Pages:**
- `/pos` - Main POS interface
- `/pos/orders` - Order management
- `/pos/gift-cards` - Gift card generation
- `/pos/receipts` - Receipt printing

**Components:**
- `POSLayout` - Touch-optimized layout
- `OrderList` - List of active orders
- `OrderCard` - Individual order display
- `OrderActions` - Mark complete, print receipt, etc.
- `GiftCardGenerator` - Generate gift cards
- `ReceiptPrinter` - Receipt printing interface
- `QuickOrder` - Quick order creation

#### Delivery Driver Interface

**Pages:**
- `/driver` - Driver dashboard (mobile-optimized)
- `/driver/orders` - Active deliveries
- `/driver/map` - GPS tracking and route

**Components:**
- `DriverDashboard` - Driver home screen
- `DeliveryList` - List of assigned deliveries
- `DeliveryCard` - Individual delivery info
- `MapView` - GPS map with route
- `RouteOptimizer` - Optimize delivery route
- `DeliveryActions` - Mark delivered, navigate

#### Admin Interface

**Pages:**
- `/admin` - Admin dashboard
- `/admin/menu` - Menu management
- `/admin/menu/categories` - Category management
- `/admin/menu/items` - Item management
- `/admin/menu/items/[id]` - Item editor
- `/admin/orders` - All orders view
- `/admin/staff` - Staff management
- `/admin/settings` - Restaurant settings
- `/admin/settings/payments` - Payment configuration
- `/admin/settings/delivery` - Delivery zones
- `/admin/analytics` - Analytics dashboard
- `/admin/gift-cards` - Gift card management
- `/admin/coupons` - Coupon management
- `/admin/loyalty` - Loyalty points configuration

**Components:**
- `AdminLayout` - Admin sidebar layout
- `MenuEditor` - Menu item editor
- `ModifierEditor` - Modifier configuration
- `CategoryEditor` - Category management
- `OrderManagement` - Order list and management
- `StaffManagement` - Staff CRUD
- `SettingsForm` - Restaurant settings
- `PaymentConfig` - Payment provider setup
- `DeliveryZoneEditor` - Delivery zone configuration
- `AnalyticsDashboard` - Charts and metrics
- `GiftCardManagement` - Gift card CRUD and analytics
- `CouponEditor` - Coupon creation/editing

### Backend Services

#### Order Management Service

**Responsibilities:**
- Create orders
- Update order status
- Calculate totals (items, modifiers, tax, delivery, tips)
- Handle order modifications (staff only)
- Order cancellation and refunds
- Order history retrieval

**Key Functions:**
```typescript
- createOrder(cart, customer, paymentMethod)
- updateOrderStatus(orderId, status)
- modifyOrder(orderId, changes)
- cancelOrder(orderId, reason)
- calculateOrderTotal(order)
- getOrderHistory(userId, filters)
```

#### Payment Processing Service

**Responsibilities:**
- Process payments (Stripe, PayPal)
- Handle payment failures and retries
- Process refunds
- Gift card transactions
- Coupon application
- Loyalty points redemption

**Key Functions:**
```typescript
- processPayment(order, paymentMethod)
- retryPayment(paymentId)
- processRefund(orderId, amount)
- applyGiftCard(orderId, giftCardNumber, pin)
- applyCoupon(orderId, couponCode)
- redeemLoyaltyPoints(orderId, points)
```

#### Menu Management Service

**Responsibilities:**
- CRUD operations for categories
- CRUD operations for menu items
- Modifier management
- Availability management (time-based)
- Menu display logic

**Key Functions:**
```typescript
- getMenu(filters, availability)
- getCategory(categoryId)
- createMenuItem(data)
- updateMenuItem(itemId, data)
- getItemModifiers(itemId)
- checkAvailability(itemId, time)
```

#### Delivery Management Service

**Responsibilities:**
- Calculate delivery fees by distance
- Assign deliveries to drivers
- Track driver locations
- Optimize delivery routes
- Update delivery status

**Key Functions:**
```typescript
- calculateDeliveryFee(address, restaurantAddress)
- assignDelivery(orderId, driverId)
- getDriverLocation(driverId)
- optimizeRoute(deliveries, driverLocation)
- updateDeliveryStatus(deliveryId, status)
```

#### Gift Card Service

**Responsibilities:**
- Generate gift cards
- Validate gift cards
- Process gift card transactions
- Track gift card usage
- Generate analytics

**Key Functions:**
```typescript
- generateGiftCard(amount, type)
- validateGiftCard(number, pin)
- applyGiftCard(orderId, giftCard)
- getGiftCardBalance(giftCardId)
- getGiftCardAnalytics(filters)
```

#### Notification Service

**Responsibilities:**
- Send email notifications
- Send SMS notifications (optional)
- Send push notifications
- In-app notifications
- Notification preferences

**Key Functions:**
```typescript
- sendOrderConfirmation(orderId)
- sendOrderStatusUpdate(orderId, status)
- sendDeliveryNotification(orderId, driverId)
- sendEmail(to, subject, template, data)
- sendSMS(to, message)
- sendPushNotification(userId, notification)
```

#### Analytics Service

**Responsibilities:**
- Calculate sales metrics
- Generate reports
- Track popular items
- Analyze delivery times
- Staff performance metrics
- Gift card analytics

**Key Functions:**
```typescript
- getSalesMetrics(dateRange)
- getPopularItems(dateRange)
- getDeliveryMetrics(dateRange)
- getStaffPerformance(staffId, dateRange)
- getGiftCardAnalytics(dateRange)
- exportReport(type, format, filters)
```

---

## Data Architecture

### Database Design Principles

1. **Single-Tenant Architecture:** One restaurant per instance
2. **Audit Trail:** All critical tables include audit fields (created_at, updated_at, created_by, updated_by)
3. **Soft Deletes:** Important records use soft deletes (deleted_at)
4. **Indexing Strategy:** Comprehensive indexes for performance
5. **Data Integrity:** Foreign keys, constraints, validation

### Core Tables (High-Level)

- `users` - All user accounts (admin, staff, customers)
- `roles` - User roles and permissions
- `restaurant_settings` - Restaurant configuration
- `menu_categories` - Menu categories
- `menu_items` - Menu items
- `modifiers` - Item modifiers (toppings, sizes, etc.)
- `modifier_groups` - Groups of modifiers
- `orders` - Customer orders
- `order_items` - Items in orders
- `order_modifiers` - Selected modifiers for order items
- `payments` - Payment transactions
- `gift_cards` - Gift cards
- `gift_card_transactions` - Gift card usage
- `coupons` - Coupon codes
- `loyalty_points` - Loyalty points transactions
- `addresses` - Customer addresses
- `delivery_zones` - Delivery zone configuration
- `deliveries` - Delivery assignments
- `ratings` - Order/item ratings
- `notifications` - User notifications
- `audit_logs` - Complete audit trail

See [Database Schema](database-schema.md) for complete schema.

---

## Authentication & Authorization

### Authentication Methods

**JWT Authentication:**
- Username/password login
- Email/password login
- JWT tokens (3-day expiration)
- Token refresh endpoint
- Password hashing with bcrypt
- Password reset via email

**Demo Accounts:**
- Pre-seeded demo accounts
- Auto-fill buttons on login page
- Role-based demo accounts (admin, manager, staff, driver, customer)

### Authorization

**Role-Based Access Control (RBAC):**
- **Admin:** Full system access
- **Manager:** All access except permission changes
- **Staff/Employee:** Order management, POS, gift cards
- **Delivery Driver:** Order management, delivery tracking
- **Customer:** Order placement, account management

**Permission Checks:**
- Middleware validates permissions on every API route
- Frontend hides UI elements based on role (UX only, not security)
- Database-level constraints prevent unauthorized access

---

## Real-Time Communication

### WebSocket Architecture

**Server Implementation:**
- WebSocket server using `ws` library
- Authenticated connections (JWT token)
- Room-based messaging (order updates, new orders)

**Client Events:**
- `order:subscribe` - Subscribe to order updates
- `order:unsubscribe` - Unsubscribe from order updates
- `driver:location` - Send driver GPS location
- `driver:accept` - Driver accepts delivery

**Server Events:**
- `order:created` - New order created
- `order:updated` - Order status updated
- `order:assigned` - Order assigned to driver
- `delivery:status` - Delivery status changed
- `notification` - New notification

**Use Cases:**
- Real-time order status updates for customers
- New order notifications for staff
- Delivery assignment for drivers
- Live order queue for POS

---

## Payment Processing Architecture

### Payment Flow

```
1. Customer completes checkout
   ↓
2. Create order in database (status: PENDING_PAYMENT)
   ↓
3. Process payment via Stripe/PayPal
   ↓
4. If successful:
   - Update order status: CONFIRMED
   - Send confirmation email
   - Notify kitchen/staff
   ↓
5. If failed:
   - Retry payment (1-2 times)
   - If still fails:
     - Cancel order
     - Notify customer
     - No charge
```

### Payment Providers

**Stripe:**
- Credit/debit cards
- Apple Pay
- Google Pay
- Saved payment methods
- Payment intents API
- Webhooks for payment events

**PayPal:**
- PayPal account payments
- Credit/debit cards
- Saved payment methods
- Orders API
- Webhooks for payment events

**Gift Cards:**
- Custom implementation
- Card number + PIN
- Balance tracking
- Transaction history
- Virtual and physical cards

**Security:**
- PCI compliance (no card data storage)
- Payment provider tokens only
- Encrypted API keys
- Secure payment processing

---

## Delivery System Architecture

### Delivery Flow

```
1. Order placed with delivery address
   ↓
2. Calculate delivery fee based on distance
   ↓
3. Order prepared (status: PREPARING → READY)
   ↓
4. Assign to delivery driver (auto or manual)
   ↓
5. Driver accepts delivery
   ↓
6. Driver navigates to address (GPS)
   ↓
7. Driver marks delivered
   ↓
8. Order status: DELIVERED
```

### GPS Integration

**Browser Geolocation API:**
- Request location permission
- Track driver location
- Calculate distance to restaurant
- Auto-assign deliveries based on proximity

**Google Maps API:**
- Display map with route
- Turn-by-turn directions
- Distance calculation
- Native map integration (open in Google Maps/Apple Maps app)

**Route Optimization:**
- Calculate optimal delivery order
- Minimize total distance
- Consider delivery time windows
- Update as driver completes deliveries

---

## File Storage Architecture

### Directory Structure

```
/storage
  /images
    /menu-items
      /{itemId}
        main.jpg
        thumbnail.jpg
    /categories
      /{categoryId}
        image.jpg
    /restaurant
      logo.png
      banner.jpg
  /receipts
    /{orderId}
      receipt.pdf
  /gift-cards
    /{giftCardId}
      card.pdf
  /placeholders
    menu-item-placeholder.jpg
    category-placeholder.jpg
```

### File Access

**Security:**
- All file access requires authentication
- Check user permissions before serving files
- Validate file paths (prevent directory traversal)
- Rate limit file downloads

**Serving Files:**
- API route: `/api/files/[id]`
- Check permissions
- Stream file to client
- Cache headers for images

---

## Security Architecture

### Security Measures

1. **Authentication:**
   - JWT tokens with expiration
   - Password hashing (bcrypt, 12 rounds)
   - Secure token storage
   - Password reset via email

2. **Authorization:**
   - Role-based access control
   - Permission checks on all endpoints
   - Resource-level permissions

3. **Input Validation:**
   - Zod schema validation
   - SQL injection prevention (Prisma)
   - XSS prevention (React escaping)
   - File upload validation

4. **Payment Security:**
   - PCI compliance
   - No card data storage
   - Encrypted API keys
   - Secure payment processing

5. **Data Protection:**
   - Encrypted sensitive data
   - Secure file storage
   - Audit logging
   - Backup encryption

6. **Network Security:**
   - HTTPS only (TLS 1.3)
   - Security headers (CSP, HSTS, etc.)
   - Rate limiting
   - CORS configuration

See [Security Guide](security-guide.md) for complete details.

---

## Performance Considerations

### Performance Targets

- **API Response Time:** < 200ms (p95), < 100ms (p50)
- **Database Query Time:** < 50ms (p95), < 20ms (p50)
- **Page Load Time:** < 2 seconds (First Contentful Paint)
- **Time to Interactive:** < 3 seconds

### Optimization Strategies

1. **Database:**
   - Comprehensive indexes
   - Connection pooling
   - Query optimization
   - Caching frequently accessed data

2. **Frontend:**
   - Code splitting
   - Image optimization
   - Lazy loading
   - Service worker caching

3. **API:**
   - Response compression
   - Pagination
   - Batch operations
   - Caching

4. **Real-Time:**
   - Efficient WebSocket connections
   - Message batching
   - Connection pooling

---

## Scalability Strategy

### Horizontal Scaling

**Future Considerations:**
- Multiple Next.js instances (PM2 cluster mode)
- Load balancer (Nginx)
- Database read replicas
- Redis cluster for caching

### Vertical Scaling

**Initial Approach:**
- Monitor VM resource usage
- Upgrade VM specs as needed
- Optimize before scaling

### Current Architecture

**Single Instance:**
- One restaurant per instance
- PostgreSQL on same VM
- Local file storage
- Can scale by deploying multiple instances

---

## Deployment Architecture

### VPS Setup

**VM Configuration:**
- **OS:** Ubuntu 22.04 LTS
- **CPU:** 2-4 cores (minimum)
- **RAM:** 4-8 GB (minimum)
- **Storage:** 50+ GB (SSD recommended)
- **Network:** Public IP or Cloudflare tunnel

**Software Stack:**
- Node.js 20 LTS
- PostgreSQL 15+
- PM2
- Nginx
- Redis (optional)

**Process Management:**
- PM2 for Node.js processes
- Auto-restart on failure
- Log rotation
- Resource monitoring

**Reverse Proxy:**
- Nginx for SSL termination
- WebSocket proxy support
- Static file serving
- Rate limiting
- Gzip compression

**SSL/TLS:**
- Let's Encrypt certificates
- Auto-renewal (certbot)
- HTTPS only
- HSTS headers

See [Deployment Guide](deployment-guide.md) for complete details.

---

This architecture provides a solid foundation for a scalable, maintainable restaurant order and delivery system. The modular design allows for incremental development and future enhancements.

