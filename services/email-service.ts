import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma'

// Create transporter (using SMTP or test account)
const createTransporter = () => {
  // In production, use real SMTP credentials
  // For development, use a test account or mock
  if (process.env.NODE_ENV === 'test') {
    // Return a mock transporter for tests
    return {
      sendMail: jest.fn(),
    } as any
  }

  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'test@example.com',
      pass: process.env.SMTP_PASS || 'test-password',
    },
  }

  return nodemailer.createTransport(smtpConfig)
}

const transporter = createTransporter()

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email notification
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // In test environment, skip actual sending
    if (process.env.NODE_ENV === 'test') {
      return
    }

    // Check if email notifications are enabled
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'default' },
    })

    if (!settings?.enableEmailNotifications) {
      console.log('Email notifications are disabled')
      return
    }

    await transporter.sendMail({
      from: settings.email || process.env.SMTP_FROM || 'noreply@restaurant.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
  } catch (error) {
    console.error('Error sending email:', error)
    // Don't throw - email failures shouldn't break the app
  }
}

/**
 * Generate HTML email template for order confirmation
 */
export function generateOrderConfirmationEmail(order: any): string {
  return `
    <html>
      <body>
        <h2>Order Confirmed!</h2>
        <p>Thank you for your order #${order.orderNumber}</p>
        <p>Total: $${order.total.toFixed(2)}</p>
        <p>Estimated delivery time: ${order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toLocaleString() : 'TBD'}</p>
      </body>
    </html>
  `
}

/**
 * Generate HTML email template for order status update
 */
export function generateOrderStatusEmail(order: any, status: string): string {
  const statusMessages: Record<string, string> = {
    CONFIRMED: 'Your order has been confirmed and is being prepared.',
    PREPARING: 'Your order is being prepared.',
    READY: 'Your order is ready for pickup!',
    OUT_FOR_DELIVERY: 'Your order is out for delivery!',
    DELIVERED: 'Your order has been delivered. Enjoy!',
    CANCELLED: 'Your order has been cancelled.',
  }

  return `
    <html>
      <body>
        <h2>Order Update</h2>
        <p>Order #${order.orderNumber}</p>
        <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
      </body>
    </html>
  `
}

/**
 * Generate HTML email template for delivery assigned
 */
export function generateDeliveryAssignedEmail(order: any, driverName?: string): string {
  return `
    <html>
      <body>
        <h2>Delivery Assigned</h2>
        <p>Order #${order.orderNumber}</p>
        <p>A driver ${driverName ? `(${driverName})` : ''} has been assigned to deliver your order.</p>
      </body>
    </html>
  `
}
