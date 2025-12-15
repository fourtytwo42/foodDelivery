import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services/order-service'
import { getOrderCalculations } from '@/lib/calculations'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createOrderSchema = z.object({
  userId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),
  type: z.enum(['DELIVERY', 'PICKUP']),
  items: z.array(
    z.object({
      menuItemId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      quantity: z.number().int().positive(),
      modifiers: z.array(
        z.object({
          modifierId: z.string(),
          modifierName: z.string(),
          optionId: z.string(),
          optionName: z.string(),
          price: z.number(),
        })
      ),
      specialInstructions: z.string().optional(),
    })
  ),
  deliveryAddressId: z.string().optional(),
  deliveryAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string().optional(),
    })
    .optional(),
  specialInstructions: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  tip: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createOrderSchema.parse(body)

    // Get restaurant settings for tax rate and delivery fee
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'default' },
    })

    const taxRate = settings?.taxRate ? Number(settings.taxRate) : 0.0825
    const minOrderAmount = settings?.minOrderAmount
      ? Number(settings.minOrderAmount)
      : 0

    // Calculate subtotal from items
    const subtotal = data.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      const modifierTotal = item.modifiers.reduce(
        (modSum, mod) => modSum + mod.price * item.quantity,
        0
      )
      return sum + itemTotal + modifierTotal
    }, 0)

    // Validate minimum order amount
    if (minOrderAmount > 0 && subtotal < minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount is $${minOrderAmount.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Calculate delivery fee (simplified - 0 for pickup, fixed for delivery)
    const deliveryFee = data.type === 'DELIVERY' ? 3.99 : 0

    // Calculate tax, total
    const calculations = getOrderCalculations(
      subtotal,
      taxRate,
      deliveryFee,
      data.tip || 0,
      data.discount || 0,
      data.type
    )

    // Create order
    const order = await orderService.createOrder({
      userId: data.userId,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      type: data.type,
      items: data.items,
      subtotal: calculations.subtotal,
      tax: calculations.tax,
      deliveryFee: calculations.deliveryFee,
      tip: calculations.tip,
      discount: calculations.discount,
      total: calculations.total,
      deliveryAddressId: data.deliveryAddressId,
      deliveryAddress: data.deliveryAddress,
      specialInstructions: data.specialInstructions,
      deliveryInstructions: data.deliveryInstructions,
    })

    return NextResponse.json({ success: true, order }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const status = searchParams.get('status') || undefined
    const type = searchParams.get('type') || undefined

    const orders = await orderService.getOrders({
      userId,
      status,
      type,
    })

    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

