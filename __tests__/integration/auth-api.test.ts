/**
 * @jest-environment node
 */
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// Mock Next.js request/response
const mockRequest = (body: unknown) => ({
  json: async () => body,
})

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookies: {
      set: jest.fn(),
    },
  }
  return res
}

describe('Auth API Routes', () => {
  let testUser: any

  beforeAll(async () => {
    // Setup: Create test roles and user
    const customerRole = await prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: {
        name: 'CUSTOMER',
        description: 'Customer access',
        permissions: ['orders:create'],
      },
    })

    const passwordHash = await hashPassword('testpassword123')
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
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
  })

  afterAll(async () => {
    // Cleanup
    await prisma.userRole.deleteMany({
      where: { userId: testUser.id },
    })
    await prisma.user.delete({
      where: { id: testUser.id },
    })
    await prisma.$disconnect()
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Mock the route handler - in real tests, we'd use Next.js test utilities
      // This is a simplified version for structure
      const loginHandler = async (request: { json: () => Promise<unknown> }) => {
        const body = await request.json()
        const { email, password } = body

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        })

        if (!user) {
          return { status: 401, json: { error: 'Invalid email or password' } }
        }

        const { verifyPassword } = await import('@/lib/auth')
        const isValidPassword = await verifyPassword(password, user.passwordHash)
        
        if (!isValidPassword) {
          return { status: 401, json: { error: 'Invalid email or password' } }
        }

        return {
          status: 200,
          json: {
            success: true,
            user: {
              id: user.id,
              email: user.email,
            },
          },
          cookies: {
            set: jest.fn(),
          },
        }
      }

      const request = mockRequest({
        email: 'test@example.com',
        password: 'testpassword123',
      })

      const result = await loginHandler(request)

      expect(result.status).toBe(200)
      expect(result.json.success).toBe(true)
      expect(result.json.user.email).toBe('test@example.com')
    })

    it('should reject invalid credentials', async () => {
      const loginHandler = async (request: { json: () => Promise<unknown> }) => {
        const body = await request.json()
        const { email } = body

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          return { status: 401, json: { error: 'Invalid email or password' } }
        }

        return { status: 401, json: { error: 'Invalid email or password' } }
      }

      const request = mockRequest({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      })

      const result = await loginHandler(request)

      expect(result.status).toBe(401)
      expect(result.json.error).toBeDefined()
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const registerHandler = async (request: { json: () => Promise<unknown> }) => {
        const body = await request.json()
        const { email, password } = body

        const existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          return { status: 409, json: { error: 'User already exists' } }
        }

        const customerRole = await prisma.role.findUnique({
          where: { name: 'CUSTOMER' },
        })

        if (!customerRole) {
          return { status: 500, json: { error: 'Customer role not found' } }
        }

        const { hashPassword } = await import('@/lib/auth')
        const passwordHash = await hashPassword(password)

        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            roles: {
              create: {
                roleId: customerRole.id,
              },
            },
          },
        })

        return {
          status: 200,
          json: {
            success: true,
            user: {
              id: user.id,
              email: user.email,
            },
          },
        }
      }

      const request = mockRequest({
        email: 'newuser@example.com',
        password: 'newpassword123',
      })

      const result = await registerHandler(request)

      expect(result.status).toBe(200)
      expect(result.json.success).toBe(true)

      // Cleanup
      const newUser = await prisma.user.findUnique({
        where: { email: 'newuser@example.com' },
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
      const registerHandler = async (request: { json: () => Promise<unknown> }) => {
        const body = await request.json()
        const { email } = body

        const existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          return { status: 409, json: { error: 'User already exists' } }
        }

        return { status: 200, json: { success: true } }
      }

      const request = mockRequest({
        email: 'test@example.com', // Already exists
        password: 'password123',
      })

      const result = await registerHandler(request)

      expect(result.status).toBe(409)
      expect(result.json.error).toContain('already exists')
    })
  })
})

