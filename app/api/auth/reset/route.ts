import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'
import crypto from 'crypto'

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token, password } = body

    // If token and password are provided, reset password
    if (token && password) {
      const { token: resetToken, password: newPassword } = resetPasswordSchema.parse({
        token,
        password,
      })

      // Find user by reset token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: resetToken,
          passwordResetExpires: {
            gt: new Date(),
          },
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }

      // Update password and clear reset token
      const passwordHash = await hashPassword(newPassword)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully',
      })
    }

    // Otherwise, request password reset
    const { email: userEmail } = requestResetSchema.parse({ email })

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a password reset email has been sent',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date()
    resetExpires.setHours(resetExpires.getHours() + 1) // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    })

    // TODO: Send email with reset link
    // For now, just return success
    // In production, send email with reset link containing the token

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent',
      // In development, you might want to return the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

