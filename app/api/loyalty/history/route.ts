import { NextRequest, NextResponse } from 'next/server'
import { loyaltyService } from '@/services/loyalty-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = searchParams.get('limit')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      )
    }

    const history = await loyaltyService.getTransactionHistory(
      userId,
      limit ? parseInt(limit, 10) : 50
    )

    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    )
  }
}

