/**
 * @jest-environment node
 */
import { POST as loginPOST } from '@/app/api/auth/login/route'
import { POST as registerPOST } from '@/app/api/auth/register/route'
import { POST as logoutPOST } from '@/app/api/auth/logout/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { NextRequest } from 'next/server'

// Mock NextRequest
const createMockRequest = (body: unknown) => {
  return {
    json: async () => body,
    cookies: {
      get: jest.fn(),
      set: jest.fn(),
    },
  } as unknown as NextRequest
}

const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookies: {
      set: jest.fn(),
    },
  }
  return res
}

describe('API Routes', () => {
  let testUser: any
  let customerRole: any

  beforeAll(async () => {
    // Ensure roles exist
    customerRole = await prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: {
        name: 'CUSTOMER',
        description: 'Customer access',
        permissions: ['orders:create'],
      },
    })
  })

  afterAll(async () => {
    // Cleanup test user if created
    if (testUser) {
      await prisma.userRole.deleteMany({
        where: { userId: testUser.id },
      })
      await prisma.user.delete({
        where: { id: testUser.id },
      })
    }
    await prisma.$disconnect()
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const passwordHash = await hashPassword('testpassword123')
      testUser = await prisma.user.create({
        data: {
          email: 'apitest@example.com',
          passwordHash,
          emailVerified: true,
          roles: {
            create: {
              roleId: customerRole.id,
            },
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      })

      const request = createMockRequest({
        email: 'apitest@example.com',
        password: 'testpassword123',
      })

      const response = await loginPOST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.email).toBe('apitest@example.com')
    })

    it('should reject invalid credentials', async () => {
      const request = createMockRequest({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      })

      const response = await loginPOST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should reject invalid email format', async () => {
      const request = createMockRequest({
        email: 'invalid-email',
        password: 'password123',
      })

      const response = await loginPOST(request as NextRequest)

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const request = createMockRequest({
        email: 'newapiuser@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      })

      const response = await registerPOST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.email).toBe('newapiuser@example.com')

      // Cleanup
      const newUser = await prisma.user.findUnique({
        where: { email: 'newapiuser@example.com' },
      })
      if (newUser) {
        await prisma.userRole.deleteMany({
          where: { userId: newUser.id },
        })
        await prisma.user.delete({
          where: { id: newUser.id },
        })
      }
    })

    it('should reject registration with existing email', async () => {
      const request = createMockRequest({
        email: 'apitest@example.com', // Already exists from login test
        password: 'password123',
      })

      const response = await registerPOST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('already exists')
    })

    it('should reject invalid email format', async () => {
      const request = createMockRequest({
        email: 'invalid-email',
        password: 'password123',
      })

      const response = await registerPOST(request as NextRequest)

      expect(response.status).toBe(400)
    })

    it('should reject password too short', async () => {
      const request = createMockRequest({
        email: 'shortpass@example.com',
        password: 'short',
      })

      const response = await registerPOST(request as NextRequest)

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await logoutPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})

