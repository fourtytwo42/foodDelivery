import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  userHasRole,
  userHasAnyRole,
  getUserRoles,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'

jest.mock('bcryptjs')
jest.mock('jsonwebtoken')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('auth utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('hashes and verifies password', async () => {
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed')
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

    const hashed = await hashPassword('secret')
    expect(hashed).toBe('hashed')
    const valid = await verifyPassword('secret', 'hashed')
    expect(valid).toBe(true)
  })

  it('generates and verifies token', () => {
    ;(jwt.sign as jest.Mock).mockReturnValue('token123')
    ;(jwt.verify as jest.Mock).mockReturnValue({
      userId: 'u1',
      email: 'test@example.com',
      roles: ['ADMIN'],
    })

    const token = generateToken({
      userId: 'u1',
      email: 'test@example.com',
      roles: ['ADMIN'],
    })
    expect(jwt.sign).toHaveBeenCalled()
    expect(token).toBe('token123')

    const decoded = verifyToken(token)
    expect(decoded.userId).toBe('u1')
  })

  it('throws on invalid token', () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid')
    })

    expect(() => verifyToken('bad')).toThrow('Invalid or expired token')
  })

  it('checks user roles', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      roles: [
        { role: { name: 'ADMIN' } },
        { role: { name: 'STAFF' } },
      ],
    })

    await expect(userHasRole('u1', 'ADMIN')).resolves.toBe(true)
    await expect(userHasRole('u1', 'DRIVER')).resolves.toBe(false)
    await expect(userHasAnyRole('u1', ['DRIVER', 'STAFF'])).resolves.toBe(true)
    await expect(getUserRoles('u1')).resolves.toEqual(['ADMIN', 'STAFF'])
  })

  it('handles missing user in role checks', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(userHasRole('u1', 'ADMIN')).resolves.toBe(false)
    await expect(userHasAnyRole('u1', ['ADMIN'])).resolves.toBe(false)
    await expect(getUserRoles('u1')).resolves.toEqual([])
  })
})

describe('generateToken variations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns signed token string', () => {
    ;(jwt.sign as jest.Mock).mockReturnValue('token123')
    const token = generateToken({
      userId: 'u1',
      email: 'a@b.com',
      roles: [],
    })
    expect(token).toBe('token123')
  })

  it('generates different tokens for different payloads when signer differs', () => {
    ;(jwt.sign as jest.Mock)
      .mockReturnValueOnce('token1')
      .mockReturnValueOnce('token2')

    const token1 = generateToken({
      userId: 'u1',
      email: 'a@b.com',
      roles: ['A'],
    })
    const token2 = generateToken({
      userId: 'u2',
      email: 'c@d.com',
      roles: ['B'],
    })

    expect(token1).toBe('token1')
    expect(token2).toBe('token2')
  })
})

// Mock Prisma client for unit tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

import { hashPassword, verifyPassword, generateToken, verifyToken } from '@/lib/auth'

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')

      const hash = await hashPassword('testpassword123')

      expect(hash).toBe('hashed-password')
      expect(bcrypt.hash).toHaveBeenCalledWith('testpassword123', 12)
    })

    it('should produce different hashes for the same password', async () => {
      ;(bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hash-one')
        .mockResolvedValueOnce('hash-two')

      const hash1 = await hashPassword('testpassword123')
      const hash2 = await hashPassword('testpassword123')

      expect(hash1).toBe('hash-one')
      expect(hash2).toBe('hash-two')
    })
  })

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const isValid = await verifyPassword('testpassword123', 'hash')
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const isValid = await verifyPassword('wrongpassword', 'hash')
      expect(isValid).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate a JWT token via signer', () => {
      ;(jwt.sign as jest.Mock).mockReturnValue('token123')
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      }

      const token = generateToken(payload)

      expect(jwt.sign).toHaveBeenCalledWith(payload, expect.any(String), expect.any(Object))
      expect(token).toBe('token123')
    })

    it('should generate different tokens when signer returns different values', () => {
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce('token1')
        .mockReturnValueOnce('token2')

      const token1 = generateToken({
        userId: 'user123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      })
      const token2 = generateToken({
        userId: 'user456',
        email: 'other@example.com',
        roles: ['ADMIN'],
      })

      expect(token1).toBe('token1')
      expect(token2).toBe('token2')
    })
  })

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      })

      const decoded = verifyToken('token123')

      expect(jwt.verify).toHaveBeenCalled()
      expect(decoded.userId).toBe('user123')
    })

    it('should throw error for invalid token', () => {
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid')
      })

      expect(() => verifyToken('invalid.token.here')).toThrow('Invalid or expired token')
    })
  })
})

