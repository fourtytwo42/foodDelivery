# Deployment Guide

**Complete production deployment guide for the Restaurant Order & Delivery App.**

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Production Build](#production-build)
4. [Database Migration](#database-migration)
5. [PM2 Configuration](#pm2-configuration)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [Monitoring Setup](#monitoring-setup)
9. [Backup Strategy](#backup-strategy)
10. [Scaling Considerations](#scaling-considerations)
11. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

### Deployment Architecture

- **Application:** Next.js app on Node.js
- **Database:** PostgreSQL on same VM
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt
- **File Storage:** Local filesystem

### Deployment Options

1. **Single Instance:** One restaurant per VPS
2. **Multiple Instances:** Multiple VPS with Cloudflare tunnels for subdomains
3. **Load Balanced:** Multiple instances behind load balancer

---

## Pre-Deployment Checklist

- [ ] All tests passing (90%+ coverage, 100% pass rate)
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Payment providers configured (live mode)
- [ ] Email service configured
- [ ] Google Maps API key configured
- [ ] File storage directory created
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Documentation reviewed

---

## Production Build

### 1. Build Application

```bash
# Install dependencies
npm install --production

# Build application
npm run build
```

### 2. Verify Build

```bash
# Check build output
ls -la .next

# Test production build locally
npm run start
```

### 3. Optimize Assets

- Images optimized
- Bundle size minimized
- Static assets cached

---

## Database Migration

### 1. Backup Existing Database (if upgrading)

```bash
# Create backup
pg_dump -U restaurant_user restaurant_app > backup_$(date +%Y%m%d).sql
```

### 2. Run Migrations

```bash
# Apply migrations (production)
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### 3. Verify Database

```bash
# Check database connection
psql -U restaurant_user -d restaurant_app -c "SELECT COUNT(*) FROM users;"
```

---

## PM2 Configuration

### 1. Create PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'restaurant-app',
    script: 'npm',
    args: 'start',
    cwd: '/opt/restaurant-app',
    instances: 1, // Or 'max' for cluster mode
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/restaurant-app/error.log',
    out_file: '/var/log/restaurant-app/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

### 2. Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow instructions provided
```

### 3. PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs restaurant-app

# Monitor resources
pm2 monit

# Restart application
pm2 restart restaurant-app
```

---

## Nginx Configuration

### 1. Create Nginx Config

Create `/etc/nginx/sites-available/restaurant-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Proxy to Next.js
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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
        proxy_read_timeout 86400;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # File upload size limit
    client_max_body_size 10M;
}
```

### 2. Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/restaurant-app /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL/HTTPS Setup

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically configure Nginx.

### 3. Auto-Renewal

Certbot sets up auto-renewal. Verify:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

---

## Monitoring Setup

### 1. PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. Application Health Check

Create health check endpoint: `app/api/health/route.ts`

```typescript
export async function GET() {
  // Check database
  // Check file system
  // Return status
  return Response.json({ status: 'ok' })
}
```

### 3. System Monitoring

- **CPU/Memory:** PM2 monit, htop
- **Disk Space:** df -h
- **Database:** pg_stat_activity
- **Logs:** PM2 logs, Nginx logs

### 4. Alerting (Optional)

- Setup email alerts for:
  - High CPU/Memory usage
  - Disk space low
  - Application crashes
  - Database connection issues

---

## Backup Strategy

### 1. Database Backups

**Daily Backup Script:** `scripts/backup-db.sh`

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/restaurant_app_$DATE.sql"

mkdir -p $BACKUP_DIR
pg_dump -U restaurant_user restaurant_app > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

**Cron Job:**
```bash
# Daily at 2 AM
0 2 * * * /opt/restaurant-app/scripts/backup-db.sh
```

### 2. File Backups

**Backup Script:** `scripts/backup-files.sh`

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/files"
DATE=$(date +%Y%m%d)
tar -czf "$BACKUP_DIR/storage_$DATE.tar.gz" /opt/restaurant-app/storage

# Keep last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 3. Backup Verification

- Test restore procedures monthly
- Verify backup integrity
- Store backups off-site

---

## Scaling Considerations

### Horizontal Scaling

**Multiple Instances:**
1. Deploy to multiple VPS
2. Use Cloudflare tunnels for subdomains
3. Each instance has own database
4. Load balancer (optional) for high traffic

### Vertical Scaling

**Upgrade VM:**
- Increase CPU cores
- Increase RAM
- Upgrade to SSD storage
- Monitor resource usage

### Database Scaling

**Optimization:**
- Add indexes
- Query optimization
- Connection pooling
- Read replicas (future)

---

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs restaurant-app

# Check port
sudo lsof -i :3000

# Restart
pm2 restart restaurant-app
```

### Database Issues

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check connections
psql -U restaurant_user -d restaurant_app -c "SELECT count(*) FROM pg_stat_activity;"

# Check disk space
df -h
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload
sudo systemctl reload nginx
```

### SSL Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check expiration
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -noout -dates
```

---

## Post-Deployment

### 1. Verify Functionality

- [ ] Application accessible via HTTPS
- [ ] Login works
- [ ] Menu displays
- [ ] Orders can be placed
- [ ] Payments process
- [ ] Email notifications work
- [ ] Admin panel accessible

### 2. Performance Check

- [ ] Page load times acceptable
- [ ] API response times good
- [ ] Database queries optimized
- [ ] Images loading properly

### 3. Security Check

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] API keys secure
- [ ] File permissions correct

---

This deployment guide ensures a smooth production deployment with monitoring, backups, and scaling considerations.

