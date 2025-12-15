/**
 * @jest-environment node
 */
import {
  GET as getNotifications,
} from '@/app/api/notifications/route'
import {
  PATCH as markAllRead,
} from '@/app/api/notifications/read-all/route'
import {
  GET as getUnreadCount,
} from '@/app/api/notifications/unread-count/route'
import {
  PATCH as markAsRead,
  DELETE as deleteNotification,
} from '@/app/api/notifications/[id]/route'
import { verifyToken } from '@/lib/auth'
import * as notificationService from '@/services/notification-service'

jest.mock('@/lib/auth')
jest.mock('@/services/notification-service')

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>
const notificationServiceMock = notificationService as jest.Mocked<typeof notificationService>

function createMockRequest(
  url: string,
  method: string = 'GET',
  body?: any,
  token: string = 'valid-token'
) {
  const headers = new Headers()
  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }
  
  const urlObj = new URL(url)
  
  return {
    headers,
    method,
    nextUrl: urlObj,
    url: url,
    json: async () => body || {},
  } as any
}

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyToken.mockReturnValue({
      userId: 'user1',
      email: 'user@example.com',
      roles: ['CUSTOMER'],
    })
  })

  describe('GET /api/notifications', () => {
    it('should fetch notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userId: 'user1',
          type: 'ORDER_CONFIRMED',
          title: 'Order Confirmed',
          message: 'Your order has been confirmed',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ]

      notificationServiceMock.getUserNotifications = jest.fn().mockResolvedValue(mockNotifications)
      notificationServiceMock.getUnreadNotificationCount = jest.fn().mockResolvedValue(1)

      const request = createMockRequest('http://localhost:3000/api/notifications')
      const response = await getNotifications(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notifications).toEqual(mockNotifications)
      expect(data.unreadCount).toBe(1)
      expect(notificationServiceMock.getUserNotifications).toHaveBeenCalledWith('user1', {
        unreadOnly: false,
        limit: 50,
        offset: 0,
      })
    })

    it('should fetch unread notifications only', async () => {
      notificationServiceMock.getUserNotifications = jest.fn().mockResolvedValue([])
      notificationServiceMock.getUnreadNotificationCount = jest.fn().mockResolvedValue(0)

      const request = createMockRequest(
        'http://localhost:3000/api/notifications?unreadOnly=true&limit=10&offset=5'
      )
      const response = await getNotifications(request)

      expect(notificationServiceMock.getUserNotifications).toHaveBeenCalledWith('user1', {
        unreadOnly: true,
        limit: 10,
        offset: 5,
      })
    })

    it('should return 401 if no token provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/notifications', 'GET', undefined, '')
      const response = await getNotifications(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle errors', async () => {
      notificationServiceMock.getUserNotifications = jest
        .fn()
        .mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('http://localhost:3000/api/notifications')
      const response = await getNotifications(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })

  describe('GET /api/notifications/unread-count', () => {
    it('should fetch unread count successfully', async () => {
      notificationServiceMock.getUnreadNotificationCount = jest.fn().mockResolvedValue(5)

      const request = createMockRequest('http://localhost:3000/api/notifications/unread-count')
      const response = await getUnreadCount(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(5)
      expect(notificationServiceMock.getUnreadNotificationCount).toHaveBeenCalledWith('user1')
    })

    it('should return 401 if no token provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/notifications/unread-count', 'GET', undefined, '')
      const response = await getUnreadCount(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PATCH /api/notifications/[id]', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif1',
        userId: 'user1',
        read: true,
        readAt: new Date().toISOString(),
      }

      notificationServiceMock.markNotificationAsRead = jest.fn().mockResolvedValue(mockNotification)

      const request = createMockRequest(
        'http://localhost:3000/api/notifications/notif1',
        'PATCH'
      )
      const response = await markAsRead(request, { params: { id: 'notif1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notification).toEqual(mockNotification)
      expect(notificationServiceMock.markNotificationAsRead).toHaveBeenCalledWith('notif1', 'user1')
    })

    it('should return 403 if unauthorized', async () => {
      notificationServiceMock.markNotificationAsRead = jest
        .fn()
        .mockRejectedValue(new Error('Unauthorized'))

      const request = createMockRequest(
        'http://localhost:3000/api/notifications/notif1',
        'PATCH'
      )
      const response = await markAsRead(request, { params: { id: 'notif1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 if no token provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/notifications/notif1', 'PATCH', undefined, '')
      const response = await markAsRead(request, { params: { id: 'notif1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('DELETE /api/notifications/[id]', () => {
    it('should delete notification', async () => {
      notificationServiceMock.deleteNotification = jest.fn().mockResolvedValue(undefined)

      const request = createMockRequest(
        'http://localhost:3000/api/notifications/notif1',
        'DELETE'
      )
      const response = await deleteNotification(request, { params: { id: 'notif1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(notificationServiceMock.deleteNotification).toHaveBeenCalledWith('notif1', 'user1')
    })

    it('should return 403 if unauthorized', async () => {
      notificationServiceMock.deleteNotification = jest
        .fn()
        .mockRejectedValue(new Error('Unauthorized'))

      const request = createMockRequest(
        'http://localhost:3000/api/notifications/notif1',
        'DELETE'
      )
      const response = await deleteNotification(request, { params: { id: 'notif1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      notificationServiceMock.markAllNotificationsAsRead = jest.fn().mockResolvedValue(undefined)

      const request = createMockRequest(
        'http://localhost:3000/api/notifications/read-all',
        'PATCH'
      )
      const response = await markAllRead(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(notificationServiceMock.markAllNotificationsAsRead).toHaveBeenCalledWith('user1')
    })

    it('should return 401 if no token provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/notifications/read-all', 'PATCH', undefined, '')
      const response = await markAllRead(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
