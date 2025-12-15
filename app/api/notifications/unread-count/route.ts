import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUnreadNotificationCount } from '@/services/notification-service'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    const userId = payload.userId

    const count = await getUnreadNotificationCount(userId)

    return NextResponse.json({
      success: true,
      count,
    })
  } catch (error: any) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
}
