# Prisma Schema Reference

**Complete Prisma schema file with all models, relationships, and configurations.**

---

## Complete Schema File

This is the complete `prisma/schema.prisma` file. See [Database Schema](database-schema.md) for detailed table documentation.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER & AUTHENTICATION
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  phone         String?
  avatar        String?
  emailVerified Boolean   @default(false)
  emailVerificationToken String? @unique
  passwordResetToken String? @unique
  passwordResetExpires DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  lastLoginAt   DateTime?
  
  roles         UserRole[]
  orders        Order[]
  addresses     Address[]
  paymentMethods PaymentMethod[]
  giftCards     GiftCard[]
  giftCardTransactions GiftCardTransaction[] @relation("GiftCardOwner")
  loyaltyPoints LoyaltyPoint[]
  ratings       Rating[]
  notifications Notification[]
  auditLogs     AuditLog[] @relation("UserAuditLogs")
  createdOrders Order[] @relation("OrderCreator")
  deliveries    Delivery[]
  generatedGiftCards GiftCard[] @relation("GiftCardGenerator")
  
  @@index([email])
  @@index([createdAt])
  @@index([deletedAt])
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  permissions String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       UserRole[]
  
  @@index([name])
}

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

// ============================================
// RESTAURANT SETTINGS
// ============================================

model RestaurantSettings {
  id                    String   @id @default("default")
  
  name                  String
  description           String?  @db.Text
  phone                 String?
  email                 String?
  website               String?
  logo                  String?
  banner                String?
  
  address               String
  city                  String
  state                 String
  zipCode               String
  country               String   @default("US")
  latitude              Float?
  longitude             Float?
  
  hoursMonday           Json?
  hoursTuesday          Json?
  hoursWednesday        Json?
  hoursThursday         Json?
  hoursFriday           Json?
  hoursSaturday         Json?
  hoursSunday           Json?
  specialHours          Json?
  
  minOrderAmount        Decimal? @db.Decimal(10, 2)
  maxDeliveryDistance   Float?
  defaultPrepTime       Int?
  autoAcceptOrders      Boolean  @default(false)
  taxRate               Decimal  @default(0.0) @db.Decimal(5, 4)
  
  enableLoyaltyPoints   Boolean  @default(false)
  loyaltyPointsPerDollar Decimal? @default(0.5) @db.Decimal(5, 2)
  loyaltyPointsForFree  Int?     @default(100)
  enableEmailNotifications Boolean @default(true)
  enableSMSNotifications  Boolean @default(false)
  enableEmailVerification  Boolean @default(false)
  enableReCAPTCHA       Boolean @default(false)
  reCAPTCHASiteKey      String?
  reCAPTCHASecretKey    String?
  
  demoMode              Boolean  @default(true)
  setupWizardEnabled    Boolean  @default(false)
  
  primaryColor          String?  @default("#FF6B35")
  secondaryColor        String?  @default("#004E89")
  menuDisplayStyle      String   @default("grid")
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  createdBy             String?
  updatedBy             String?
  
  @@index([zipCode])
}

// ============================================
// MENU
// ============================================

model MenuCategory {
  id              String   @id @default(cuid())
  name            String
  description     String?  @db.Text
  image           String?
  order           Int      @default(0)
  active          Boolean  @default(true)
  availableTimes Json?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?
  
  items           MenuItem[]
  
  @@index([order])
  @@index([active])
  @@index([deletedAt])
}

