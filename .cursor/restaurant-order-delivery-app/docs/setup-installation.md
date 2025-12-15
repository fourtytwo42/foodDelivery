# Setup & Installation Guide

**Complete setup and installation instructions for the Restaurant Order & Delivery App.**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [Application Installation](#application-installation)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running Migrations](#running-migrations)
7. [Seeding Demo Data](#seeding-demo-data)
8. [Starting the Application](#starting-the-application)
9. [SSL/HTTPS Setup](#sslhttps-setup)
10. [Post-Installation Configuration](#post-installation-configuration)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Operating System:** Ubuntu 22.04 LTS (recommended) or similar Linux distribution
- **CPU:** 2+ cores (4+ recommended)
- **RAM:** 4GB minimum (8GB+ recommended)
- **Storage:** 50GB+ (SSD recommended)
- **Network:** Public IP or Cloudflare tunnel setup

### Software Requirements

- **Node.js:** 20.x LTS or higher
- **PostgreSQL:** 15+ 
- **Git:** Latest version
- **Nginx:** For reverse proxy (optional but recommended)
- **PM2:** For process management
- **Redis:** Optional, for job queue (can use in-memory queue instead)

---

## Initial Server Setup

### 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js 20 LTS

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 3. Install PostgreSQL 15+

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### 4. Create PostgreSQL Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE restaurant_app;
CREATE USER restaurant_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE restaurant_app TO restaurant_user;
\q
```

### 5. Install Nginx (Optional but Recommended)

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Install PM2

```bash
sudo npm install -g pm2
```

### 7. Install Redis (Optional)

```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## Application Installation

### 1. Clone Repository

```bash
# Navigate to desired directory
cd /opt  # or /var/www or your preferred location

# Clone repository
git clone <repository-url> restaurant-app
cd restaurant-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Application

```bash
npm run build
```

---

## Database Setup

### 1. Configure Database Connection

Edit `.env` file (see [Environment Configuration](#environment-configuration)):

```env
DATABASE_URL="postgresql://restaurant_user:your_secure_password@localhost:5432/restaurant_app?schema=public"
```

### 2. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
# Or for development:
npx prisma migrate dev
```

### 3. Verify Database Schema

```bash
# Open Prisma Studio to verify
npx prisma studio
```

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Edit Environment Variables

Open `.env` file and configure:

```env
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://restaurant_user:password@localhost:5432/restaurant_app?schema=public"

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=3d

# Stripe (Get from https://dashboard.stripe.com/apikeys)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (Get from https://developer.paypal.com)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or "live" for production

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@yourdomain.com

# Google Maps (Get from https://console.cloud.google.com)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# reCAPTCHA (Optional, get from https://www.google.com/recaptcha/admin)
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# File Storage
UPLOAD_DIR=/opt/restaurant-app/storage
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Demo Mode
DEMO_MODE=true
SETUP_WIZARD_ENABLED=false

# Features
ENABLE_EMAIL_VERIFICATION=false
ENABLE_RECAPTCHA=false
```

### 3. Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate other secrets as needed
```

See [Environment Variables](environment-variables.md) for complete documentation.

---

## Running Migrations

### Development

```bash
# Create and apply migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Production

```bash
# Apply pending migrations
npx prisma migrate deploy

# Never use `migrate dev` in production
```

---

## Seeding Demo Data

### 1. Run Seed Script

```bash
npm run db:seed
```

This will create:
- Demo user accounts (admin, manager, staff, driver, customer)
- Demo menu categories and items
- Demo modifiers and options
- Demo restaurant settings
- Demo delivery zones

### 2. Reset Database (for daily reset via cron)

Create reset script: `scripts/reset-demo.sh`

```bash
#!/bin/bash
cd /opt/restaurant-app
npm run db:reset
npm run db:seed
```

Make executable:
```bash
chmod +x scripts/reset-demo.sh
```

### 3. Setup Daily Reset Cron Job

```bash
# Edit crontab
crontab -e

# Add line to reset at 2 AM daily
0 2 * * * /opt/restaurant-app/scripts/reset-demo.sh >> /var/log/restaurant-reset.log 2>&1
```

---

## Starting the Application

### Development Mode

```bash
npm run dev
```

Application will be available at `http://localhost:3000`

### Production Mode with PM2

```bash
# Start application
pm2 start npm --name "restaurant-app" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided
```

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs restaurant-app

# Restart
pm2 restart restaurant-app

# Stop
pm2 stop restaurant-app

# Monitor
pm2 monit
```

---

## SSL/HTTPS Setup

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Configure Nginx

Create Nginx configuration: `/etc/nginx/sites-available/restaurant-app`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /api/ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/restaurant-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically configure Nginx for HTTPS.

### 4. Auto-Renewal

Certbot sets up auto-renewal automatically. Verify:

```bash
sudo certbot renew --dry-run
```

---

## Post-Installation Configuration

### 1. Update Environment Variables

Update `NEXT_PUBLIC_APP_URL` in `.env`:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Restart application:
```bash
pm2 restart restaurant-app
```

### 2. Configure Restaurant Settings

1. Log in as admin (demo account or your account)
2. Navigate to `/admin/settings`
3. Configure:
   - Restaurant name, address, phone, email
   - Business hours
   - Tax rate
   - Delivery zones
   - Payment providers (Stripe, PayPal)
   - Email settings

### 3. Setup Payment Providers

#### Stripe

1. Create account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Add keys to `.env`:
   ```env
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
4. Setup webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
5. Get webhook secret and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

#### PayPal

1. Create account at https://www.paypal.com
2. Go to Developer Dashboard
3. Create app and get credentials
4. Add to `.env`:
   ```env
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   PAYPAL_MODE=live
   ```

### 4. Configure Email

#### Gmail SMTP

1. Enable 2-factor authentication
2. Generate app password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SMTP_FROM=noreply@yourdomain.com
   ```

#### Other SMTP Providers

Update SMTP settings in `.env` according to your provider's documentation.

### 5. Configure Google Maps

1. Go to https://console.cloud.google.com
2. Create project or select existing
3. Enable Maps JavaScript API and Geocoding API
4. Create API key
5. Add to `.env`:
   ```env
   GOOGLE_MAPS_API_KEY=your_api_key
   ```

### 6. Setup reCAPTCHA (Optional)

1. Go to https://www.google.com/recaptcha/admin
2. Register new site (reCAPTCHA v2)
3. Get site key and secret key
4. Add to `.env`:
   ```env
   RECAPTCHA_SITE_KEY=...
   RECAPTCHA_SECRET_KEY=...
   ENABLE_RECAPTCHA=true
   ```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U restaurant_user -d restaurant_app -h localhost

# Check connection string in .env
# Verify DATABASE_URL format
```

### Application Won't Start

```bash
# Check logs
pm2 logs restaurant-app

# Check if port is in use
sudo lsof -i :3000

# Verify environment variables
cat .env

# Check Node.js version
node --version
```

### Migration Issues

```bash
# Reset migrations (WARNING: Deletes data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Manually apply migrations
npx prisma migrate deploy
```

### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/restaurant-app
chmod -R 755 /opt/restaurant-app/storage
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check auto-renewal
sudo systemctl status certbot.timer
```

---

## Setup Script

A complete setup script is provided: `scripts/setup.sh`

**Usage:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The script will:
1. Update system packages
2. Install Node.js, PostgreSQL, Nginx, PM2
3. Create database and user
4. Clone repository (if not already cloned)
5. Install dependencies
6. Setup environment variables (interactive)
7. Run migrations
8. Seed demo data
9. Configure Nginx
10. Setup SSL (if domain provided)
11. Start application with PM2

**Note:** Review the script before running and customize as needed.

---

## Next Steps

After installation:

1. **Configure Restaurant Settings:** Log in as admin and complete setup
2. **Test Payment Processing:** Place test orders with Stripe/PayPal test mode
3. **Configure Delivery Zones:** Set up delivery zones and fees
4. **Add Menu Items:** Create categories and menu items
5. **Test Order Flow:** Place test orders end-to-end
6. **Setup Monitoring:** Configure PM2 monitoring and alerts
7. **Backup Strategy:** Setup database backups (see [Deployment Guide](deployment-guide.md))

See [Development Guide](development-guide.md) for development workflow and [Deployment Guide](deployment-guide.md) for production deployment details.

