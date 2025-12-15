# Integration Guides

**Step-by-step guides for integrating external services (Stripe, PayPal, Email, Maps, etc.).**

---

## Table of Contents

1. [Stripe Integration](#stripe-integration)
2. [PayPal Integration](#paypal-integration)
3. [Email Setup (SMTP)](#email-setup-smtp)
4. [Google Maps Integration](#google-maps-integration)
5. [reCAPTCHA Setup](#recaptcha-setup)
6. [DoorDash Integration (Future)](#doordash-integration-future)

---

## Stripe Integration

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Sign up for account
3. Complete business verification

### Step 2: Get API Keys

1. Go to Dashboard → Developers → API keys
2. Copy **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy **Secret key** (starts with `sk_test_` or `sk_live_`)
4. **Important:** Never commit secret keys to Git

### Step 3: Configure Environment Variables

Add to `.env`:

```env
STRIPE_PUBLIC_KEY=pk_test_51AbCdEf...
STRIPE_SECRET_KEY=sk_test_51AbCdEf...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from webhook setup
```

### Step 4: Install Stripe Package

```bash
npm install stripe
```

### Step 5: Setup Webhook Endpoint

1. Go to Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy webhook signing secret to `.env`

### Step 6: Test Integration

```typescript
// Test payment intent creation
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000, // $10.00
  currency: 'usd'
})
```

### Step 7: Frontend Integration

```typescript
// Install Stripe.js
npm install @stripe/stripe-js

// In checkout component
import { loadStripe } from '@stripe/stripe-js'

const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!)
await stripe.confirmPayment({ clientSecret })
```

### Helpful Links

- **Documentation:** https://stripe.com/docs
- **Testing Cards:** https://stripe.com/docs/testing
- **Webhook Testing:** Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## PayPal Integration

### Step 1: Create PayPal Business Account

1. Go to https://www.paypal.com
2. Sign up for business account
3. Complete business verification

### Step 2: Create App in Developer Dashboard

1. Go to https://developer.paypal.com
2. Log in with business account
3. Go to Dashboard → My Apps & Credentials
4. Create new app
5. Copy **Client ID** and **Secret**

### Step 3: Configure Environment Variables

Add to `.env`:

```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # or "live" for production
```

### Step 4: Install PayPal SDK

```bash
npm install @paypal/checkout-server-sdk
```

### Step 5: Setup Webhook

1. Go to Developer Dashboard → Webhooks
2. Create webhook
3. URL: `https://your-domain.com/api/webhooks/paypal`
4. Select events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

### Step 6: Test Integration

Use PayPal sandbox accounts for testing.

### Helpful Links

- **Documentation:** https://developer.paypal.com/docs
- **Sandbox Testing:** https://developer.paypal.com/dashboard/accounts

---

## Email Setup (SMTP)

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable 2FA

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other"
   - Enter "Restaurant App"
   - Copy generated password

3. **Configure Environment:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SMTP_FROM=noreply@yourdomain.com
   SMTP_SECURE=false
   ```

### SendGrid Setup

1. **Create Account:** https://sendgrid.com
2. **Get API Key:**
   - Settings → API Keys
   - Create API key
   - Copy key

3. **Configure Environment:**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=your_sendgrid_api_key
   SMTP_FROM=noreply@yourdomain.com
   SMTP_SECURE=false
   ```

### Other SMTP Providers

Update SMTP settings in `.env` according to provider documentation:
- **Mailgun:** smtp.mailgun.org
- **AWS SES:** email-smtp.region.amazonaws.com
- **Custom SMTP:** Use provider's SMTP settings

---

## Google Maps Integration

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable billing (required for Maps API)

### Step 2: Enable APIs

1. Go to APIs & Services → Library
2. Enable:
   - **Maps JavaScript API** (for map display)
   - **Geocoding API** (for address to coordinates)
   - **Directions API** (for route calculation)
   - **Distance Matrix API** (for distance calculation)

### Step 3: Create API Key

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "API Key"
3. Copy API key
4. **Restrict API Key:**
   - Application restrictions: HTTP referrers
   - Add your domain
   - API restrictions: Select enabled APIs

### Step 4: Configure Environment

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Step 5: Frontend Integration

```typescript
// Install Google Maps
npm install @react-google-maps/api

// In component
import { GoogleMap, LoadScript } from '@react-google-maps/api'

<LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
  <GoogleMap
    center={{ lat: 40.7128, lng: -74.0060 }}
    zoom={13}
  />
</LoadScript>
```

### Helpful Links

- **Documentation:** https://developers.google.com/maps/documentation
- **Pricing:** https://mapsplatform.google.com/pricing

---

## reCAPTCHA Setup

### Step 1: Register Site

1. Go to https://www.google.com/recaptcha/admin
2. Click "+" to add new site
3. **Label:** Restaurant App
4. **reCAPTCHA type:** reCAPTCHA v2 → "I'm not a robot" Checkbox
5. **Domains:** Add your domain
6. Accept terms
7. Submit

### Step 2: Get Keys

1. Copy **Site Key** (public)
2. Copy **Secret Key** (private)

### Step 3: Configure Environment

```env
RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
ENABLE_RECAPTCHA=true
```

### Step 4: Frontend Integration

```typescript
// Install reCAPTCHA
npm install react-google-recaptcha

// In component
import ReCAPTCHA from 'react-google-recaptcha'

<ReCAPTCHA
  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
  onChange={handleCaptchaChange}
/>
```

### Step 5: Backend Verification

```typescript
// Verify captcha
const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
  method: 'POST',
  body: new URLSearchParams({
    secret: process.env.RECAPTCHA_SECRET_KEY!,
    response: captchaToken
  })
})

const data = await response.json()
if (!data.success) {
  throw new Error('reCAPTCHA verification failed')
}
```

---

## DoorDash Integration (Future)

### Overview

DoorDash Drive API allows restaurants to dispatch deliveries through DoorDash without orders coming from DoorDash platform.

### Research Needed

- **API Documentation:** Research DoorDash Drive API
- **Authentication:** OAuth or API key
- **Delivery Creation:** How to create delivery requests
- **Status Tracking:** How to track delivery status
- **Pricing:** Delivery fee structure

### Implementation Plan

1. **Research Phase:**
   - Review DoorDash Drive API documentation
   - Understand authentication flow
   - Identify required endpoints

2. **Integration Phase:**
   - Create DoorDash service
   - Implement delivery creation
   - Implement status tracking
   - Handle webhooks (if available)

3. **Configuration:**
   - Add DoorDash credentials to admin settings
   - Configure delivery zones mapping
   - Setup webhook endpoint

### Placeholder Implementation

```typescript
// services/doordash-service.ts
// TODO: Implement DoorDash Drive API integration

export class DoorDashService {
  async createDelivery(order: Order): Promise<DeliveryResponse> {
    // TODO: Implement DoorDash delivery creation
    throw new Error('DoorDash integration not yet implemented')
  }

  async trackDelivery(deliveryId: string): Promise<DeliveryStatus> {
    // TODO: Implement delivery tracking
    throw new Error('DoorDash integration not yet implemented')
  }
}
```

### Resources

- **DoorDash Drive:** https://developer.doordash.com/drive/
- **API Documentation:** Research required
- **Support:** Contact DoorDash for API access

---

## Integration Testing

### Test Each Integration

1. **Stripe:**
   - Test payment with test cards
   - Verify webhook handling
   - Test refunds

2. **PayPal:**
   - Test with sandbox accounts
   - Verify order creation
   - Test refunds

3. **Email:**
   - Send test emails
   - Verify delivery
   - Check spam folder

4. **Maps:**
   - Test geocoding
   - Test distance calculation
   - Verify map display

5. **reCAPTCHA:**
   - Test validation
   - Verify blocking invalid submissions

---

These integration guides provide step-by-step instructions for setting up all external services.

