import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  sendOrderConfirmationNotification,
  sendOrderStatusUpdateNotification,
  sendDeliveryAssignedNotification,
} from '@/services/notification-service'
import { prisma } from '@/lib/prisma'
import * as emailService from '@/services/email-service'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/services/email-service', () => ({
  sendEmail: jest.fn(),
  generateOrderConfirmationEmail: jest.fn(() => '<html>Order confirmed</html>'),
  generateOrderStatusEmail: jest.fn(() => '<html>Status update</html>'),
  generateDeliveryAssignedEmail: jest.fn(() => '<html>Delivery assigned</html>'),
}))

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNotification', () => {
    it('should create a notification without sending email', async () => {
      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed',
        read: false,
        user: { id: 'user1', email: 'user@example.com', firstName: 'John', lastName: 'Doe' },
        order: null,
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)

      const result = await createNotification({
        userId: 'user1',
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed',
      })

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          orderId: undefined,
          type: 'ORDER_CONFIRMED',
          title: 'Order Confirmed',
          message: 'Your order has been confirmed',
          link: undefined,
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
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should create notification and send email when requested', async () => {
      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed',
        read: false,
        user: { id: 'user1', email: 'user@example.com', firstName: 'John', lastName: 'Doe' },
        order: {
          id: 'order1',
          orderNumber: 'ORD-123',
          status: 'CONFIRMED',
        },
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        emailSent: true,
        emailSentAt: new Date(),
      })
      ;(emailService.sendEmail as jest.Mock).mockResolvedValue(undefined)

      await createNotification({
        userId: 'user1',
        orderId: 'order1',
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed',
        sendEmail: true,
      })

      expect(emailService.sendEmail).toHaveBeenCalled()
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: {
          emailSent: true,
          emailSentAt: expect.any(Date),
        },
      })
    })

    it('should handle email sending errors gracefully', async () => {
      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed',
        read: false,
        user: { id: 'user1', email: 'user@example.com' },
        order: null,
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(emailService.sendEmail as jest.Mock).mockRejectedValue(new Error('Email error'))

      // Should not throw
      await expect(
        createNotification({
          userId: 'user1',
          type: 'ORDER_CONFIRMED',
          title: 'Order Confirmed',
          message: 'Your order has been confirmed',
          sendEmail: true,
        })
      ).resolves.not.toThrow()
    })

    it('should mark SMS and Push as sent when requested', async () => {
      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed',
        read: false,
        user: { id: 'user1', email: null },
        order: null,
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(prisma.notification.update as jest.Mock)
        .mockResolvedValueOnce({
          ...mockNotification,
          smsSent: true,
          smsSentAt: new Date(),
        })
        .mockResolvedValueOnce({
          ...mockNotification,
          pushSent: true,
          pushSentAt: new Date(),
        })

      await createNotification({
        userId: 'user1',
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed',
        sendSMS: true,
        sendPush: true,
      })

      expect(prisma.notification.update).toHaveBeenCalledTimes(2)
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: {
          smsSent: true,
          smsSentAt: expect.any(Date),
        },
      })
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: {
          pushSent: true,
          pushSentAt: expect.any(Date),
        },
      })
    })
  })

  describe('getUserNotifications', () => {
    it('should get all notifications for a user', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userId: 'user1',
          type: 'ORDER_CONFIRMED',
          title: 'Order Confirmed',
          message: 'Your order has been confirmed',
          read: false,
          order: null,
        },
      ]

      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications)

      const result = await getUserNotifications('user1')

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
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
      expect(result).toEqual(mockNotifications)
    })

    it('should get unread notifications only', async () => {
      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([])

      await getUserNotifications('user1', { unreadOnly: true, limit: 10, offset: 5 })

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', read: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 5,
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
    })
  })

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        read: false,
      }

      ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        read: true,
        readAt: new Date(),
      })

      const result = await markNotificationAsRead('notif1', 'user1')

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      })
      expect(result.read).toBe(true)
    })

    it('should return notification if already read', async () => {
      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        read: true,
      }

      ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification)

      const result = await markNotificationAsRead('notif1', 'user1')

      expect(prisma.notification.update).not.toHaveBeenCalled()
      expect(result).toEqual(mockNotification)
    })

    it('should throw error if notification not found', async () => {
      ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(markNotificationAsRead('notif1', 'user1')).rejects.toThrow(
        'Notification not found'
      )
    })

    it('should throw error if user is not authorized', async () => {
      ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user2',
      })

      await expect(markNotificationAsRead('notif1', 'user1')).rejects.toThrow('Unauthorized')
    })
  })

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

      await markAllNotificationsAsRead('user1')

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          read: false,
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      })
    })
  })

  describe('getUnreadNotificationCount', () => {
    it('should return unread notification count', async () => {
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(3)

      const count = await getUnreadNotificationCount('user1')

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          read: false,
        },
      })
      expect(count).toBe(3)
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user1',
      })
      ;(prisma.notification.delete as jest.Mock).mockResolvedValue({})

      await deleteNotification('notif1', 'user1')

      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif1' },
      })
    })

    it('should throw error if notification not found', async () => {
      ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(deleteNotification('notif1', 'user1')).rejects.toThrow(
        'Notification not found'
      )
    })

    it('should throw error if user is not authorized', async () => {
      ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user2',
      })

      await expect(deleteNotification('notif1', 'user1')).rejects.toThrow('Unauthorized')
    })
  })

  describe('sendOrderConfirmationNotification', () => {
    it('should send order confirmation notification', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        total: 25.99,
        userId: 'user1',
        user: { id: 'user1', email: 'user@example.com' },
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user1',
        orderId: 'order1',
        user: mockOrder.user,
        order: mockOrder,
      })
      ;(emailService.sendEmail as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      await sendOrderConfirmationNotification('order1')

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order1' },
        include: { user: true },
      })
      expect(prisma.notification.create).toHaveBeenCalled()
    })

    it('should not send notification if order has no userId', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order1',
        userId: null,
      })

      await sendOrderConfirmationNotification('order1')

      expect(prisma.notification.create).not.toHaveBeenCalled()
    })
  })

  describe('sendOrderStatusUpdateNotification', () => {
    it('should send order status update notification', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        status: 'PREPARING',
        userId: 'user1',
        user: { id: 'user1', email: 'user@example.com' },
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user1',
        orderId: 'order1',
        user: mockOrder.user,
        order: mockOrder,
      })
      ;(emailService.sendEmail as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      await sendOrderStatusUpdateNotification('order1', 'PREPARING')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'ORDER_STATUS',
          title: 'Order Being Prepared',
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('sendDeliveryAssignedNotification', () => {
    it('should send delivery assigned notification', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        userId: 'user1',
        user: { id: 'user1', email: 'user@example.com' },
        delivery: {
          driver: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user1',
        orderId: 'order1',
        user: mockOrder.user,
        order: mockOrder,
      })
      ;(emailService.sendEmail as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      await sendDeliveryAssignedNotification('order1', 'driver1')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'DELIVERY_ASSIGNED',
          title: 'Delivery Assigned',
        }),
        include: expect.any(Object),
      })
    })

    it('should handle missing driver', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        userId: 'user1',
        user: { id: 'user1', email: 'user@example.com' },
        delivery: null,
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user1',
      })

      await sendDeliveryAssignedNotification('order1', 'driver1')

      expect(prisma.notification.create).toHaveBeenCalled()
    })

    it('should not send notification if order has no userId for delivery assigned', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order1',
        userId: null,
      })

      await sendDeliveryAssignedNotification('order1', 'driver1')

      expect(prisma.notification.create).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle notification creation with missing user email gracefully', async () => {
      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed',
        read: false,
        user: { id: 'user1', email: null },
        order: null,
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)

      await createNotification({
        userId: 'user1',
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed',
        sendEmail: true,
      })

      // Should not throw and should not attempt to send email
      expect(prisma.notification.create).toHaveBeenCalled()
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should handle notification creation with missing order for status update', async () => {
      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        type: 'ORDER_STATUS',
        title: 'Order Update',
        message: 'Order status updated',
        read: false,
        user: { id: 'user1', email: 'user@example.com' },
        order: null,
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(emailService.sendEmail as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        emailSent: true,
      })

      await createNotification({
        userId: 'user1',
        type: 'ORDER_STATUS',
        title: 'Order Update',
        message: 'Order status updated',
        sendEmail: true,
      })

      expect(emailService.sendEmail).toHaveBeenCalled()
    })

    it('should handle delivery assigned with driver having empty name after trim', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        userId: 'user1',
        user: { id: 'user1', email: 'user@example.com' },
        delivery: {
          driver: {
            firstName: '',
            lastName: '',
          },
        },
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user1',
      })

      await sendDeliveryAssignedNotification('order1', 'driver1')

      expect(prisma.notification.create).toHaveBeenCalled()
      const callArgs = (prisma.notification.create as jest.Mock).mock.calls[0][0]
      // Should not include driver name in message when name is empty
      expect(callArgs.data.message).not.toContain('(')
    })

    it('should handle all order status types', async () => {
      const statuses = ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
      
      for (const status of statuses) {
        const mockOrder = {
          id: 'order1',
          orderNumber: 'ORD-123',
          status,
          userId: 'user1',
          user: { id: 'user1', email: 'user@example.com' },
        }

        ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
        ;(prisma.notification.create as jest.Mock).mockResolvedValue({
          id: 'notif1',
          userId: 'user1',
        })

        await sendOrderStatusUpdateNotification('order1', status)

        expect(prisma.notification.create).toHaveBeenCalled()
        jest.clearAllMocks()
      }
    })

    it('should handle order not found for all notification functions', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      await sendOrderConfirmationNotification('order1')
      await sendOrderStatusUpdateNotification('order1', 'PREPARING')
      await sendDeliveryAssignedNotification('order1', 'driver1')

      expect(prisma.notification.create).not.toHaveBeenCalled()
    })
  })
})
