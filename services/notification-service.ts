import { prisma } from '../lib/prisma'
import {
  sendEmail,
  generateOrderConfirmationEmail,
  generateOrderStatusEmail,
  generateDeliveryAssignedEmail,
} from './email-service'

export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_STATUS'
  | 'DELIVERY_ASSIGNED'
  | 'DELIVERY_PICKED_UP'
  | 'DELIVERY_DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'GIFT_CARD_PURCHASED'
  | 'LOYALTY_POINTS_EARNED'
  | 'COUPON_APPLIED'

export interface CreateNotificationInput {
  userId: string
  orderId?: string
  type: NotificationType
  title: string
  message: string
  link?: string
  sendEmail?: boolean
  sendSMS?: boolean
  sendPush?: boolean
}

/**
 * Create a new notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<any> {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      orderId: input.orderId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      order: true,
    },
  })

  // Send email if requested
  if (input.sendEmail && notification.user?.email) {
    try {
      let emailHtml = ''
      let emailSubject = input.title

      if (input.orderId && notification.order) {
        switch (input.type) {
          case 'ORDER_CONFIRMED':
            emailHtml = generateOrderConfirmationEmail(notification.order)
            break
          case 'ORDER_STATUS':
            emailHtml = generateOrderStatusEmail(
              notification.order,
              notification.order.status
            )
            break
          case 'DELIVERY_ASSIGNED':
            emailHtml = generateDeliveryAssignedEmail(notification.order)
            break
          default:
            emailHtml = `<html><body><p>${input.message}</p></body></html>`
        }
      } else {
        emailHtml = `<html><body><p>${input.message}</p></body></html>`
      }

      await sendEmail({
        to: notification.user.email,
        subject: emailSubject,
        html: emailHtml,
      })

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  }

  // TODO: Implement SMS and Push notifications
  // For now, just mark as sent if requested (mock)
  if (input.sendSMS) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        smsSent: true,
        smsSentAt: new Date(),
      },
    })
  }

  if (input.sendPush) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        pushSent: true,
        pushSentAt: new Date(),
      },
    })
  }

  return notification
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
  }
): Promise<any[]> {
  const where: any = { userId }
  if (options?.unreadOnly) {
    where.read = false
  }

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
        },
      },
    },
  })
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<any> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification) {
    throw new Error('Notification not found')
  }

  if (notification.userId !== userId) {
    throw new Error('Unauthorized')
  }

  if (notification.read) {
    return notification
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  })
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification) {
    throw new Error('Notification not found')
  }

  if (notification.userId !== userId) {
    throw new Error('Unauthorized')
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  })
}

/**
 * Send order confirmation notification
 */
export async function sendOrderConfirmationNotification(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  })

  if (!order || !order.userId) {
    return
  }

  await createNotification({
    userId: order.userId,
    orderId: order.id,
    type: 'ORDER_CONFIRMED',
    title: 'Order Confirmed',
    message: `Your order #${order.orderNumber} has been confirmed. Total: $${order.total.toFixed(2)}`,
    link: `/orders/${order.id}`,
    sendEmail: true,
  })
}

/**
 * Send order status update notification
 */
export async function sendOrderStatusUpdateNotification(
  orderId: string,
  status: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  })

  if (!order || !order.userId) {
    return
  }

  const statusTitles: Record<string, string> = {
    CONFIRMED: 'Order Confirmed',
    PREPARING: 'Order Being Prepared',
    READY: 'Order Ready',
    OUT_FOR_DELIVERY: 'Order Out for Delivery',
    DELIVERED: 'Order Delivered',
    CANCELLED: 'Order Cancelled',
  }

  await createNotification({
    userId: order.userId,
    orderId: order.id,
    type: 'ORDER_STATUS',
    title: statusTitles[status] || 'Order Update',
    message: `Your order #${order.orderNumber} status has been updated to ${status}.`,
    link: `/orders/${order.id}`,
    sendEmail: true,
  })
}

/**
 * Send delivery assigned notification
 */
export async function sendDeliveryAssignedNotification(
  orderId: string,
  driverId: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      delivery: {
        include: {
          driver: true,
        },
      },
    },
  })

  if (!order || !order.userId) {
    return
  }

  const driverName = order.delivery?.driver
    ? `${order.delivery.driver.firstName || ''} ${order.delivery.driver.lastName || ''}`.trim()
    : undefined

  await createNotification({
    userId: order.userId,
    orderId: order.id,
    type: 'DELIVERY_ASSIGNED',
    title: 'Delivery Assigned',
    message: `A driver${driverName ? ` (${driverName})` : ''} has been assigned to deliver your order #${order.orderNumber}.`,
    link: `/orders/${order.id}`,
    sendEmail: true,
  })
}

