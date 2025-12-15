# Testing Guide

**Complete testing strategy, coverage requirements, and testing procedures.**

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Testing Requirements](#testing-requirements)
3. [Test Types](#test-types)
4. [Test Structure](#test-structure)
5. [Writing Tests](#writing-tests)
6. [Running Tests](#running-tests)
7. [Coverage Requirements](#coverage-requirements)
8. [E2E Testing](#e2e-testing)
9. [Test Data Management](#test-data-management)
10. [Continuous Testing](#continuous-testing)

---

## Testing Overview

### Testing Philosophy

- **Test-Driven Development (TDD):** Write tests first, then implement
- **90%+ Coverage:** Minimum coverage requirement
- **100% Pass Rate:** All tests must pass
- **Test-as-you-go:** Test each milestone before moving forward
- **Comprehensive Testing:** Unit, integration, and E2E tests

### Testing Tools

- **Unit/Integration:** Jest + React Testing Library
- **E2E:** Playwright
- **Coverage:** Jest coverage reports
- **Mocking:** Jest mocks, MSW for API mocking

---

## Testing Requirements

### Coverage Targets

- **Overall Coverage:** 90%+
- **Critical Paths:** 100% coverage
- **Business Logic:** 95%+ coverage
- **UI Components:** 85%+ coverage
- **API Endpoints:** 95%+ coverage

### Pass Rate

- **All Tests:** 100% must pass
- **No Skipped Tests:** All tests must run
- **No Flaky Tests:** Tests must be deterministic

### Test Methodology

1. Write tests for milestone
2. Implement features to pass tests
3. Achieve 90%+ coverage
4. Ensure 100% pass rate
5. Commit and push
6. Move to next milestone

---

## Test Types

### Unit Tests

**Purpose:** Test individual functions, utilities, and pure logic

**Examples:**
- Price calculations
- Date formatting
- Validation functions
- Utility functions

**Location:** `__tests__/unit/`

**Example:**
```typescript
import { calculateOrderTotal } from '@/lib/order-calculations'

describe('calculateOrderTotal', () => {
  it('should calculate total with tax and delivery', () => {
    const order = {
      subtotal: 25.00,
      tax: 2.06,
      deliveryFee: 3.00,
      tip: 5.00
    }
    expect(calculateOrderTotal(order)).toBe(35.06)
  })
})
```

### Integration Tests

**Purpose:** Test component interactions, API endpoints, database operations

**Examples:**
- API endpoint handlers
- Database queries
- Service layer functions
- Component interactions

**Location:** `__tests__/integration/`

**Example:**
```typescript
import { createOrder } from '@/services/order-service'
import { prisma } from '@/lib/prisma'

describe('Order Service', () => {
  it('should create order with items', async () => {
    const order = await createOrder({
      userId: 'user_123',
      items: [...],
      type: 'DELIVERY'
    })
    
    expect(order.id).toBeDefined()
    expect(order.status).toBe('PENDING')
  })
})
```

### Component Tests

**Purpose:** Test React components in isolation

**Examples:**
- Component rendering
- User interactions
- Props handling
- State management

**Location:** `__tests__/components/`

**Example:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MenuItemCard } from '@/components/MenuItemCard'

describe('MenuItemCard', () => {
  it('should display menu item information', () => {
    const item = {
      id: 'item_123',
      name: 'Pizza',
      price: 12.99
    }
    
    render(<MenuItemCard item={item} />)
    
    expect(screen.getByText('Pizza')).toBeInTheDocument()
    expect(screen.getByText('$12.99')).toBeInTheDocument()
  })
  
  it('should call onAddToCart when button clicked', () => {
    const onAddToCart = jest.fn()
    render(<MenuItemCard item={item} onAddToCart={onAddToCart} />)
    
    fireEvent.click(screen.getByText('Add to Cart'))
    expect(onAddToCart).toHaveBeenCalledWith(item)
  })
})
```

### E2E Tests

**Purpose:** Test complete user flows in real browser

**Examples:**
- Customer order flow
- Admin menu management
- POS order creation
- Driver delivery flow

**Location:** `__tests__/e2e/`

**Example:**
```typescript
import { test, expect } from '@playwright/test'

test('customer can place order', async ({ page }) => {
  // Navigate to menu
  await page.goto('/menu')
  
  // Add item to cart
  await page.click('[data-testid="add-to-cart-pizza"]')
  
  // Go to cart
  await page.click('[data-testid="cart-button"]')
  
  // Proceed to checkout
  await page.click('[data-testid="checkout-button"]')
  
  // Fill delivery address
  await page.fill('[name="street"]', '123 Main St')
  await page.fill('[name="city"]', 'New York')
  // ... more fields
  
  // Complete payment
  await page.click('[data-testid="pay-button"]')
  
  // Verify order confirmation
  await expect(page.locator('[data-testid="order-confirmed"]')).toBeVisible()
})
```

---

## Test Structure

### Directory Structure

```
__tests__/
  unit/
    services/
      order-service.test.ts
      payment-service.test.ts
      menu-service.test.ts
    lib/
      calculations.test.ts
      validations.test.ts
    utils/
      formatters.test.ts
  integration/
    api/
      orders.test.ts
      payments.test.ts
      menu.test.ts
    database/
      queries.test.ts
  components/
    MenuItemCard.test.tsx
    OrderCard.test.tsx
    Cart.test.tsx
  e2e/
    customer-flow.spec.ts
    admin-flow.spec.ts
    pos-flow.spec.ts
    driver-flow.spec.ts
  fixtures/
    orders.ts
    users.ts
    menu-items.ts
  mocks/
    stripe.ts
    paypal.ts
    email.ts
```

### Test File Naming

- Unit tests: `*.test.ts`
- Component tests: `*.test.tsx`
- E2E tests: `*.spec.ts`

---

## Writing Tests

### Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })
  
  afterEach(() => {
    // Cleanup after each test
  })
  
  it('should do something specific', () => {
    // Arrange
    const input = ...
    
    // Act
    const result = functionUnderTest(input)
    
    // Assert
    expect(result).toBe(expected)
  })
})
```

### Best Practices

1. **Arrange-Act-Assert Pattern:**
   - Arrange: Setup test data
   - Act: Execute function
   - Assert: Verify results

2. **Descriptive Test Names:**
   - Use "should" format
   - Be specific about what is tested

3. **One Assertion Per Test:**
   - Focus on one behavior
   - Easier to debug failures

4. **Mock External Dependencies:**
   - Mock API calls
   - Mock database
   - Mock external services

5. **Use Test Fixtures:**
   - Reusable test data
   - Consistent test setup

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests in specific browser
npm run test:e2e -- --browser chromium
npm run test:e2e -- --browser firefox
npm run test:e2e -- --browser webkit

# Run E2E tests in Cursor browser
npm run test:e2e -- --browser chromium --headed
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### CI/CD Integration

Tests should run automatically on:
- Pull requests
- Commits to main/develop
- Before deployment

---

## Coverage Requirements

### Minimum Coverage

- **Overall:** 90%
- **Services:** 95%
- **API Routes:** 95%
- **Components:** 85%
- **Utils:** 90%

### Coverage Exclusions

- Test files
- Configuration files
- Type definitions
- Migration files

### Coverage Configuration

```json
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}
```

---

## E2E Testing

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
})
```

### E2E Test Scenarios

**Customer Flow:**
1. Browse menu
2. Add items to cart
3. Customize items
4. Checkout
5. Place order
6. Track order

**Admin Flow:**
1. Login as admin
2. Create menu category
3. Add menu item
4. Configure modifiers
5. View orders
6. Update order status

**POS Flow:**
1. Login as staff
2. Create order
3. Generate gift card
4. Print receipt
5. Mark order complete

**Driver Flow:**
1. Login as driver
2. View assigned deliveries
3. Accept delivery
4. Update location
5. Mark delivered

### E2E Best Practices

1. **Use Data Test IDs:**
   ```tsx
   <button data-testid="add-to-cart">Add to Cart</button>
   ```

2. **Wait for Elements:**
   ```typescript
   await page.waitForSelector('[data-testid="order-confirmed"]')
   ```

3. **Use Fixtures:**
   ```typescript
   test('order flow', async ({ page, user }) => {
     await page.goto('/')
     // Use fixture user
   })
   ```

4. **Clean Up:**
   ```typescript
   afterEach(async () => {
     // Clean up test data
   })
   ```

---

## Test Data Management

### Test Fixtures

```typescript
// __tests__/fixtures/orders.ts
export const mockOrder = {
  id: 'order_123',
  orderNumber: 'ORD-2025-001',
  status: 'PENDING',
  items: [...]
}

export const mockOrderItems = [...]
```

### Database Seeding for Tests

```typescript
// __tests__/setup.ts
beforeAll(async () => {
  // Seed test database
  await seedTestDatabase()
})

afterAll(async () => {
  // Cleanup test database
  await cleanupTestDatabase()
})
```

### Mocking External Services

```typescript
// __tests__/mocks/stripe.ts
export const mockStripe = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_123',
      client_secret: 'pi_123_secret'
    })
  }
}
```

---

## Continuous Testing

### Pre-Commit Hooks

```bash
# .husky/pre-commit
npm test
npm run test:coverage
```

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - run: npm run test:e2e
```

---

## Testing Checklist

Before committing:

- [ ] All tests written for new code
- [ ] 90%+ coverage achieved
- [ ] 100% tests passing
- [ ] E2E tests for critical paths
- [ ] No flaky tests
- [ ] Tests are fast (< 5 minutes total)
- [ ] Tests are maintainable
- [ ] Mock external dependencies
- [ ] Clean up test data

---

This testing guide ensures comprehensive test coverage and quality throughout the development process.

