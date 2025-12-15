# Troubleshooting Guide

**Common issues and solutions for the Restaurant Order & Delivery App.**

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Database Issues](#database-issues)
3. [Application Issues](#application-issues)
4. [Payment Issues](#payment-issues)
5. [Email Issues](#email-issues)
6. [Performance Issues](#performance-issues)
7. [Deployment Issues](#deployment-issues)

---

## Installation Issues

### Node.js Not Found

**Error:** `node: command not found`

**Solution:**
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v20.x.x
```

### PostgreSQL Connection Failed

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection string in .env
# Format: postgresql://user:password@host:port/database
```

### Permission Denied on Scripts

**Error:** `Permission denied: ./scripts/setup.sh`

**Solution:**
```bash
chmod +x scripts/setup.sh
chmod +x scripts/reset-demo.sh
```

---

## Database Issues

### Migration Fails

**Error:** `Migration failed`

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: Deletes data)
npx prisma migrate reset

# Or manually fix migration
npx prisma migrate dev
```

### Connection Pool Exhausted

**Error:** `Too many connections`

**Solution:**
```sql
-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Increase connection limit in PostgreSQL
-- Edit postgresql.conf: max_connections = 200
-- Restart PostgreSQL
```

### Seed Script Fails

**Error:** `Seed script error`

**Solution:**
```bash
# Check database connection
psql -U restaurant_user -d restaurant_app

# Run seed manually
npm run db:seed

# Check for foreign key violations
# Ensure roles exist before users
```

---

## Application Issues

### Application Won't Start

**Error:** `Error: Cannot start server`

**Solution:**
```bash
# Check logs
pm2 logs restaurant-app

# Check if port is in use
sudo lsof -i :3000

# Kill process on port
sudo kill -9 $(lsof -t -i:3000)

# Check environment variables
cat .env

# Verify Node.js version
node --version  # Should be 20.x
```

### Build Fails

**Error:** `Build error`

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Try build again
npm run build
```

### WebSocket Connection Fails

**Error:** `WebSocket connection failed`

**Solution:**
```bash
# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000/api/ws

# Check Nginx WebSocket configuration
# Ensure proxy_set_header Upgrade and Connection headers

# Check firewall
sudo ufw status
```

---

## Payment Issues

### Stripe Payment Fails

**Error:** `Payment failed`

**Solution:**
1. **Check API Keys:**
   ```bash
   # Verify keys in .env
   echo $STRIPE_SECRET_KEY
   ```

2. **Test with Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Check Webhook Secret:**
   - Verify webhook secret matches
   - Check webhook endpoint URL

4. **Test Cards:**
   - Use Stripe test cards: 4242 4242 4242 4242
   - Check card details in Stripe Dashboard

### PayPal Payment Fails

**Error:** `PayPal order creation failed`

**Solution:**
1. **Check Credentials:**
   ```bash
   # Verify in .env
   echo $PAYPAL_CLIENT_ID
   echo $PAYPAL_CLIENT_SECRET
   ```

2. **Check Mode:**
   - Sandbox for testing
   - Live for production

3. **Test with Sandbox:**
   - Use PayPal sandbox accounts
   - Check PayPal Developer Dashboard

### Payment Retry Fails

**Error:** `Payment retry failed`

**Solution:**
- Check payment provider status
- Verify API keys are valid
- Check network connectivity
- Review payment logs

---

## Email Issues

### Emails Not Sending

**Error:** `Email send failed`

**Solution:**
1. **Check SMTP Settings:**
   ```bash
   # Verify in .env
   echo $SMTP_HOST
   echo $SMTP_USER
   ```

2. **Test SMTP Connection:**
   ```bash
   # Use telnet to test
   telnet $SMTP_HOST $SMTP_PORT
   ```

3. **Gmail App Password:**
   - Ensure 2FA enabled
   - Generate new app password
   - Use app password, not regular password

4. **Check Firewall:**
   ```bash
   # Allow SMTP port
   sudo ufw allow 587/tcp
   ```

### Emails Going to Spam

**Solution:**
- Use proper "From" address
- Configure SPF/DKIM records
- Use reputable SMTP provider (SendGrid, Mailgun)
- Avoid spam trigger words

---

## Performance Issues

### Slow Page Loads

**Solution:**
1. **Check Database Queries:**
   ```bash
   # Enable query logging
   # Check slow queries
   ```

2. **Optimize Images:**
   - Use Next.js Image component
   - Compress images
   - Use WebP format

3. **Check Bundle Size:**
   ```bash
   npm run build
   # Check .next/analyze for bundle analysis
   ```

4. **Database Indexes:**
   ```sql
   -- Check missing indexes
   EXPLAIN ANALYZE SELECT * FROM orders WHERE userId = '...';
   ```

### High Memory Usage

**Solution:**
```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart restaurant-app

# Increase VM memory if needed
```

### Slow Database Queries

**Solution:**
```sql
-- Find slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Add indexes
CREATE INDEX idx_orders_user_id ON orders(userId);
```

---

## Deployment Issues

### SSL Certificate Issues

**Error:** `SSL certificate invalid`

**Solution:**
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check expiration
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -noout -dates
```

### Nginx Configuration Errors

**Error:** `Nginx configuration test failed`

**Solution:**
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

### PM2 Process Crashes

**Error:** `Application keeps crashing`

**Solution:**
```bash
# Check logs
pm2 logs restaurant-app

# Check error logs
pm2 logs restaurant-app --err

# Restart with more memory
pm2 restart restaurant-app --max-memory-restart 500M

# Check system resources
htop
df -h
```

---

## Common Error Messages

### "Authentication Required"

**Cause:** Missing or invalid JWT token

**Solution:**
- Check token in request headers
- Verify JWT_SECRET in .env
- Check token expiration

### "Resource Not Found"

**Cause:** Invalid ID or deleted resource

**Solution:**
- Verify resource exists
- Check ID format
- Check soft deletes

### "Validation Error"

**Cause:** Invalid request data

**Solution:**
- Check request format
- Verify required fields
- Check data types

### "Payment Failed"

**Cause:** Payment provider error

**Solution:**
- Check payment provider status
- Verify API keys
- Check card details
- Review payment logs

---

## Getting Help

### Check Logs

```bash
# Application logs
pm2 logs restaurant-app

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# System logs
journalctl -u restaurant-app
```

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check environment
env | grep -i restaurant
```

### Database Debugging

```bash
# Open Prisma Studio
npm run db:studio

# Direct database access
psql -U restaurant_user -d restaurant_app
```

---

This troubleshooting guide covers common issues and their solutions. For additional help, check the specific documentation for each feature.

