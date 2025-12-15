import { NextRequest, NextResponse } from 'next/server'
import { menuService } from '@/services/menu-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId') || undefined
    const featured = searchParams.get('featured') === 'true' ? true : undefined
    const popular = searchParams.get('popular') === 'true' ? true : undefined
    const search = searchParams.get('search') || undefined

    const items = await menuService.getMenuItems({
      categoryId,
      featured,
      popular,
      search,
    })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}

