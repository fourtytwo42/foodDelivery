# SaaS Landing Page Specification

**Dual-purpose landing page: Restaurant menu demo + SaaS product sales.**

---

## Overview

The landing page serves two purposes:
1. **Restaurant Menu Demo:** Functional menu with gag food items that customers can browse and order
2. **SaaS Product Sales:** Information about the restaurant ordering system as a product

The page should seamlessly blend both purposes, making it clear this is both a demo and a product showcase.

---

## Page Structure

### Header

- **Logo:** Restaurant/SaaS branding
- **Navigation:**
  - Menu (scroll to menu section)
  - Features (scroll to features)
  - Pricing (scroll to pricing)
  - Contact (scroll to contact)
  - Sales/Get Started (link to sales contact)
  - Login (link to login page with demo account buttons)

### Hero Section

**Left Side - SaaS Focus:**
- Headline: "The Complete Restaurant Ordering System"
- Subheadline: "Self-hosted, customizable, and easy to use"
- Key benefits (3-4 bullet points)
- CTA buttons:
  - "Try Demo" (scroll to menu)
  - "Contact Sales" (link to contact form)
  - "View Features" (scroll to features)

**Right Side - Menu Preview:**
- Featured menu item card
- "Order Now" button that scrolls to menu

### Menu Section (Functional Demo)

**Header:**
- "Try Our Demo Menu"
- Subtext: "Experience the full ordering system with our demo menu. Place an order, customize items, and see how easy it is for your customers."

**Menu Display:**
- Full functional menu with categories
- Gag food items (funny names, creative descriptions)
- All menu features working:
  - Categories
  - Item customization
  - Add to cart
  - Checkout process
  - Guest checkout
  - Account creation

**Sample Gag Items:**
- "The Code Burger" - "Stacked with layers of functionality"
- "API Pizza" - "Endpoints included, toppings extra"
- "Database Delight" - "Relational and delicious"
- "Cloud Soup" - "Scalable to any size"
- "Bug-Free Fries" - "Tested and approved"
- "Deployment Dessert" - "Ready to ship"

### Features Section

**Grid Layout with Icons:**

1. **Easy Menu Management**
   - Icon: Menu/Edit icon
   - Description: "Configure your menu with categories, items, modifiers, and availability times. No technical knowledge required."

2. **Point of Sale System**
   - Icon: Touch screen icon
   - Description: "Touch-optimized POS for your staff. Create orders, generate gift cards, print receipts."

3. **Delivery Management**
   - Icon: GPS/Map icon
   - Description: "GPS tracking, route optimization, and driver assignment. Real-time delivery updates."

4. **Payment Processing**
   - Icon: Credit card icon
   - Description: "Stripe, PayPal, Apple Pay, Google Pay. Gift cards, coupons, and loyalty points."

5. **Analytics & Reporting**
   - Icon: Chart icon
   - Description: "Complete sales analytics, popular items, staff performance, and exportable reports."

6. **Self-Hosted**
   - Icon: Server icon
   - Description: "Full control. Host on your own VPS. No monthly fees. One-time purchase."

### How It Works Section

**Step-by-Step Process:**

1. **Purchase & Setup**
   - "Buy the system and we'll help you set it up on your VPS"
   - Icon: Shopping cart

2. **Configure Your Restaurant**
   - "Use our setup wizard to configure your restaurant details"
   - Icon: Settings

3. **Add Your Menu**
   - "Add your menu items, categories, and modifiers"
   - Icon: Menu

4. **Start Taking Orders**
   - "Go live and start accepting orders from customers"
   - Icon: Checkmark

### Pricing Section

**Pricing Tiers:**

- **Basic:** $X one-time
  - Single restaurant
  - All core features
  - Email support
  - Setup assistance

- **Professional:** $Y one-time
  - Everything in Basic
  - Priority support
  - Custom branding
  - Advanced analytics

- **Enterprise:** Contact for pricing
  - Multiple locations
  - Custom development
  - Dedicated support
  - Training included

**Note:** "Self-hosted. No monthly fees. One-time purchase."

### Testimonials Section

- Customer testimonials (if available)
- Case studies
- Success stories

### Contact Section

**Contact Form:**
- Name
- Email
- Restaurant name
- Phone
- Message
- "I'm interested in:" checkbox list
  - [ ] Demo
  - [ ] Pricing
  - [ ] Setup help
  - [ ] Custom features

**Contact Information:**
- Email: sales@yourdomain.com
- Phone: (optional)
- Response time: "We'll respond within 24 hours"

### Footer

- Links:
  - Features
  - Pricing
  - Documentation
  - Support
  - Privacy Policy
  - Terms of Service
