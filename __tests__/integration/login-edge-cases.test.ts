/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/login/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { NextRequest } from 'next/server'

const createMockRequest = (body: unknown) => {
  return {
    json: async () => body,
  } as unknown as NextRequest
}

describe('Login Edge Cases', () => {
  let deletedUser: any
  let customerRole: any

  beforeAll(async () => {
    customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    })
  })

  afterAll(async () => {
    if (deletedUser) {
      await prisma.userRole.deleteMany({
        where: { userId: deletedUser.id },
      })
      await prisma.user.delete({
        where: { id: deletedUser.id },
      })
    }
    await prisma.$disconnect()
  })

  it('should reject login for deleted user', async () => {
    const passwordHash = await hashPassword('password123')
    deletedUser = await prisma.user.create({
      data: {
        email: 'deleted@example.com',
        passwordHash,
        deletedAt: new Date(),
        roles: {
          create: {
            roleId: customerRole!.id,
          },
        },
      },
    })

    const request = createMockRequest({
      email: 'deleted@example.com',
      password: 'password123',
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('deactivated')
  })

  it('should handle server errors gracefully', async () => {
    // Mock prisma to throw error
    const originalFindUnique = prisma.user.findUnique
    prisma.user.findUnique = jest.fn().mockRejectedValueOnce(new Error('Database error'))

    const request = createMockRequest({
      email: 'error@example.com',
      password: 'password123',
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()

    // Restore
    prisma.user.findUnique = originalFindUnique
  })
})

