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
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should produce different hashes for the same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      // bcrypt salts should produce different hashes
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      }
      
      const token = generateToken(payload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different payloads', () => {
      const payload1 = {
        userId: 'user123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      }
      
      const payload2 = {
        userId: 'user456',
        email: 'other@example.com',
        roles: ['ADMIN'],
      }
      
      const token1 = generateToken(payload1)
      const token2 = generateToken(payload2)
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      }
      
      const token = generateToken(payload)
      const decoded = verifyToken(token)
      
      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.roles).toEqual(payload.roles)
    })

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here'
      
      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token')
    })

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-token'
      
      expect(() => verifyToken(malformedToken)).toThrow()
    })
  })
})

