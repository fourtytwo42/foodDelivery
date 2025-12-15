/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/reset/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { NextRequest } from 'next/server'

const createMockRequest = (body: unknown) => {
  return {
    json: async () => body,
  } as unknown as NextRequest
}

describe('Password Reset API', () => {
  let testUser: any
  let customerRole: any

  beforeAll(async () => {
    customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    })
  })

  afterAll(async () => {
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

  describe('Request Password Reset', () => {
    it('should create reset token for existing user', async () => {
      const passwordHash = await hashPassword('password123')
      testUser = await prisma.user.create({
        data: {
          email: 'resetuser@example.com',
          passwordHash,
          roles: {
            create: {
              roleId: customerRole!.id,
            },
          },
        },
      })

      const request = createMockRequest({
        email: 'resetuser@example.com',
      })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify reset token was created
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      })
      expect(updatedUser?.passwordResetToken).toBeDefined()
      expect(updatedUser?.passwordResetExpires).toBeDefined()
    })

    it('should return success even for non-existent user (security)', async () => {
      const request = createMockRequest({
        email: 'nonexistent@example.com',
      })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Should not reveal if user exists
    })

    it('should reject invalid email format', async () => {
      const request = createMockRequest({
        email: 'invalid-email',
      })

      const response = await POST(request as NextRequest)

      expect(response.status).toBe(400)
    })
  })

  describe('Reset Password with Token', () => {
    it('should reset password with valid token', async () => {
      // Create user with reset token
      const passwordHash = await hashPassword('oldpassword')
      const resetUser = await prisma.user.create({
        data: {
          email: 'resettokenuser@example.com',
          passwordHash,
          passwordResetToken: 'valid-reset-token-123',
          passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour from now
          roles: {
            create: {
              roleId: customerRole!.id,
            },
          },
        },
      })

      const request = createMockRequest({
        token: 'valid-reset-token-123',
        password: 'newpassword123',
      })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify password was changed and token cleared
      const updatedUser = await prisma.user.findUnique({
        where: { id: resetUser.id },
      })
      expect(updatedUser?.passwordResetToken).toBeNull()
      expect(updatedUser?.passwordResetExpires).toBeNull()
      expect(updatedUser?.passwordHash).not.toBe(passwordHash)

      // Cleanup
      await prisma.userRole.deleteMany({
        where: { userId: resetUser.id },
      })
      await prisma.user.delete({
        where: { id: resetUser.id },
      })
    })

    it('should reject expired token', async () => {
      const passwordHash = await hashPassword('oldpassword')
      const expiredUser = await prisma.user.create({
        data: {
          email: 'expireduser@example.com',
          passwordHash,
          passwordResetToken: 'expired-token',
          passwordResetExpires: new Date(Date.now() - 3600000), // 1 hour ago
          roles: {
            create: {
              roleId: customerRole!.id,
            },
          },
        },
      })

      const request = createMockRequest({
        token: 'expired-token',
        password: 'newpassword123',
      })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or expired')

      // Cleanup
      await prisma.userRole.deleteMany({
        where: { userId: expiredUser.id },
      })
      await prisma.user.delete({
        where: { id: expiredUser.id },
      })
    })

    it('should reject invalid token', async () => {
      const request = createMockRequest({
        token: 'invalid-token',
        password: 'newpassword123',
      })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or expired')
    })

    it('should reject password too short', async () => {
      const request = createMockRequest({
        token: 'some-token',
        password: 'short',
      })

      const response = await POST(request as NextRequest)

      expect(response.status).toBe(400)
    })
  })
})

