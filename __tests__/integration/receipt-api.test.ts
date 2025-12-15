/**
 * @jest-environment node
 */
import { GET as getReceipt } from '@/app/api/orders/[id]/receipt/route'
import { orderService } from '@/services/order-service'
import { generateReceiptHTML } from '@/lib/receipt-generator'
import { NextRequest } from 'next/server'

jest.mock('@/services/order-service', () => ({
  orderService: {
    getOrderById: jest.fn(),
  },
}))

jest.mock('@/lib/receipt-generator', () => ({
  generateReceiptHTML: jest.fn(),
}))

const createMockRequest = (url: string, method = 'GET') => {
  const urlObj = new URL(url)
  return {
    url,
    method,
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Receipt API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return receipt html when order exists', async () => {
    ;(orderService.getOrderById as jest.Mock).mockResolvedValue({
      id: 'order1',
      orderNumber: 'ORD-1001',
      placedAt: new Date().toISOString(),
      customerName: 'John Doe',
      type: 'DELIVERY',
      items: [{ name: 'Item 1', quantity: 1, price: 12.5 }],
      subtotal: 12.5,
      tax: 1.0,
      deliveryFee: 3.0,
      tip: 0,
      discount: 0,
      total: 16.5,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
    })
    ;(generateReceiptHTML as jest.Mock).mockReturnValue('<html>receipt</html>')

    const request = createMockRequest('http://localhost:3000/api/orders/order1/receipt')
    const response = await getReceipt(request, { params: Promise.resolve({ id: 'order1' }) })

    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('receipt')
  })

  it('should return 404 when order not found', async () => {
    ;(orderService.getOrderById as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest('http://localhost:3000/api/orders/missing/receipt')
    const response = await getReceipt(request, { params: Promise.resolve({ id: 'missing' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Order not found')
  })

  it('should handle errors', async () => {
    ;(orderService.getOrderById as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/orders/order1/receipt')
    const response = await getReceipt(request, { params: Promise.resolve({ id: 'order1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate receipt')
  })

  it('should handle render errors', async () => {
    ;(orderService.getOrderById as jest.Mock).mockResolvedValue({
      id: 'order1',
      orderNumber: 'ORD-1001',
      placedAt: new Date().toISOString(),
      customerName: 'John Doe',
      type: 'DELIVERY',
      items: [],
      subtotal: 0,
      tax: 0,
      deliveryFee: 0,
      tip: 0,
      discount: 0,
      total: 0,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
    })
    ;(generateReceiptHTML as jest.Mock).mockImplementation(() => {
      throw new Error('render fail')
    })

    const request = createMockRequest('http://localhost:3000/api/orders/order1/receipt')
    const response = await getReceipt(request, { params: Promise.resolve({ id: 'order1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate receipt')
  })
})


