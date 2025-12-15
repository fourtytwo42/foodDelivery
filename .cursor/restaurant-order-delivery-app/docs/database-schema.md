# Database Schema

**Complete database schema, relationships, indexes, and migrations for the Restaurant Order & Delivery App.**

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Menu Tables](#menu-tables)
4. [Order Tables](#order-tables)
5. [Payment Tables](#payment-tables)
6. [Gift Card Tables](#gift-card-tables)
7. [Loyalty & Coupon Tables](#loyalty--coupon-tables)
8. [Delivery Tables](#delivery-tables)
9. [User & Role Tables](#user--role-tables)
10. [Analytics & Audit Tables](#analytics--audit-tables)
11. [Indexes Strategy](#indexes-strategy)
12. [Migrations](#migrations)

---

## Schema Overview

### Design Principles

1. **Single-Tenant:** One restaurant per database instance
2. **Audit Trail:** All critical tables include `created_at`, `updated_at`, `created_by`, `updated_by`
3. **Soft Deletes:** Important records use `deleted_at` for soft deletes
4. **Data Integrity:** Foreign keys, constraints, validation
5. **Performance:** Comprehensive indexes on frequently queried fields

### Database Technology

- **Database:** PostgreSQL 15+
- **ORM:** Prisma 5.x
- **Migrations:** Prisma Migrate
- **Seeding:** Prisma seed script

---

## Core Tables

### Users Table

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  phone         String?
  avatar        String?   // URL to avatar image
  emailVerified Boolean   @default(false)
  emailVerificationToken String? @unique
  passwordResetToken String? @unique
  passwordResetExpires DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete
  lastLoginAt   DateTime?
  
  // Relations
  roles         UserRole[]
  orders        Order[]
  addresses     Address[]
  paymentMethods PaymentMethod[]
  giftCards     GiftCard[] // Gift cards owned by user
  giftCardTransactions GiftCardTransaction[]
  loyaltyPoints LoyaltyPoint[]
  ratings       Rating[]
  notifications Notification[]
  auditLogs     AuditLog[] @relation("UserAuditLogs")
  createdOrders Order[] @relation("OrderCreator") // Staff who created orders
  deliveries    Delivery[]
  
  @@index([email])
  @@index([createdAt])
  @@index([deletedAt])
}
```

### Roles Table

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique // "ADMIN", "MANAGER", "STAFF", "DRIVER", "CUSTOMER"
  description String?
  permissions String[] // Array of permission strings
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       UserRole[]
  
  @@index([name])
}
```

### UserRole Junction Table

```prisma
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
}
```

### Restaurant Settings Table

```prisma
model RestaurantSettings {
  id                    String   @id @default(cuid())
  
  // Basic Info
  name                  String
  description           String?  @db.Text
  phone                 String?
  email                 String?
  website               String?
  logo                  String?  // URL to logo
  banner                String?  // URL to banner
  
  // Address
  address               String
  city                  String
  state                 String
  zipCode               String
  country               String   @default("US")
  latitude              Float?
  longitude             Float?
  
  // Business Hours
  hoursMonday            Json?    // { open: "09:00", close: "22:00" }
  hoursTuesday           Json?
  hoursWednesday         Json?
  hoursThursday          Json?
  hoursFriday            Json?
  hoursSaturday          Json?
  hoursSunday            Json?
  specialHours           Json?    // Array of { date: "2025-12-25", open: "10:00", close: "20:00" }
  
  // Business Settings
  minOrderAmount         Decimal? @db.Decimal(10, 2)
  maxDeliveryDistance    Float?   // Miles
  defaultPrepTime        Int?     // Minutes
  autoAcceptOrders       Boolean  @default(false)
  taxRate                Decimal  @default(0.0) @db.Decimal(5, 4) // e.g., 0.0825 for 8.25%
  
  // Features
  enableLoyaltyPoints    Boolean  @default(false)
  loyaltyPointsPerDollar Decimal? @default(0.5) @db.Decimal(5, 2) // e.g., 0.5 = 5 points per $10
  loyaltyPointsForFree   Int?     @default(100) // Points needed for free item
  enableEmailNotifications Boolean @default(true)
  enableSMSNotifications  Boolean @default(false)
  enableEmailVerification  Boolean @default(false)
  enableReCAPTCHA         Boolean @default(false)
  reCAPTCHASiteKey        String?
  reCAPTCHASecretKey      String?
  
  // Demo Mode
  demoMode               Boolean  @default(true)
  setupWizardEnabled     Boolean  @default(false)
  
  // Display Settings
  primaryColor           String?  @default("#FF6B35")
  secondaryColor         String?  @default("#004E89")
  menuDisplayStyle       String   @default("grid") // "grid" | "list"
  
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  createdBy              String?
  updatedBy              String?
  
  @@index([zipCode])
}
```

---

## Menu Tables

### Menu Categories Table

```prisma
model MenuCategory {
  id              String   @id @default(cuid())
  name            String
  description     String?  @db.Text
  image           String?  // URL to category image
  order           Int      @default(0) // Display order
  active          Boolean  @default(true)
  
  // Availability
  availableTimes  Json?    // Array of { start: "11:00", end: "14:00" } for lunch, etc.
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime? // Soft delete
  createdBy       String?
  updatedBy       String?
  
  // Relations
  items           MenuItem[]
  
  @@index([order])
  @@index([active])
  @@index([deletedAt])
}
```

### Menu Items Table

```prisma
model MenuItem {
  id                String   @id @default(cuid())
  categoryId        String
  name              String
  description       String?  @db.Text
  image             String?  // URL to item image
  price             Decimal  @db.Decimal(10, 2)
  active            Boolean  @default(true)
  featured          Boolean  @default(false)
  popular           Boolean  @default(false)
  
  // Availability
  availableTimes    Json?    // Array of { start: "11:00", end: "14:00" }
  
  // Dietary Info (optional)
  dietaryTags       String[] // ["vegetarian", "vegan", "gluten-free", "spicy"]
  allergens         String[] // ["peanuts", "dairy", "eggs"]
  calories          Int?
  nutritionInfo     Json?    // { protein: 25, carbs: 30, fat: 10 }
  
  // Metadata
  preparationTime   Int?     // Minutes
  spiceLevel        Int?     // 1-5
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime? // Soft delete
  createdBy         String?
  updatedBy         String?
  
  // Relations
  category          MenuCategory @relation(fields: [categoryId], references: [id])
  modifiers         MenuItemModifier[]
  orderItems        OrderItem[]
  ratings           Rating[]
  
  @@index([categoryId])
  @@index([active])
  @@index([featured])
  @@index([popular])
  @@index([deletedAt])
}
```

### Modifiers Table

```prisma
model Modifier {
  id              String   @id @default(cuid())
  name            String
  description     String?  @db.Text
  type            String   // "SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT", "NUMBER"
  required        Boolean  @default(false)
  minSelections   Int?     // For MULTIPLE_CHOICE
  maxSelections   Int?     // For MULTIPLE_CHOICE
  active          Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime? // Soft delete
  createdBy       String?
  updatedBy       String?
  
  // Relations
  options         ModifierOption[]
  itemModifiers   MenuItemModifier[]
  
  @@index([active])
  @@index([deletedAt])
}
```

### Modifier Options Table

```prisma
model ModifierOption {
  id              String   @id @default(cuid())
  modifierId      String
  name            String
  description     String?  @db.Text
  price           Decimal  @default(0.0) @db.Decimal(10, 2)
  priceType       String   @default("FIXED") // "FIXED" | "PERCENTAGE"
  active          Boolean  @default(true)
  order           Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime? // Soft delete
  createdBy       String?
  updatedBy       String?
  
  // Relations
  modifier        Modifier @relation(fields: [modifierId], references: [id], onDelete: Cascade)
  orderModifiers OrderModifier[]
  
  @@index([modifierId])
  @@index([active])
  @@index([order])
  @@index([deletedAt])
}
```

### Menu Item Modifiers Junction Table

```prisma
model MenuItemModifier {
  id              String   @id @default(cuid())
  menuItemId      String
  modifierId      String
  required        Boolean  @default(false) // Override modifier required setting
  order           Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  menuItem        MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  modifier        Modifier @relation(fields: [modifierId], references: [id], onDelete: Cascade)
  
  @@unique([menuItemId, modifierId])
  @@index([menuItemId])
  @@index([modifierId])
}
```

---

## Order Tables

### Orders Table

```prisma
model Order {
  id                  String   @id @default(cuid())
  orderNumber         String   @unique // Human-readable order number
  userId              String?  // Null for guest orders
  customerEmail       String?  // For guest orders
  customerPhone       String?
  customerName        String?
  
  // Order Type
  type                String   // "DELIVERY" | "PICKUP"
  
  // Status
  status              String   @default("PENDING") 
  // "PENDING" | "PENDING_PAYMENT" | "CONFIRMED" | "PREPARING" | "READY" | 
  // "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "REFUNDED"
  
  // Totals
  subtotal            Decimal  @db.Decimal(10, 2)
  tax                 Decimal  @db.Decimal(10, 2)
  deliveryFee         Decimal  @default(0.0) @db.Decimal(10, 2)
  tip                 Decimal  @default(0.0) @db.Decimal(10, 2)
  discount            Decimal  @default(0.0) @db.Decimal(10, 2) // From coupons
  total               Decimal  @db.Decimal(10, 2)
  
  // Delivery Info
  deliveryAddressId   String?
  deliveryAddress     Json?    // Full address JSON for delivery
  estimatedDeliveryTime DateTime?
  actualDeliveryTime  DateTime?
  
  // Payment
  paymentStatus       String   @default("PENDING") // "PENDING" | "PAID" | "FAILED" | "REFUNDED"
  paymentMethod       String?  // "STRIPE" | "PAYPAL" | "GIFT_CARD" | "CASH"
  paymentIntentId     String?  // Stripe/PayPal payment intent ID
  
  // Special Instructions
  specialInstructions String?  @db.Text
  deliveryInstructions String? @db.Text
  
  // Timestamps
  placedAt            DateTime @default(now())
  confirmedAt         DateTime?
  preparingAt         DateTime?
  readyAt             DateTime?
  outForDeliveryAt    DateTime?
  deliveredAt         DateTime?
  cancelledAt         DateTime?
  cancelledBy         String?  // User ID who cancelled
  cancellationReason  String?  @db.Text
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  user                User?    @relation(fields: [userId], references: [id])
  createdBy           User?    @relation("OrderCreator", fields: [createdBy], references: [id])
  items               OrderItem[]
  payments            Payment[]
  delivery            Delivery?
  ratings             Rating[]
  notifications       Notification[]
  
  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([type])
  @@index([paymentStatus])
  @@index([placedAt])
  @@index([createdAt])
}
```

### Order Items Table

```prisma
model OrderItem {
  id              String   @id @default(cuid())
  orderId         String
  menuItemId      String
  name            String   // Snapshot of item name at time of order
  description     String?  @db.Text
  price           Decimal  @db.Decimal(10, 2) // Snapshot of price
  quantity        Int      @default(1)
  specialInstructions String? @db.Text
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItem        MenuItem @relation(fields: [menuItemId], references: [id])
  modifiers       OrderModifier[]
  
  @@index([orderId])
  @@index([menuItemId])
}
```

### Order Modifiers Table

```prisma
model OrderModifier {
  id                  String   @id @default(cuid())
  orderItemId         String
  modifierOptionId    String
  modifierName        String   // Snapshot
  optionName          String   // Snapshot
  price               Decimal  @db.Decimal(10, 2) // Snapshot
  quantity            Int      @default(1)
  
  createdAt           DateTime @default(now())
  
  // Relations
  orderItem           OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  modifierOption      ModifierOption @relation(fields: [modifierOptionId], references: [id])
  
  @@index([orderItemId])
  @@index([modifierOptionId])
}
```

---

## Payment Tables

### Payments Table

```prisma
model Payment {
  id                  String   @id @default(cuid())
  orderId             String
  amount              Decimal  @db.Decimal(10, 2)
  currency            String   @default("USD")
  status              String   // "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED"
  paymentMethod       String   // "STRIPE" | "PAYPAL" | "GIFT_CARD" | "CASH" | "LOYALTY_POINTS"
  
  // Provider-specific IDs
  stripePaymentIntentId String? @unique
  paypalOrderId        String? @unique
  giftCardId           String?
  loyaltyPointsUsed    Int?     // Points used if applicable
  
  // Metadata
  providerResponse     Json?    // Full provider response
  failureReason        String?  @db.Text
  retryCount           Int      @default(0)
  
  // Timestamps
  processedAt         DateTime?
  refundedAt          DateTime?
  refundAmount        Decimal? @db.Decimal(10, 2)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  order               Order    @relation(fields: [orderId], references: [id])
  giftCard            GiftCard? @relation(fields: [giftCardId], references: [id])
  
  @@index([orderId])
  @@index([status])
  @@index([paymentMethod])
  @@index([stripePaymentIntentId])
  @@index([paypalOrderId])
  @@index([processedAt])
}
```

### Payment Methods Table (Saved payment methods)

```prisma
model PaymentMethod {
  id                  String   @id @default(cuid())
  userId              String
  type                String   // "STRIPE" | "PAYPAL"
  providerCustomerId String?  // Stripe customer ID, PayPal payer ID
  providerPaymentMethodId String? // Stripe payment method ID, PayPal billing agreement ID
  last4               String?  // Last 4 digits of card
  brand               String?  // "visa", "mastercard", etc.
  expiryMonth         Int?
  expiryYear          Int?
  isDefault           Boolean  @default(false)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime? // Soft delete
  
  // Relations
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([providerCustomerId])
  @@index([deletedAt])
}
```

---

## Gift Card Tables

### Gift Cards Table

```prisma
model GiftCard {
  id                  String   @id @default(cuid())
  cardNumber          String   @unique // Generated unique card number
  pin                 String   // Hashed PIN
  initialAmount       Decimal  @db.Decimal(10, 2)
  currentBalance      Decimal  @db.Decimal(10, 2)
  type                String   @default("VIRTUAL") // "VIRTUAL" | "PHYSICAL"
  status              String   @default("ACTIVE") // "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED"
  
  // Ownership
  userId              String?  // User who owns the card (if virtual on account)
  customerEmail       String?  // Email for virtual/physical card delivery
  customerName        String?
  
  // Physical card info
  physicalAddress     Json?    // { street, city, state, zip }
  physicalRequestedAt DateTime?
  physicalSentAt      DateTime?
  
  // Expiration
  expiresAt           DateTime?
  
  // Generation info
  generatedBy         String?  // User ID who generated it
  generatedAt         DateTime @default(now())
  purchaseOrderId     String?  // Order ID if purchased by customer
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  user                User?    @relation(fields: [userId], references: [id])
  generator           User?    @relation("GiftCardGenerator", fields: [generatedBy], references: [id])
  transactions        GiftCardTransaction[]
  payments            Payment[]
  
  @@index([cardNumber])
  @@index([userId])
  @@index([status])
  @@index([generatedBy])
  @@index([expiresAt])
}
```

### Gift Card Transactions Table

```prisma
model GiftCardTransaction {
  id                  String   @id @default(cuid())
  giftCardId          String
  orderId             String?
  type                String   // "PURCHASE" | "REDEMPTION" | "REFUND" | "EXPIRATION"
  amount              Decimal  @db.Decimal(10, 2)
  balanceBefore       Decimal  @db.Decimal(10, 2)
  balanceAfter        Decimal  @db.Decimal(10, 2)
  description         String?  @db.Text
  
  createdAt           DateTime @default(now())
  
  // Relations
  giftCard            GiftCard @relation(fields: [giftCardId], references: [id], onDelete: Cascade)
  order               Order?   @relation(fields: [orderId], references: [id])
  
  @@index([giftCardId])
  @@index([orderId])
  @@index([type])
  @@index([createdAt])
}
```

---

## Loyalty & Coupon Tables

### Loyalty Points Table

```prisma
model LoyaltyPoint {
  id                  String   @id @default(cuid())
  userId              String
  points              Int      // Positive for earned, negative for redeemed
  type                String   // "EARNED" | "REDEEMED" | "EXPIRED" | "ADJUSTED"
  orderId             String?
  description         String?  @db.Text
  balanceAfter        Int      // Running balance after this transaction
  
  createdAt           DateTime @default(now())
  
  // Relations
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  order               Order?   @relation(fields: [orderId], references: [id])
  
  @@index([userId])
  @@index([orderId])
  @@index([type])
  @@index([createdAt])
}
```

### Coupons Table

```prisma
model Coupon {
  id                  String   @id @default(cuid())
  code                String   @unique
  name                String
  description         String?  @db.Text
  type                String   // "PERCENTAGE" | "FIXED_AMOUNT" | "BUY_X_GET_Y" | "FREE_ITEM"
  value               Decimal? @db.Decimal(10, 2) // Percentage or fixed amount
  minOrderAmount      Decimal? @db.Decimal(10, 2)
  maxDiscount         Decimal? @db.Decimal(10, 2)
  
  // Buy X Get Y
  buyXGetYConfig      Json?    // { buyQuantity: 2, getQuantity: 1, getItemId: "..." }
  
  // Free Item
  freeItemId          String?
  
  // Usage Limits
  usageLimit          Int?     // Total usage limit
  usageCount          Int      @default(0)
  usageLimitPerUser   Int?     // Per user limit
  firstTimeOnly       Boolean  @default(false)
  
  // Validity
  validFrom           DateTime
  validUntil          DateTime?
  active              Boolean  @default(true)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  createdBy           String?
  updatedBy           String?
  
  // Relations
  freeMenuItem        MenuItem? @relation(fields: [freeItemId], references: [id])
  usages              CouponUsage[]
  
  @@index([code])
  @@index([active])
  @@index([validFrom, validUntil])
}
```

### Coupon Usage Table

```prisma
model CouponUsage {
  id                  String   @id @default(cuid())
  couponId            String
  orderId             String
  userId              String?
  discountAmount      Decimal  @db.Decimal(10, 2)
  
  createdAt           DateTime @default(now())
  
  // Relations
  coupon              Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  order               Order    @relation(fields: [orderId], references: [id])
  user                User?    @relation(fields: [userId], references: [id])
  
  @@unique([couponId, orderId])
  @@index([couponId])
  @@index([orderId])
  @@index([userId])
  @@index([createdAt])
}
```

---

## Delivery Tables

### Delivery Zones Table

```prisma
model DeliveryZone {
  id                  String   @id @default(cuid())
  name                String
  description         String?  @db.Text
  radius              Float    // Miles from restaurant
  deliveryFee         Decimal  @db.Decimal(10, 2)
  freeDeliveryThreshold Decimal? @db.Decimal(10, 2) // Free delivery if order above this
  active              Boolean  @default(true)
  order               Int      @default(0) // Priority order (check zones in order)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  createdBy           String?
  updatedBy           String?
  
  @@index([active])
  @@index([order])
  @@index([radius])
}
```

### Deliveries Table

```prisma
model Delivery {
  id                  String   @id @default(cuid())
  orderId             String   @unique
  driverId            String?
  status              String   @default("PENDING") 
  // "PENDING" | "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED"
  
  // Address
  deliveryAddress     Json     // Full address JSON
  latitude            Float?
  longitude           Float?
  
  // Driver Location (for tracking)
  driverLatitude      Float?
  driverLongitude     Float?
  driverLocationUpdatedAt DateTime?
  
  // Estimated times
  estimatedPickupTime DateTime?
  estimatedDeliveryTime DateTime?
  actualPickupTime    DateTime?
  actualDeliveryTime  DateTime?
  
  // Distance
  distance            Float?   // Miles
  routeOptimized      Boolean  @default(false)
  
  // Notes
  deliveryNotes       String?  @db.Text
  driverNotes         String?  @db.Text
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  order               Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  driver              User?    @relation(fields: [driverId], references: [id])
  
  @@index([orderId])
  @@index([driverId])
  @@index([status])
  @@index([estimatedDeliveryTime])
}
```

---

## User & Role Tables

### Addresses Table

```prisma
model Address {
  id                  String   @id @default(cuid())
  userId              String
  label               String?  // "Home", "Work", etc.
  street              String
  city                String
  state               String
  zipCode             String
  country             String   @default("US")
  latitude            Float?
  longitude           Float?
  isDefault           Boolean  @default(false)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime? // Soft delete
  
  // Relations
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([deletedAt])
}
```

### Ratings Table

```prisma
model Rating {
  id                  String   @id @default(cuid())
  userId              String
  orderId             String?
  menuItemId          String?
  type                String   // "ORDER" | "ITEM" | "RESTAURANT"
  rating              Int      // 1-5 stars
  comment             String?  @db.Text
  helpfulCount        Int      @default(0)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  order               Order?   @relation(fields: [orderId], references: [id])
  menuItem            MenuItem? @relation(fields: [menuItemId], references: [id])
  
  @@index([userId])
  @@index([orderId])
  @@index([menuItemId])
  @@index([type])
  @@index([rating])
  @@index([createdAt])
}
```

### Notifications Table

```prisma
model Notification {
  id                  String   @id @default(cuid())
  userId              String
  orderId             String?
  type                String   // "ORDER_CONFIRMED" | "ORDER_STATUS" | "DELIVERY_ASSIGNED" | etc.
  title               String
  message             String   @db.Text
  link                String?  // URL to related content
  read                Boolean  @default(false)
  readAt              DateTime?
  emailSent           Boolean  @default(false)
  emailSentAt         DateTime?
  smsSent             Boolean  @default(false)
  smsSentAt            DateTime?
  pushSent            Boolean  @default(false)
  pushSentAt          DateTime?
  
  createdAt           DateTime @default(now())
  
  // Relations
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  order               Order?   @relation(fields: [orderId], references: [id])
  
  @@index([userId, read])
  @@index([orderId])
  @@index([type])
  @@index([createdAt])
}
```

---

## Analytics & Audit Tables

### Audit Logs Table

```prisma
model AuditLog {
  id                  String   @id @default(cuid())
  userId              String?  // User who performed action
  action              String   // "CREATE", "UPDATE", "DELETE", "LOGIN", "PAYMENT", etc.
  entityType          String   // "ORDER", "MENU_ITEM", "USER", "GIFT_CARD", etc.
  entityId            String?
  changes             Json?    // JSON object of what changed
  ipAddress           String?
  userAgent           String?
  metadata            Json?    // Additional metadata
  
  createdAt           DateTime @default(now())
  
  // Relations
  user                User?    @relation("UserAuditLogs", fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
}
```

---

## Indexes Strategy

### Performance Indexes

**User Lookups:**
- `users.email` - Unique index for login
- `users.createdAt` - For user analytics
- `users.deletedAt` - For soft delete queries

**Order Queries:**
- `orders.userId` - User order history
- `orders.status` - Filter by status
- `orders.type` - Filter by delivery/pickup
- `orders.paymentStatus` - Payment queries
- `orders.placedAt` - Time-based queries
- `orders.orderNumber` - Unique lookup

**Menu Queries:**
- `menu_items.categoryId` - Category filtering
- `menu_items.active` - Active items only
- `menu_items.featured` - Featured items
- `menu_items.popular` - Popular items

**Payment Queries:**
- `payments.orderId` - Order payments
- `payments.status` - Payment status
- `payments.stripePaymentIntentId` - Stripe lookups
- `payments.paypalOrderId` - PayPal lookups

**Gift Card Queries:**
- `gift_cards.cardNumber` - Unique lookup
- `gift_cards.userId` - User gift cards
- `gift_cards.status` - Active cards

**Delivery Queries:**
- `deliveries.driverId` - Driver deliveries
- `deliveries.status` - Delivery status
- `deliveries.estimatedDeliveryTime` - Time-based queries

### Composite Indexes

- `[orders.userId, orders.placedAt]` - User order history with sorting
- `[orders.status, orders.placedAt]` - Status filtering with sorting
- `[notifications.userId, notifications.read]` - Unread notifications
- `[gift_card_transactions.giftCardId, gift_card_transactions.createdAt]` - Transaction history

---

## Migrations

### Migration Strategy

1. **Initial Migration:** Create all tables
2. **Incremental Migrations:** Add new tables/columns as needed
3. **Data Migrations:** Seed demo data, migrate existing data
4. **Rollback Support:** All migrations should be reversible

### Seed Data

**Demo Accounts:**
- Admin user
- Manager user
- Staff user
- Delivery driver user
- Customer user

**Demo Menu:**
- Categories (Appetizers, Entrees, Desserts, etc.)
- Menu items with images
- Modifiers and options
- Sample availability times

**Demo Settings:**
- Restaurant information
- Delivery zones
- Payment configuration (test mode)

See [Setup & Installation Guide](setup-installation.md) for seed script details.

---

This schema provides a complete foundation for the restaurant order and delivery system with full auditability, flexibility, and performance optimization.