model MenuItem {
  id                String   @id @default(cuid())
  categoryId        String
  name              String
  description       String?  @db.Text
  image             String?
  price             Decimal  @db.Decimal(10, 2)
  active            Boolean  @default(true)
  featured          Boolean  @default(false)
  popular           Boolean  @default(false)
  availableTimes    Json?
  dietaryTags       String[]
  allergens         String[]
  calories          Int?
  nutritionInfo     Json?
  preparationTime   Int?
  spiceLevel        Int?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  createdBy         String?
  updatedBy         String?
  
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

model Modifier {
  id              String   @id @default(cuid())
  name            String
  description     String?  @db.Text
  type            String
  required        Boolean  @default(false)
  minSelections   Int?
  maxSelections   Int?
  active          Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?
  
  options         ModifierOption[]
  itemModifiers   MenuItemModifier[]
  
  @@index([active])
  @@index([deletedAt])
}

model ModifierOption {
  id              String   @id @default(cuid())
  modifierId      String
  name            String
  description     String?  @db.Text
  price           Decimal  @default(0.0) @db.Decimal(10, 2)
  priceType       String   @default("FIXED")
  active          Boolean  @default(true)
  order           Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?
  
  modifier        Modifier @relation(fields: [modifierId], references: [id], onDelete: Cascade)
  orderModifiers  OrderModifier[]
  
  @@index([modifierId])
  @@index([active])
  @@index([order])
  @@index([deletedAt])
}

model MenuItemModifier {
  id              String   @id @default(cuid())
  menuItemId      String
  modifierId      String
  required        Boolean  @default(false)
  order           Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  menuItem        MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  modifier        Modifier @relation(fields: [modifierId], references: [id], onDelete: Cascade)
  
  @@unique([menuItemId, modifierId])
  @@index([menuItemId])
  @@index([modifierId])
}

// ============================================
// ORDERS
// ============================================

model Order {
  id                  String   @id @default(cuid())
  orderNumber         String   @unique
  userId              String?
  customerEmail       String?
  customerPhone       String?
  customerName        String?
  type                String
  status              String   @default("PENDING")
  subtotal            Decimal  @db.Decimal(10, 2)
  tax                 Decimal  @db.Decimal(10, 2)
  deliveryFee         Decimal  @default(0.0) @db.Decimal(10, 2)
  tip                 Decimal  @default(0.0) @db.Decimal(10, 2)
  discount            Decimal  @default(0.0) @db.Decimal(10, 2)
  total               Decimal  @db.Decimal(10, 2)
  deliveryAddressId   String?
  deliveryAddress     Json?
  estimatedDeliveryTime DateTime?
  actualDeliveryTime  DateTime?
  paymentStatus       String   @default("PENDING")
  paymentMethod       String?
  paymentIntentId     String?
  specialInstructions String?  @db.Text
  deliveryInstructions String? @db.Text
  placedAt            DateTime @default(now())
  confirmedAt         DateTime?
  preparingAt         DateTime?
  readyAt             DateTime?
  outForDeliveryAt    DateTime?
  deliveredAt         DateTime?
  cancelledAt         DateTime?
  cancelledBy         String?
  cancellationReason  String?  @db.Text
  createdBy           String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  user                User?    @relation(fields: [userId], references: [id])
  creator             User?    @relation("OrderCreator", fields: [createdBy], references: [id])
  items               OrderItem[]
  payments            Payment[]
  delivery            Delivery?
  ratings             Rating[]
  notifications       Notification[]
  couponUsages        CouponUsage[]
  loyaltyPoints       LoyaltyPoint[]
  
  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([type])
  @@index([paymentStatus])
  @@index([placedAt])
  @@index([createdAt])
}

model OrderItem {
  id              String   @id @default(cuid())
  orderId         String
  menuItemId      String
  name            String
  description     String?  @db.Text
  price           Decimal  @db.Decimal(10, 2)
  quantity        Int      @default(1)
  specialInstructions String? @db.Text
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItem        MenuItem @relation(fields: [menuItemId], references: [id])
  modifiers       OrderModifier[]
  
  @@index([orderId])
  @@index([menuItemId])
}

model OrderModifier {
  id                  String   @id @default(cuid())
  orderItemId         String
  modifierOptionId    String
  modifierName        String
  optionName          String
  price               Decimal  @db.Decimal(10, 2)
  quantity            Int      @default(1)
  
  createdAt           DateTime @default(now())
  
  orderItem           OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  modifierOption      ModifierOption @relation(fields: [modifierOptionId], references: [id])
  
  @@index([orderItemId])
  @@index([modifierOptionId])
}

// ============================================
// PAYMENTS
// ============================================

model Payment {
  id                  String   @id @default(cuid())
  orderId             String
  amount              Decimal  @db.Decimal(10, 2)
  currency            String   @default("USD")
  status              String
  paymentMethod       String
  stripePaymentIntentId String? @unique
  paypalOrderId       String? @unique
  giftCardId          String?
  loyaltyPointsUsed   Int?
  providerResponse    Json?
  failureReason       String?  @db.Text
  retryCount          Int      @default(0)
  processedAt         DateTime?
  refundedAt          DateTime?
  refundAmount        Decimal? @db.Decimal(10, 2)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  order               Order    @relation(fields: [orderId], references: [id])
  giftCard            GiftCard? @relation(fields: [giftCardId], references: [id])
  
  @@index([orderId])
  @@index([status])
  @@index([paymentMethod])
  @@index([stripePaymentIntentId])
  @@index([paypalOrderId])
  @@index([processedAt])
}

model PaymentMethod {
  id                  String   @id @default(cuid())
  userId              String
  type                String
  providerCustomerId String?
  providerPaymentMethodId String?
  last4               String?
  brand               String?
  expiryMonth         Int?
  expiryYear          Int?
  isDefault           Boolean  @default(false)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?
  
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([providerCustomerId])
  @@index([deletedAt])
}

// ============================================
// GIFT CARDS
// ============================================

model GiftCard {
  id                  String   @id @default(cuid())
  cardNumber          String   @unique
  pin                 String
  initialAmount       Decimal  @db.Decimal(10, 2)
  currentBalance      Decimal  @db.Decimal(10, 2)
  type                String   @default("VIRTUAL")
  status              String   @default("ACTIVE")
  userId              String?
  customerEmail       String?
  customerName        String?
  physicalAddress     Json?
  physicalRequestedAt DateTime?
  physicalSentAt      DateTime?
  expiresAt           DateTime?
  generatedBy         String?
  generatedAt         DateTime @default(now())
  purchaseOrderId     String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  user                User?    @relation("GiftCardOwner", fields: [userId], references: [id])
  generator           User?    @relation("GiftCardGenerator", fields: [generatedBy], references: [id])
  transactions        GiftCardTransaction[]
  payments            Payment[]
  
  @@index([cardNumber])
  @@index([userId])
  @@index([status])
  @@index([generatedBy])
  @@index([expiresAt])
}

model GiftCardTransaction {
  id                  String   @id @default(cuid())
  giftCardId          String
  orderId             String?
  type                String
  amount              Decimal  @db.Decimal(10, 2)
  balanceBefore       Decimal  @db.Decimal(10, 2)
  balanceAfter        Decimal  @db.Decimal(10, 2)
  description         String?  @db.Text
  
  createdAt           DateTime @default(now())
  
  giftCard            GiftCard @relation(fields: [giftCardId], references: [id], onDelete: Cascade)
  order               Order?   @relation(fields: [orderId], references: [id])
  
  @@index([giftCardId])
  @@index([orderId])
  @@index([type])
  @@index([createdAt])
}

// ============================================
// LOYALTY & COUPONS
// ============================================

model LoyaltyPoint {
  id                  String   @id @default(cuid())
  userId              String
  points              Int
  type                String
  orderId             String?
  description         String?  @db.Text
  balanceAfter        Int
  
  createdAt           DateTime @default(now())
  
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  order               Order?   @relation(fields: [orderId], references: [id])
  
  @@index([userId])
  @@index([orderId])
  @@index([type])
  @@index([createdAt])
}

model Coupon {
  id                  String   @id @default(cuid())
  code                String   @unique
  name                String
  description         String?  @db.Text
  type                String
  value               Decimal? @db.Decimal(10, 2)
  minOrderAmount      Decimal? @db.Decimal(10, 2)
  maxDiscount         Decimal? @db.Decimal(10, 2)
  buyXGetYConfig      Json?
  freeItemId          String?
  usageLimit          Int?
  usageCount          Int      @default(0)
  usageLimitPerUser   Int?
  firstTimeOnly       Boolean  @default(false)
  validFrom           DateTime
  validUntil          DateTime?
  active              Boolean  @default(true)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  createdBy           String?
  updatedBy           String?
  
  freeMenuItem        MenuItem? @relation(fields: [freeItemId], references: [id])
  usages              CouponUsage[]
  
  @@index([code])
  @@index([active])
  @@index([validFrom, validUntil])
}

model CouponUsage {
  id                  String   @id @default(cuid())
  couponId            String
  orderId             String
  userId              String?
  discountAmount      Decimal  @db.Decimal(10, 2)
  
  createdAt           DateTime @default(now())
  
  coupon              Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  order               Order    @relation(fields: [orderId], references: [id])
  user                User?    @relation(fields: [userId], references: [id])
  
  @@unique([couponId, orderId])
  @@index([couponId])
  @@index([orderId])
  @@index([userId])
  @@index([createdAt])
}

// ============================================
// DELIVERY
// ============================================

model DeliveryZone {
  id                  String   @id @default(cuid())
  name                String
  description         String?  @db.Text
  radius              Float
  deliveryFee         Decimal  @db.Decimal(10, 2)
  freeDeliveryThreshold Decimal? @db.Decimal(10, 2)
  active              Boolean  @default(true)
  order               Int      @default(0)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  createdBy           String?
  updatedBy           String?
  
  @@index([active])
  @@index([order])
  @@index([radius])
}

model Delivery {
  id                  String   @id @default(cuid())
  orderId             String   @unique
  driverId            String?
  status              String   @default("PENDING")
  deliveryAddress     Json
  latitude            Float?
  longitude           Float?
  driverLatitude      Float?
  driverLongitude     Float?
  driverLocationUpdatedAt DateTime?
  estimatedPickupTime DateTime?
  estimatedDeliveryTime DateTime?
  actualPickupTime    DateTime?
  actualDeliveryTime  DateTime?
  distance            Float?
  routeOptimized      Boolean  @default(false)
  deliveryNotes       String?  @db.Text
  driverNotes         String?  @db.Text
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  order               Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  driver              User?    @relation(fields: [driverId], references: [id])
  
  @@index([orderId])
  @@index([driverId])
  @@index([status])
  @@index([estimatedDeliveryTime])
}

// ============================================
// USER DATA
// ============================================

model Address {
  id                  String   @id @default(cuid())
  userId              String
  label               String?
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
  deletedAt           DateTime?
  
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([deletedAt])
}

model Rating {
  id                  String   @id @default(cuid())
  userId              String
  orderId             String?
  menuItemId          String?
  type                String
  rating              Int
  comment             String?  @db.Text
  helpfulCount        Int      @default(0)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
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

model Notification {
  id                  String   @id @default(cuid())
  userId              String
  orderId             String?
  type                String
  title               String
  message             String   @db.Text
  link                String?
  read                Boolean  @default(false)
  readAt              DateTime?
  emailSent           Boolean  @default(false)
  emailSentAt         DateTime?
  smsSent             Boolean  @default(false)
  smsSentAt           DateTime?
  pushSent            Boolean  @default(false)
  pushSentAt          DateTime?
  
  createdAt           DateTime @default(now())
  
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  order               Order?   @relation(fields: [orderId], references: [id])
  
  @@index([userId, read])
  @@index([orderId])
  @@index([type])
  @@index([createdAt])
}

// ============================================
// AUDIT & ANALYTICS
// ============================================

model AuditLog {
  id                  String   @id @default(cuid())
  userId              String?
  action              String
  entityType          String
  entityId            String?
  changes             Json?
  ipAddress           String?
  userAgent           String?
  metadata            Json?
  
  createdAt           DateTime @default(now())
  
  user                User?    @relation("UserAuditLogs", fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
}
```

---

## Migration Commands

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

---

## Indexes Summary

All indexes are defined in the schema above. Key indexes:

- **User lookups:** `email`, `createdAt`, `deletedAt`
- **Order queries:** `userId`, `orderNumber`, `status`, `type`, `paymentStatus`, `placedAt`
- **Menu queries:** `categoryId`, `active`, `featured`, `popular`
- **Payment queries:** `orderId`, `status`, `stripePaymentIntentId`, `paypalOrderId`
- **Gift card queries:** `cardNumber`, `userId`, `status`
- **Delivery queries:** `driverId`, `status`, `estimatedDeliveryTime`

---

This Prisma schema reference provides the complete database structure for the restaurant ordering system.

