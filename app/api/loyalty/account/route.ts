import { NextRequest, NextResponse } from 'next/server'
import { loyaltyService } from '@/services/loyalty-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      )
    }

    const account = await loyaltyService.getAccount(userId)

    if (!account) {
      return NextResponse.json(
        { error: 'Loyalty account not found' },
        { status: 404 }
      )
    }

    // Get points value in dollars
    const pointsValue = await loyaltyService.getPointsValue(account.points)

    return NextResponse.json({
      success: true,
      account,
      pointsValue,
    })
  } catch (error) {
    console.error('Error fetching loyalty account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty account' },
      { status: 500 }
    )
  }
}

