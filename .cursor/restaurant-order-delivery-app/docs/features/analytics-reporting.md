# Analytics & Reporting Feature

**Complete analytics dashboard and reporting system.**

---

## Overview

The analytics system provides comprehensive insights into sales, orders, popular items, delivery times, staff performance, and gift card usage.

---

## Features

### Sales Analytics

- Total sales (daily, weekly, monthly, yearly)
- Sales trends over time
- Average order value
- Sales by order type (delivery/pickup)
- Sales by payment method

### Order Analytics

- Total orders
- Orders by status
- Orders by time of day
- Orders by day of week
- Order completion rate
- Average order time

### Popular Items

- Most ordered items
- Revenue by item
- Items by category
- Trending items
- Low-performing items

### Delivery Analytics

- Average delivery time
- Delivery distance statistics
- Driver performance
- On-time delivery rate
- Delivery fee revenue

### Staff Performance

- Orders processed per staff
- Gift cards generated
- Average order processing time
- Staff activity logs

### Gift Card Analytics

- Gift cards issued
- Gift cards redeemed
- Total gift card revenue
- Average gift card value
- Redemption rate

### Customer Analytics

- New customers
- Returning customers
- Customer lifetime value
- Average orders per customer
- Customer retention rate

---

## Reports

### Export Formats

- **CSV:** For data analysis
- **PDF:** For presentations

### Report Types

- Sales reports
- Order reports
- Item performance reports
- Delivery reports
- Staff performance reports
- Gift card reports
- Customer reports

### Date Ranges

- Today
- This week
- This month
- This year
- Custom date range

---

## Dashboard

### Overview Metrics

- Today's sales
- Today's orders
- Active orders
- Popular items
- Recent orders

### Charts

- Line charts (trends over time)
- Bar charts (comparisons)
- Pie charts (distributions)
- Area charts (cumulative data)

---

## Database Schema

See [Database Schema](../database-schema.md) for complete schema.

Analytics use existing tables with aggregation queries.

---

## API Endpoints

See [API Specifications](../api-specifications.md) for complete API docs.

Key endpoints:
- `GET /api/v1/admin/analytics/sales` - Sales analytics
- `GET /api/v1/admin/analytics/popular-items` - Popular items
- `GET /api/v1/admin/analytics/export` - Export reports

---

This feature provides comprehensive analytics and reporting for data-driven decisions.

