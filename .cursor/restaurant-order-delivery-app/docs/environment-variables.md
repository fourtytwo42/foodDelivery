# Environment Variables

**Complete reference for all environment variables.**

---

## Overview

All environment variables are defined in `.env` file. Copy `.env.example` to `.env` and configure.

---

## Application Variables

### `NODE_ENV`
- **Type:** `string`
- **Values:** `development` | `production` | `test`
- **Default:** `development`
- **Description:** Node.js environment

### `PORT`
- **Type:** `number`
- **Default:** `3000`
- **Description:** Port for Next.js server

### `NEXT_PUBLIC_APP_URL`
- **Type:** `string`
- **Example:** `https://your-domain.com`
- **Description:** Public URL of application (used for email links, etc.)

---

## Database Variables

### `DATABASE_URL`
- **Type:** `string`
- **Format:** `postgresql://user:password@host:port/database?schema=public`
- **Example:** `postgresql://restaurant_user:password@localhost:5432/restaurant_app?schema=public`
- **Description:** PostgreSQL connection string
- **Required:** Yes

---

## Authentication Variables

### `JWT_SECRET`
- **Type:** `string`
- **Description:** Secret key for JWT token signing
- **Required:** Yes
- **Generate:** `openssl rand -base64 32`

### `JWT_EXPIRES_IN`
- **Type:** `string`
- **Default:** `3d`
- **Description:** JWT token expiration time
- **Format:** `1d`, `7d`, `1h`, etc.

---

## Payment Provider Variables

### Stripe

#### `STRIPE_PUBLIC_KEY`
- **Type:** `string`
- **Format:** `pk_test_...` or `pk_live_...`
- **Description:** Stripe publishable key
- **Get from:** https://dashboard.stripe.com/apikeys

#### `STRIPE_SECRET_KEY`
- **Type:** `string`
- **Format:** `sk_test_...` or `sk_live_...`
- **Description:** Stripe secret key
- **Get from:** https://dashboard.stripe.com/apikeys

#### `STRIPE_WEBHOOK_SECRET`
- **Type:** `string`
- **Format:** `whsec_...`
- **Description:** Stripe webhook signing secret
- **Get from:** Stripe Dashboard → Webhooks

### PayPal

#### `PAYPAL_CLIENT_ID`
- **Type:** `string`
- **Description:** PayPal client ID
- **Get from:** https://developer.paypal.com

#### `PAYPAL_CLIENT_SECRET`
- **Type:** `string`
- **Description:** PayPal client secret
- **Get from:** https://developer.paypal.com

#### `PAYPAL_MODE`
- **Type:** `string`
- **Values:** `sandbox` | `live`
- **Default:** `sandbox`
- **Description:** PayPal API mode

---

## Email Variables

### `SMTP_HOST`
- **Type:** `string`
- **Example:** `smtp.gmail.com`
- **Description:** SMTP server hostname

### `SMTP_PORT`
- **Type:** `number`
- **Default:** `587`
- **Description:** SMTP server port

### `SMTP_USER`
- **Type:** `string`
- **Example:** `your_email@gmail.com`
- **Description:** SMTP username

### `SMTP_PASSWORD`
- **Type:** `string`
- **Description:** SMTP password or app password

### `SMTP_FROM`
- **Type:** `string`
- **Example:** `noreply@yourdomain.com`
- **Description:** From email address

### `SMTP_SECURE`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Use TLS/SSL

---

## Google Services Variables

### `GOOGLE_MAPS_API_KEY`
- **Type:** `string`
- **Description:** Google Maps API key
- **Get from:** https://console.cloud.google.com
- **Required for:** Delivery driver GPS features

---

## reCAPTCHA Variables

### `RECAPTCHA_SITE_KEY`
- **Type:** `string`
- **Description:** reCAPTCHA site key
- **Get from:** https://www.google.com/recaptcha/admin
- **Optional:** Default off

### `RECAPTCHA_SECRET_KEY`
- **Type:** `string`
- **Description:** reCAPTCHA secret key
- **Get from:** https://www.google.com/recaptcha/admin
- **Optional:** Default off

### `ENABLE_RECAPTCHA`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enable reCAPTCHA validation

---

## Redis Variables (Optional)

### `REDIS_URL`
- **Type:** `string`
- **Example:** `redis://localhost:6379`
- **Description:** Redis connection URL
- **Optional:** For job queue (can use in-memory queue)

---

## File Storage Variables

### `UPLOAD_DIR`
- **Type:** `string`
- **Default:** `./storage`
- **Description:** Directory for file uploads

### `MAX_FILE_SIZE`
- **Type:** `number`
- **Default:** `10485760` (10MB)
- **Description:** Maximum file size in bytes

---

## Feature Flags

### `DEMO_MODE`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enable demo mode (demo menu, demo accounts)

### `SETUP_WIZARD_ENABLED`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enable setup wizard for first-time setup

### `ENABLE_EMAIL_VERIFICATION`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Require email verification for registration

---

## Example `.env` File

```env
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://restaurant_user:password@localhost:5432/restaurant_app?schema=public

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=3d

# Stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=live

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@yourdomain.com
SMTP_SECURE=false

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# reCAPTCHA (Optional)
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
ENABLE_RECAPTCHA=false

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# File Storage
UPLOAD_DIR=/opt/restaurant-app/storage
MAX_FILE_SIZE=10485760

# Feature Flags
DEMO_MODE=true
SETUP_WIZARD_ENABLED=false
ENABLE_EMAIL_VERIFICATION=false
```

---

## Security Notes

- **Never commit `.env` file to Git**
- **Use strong, unique secrets**
- **Rotate secrets regularly**
- **Use different keys for development/production**
- **Store production secrets securely**

---

This environment variables reference provides complete configuration for the restaurant ordering system.

