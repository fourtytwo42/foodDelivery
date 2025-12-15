import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { markAllNotificationsAsRead } from '@/services/notification-service'

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    const userId = payload.userId

    await markAllNotificationsAsRead(userId)

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}
