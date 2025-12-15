import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  roles: string[]
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Get user with roles from database
 */
export async function getUserWithRoles(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })
}

/**
 * Check if user has a specific role
 */
export async function userHasRole(userId: string, roleName: string): Promise<boolean> {
  const user = await getUserWithRoles(userId)
  if (!user) return false

  return user.roles.some((userRole) => userRole.role.name === roleName)
}

/**
 * Check if user has any of the specified roles
 */
export async function userHasAnyRole(
  userId: string,
  roleNames: string[]
): Promise<boolean> {
  const user = await getUserWithRoles(userId)
  if (!user) return false

  const userRoleNames = user.roles.map((userRole) => userRole.role.name)
  return roleNames.some((roleName) => userRoleNames.includes(roleName))
}

/**
 * Get user roles as string array
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const user = await getUserWithRoles(userId)
  if (!user) return []

  return user.roles.map((userRole) => userRole.role.name)
}

