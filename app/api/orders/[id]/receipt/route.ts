import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services/order-service'
import { generateReceiptHTML } from '@/lib/receipt-generator'
import { decimalToNumber } from '@/lib/calculations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await orderService.getOrderById(id)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const receiptData = {
      orderNumber: order.orderNumber,
      orderDate: new Date(order.placedAt).toLocaleString(),
      customerName: order.customerName,
      orderType: order.type,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: decimalToNumber(item.price),
      })),
      subtotal: decimalToNumber(order.subtotal),
      tax: decimalToNumber(order.tax),
      deliveryFee: decimalToNumber(order.deliveryFee),
      tip: decimalToNumber(order.tip),
      discount: decimalToNumber(order.discount),
      total: decimalToNumber(order.total),
      paymentMethod: order.paymentMethod || undefined,
      paymentStatus: order.paymentStatus || undefined,
    }

    const html = generateReceiptHTML(receiptData)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}

