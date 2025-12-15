# Decisions & Patterns

**Key architectural decisions, design patterns, and conventions established during design and development.**

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Design Patterns](#design-patterns)
3. [Business Logic Decisions](#business-logic-decisions)
4. [Technical Decisions](#technical-decisions)
5. [Security Decisions](#security-decisions)
6. [Data Management Decisions](#data-management-decisions)
7. [User Experience Decisions](#user-experience-decisions)
8. [Development Patterns](#development-patterns)
9. [Deployment Patterns](#deployment-patterns)

---

## Architecture Decisions

### AD-001: Single-Tenant Architecture

**Decision:** One restaurant per database instance (single-tenant, not multi-tenant)

**Rationale:**
- Simpler data isolation (no need for tenant filtering)
- Better performance (no tenant queries)
- Easier to scale (deploy multiple instances)
- Lower security risk (complete isolation)
- Easier for restaurant owners to self-host

**Implementation:**
- Each restaurant gets own VPS instance
- Separate PostgreSQL database per instance
- Can scale horizontally with multiple VMs
- Cloudflare tunnels for subdomain routing (optional)

**Alternatives Considered:**
- Multi-tenant SaaS (rejected - more complex, security concerns)
- Shared database with tenant isolation (rejected - performance and complexity)

---

### AD-002: Next.js 16 (Latest Version)

**Decision:** Use Next.js 16.x (latest available) instead of Next.js 15

**Rationale:**
- Always use latest stable technology
- Better performance and features
- Future-proof
- Access to latest React features

**Implementation:**
- Check for Next.js 16 availability
- Fallback to Next.js 15 if 16 not available
- Use App Router (not Pages Router)

---

### AD-003: PostgreSQL on Same VM

**Decision:** Run PostgreSQL on the same VM as the Node.js application

**Rationale:**
- Simpler deployment (one VM to manage)
- Lower latency (no network calls)
- Cost-effective (no separate database server)
- Sufficient for single restaurant scale

**Alternatives Considered:**
- Separate database server (rejected - overkill for single restaurant)
- Managed database (rejected - adds cost and complexity)
- SQLite (rejected - not suitable for production scale)

---

### AD-004: Self-Hostable Design

**Decision:** Application designed to be self-hostable by restaurant owners

**Rationale:**
- Restaurant owners can host on their own VPS
- No monthly SaaS fees
- Full control over data
- One-time purchase model

**Implementation:**
- Complete setup scripts
- Comprehensive documentation
- Simple installation process
- Can be managed by non-technical users (with setup help)

---

### AD-005: Horizontal Scaling Strategy

**Decision:** Scale by deploying multiple instances, not by scaling single instance

**Rationale:**
- Each restaurant is independent
- Easier to manage (isolated instances)
- Can use Cloudflare tunnels for subdomains
- Can add load balancer if needed

**Implementation:**
- One instance per restaurant
- Cloudflare tunnels for subdomain routing
- Optional load balancer for high-traffic restaurants
- Each instance has own database

---

## Design Patterns

### DP-001: DoorDash-Inspired UI/UX

**Decision:** Match DoorDash's interface design and user experience

**Rationale:**
- DoorDash is well-known and proven
- Users are familiar with the interface
- Reduces learning curve
- Professional, modern design

**Implementation:**
- Similar checkout flow
- Similar menu browsing
- Similar order tracking
- Similar search and filtering
- Mobile-first responsive design

---

### DP-002: Test-Driven Development (TDD)

**Decision:** Write tests first, then implement features

**Rationale:**
- Ensures code quality
- Catches bugs early
- Documents expected behavior
- Enables refactoring with confidence

**Implementation:**
- Write tests for each milestone
- Achieve 90%+ coverage
- 100% pass rate required
- Test-as-you-go methodology

---

### DP-003: Milestone-Based Development

**Decision:** Break development into 10 distinct milestones

**Rationale:**
- Clear progress tracking
- Testable deliverables
- Easier project management
- Natural checkpoints

**Implementation:**
- Each milestone is complete, testable feature set
- Tests must pass before moving forward
- Coverage must be 90%+ per milestone
- All tests must pass (100%)

---

### DP-004: "Everything Optional But Functional"

**Decision:** All features are optional but must work when enabled

**Rationale:**
- Maximum flexibility for restaurant owners
- Can enable/disable features as needed
- No forced features
- Easy to configure

**Implementation:**
- Feature flags in environment variables
- Admin panel toggles
- Defaults set appropriately
- All optional features fully functional when enabled

**Examples:**
- Email verification (optional, default off)
- reCAPTCHA (optional, default off)
- SMS notifications (optional, default off)
- Loyalty points (optional, default off)
- Dietary tags (optional)
- Allergen info (optional)

---

## Business Logic Decisions

### BL-001: Demo Mode by Default

**Decision:** Application runs in demo mode by default (ENV configurable)

**Rationale:**
- Allows public demo without real orders
- Easy to reset for testing
- Safe for showcasing
- Can be disabled for production

**Implementation:**
- `DEMO_MODE=true` in .env (default)
- Demo menu with gag items
- Demo accounts pre-seeded
- Daily reset via cron job
- Can disable via ENV

---

### BL-002: Setup Wizard Disabled by Default

**Decision:** Setup wizard disabled by default, enabled via ENV

**Rationale:**
- Demo mode doesn't need setup
- Can enable for first-time setup
- Flexible configuration

**Implementation:**
- `SETUP_WIZARD_ENABLED=false` in .env (default)
- Can enable for initial setup
- Guides restaurant owner through configuration

---

### BL-003: Daily Database Reset

**Decision:** Reset demo database daily via cron job

**Rationale:**
- Keeps demo fresh
- Allows public testing
- Resets orders, maintains demo accounts
- Safe for public-facing demo

**Implementation:**
- Cron job runs reset script daily
- Resets orders and demo data
- Maintains demo accounts
- Logs reset actions

---

### BL-004: Customer Cannot Cancel Orders

**Decision:** Customers cannot cancel orders once placed (must call restaurant)

**Rationale:**
- Prevents abuse
- Ensures restaurant control
- Reduces order management complexity
- Standard restaurant practice

**Implementation:**
- No cancel button for customers
- Staff can cancel orders
- Automatic refund on staff cancellation
- Customer notified of cancellation

---

### BL-005: Automatic Refunds on Cancellation

**Decision:** Automatically refund payments when staff cancels order

**Rationale:**
- Fair to customers
- Automatic process (no manual steps)
- Handled by payment provider
- Customer notified

**Implementation:**
- When staff cancels paid order
- Trigger refund via payment provider
- Update order status to REFUNDED
- Notify customer via email/browser

---

### BL-006: Payment Retry Logic

**Decision:** Retry failed payments 1-2 times before canceling order

**Rationale:**
- Network issues may cause temporary failures
- Gives payment a chance to succeed
- Better user experience
- Prevents unnecessary order cancellations

**Implementation:**
- First attempt
- If fails, retry once
- If still fails, retry once more (total 2 retries)
- If all fail, cancel order and notify customer

---

### BL-007: Dynamic Delivery Time Estimation

**Decision:** Estimated delivery time based on current order queue

**Rationale:**
- More accurate estimates
- Accounts for restaurant busyness
- Better customer expectations
- Realistic delivery times

**Implementation:**
- Count active orders in queue
- Calculate based on:
  - Number of orders ahead
  - Average preparation time
  - Delivery distance
  - Driver availability
- Update estimate as queue changes

---

### BL-008: Multiple Delivery Zones

**Decision:** Support multiple delivery zones with different fees

**Rationale:**
- Flexible pricing
- Can offer free delivery for close orders
- Tiered pricing by distance
- Restaurant owner control

**Implementation:**
- Admin configures zones
- Each zone has radius and fee
- System calculates which zone applies
- Can set free delivery threshold per zone

---

## Technical Decisions

### TD-001: No AI Features (Removed from Scope)

**Decision:** Remove AI-powered setup and configuration features

**Rationale:**
- Simplifies initial implementation
- Reduces complexity
- Can add later if needed
- Focus on core functionality

**Implementation:**
- No OpenAI integration for setup
- No AI tool calling for configuration
- Traditional forms and wizards
- Can add AI features in future

---

### TD-002: Stripe and PayPal Only (For Now)

**Decision:** Support only Stripe and PayPal initially

**Rationale:**
- Covers majority of payment methods
- Apple Pay/Google Pay via Stripe/PayPal
- Simpler to implement
- Can add more providers later

**Implementation:**
- Stripe integration (primary)
- PayPal integration (secondary)
- Apple Pay via Stripe
- Google Pay via Stripe/PayPal
- Can add more providers in future

---

### TD-003: WebSocket for Real-Time Updates

**Decision:** Use WebSocket (ws library) for real-time order updates

**Rationale:**
- Low latency
- Efficient (persistent connection)
- Good for order status updates
- Standard approach

**Implementation:**
- WebSocket server using `ws` library
- Authenticated connections (JWT)
- Room-based messaging
- Fallback to polling if WebSocket unavailable

---

### TD-004: PWA Support

**Decision:** Make application installable as PWA

**Rationale:**
- App-like experience on mobile
- Can install on home screen
- Push notifications support
- Offline support (future)

**Implementation:**
- Next.js PWA plugin
- Service worker
- Manifest file
- Install prompt

---

### TD-005: Mobile-First Responsive Design

**Decision:** Design mobile-first, ensure desktop works well

**Rationale:**
- Most customers order on mobile
- Mobile is primary use case
- Desktop still important (admin, POS)
- Responsive by default

**Implementation:**
- Mobile-first CSS
- Touch-friendly buttons (44x44px minimum)
- Responsive layouts
- Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)

---

## Security Decisions

### SD-001: PCI Compliance - No Card Storage

**Decision:** Never store card data, use payment provider tokens only

**Rationale:**
- PCI compliance requirement
- Reduces security risk
- Payment providers handle security
- Industry best practice

**Implementation:**
- Store payment provider tokens only
- No card numbers, CVV, expiration
- Use Stripe/PayPal payment methods
- Encrypt API keys at rest

---

### SD-002: Encrypted API Keys

**Decision:** Encrypt API keys in database

**Rationale:**
- Security best practice
- Protects sensitive credentials
- Defense in depth
- Required for compliance

**Implementation:**
- Encrypt API keys before storing
- Decrypt when needed
- Use strong encryption (AES-256)
- Secure key management

---

### SD-003: JWT Authentication

**Decision:** Use JWT tokens for authentication

**Rationale:**
- Stateless (no server-side sessions)
- Scalable
- Standard approach
- Works well with Next.js

**Implementation:**
- JWT tokens with 3-day expiration
- Refresh token mechanism
- HTTP-only cookies (optional)
- Secure token storage

---

### SD-004: Role-Based Access Control (RBAC)

**Decision:** Implement role-based permissions

**Rationale:**
- Clear permission model
- Easy to understand
- Flexible (can add roles)
- Secure by default

**Implementation:**
- Roles: Admin, Manager, Staff, Driver, Customer
- Permissions per role
- Middleware checks permissions
- Database-level constraints

---

## Data Management Decisions

### DM-001: Full Audit Trail

**Decision:** Track all critical actions in audit logs

**Rationale:**
- Compliance requirements
- Debugging and troubleshooting
- Security monitoring
- Business analytics

**Implementation:**
- AuditLog table for all actions
- Track: user, action, entity, changes, IP, timestamp
- Exportable audit logs
- Immutable logs (no updates/deletes)

---

### DM-002: Soft Deletes for Important Records

**Decision:** Use soft deletes (deletedAt) for important records

**Rationale:**
- Preserve data for analytics
- Can recover if needed
- Maintain referential integrity
- Audit trail preservation

**Implementation:**
- `deletedAt` timestamp field
- Filter deleted records in queries
- Can restore if needed
- Permanent delete option (admin only)

---

### DM-003: Everything Trackable

**Decision:** All business data should be trackable and auditable

**Rationale:**
- Business intelligence
- Compliance
- Debugging
- Analytics

**Implementation:**
- Audit logs for all actions
- Transaction history (gift cards, payments)
- Order history
- User activity tracking
- Exportable data

---

### DM-004: Exportable Analytics

**Decision:** All analytics should be exportable (CSV, PDF)

**Rationale:**
- Business reporting
- External analysis
- Record keeping
- Compliance

**Implementation:**
- CSV export for data analysis
- PDF export for reports
- Date range filtering
- All metrics exportable

---

## User Experience Decisions

### UX-001: Demo Accounts with Auto-Fill

**Decision:** Display demo account buttons on login page with auto-fill

**Rationale:**
- Easy to test different roles
- No need to remember credentials
- Quick access to demo
- Better demo experience

**Implementation:**
- Buttons on login page
- Auto-fill email and password
- One click to login
- Different accounts for each role

---

### UX-002: Guest Checkout

**Decision:** Allow customers to checkout without creating account

**Rationale:**
- Reduces friction
- Faster checkout
- More conversions
- Standard practice

**Implementation:**
- Guest checkout option
- Email for order tracking
- Can create account later
- Order tracking via link

---

### UX-003: Real-Time Order Tracking

**Decision:** Show real-time order status updates to customers

**Rationale:**
- Better customer experience
- Reduces support inquiries
- Transparency
- Industry standard

**Implementation:**
- WebSocket updates
- Status timeline
- Estimated delivery time
- Driver tracking (if delivery)

---

### UX-004: Touch-Optimized POS

**Decision:** POS interface optimized for touch screens

**Rationale:**
- Restaurant staff use tablets
- Faster order entry
- Better user experience
- Industry standard

**Implementation:**
- Large touch targets (44x44px minimum)
- Touch-friendly buttons
- Swipe gestures
- Optimized for tablets

---

### UX-005: Mobile-Optimized Driver App

**Decision:** Driver interface optimized for mobile devices

**Rationale:**
- Drivers use phones
- GPS tracking on mobile
- Native map integration
- Better UX on mobile

**Implementation:**
- Mobile-first design
- Large buttons
- GPS integration
- Native map apps

---

## Development Patterns

### DEV-001: Test Coverage Target

**Decision:** 90%+ test coverage, 100% pass rate

**Rationale:**
- High quality code
- Catch bugs early
- Confidence in changes
- Industry standard

**Implementation:**
- Unit tests for all functions
- Integration tests for APIs
- E2E tests for critical paths
- Coverage reports
- All tests must pass

---

### DEV-002: Test-as-You-Go

**Decision:** Test each milestone before moving forward

**Rationale:**
- Prevents accumulation of bugs
- Easier to fix issues early
- Clear progress tracking
- Better code quality

**Implementation:**
- Write tests for milestone
- Implement features
- Achieve 90%+ coverage
- Ensure 100% pass rate
- Commit and push
- Move to next milestone

---

### DEV-003: TypeScript Strict Mode

**Decision:** Use TypeScript with strict mode enabled

**Rationale:**
- Type safety
- Catch errors at compile time
- Better IDE support
- Industry standard

**Implementation:**
- Strict TypeScript configuration
- No `any` types
- Proper type definitions
- Type-safe code throughout

---

### DEV-004: Component-Based Architecture

**Decision:** Build UI with reusable components

**Rationale:**
- Code reusability
- Consistency
- Easier maintenance
- Faster development

**Implementation:**
- Base UI components
- Feature-specific components
- Composable patterns
- Component library

---

## Deployment Patterns

### DEP-001: Automated Setup Script

**Decision:** Provide automated setup script for initial installation

**Rationale:**
- Easier installation
- Consistent setup
- Less manual work
- Fewer errors

**Implementation:**
- `scripts/setup.sh` script
- Installs all dependencies
- Creates database
- Generates secrets
- Creates .env template

---

### DEP-002: Environment-Based Configuration

**Decision:** All configuration via environment variables

**Rationale:**
- Easy to configure
- No code changes needed
- Secure (no secrets in code)
- Flexible

**Implementation:**
- `.env` file for configuration
- `.env.example` as template
- All settings in ENV
- Documentation for all variables

---

### DEP-003: PM2 Process Management

**Decision:** Use PM2 for process management

**Rationale:**
- Auto-restart on crash
- Log management
- Resource monitoring
- Production-ready

**Implementation:**
- PM2 for Node.js processes
- Auto-restart enabled
- Log rotation
- Resource monitoring
- Startup on boot

---

### DEP-004: Nginx Reverse Proxy

**Decision:** Use Nginx as reverse proxy

**Rationale:**
- SSL termination
- Static file serving
- Rate limiting
- WebSocket support

**Implementation:**
- Nginx configuration
- SSL/TLS termination
- Proxy to Next.js
- WebSocket support
- Static file caching

---

## Pattern Summary

### Code Organization

- **File Structure:** Feature-based organization
- **Naming:** kebab-case files, PascalCase components, camelCase functions
- **Imports:** Absolute imports with `@/` alias
- **Exports:** Named exports preferred

### Error Handling

- **Pattern:** Try-catch with specific error types
- **Response:** Consistent error format
- **Logging:** Log errors with context
- **User Messages:** Clear, helpful error messages

### State Management

- **Client State:** Zustand stores
- **Server State:** React Server Components
- **Form State:** React Hook Form
- **Cache:** React Query (optional)

### API Design

- **RESTful:** Standard REST patterns
- **Versioning:** `/api/v1/` prefix
- **Response Format:** Consistent JSON structure
- **Error Codes:** Standardized error codes

### Database Patterns

- **ORM:** Prisma for type safety
- **Migrations:** Prisma Migrate
- **Seeding:** TypeScript seed script
- **Queries:** Optimized with indexes

---

## Decision Log

### Decisions Made

1. ✅ Single-tenant architecture
2. ✅ Next.js 16 (latest)
3. ✅ PostgreSQL on same VM
4. ✅ Self-hostable design
5. ✅ No AI features (removed)
6. ✅ Stripe and PayPal only
7. ✅ Demo mode by default
8. ✅ Customer cannot cancel orders
9. ✅ Automatic refunds
10. ✅ Payment retry logic
11. ✅ Dynamic delivery time
12. ✅ Multiple delivery zones
13. ✅ Full audit trail
14. ✅ Soft deletes
15. ✅ Test-driven development
16. ✅ 90% coverage, 100% pass rate

### Decisions Pending

- [ ] DoorDash API integration (research needed)
- [ ] Additional payment providers (future)
- [ ] Multi-language support (future)
- [ ] Advanced analytics features (future)

---

This document captures all key decisions and patterns established during the design phase. Refer to this when implementing features to maintain consistency.

