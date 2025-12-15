// Mock Prisma client for unit tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

import { getUserWithRoles, userHasRole, userHasAnyRole, getUserRoles } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('Auth Role Utilities', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    passwordHash: 'hashed',
    roles: [
      {
        role: {
          id: 'role1',
          name: 'CUSTOMER',
          description: 'Customer role',
          permissions: ['orders:create'],
        },
      },
      {
        role: {
          id: 'role2',
          name: 'ADMIN',
          description: 'Admin role',
          permissions: ['*'],
        },
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserWithRoles', () => {
    it('should get user with roles from database', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

      const result = await getUserWithRoles('user123')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      const result = await getUserWithRoles('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('userHasRole', () => {
    it('should return true if user has the role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

      const hasRole = await userHasRole('user123', 'CUSTOMER')

      expect(hasRole).toBe(true)
    })

    it('should return false if user does not have the role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

      const hasRole = await userHasRole('user123', 'MANAGER')

      expect(hasRole).toBe(false)
    })

    it('should return false if user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      const hasRole = await userHasRole('nonexistent', 'CUSTOMER')

      expect(hasRole).toBe(false)
    })
  })

  describe('userHasAnyRole', () => {
    it('should return true if user has any of the roles', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

      const hasAnyRole = await userHasAnyRole('user123', ['MANAGER', 'CUSTOMER'])

      expect(hasAnyRole).toBe(true)
    })

    it('should return false if user has none of the roles', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

      const hasAnyRole = await userHasAnyRole('user123', ['STAFF', 'DRIVER'])

      expect(hasAnyRole).toBe(false)
    })
  })

  describe('getUserRoles', () => {
    it('should return array of role names', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

      const roles = await getUserRoles('user123')

      expect(roles).toEqual(['CUSTOMER', 'ADMIN'])
    })

    it('should return empty array if user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      const roles = await getUserRoles('nonexistent')

      expect(roles).toEqual([])
    })
  })
})

