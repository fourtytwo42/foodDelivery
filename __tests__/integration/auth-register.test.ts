/**
 * @jest-environment node
 */
import { POST as register } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
  generateToken: jest.fn(),
}))

const createMockRequest = (body: unknown) =>
  ({
    json: async () => body,
  } as unknown as NextRequest)

describe('Auth Register API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('registers a new user', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.role.findUnique as jest.Mock).mockResolvedValue({ id: 'role1', name: 'CUSTOMER' })
    ;(hashPassword as jest.Mock).mockResolvedValue('hashed')
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: [{ role: { name: 'CUSTOMER' } }],
    })
    ;(generateToken as jest.Mock).mockReturnValue('token123')

    const response = await register(
      createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(generateToken).toHaveBeenCalled()
  })

  it('returns 409 when user already exists', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' })

    const response = await register(
      createMockRequest({
        email: 'exists@example.com',
        password: 'password123',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toContain('already exists')
  })

  it('returns 400 for validation error', async () => {
    const response = await register(
      createMockRequest({
        email: 'not-an-email',
        password: 'short',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('returns 500 when customer role missing', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.role.findUnique as jest.Mock).mockResolvedValue(null)

    const response = await register(
      createMockRequest({
        email: 'new@example.com',
        password: 'password123',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Customer role not found')
  })
})


