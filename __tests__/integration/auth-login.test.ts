/**
 * @jest-environment node
 */
import { POST as login } from '@/app/api/auth/login/route'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyPassword: jest.fn(),
  generateToken: jest.fn(),
}))

const createMockRequest = (body: unknown) =>
  ({
    json: async () => body,
  } as unknown as NextRequest)

describe('Auth Login API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs in a valid user', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      passwordHash: 'hash',
      roles: [{ role: { name: 'CUSTOMER' } }],
    })
    ;(verifyPassword as jest.Mock).mockResolvedValue(true)
    ;(generateToken as jest.Mock).mockReturnValue('token123')

    const response = await login(
      createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(generateToken).toHaveBeenCalled()
  })

  it('returns 401 for invalid credentials', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      passwordHash: 'hash',
      roles: [],
    })
    ;(verifyPassword as jest.Mock).mockResolvedValue(false)

    const response = await login(
      createMockRequest({
        email: 'test@example.com',
        password: 'wrong',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid email or password')
  })

  it('returns 401 for deactivated account', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      passwordHash: 'hash',
      roles: [],
      deletedAt: new Date(),
    })

    const response = await login(
      createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('deactivated')
  })

  it('returns 400 for validation error', async () => {
    const response = await login(
      createMockRequest({
        email: 'not-an-email',
        password: '',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('returns 401 when user not found', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const response = await login(
      createMockRequest({
        email: 'missing@example.com',
        password: 'password123',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid email or password')
  })
})