- Social media links (if applicable)
- Copyright notice

---

## Functional Requirements

### Menu Functionality

- **Full Menu System:**
  - Browse categories
  - View items
  - Customize items (modifiers)
  - Add to cart
  - View cart
  - Checkout process
  - Guest checkout
  - Account creation

### Demo Mode Indicators

- **Visual Indicators:**
  - Banner: "Demo Mode - This is a demonstration of our restaurant ordering system"
  - Watermark on checkout: "Demo Order"
  - Confirmation message: "This is a demo order. No actual charges will be made."

### Demo Account Access

- **Login Page Integration:**
  - Link to login page from header
  - Login page shows demo account buttons:
    - "Login as Admin" (auto-fills admin credentials)
    - "Login as Staff" (auto-fills staff credentials)
    - "Login as Customer" (auto-fills customer credentials)
    - "Login as Driver" (auto-fills driver credentials)

### Order Processing (Demo)

- **Demo Orders:**
  - Orders can be placed
  - Payment processing simulated (no actual charges)
  - Order tracking works
  - Staff can manage orders (if logged in)
  - Orders reset daily (via cron job)

---

## Design Requirements

### Visual Style

- **Modern & Clean:**
  - DoorDash-inspired design
  - Professional SaaS aesthetic
  - Restaurant menu appeal
  - Mobile-responsive

### Color Scheme

- Configurable via admin (default: professional blue/orange)
- High contrast for accessibility
- Brand colors for SaaS elements

### Typography

- Clear, readable fonts
- Headings: Bold, attention-grabbing
- Body: Easy to read
- Menu items: Appetizing descriptions

### Images

- **Placeholder Images:**
  - Folder: `public/images/placeholders/`
  - Menu item placeholders
  - Category placeholders
  - Restaurant logo placeholder
  - Replaceable via admin panel

- **SaaS Images:**
  - Screenshots of admin panel
  - Feature illustrations
  - Dashboard previews

---

## Content Strategy

### Dual Messaging

**For Restaurant Owners:**
- "Manage your restaurant orders easily"
- "No technical knowledge required"
- "Self-hosted, full control"

**For Customers (Demo):**
- "Try our demo menu"
- "Experience the ordering system"
- "Place an order and see how it works"

### Call-to-Actions

- **Primary CTAs:**
  - "Try Demo Menu" (scroll to menu)
  - "Contact Sales" (contact form)
  - "Get Started" (contact form)

- **Secondary CTAs:**
  - "View Features" (scroll)
  - "See Pricing" (scroll)
  - "Login to Admin" (login page)

---

## Technical Implementation

### Page Route

- **Path:** `/` (root)
- **File:** `app/page.tsx`
- **Type:** Server Component with Client Components

### Demo Mode Configuration

```typescript
// Environment variable
DEMO_MODE=true  // Default: true
SETUP_WIZARD_ENABLED=false  // Default: false

// Component logic
const isDemoMode = process.env.DEMO_MODE === 'true'
```

### Menu Data

- **Source:** Seeded demo data
- **Reset:** Daily via cron job
- **Editable:** Via admin panel (if logged in as admin)

### Order Processing

- **Demo Orders:**
  - Orders saved to database
  - Payment simulated (no actual processing)
  - Order tracking functional
  - Daily reset via cron

---

## User Flows

### Customer Flow (Demo)

1. Land on homepage
2. Scroll to menu section
3. Browse menu items
4. Add items to cart
5. Customize items
6. Proceed to checkout
7. Fill delivery address
8. Select payment method (demo)
9. Place order
10. View order confirmation
11. Track order status

### Sales Flow

1. Land on homepage
2. Read features
3. View pricing
4. Click "Contact Sales"
5. Fill contact form
6. Submit inquiry
7. Receive email confirmation
8. Sales team follows up

### Admin Demo Flow

1. Click "Login" in header
2. Click "Login as Admin" button
3. Auto-fill credentials
4. Click "Login"
5. Access admin dashboard
6. Explore features:
   - Menu management
   - Order management
   - Analytics
   - Settings

---

## Success Metrics

### Demo Engagement

- Menu views
- Items added to cart
- Checkout starts
- Orders placed
- Demo account logins

### Sales Conversion

- Contact form submissions
- Feature section views
- Pricing page views
- Time on page
- Scroll depth

---

## Maintenance

### Daily Reset

- Cron job resets demo data
- Clears demo orders
- Resets menu to default
- Maintains demo accounts

### Content Updates

- Admin can update:
  - Restaurant information
  - Menu items (for demo)
  - Pricing information
  - Contact information
  - Feature descriptions

---

This landing page serves as both a functional demo and an effective sales tool for the restaurant ordering system SaaS product.

