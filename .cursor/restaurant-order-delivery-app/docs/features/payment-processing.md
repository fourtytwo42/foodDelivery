# Payment Processing Feature

**Complete payment processing system with multiple providers.**

---

## Overview

The payment processing system supports Stripe, PayPal, Apple Pay, Google Pay, gift cards, coupons, and loyalty points.

---

## Payment Providers

### Stripe

- Credit/debit cards
- Apple Pay
- Google Pay
- Saved payment methods
- Payment intents API
- Webhooks for events

### PayPal

- PayPal account payments
- Credit/debit cards
- Saved payment methods
- Orders API
- Webhooks for events

### Gift Cards

- Custom implementation
- Card number + PIN
- Virtual and physical cards
- Balance tracking
- Transaction history

### Cash

- Cash on delivery
- Cash on pickup
- Mark as paid manually

---

## Payment Flow

1. Customer completes checkout
2. Create payment intent/order
3. Process payment
4. If successful: Confirm order
5. If failed: Retry (1-2 times)
6. If still fails: Cancel order, notify customer

---

## Features

### Payment Methods

- Credit/debit cards
- Apple Pay
- Google Pay
- Gift cards
- Loyalty points
- Cash

### Saved Payment Methods

- Save for returning customers
- Set default method
- Manage methods in account

### Payment Retry

- Automatic retry on failure
- 1-2 retry attempts
- Customer notified on failure

### Refunds

- Automatic refunds on cancellation
- Manual refunds (admin)
- Partial refunds supported

---

## Security

- PCI compliance
- No card data storage
- Payment provider tokens only
- Encrypted API keys
- Secure payment processing

---

## Database Schema

See [Database Schema](../database-schema.md) for complete schema.

Key tables:
- `payments`
- `payment_methods`
- `gift_cards`
- `gift_card_transactions`

---

## API Endpoints

See [API Specifications](../api-specifications.md) for complete API docs.

Key endpoints:
- `POST /api/v1/payments/process` - Process payment
- `POST /api/v1/payments/stripe/create-intent` - Stripe intent
- `POST /api/v1/payments/paypal/create-order` - PayPal order

---

This feature provides secure, flexible payment processing with multiple options.

