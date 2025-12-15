# Development Guide

**Complete development workflow, milestones, and implementation guide.**

---

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Project Setup](#project-setup)
3. [Development Milestones](#development-milestones)
4. [Testing Methodology](#testing-methodology)
5. [Code Standards](#code-standards)
6. [Git Workflow](#git-workflow)
7. [Common Tasks](#common-tasks)

---

## Development Workflow

### Test-Driven Development (TDD) Approach

**Methodology:**
1. Write tests first (unit/integration)
2. Implement feature to pass tests
3. Achieve 90%+ coverage
4. Ensure 100% pass rate
5. Commit and push
6. Move to next milestone

### Milestone-Based Development

- Each milestone is a complete, testable feature set
- Tests must pass before moving to next milestone
- Coverage must be 90%+ for each milestone
- All tests must pass (100% pass rate)

---

## Project Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd restaurant-order-delivery-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Setup Database

```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Run migrations
npx prisma migrate dev

# Seed demo data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Application available at `http://localhost:3000`

---

## Development Milestones

### Milestone 1: Project Foundation & Authentication

**Goal:** Setup project structure, database, and authentication system

**Tasks:**
- [ ] Initialize Next.js 16 project
- [ ] Setup TypeScript configuration
- [ ] Setup Tailwind CSS
- [ ] Setup Prisma with PostgreSQL
- [ ] Create database schema (users, roles, user_roles)
- [ ] Implement JWT authentication
- [ ] Create login/register pages
- [ ] Implement password hashing (bcrypt)
- [ ] Create password reset flow
- [ ] Setup demo accounts seed data
- [ ] Create demo account login buttons
- [ ] Implement role-based access control (RBAC)
- [ ] Create protected route middleware
- [ ] Write tests for authentication (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Working authentication system
- Demo accounts functional
- Role-based access working
- Tests passing with 90%+ coverage

**Estimated Time:** 1-2 weeks

---

### Milestone 2: Menu Management System

**Goal:** Complete menu management with categories, items, and modifiers

**Tasks:**
- [ ] Create menu database schema (categories, items, modifiers, options)
- [ ] Create admin menu management pages
- [ ] Implement category CRUD
- [ ] Implement menu item CRUD
- [ ] Implement modifier system (single/multiple choice, text, number)
- [ ] Implement modifier options with pricing
- [ ] Create menu item editor with modifier configuration
- [ ] Implement time-based availability (per item and category)
- [ ] Add dietary tags and allergen information
- [ ] Add featured/popular flags
- [ ] Create public menu display page
- [ ] Implement menu search and filtering
- [ ] Add image upload for categories and items
- [ ] Create placeholder image system
- [ ] Write tests for menu management (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Complete menu management in admin
- Public menu display functional
- Modifier system working
- Image uploads working
- Tests passing with 90%+ coverage

**Estimated Time:** 2-3 weeks

---

### Milestone 3: Shopping Cart & Checkout

**Goal:** Shopping cart functionality and checkout process

**Tasks:**
- [ ] Create cart state management (Zustand)
- [ ] Implement add to cart functionality
- [ ] Implement cart item modification
- [ ] Implement cart item removal
- [ ] Create cart UI component
- [ ] Implement guest checkout flow
- [ ] Implement authenticated checkout flow
- [ ] Create address management (save/select)
- [ ] Implement delivery fee calculation
- [ ] Implement tax calculation
- [ ] Create checkout form validation
- [ ] Implement order creation
- [ ] Create order confirmation page
- [ ] Write tests for cart and checkout (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Shopping cart functional
- Checkout process complete
- Order creation working
- Tests passing with 90%+ coverage

**Estimated Time:** 2 weeks

---

### Milestone 4: Payment Integration

**Goal:** Integrate Stripe and PayPal payment processing

**Tasks:**
- [ ] Setup Stripe account and API keys
- [ ] Implement Stripe payment intent creation
- [ ] Implement Stripe payment processing
- [ ] Implement Stripe payment retry logic
- [ ] Setup PayPal account and API keys
- [ ] Implement PayPal order creation
- [ ] Implement PayPal payment processing
- [ ] Implement Apple Pay (via Stripe)
- [ ] Implement Google Pay (via Stripe/PayPal)
- [ ] Implement saved payment methods
- [ ] Implement payment failure handling
- [ ] Implement automatic refunds on cancellation
- [ ] Create payment webhook handlers
- [ ] Write tests for payment processing (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Stripe integration complete
- PayPal integration complete
- Apple Pay/Google Pay working
- Payment retry logic working
- Refunds working
- Tests passing with 90%+ coverage

**Estimated Time:** 2-3 weeks

---

### Milestone 5: Point of Sale (POS) System

**Goal:** Complete POS interface for staff

**Tasks:**
- [ ] Create POS layout (touch-optimized)
- [ ] Implement quick order creation
- [ ] Create order list view
- [ ] Implement order status updates
- [ ] Create receipt printing functionality
- [ ] Implement gift card generation
- [ ] Create order management interface
- [ ] Implement order modification (staff only)
- [ ] Implement order cancellation
- [ ] Create staff dashboard
- [ ] Write tests for POS system (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- POS interface functional
- Order management working
- Receipt printing working
- Gift card generation working
- Tests passing with 90%+ coverage

**Estimated Time:** 2 weeks

---

### Milestone 6: Delivery Driver System

**Goal:** Mobile-optimized delivery driver app with GPS tracking

**Tasks:**
- [ ] Create delivery driver layout (mobile-optimized)
- [ ] Implement GPS location tracking (browser Geolocation API)
- [ ] Create delivery assignment system
- [ ] Implement auto-assignment based on location
- [ ] Create delivery list view
- [ ] Implement delivery acceptance
- [ ] Integrate Google Maps API
- [ ] Create route optimization
- [ ] Implement turn-by-turn directions
- [ ] Implement native map integration (open in Google Maps/Apple Maps)
- [ ] Create delivery completion flow
- [ ] Implement delivery status updates
- [ ] Write tests for delivery system (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Delivery driver app functional
- GPS tracking working
- Route optimization working
- Native map integration working
- Tests passing with 90%+ coverage

**Estimated Time:** 2-3 weeks

---

### Milestone 7: Gift Cards, Coupons, and Loyalty Points

**Goal:** Complete gift card, coupon, and loyalty points system

**Tasks:**
- [ ] Create gift card database schema
- [ ] Implement gift card generation (admin/staff)
- [ ] Implement gift card purchase (customer)
- [ ] Create gift card validation (with PIN)
- [ ] Implement gift card balance checking (with reCAPTCHA)
- [ ] Create gift card analytics
- [ ] Implement coupon system (database schema)
- [ ] Create coupon CRUD (admin)
- [ ] Implement coupon validation
- [ ] Implement coupon application (percentage, fixed, buy X get Y)
- [ ] Create loyalty points system (database schema)
- [ ] Implement points earning
- [ ] Implement points redemption
- [ ] Create loyalty points configuration (admin)
- [ ] Write tests for gift cards, coupons, loyalty (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Gift card system complete
- Coupon system complete
- Loyalty points system complete
- Analytics for all systems
- Tests passing with 90%+ coverage

**Estimated Time:** 2-3 weeks

---

### Milestone 8: Analytics and Reporting

**Goal:** Complete analytics dashboard and reporting system

**Tasks:**
- [ ] Create analytics database queries
- [ ] Implement sales analytics
- [ ] Implement order analytics
- [ ] Implement popular items analytics
- [ ] Implement delivery time analytics
- [ ] Create staff performance metrics
- [ ] Create gift card analytics
- [ ] Implement CSV export functionality
- [ ] Implement PDF export functionality
- [ ] Create analytics dashboard UI
- [ ] Create charts and visualizations
- [ ] Implement date range filtering
- [ ] Write tests for analytics (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Analytics dashboard complete
- All metrics working
- Export functionality working
- Tests passing with 90%+ coverage

**Estimated Time:** 2 weeks

---

### Milestone 9: Real-Time Updates and Notifications

**Goal:** WebSocket real-time updates and notification system

**Tasks:**
- [ ] Setup WebSocket server (ws library)
- [ ] Implement WebSocket authentication
- [ ] Create order update subscriptions
- [ ] Implement real-time order status updates
- [ ] Create notification system (database schema)
- [ ] Implement email notifications
- [ ] Implement SMS notifications (optional)
- [ ] Implement push notifications (PWA)
- [ ] Implement in-app notifications
- [ ] Create notification preferences
- [ ] Implement estimated delivery time calculation
- [ ] Write tests for real-time system (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Real-time updates working
- Notification system complete
- Email/SMS/Push notifications working
- Tests passing with 90%+ coverage

**Estimated Time:** 2 weeks

---

### Milestone 10: Testing, Optimization, and Deployment

**Goal:** Complete testing, optimization, and production deployment

**Tasks:**
- [ ] Achieve 90%+ test coverage across all code
- [ ] Ensure 100% test pass rate
- [ ] Run E2E tests (Playwright)
- [ ] Performance optimization
- [ ] Database query optimization
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Security audit
- [ ] Create production build
- [ ] Setup production environment
- [ ] Deploy to production
- [ ] Setup monitoring and alerts
- [ ] Create backup strategy
- [ ] Documentation review and updates

**Deliverables:**
- 90%+ test coverage
- 100% test pass rate
- Optimized application
- Production deployment complete
- Monitoring setup
- Backup strategy in place

**Estimated Time:** 2-3 weeks

---

## Testing Methodology

### Test Types

1. **Unit Tests:**
   - Test individual functions/components
   - Mock external dependencies
   - Fast execution
   - Target: 90%+ coverage

2. **Integration Tests:**
   - Test component interactions
   - Test API endpoints
   - Test database operations
   - Target: 90%+ coverage

3. **E2E Tests (Playwright):**
   - Test complete user flows
   - Test in real browser (including Cursor browser)
   - Test critical paths
   - Target: All critical paths covered

### Test Structure

```
__tests__/
  unit/
    services/
    utils/
    components/
  integration/
    api/
    database/
  e2e/
    customer-flow.spec.ts
    admin-flow.spec.ts
    pos-flow.spec.ts
    driver-flow.spec.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- path/to/test.ts
```

### Coverage Requirements

- **Minimum Coverage:** 90%
- **Pass Rate:** 100%
- **Critical Paths:** 100% E2E coverage

### Test Commands

```bash
# Unit and integration tests
npm test

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# E2E tests in Cursor browser
npm run test:e2e -- --browser chromium
```

---

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Proper type definitions
- Interface over type for object shapes

### Code Style

- Use ESLint and Prettier
- 2 spaces indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in objects/arrays

### Naming Conventions

- **Files:** kebab-case (`order-service.ts`)
- **Components:** PascalCase (`OrderCard.tsx`)
- **Functions/Variables:** camelCase (`calculateTotal`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types/Interfaces:** PascalCase (`OrderStatus`)

### File Organization

```
src/
  app/              # Next.js App Router pages
  components/       # React components
  lib/              # Utilities and helpers
  services/         # Business logic services
  types/            # TypeScript types
  hooks/            # React hooks
  stores/           # Zustand stores
  __tests__/        # Test files
```

### Component Structure

```typescript
// Component file structure
import { ... } from '...'

interface ComponentProps {
  // Props definition
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

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/milestone-X` - Feature branches per milestone
- `fix/bug-description` - Bug fixes

### Commit Messages

Format: `[Milestone X] Description`

Examples:
- `[Milestone 1] Add JWT authentication`
- `[Milestone 2] Implement menu item CRUD`
- `[Fix] Fix payment retry logic`

### Workflow

1. Create feature branch from `develop`
2. Make changes and write tests
3. Ensure tests pass (90%+ coverage, 100% pass rate)
4. Commit with descriptive message
5. Push to remote
6. Create pull request
7. Review and merge to `develop`
8. After milestone complete, merge to `main`

---

## Common Tasks

### Adding a New Feature

1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Ensure tests pass
5. Update documentation
6. Commit and push

### Database Migration

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply in production
npx prisma migrate deploy
```

### Adding a New API Endpoint

1. Create route file: `app/api/v1/endpoint/route.ts`
2. Add authentication middleware
3. Add validation (Zod schema)
4. Implement handler
5. Write tests
6. Update API documentation

### Adding a New Component

1. Create component file: `components/ComponentName.tsx`
2. Add TypeScript types
3. Add Tailwind styling
4. Write component tests
5. Use in pages

### Debugging

```bash
# View logs
pm2 logs restaurant-app

# Database debugging
npx prisma studio

# API testing
# Use Postman or curl
```

---

## Development Checklist

Before moving to next milestone:

- [ ] All tests written and passing (90%+ coverage)
- [ ] 100% test pass rate
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Performance acceptable
- [ ] Security considerations addressed
- [ ] Committed and pushed to Git

---

This development guide provides a structured approach to building the restaurant order and delivery system with quality and testing as priorities.

