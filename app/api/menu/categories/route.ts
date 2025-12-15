import { NextRequest, NextResponse } from 'next/server'
import { menuService } from '@/services/menu-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const categories = await menuService.getCategories(includeInactive)

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

