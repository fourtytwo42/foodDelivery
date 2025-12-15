/**
 * @jest-environment node
 */
import { POST as createCoupon, GET as getCoupons } from '@/app/api/coupons/route'
import { GET as getCouponById } from '@/app/api/coupons/[id]/route'
import { POST as validateCoupon } from '@/app/api/coupons/validate/route'
import { POST as applyCoupon } from '@/app/api/coupons/apply/route'
import { couponService } from '@/services/coupon-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/coupon-service', () => ({
  couponService: {
    createCoupon: jest.fn(),
    getCoupons: jest.fn(),
    getCouponById: jest.fn(),
    getCouponByCode: jest.fn(),
    validateCoupon: jest.fn(),
    calculateDiscount: jest.fn(),
    applyCoupon: jest.fn(),
  },
}))

const createMockRequest = (url: string, body?: unknown, method = 'GET') => {
  const urlObj = new URL(url)
  return {
    url,
    method,
    json: async () => body,
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Coupons API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/coupons', () => {
    it('should create a coupon', async () => {
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountValue: 10,
      }

      ;(couponService.createCoupon as jest.Mock).mockResolvedValue(mockCoupon)

      const request = createMockRequest(
        'http://localhost:3000/api/coupons',
        {
          code: 'SAVE10',
          name: '10% Off',
          type: 'PERCENTAGE',
          discountValue: 10,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        },
        'POST'
      )

      const response = await createCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.coupon).toEqual(mockCoupon)
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/coupons',
        {
          code: '', // Invalid: empty code
          name: '10% Off',
          type: 'PERCENTAGE',
        },
        'POST'
      )

      const response = await createCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle duplicate code error', async () => {
      ;(couponService.createCoupon as jest.Mock).mockRejectedValue(
        new Error('Coupon code already exists')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/coupons',
        {
          code: 'SAVE10',
          name: '10% Off',
          type: 'PERCENTAGE',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        },
        'POST'
      )

      const response = await createCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Coupon code already exists')
    })
  })

  describe('GET /api/coupons', () => {
    it('should return coupons', async () => {
      const mockCoupons = [{ id: 'coupon1', code: 'SAVE10' }]
      ;(couponService.getCoupons as jest.Mock).mockResolvedValue(mockCoupons)

      const request = createMockRequest('http://localhost:3000/api/coupons')
      const response = await getCoupons(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.coupons).toEqual(mockCoupons)
    })

    it('should filter coupons by status', async () => {
      const mockCoupons = [{ id: 'coupon1', code: 'SAVE10', status: 'ACTIVE' }]
      ;(couponService.getCoupons as jest.Mock).mockResolvedValue(mockCoupons)

      const request = createMockRequest('http://localhost:3000/api/coupons?status=ACTIVE')
      const response = await getCoupons(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(couponService.getCoupons).toHaveBeenCalledWith({
        status: 'ACTIVE',
        active: undefined,
      })
      expect(data.coupons).toEqual(mockCoupons)
    })

    it('should filter active coupons', async () => {
      const mockCoupons = [{ id: 'coupon1', code: 'SAVE10', status: 'ACTIVE' }]
      ;(couponService.getCoupons as jest.Mock).mockResolvedValue(mockCoupons)

      const request = createMockRequest('http://localhost:3000/api/coupons?active=true')
      const response = await getCoupons(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(couponService.getCoupons).toHaveBeenCalledWith({
        status: undefined,
        active: true,
      })
      expect(data.coupons).toEqual(mockCoupons)
    })
  })

  describe('GET /api/coupons/[id]', () => {
    it('should return coupon by ID', async () => {
      const mockCoupon = { id: 'coupon1', code: 'SAVE10' }
      ;(couponService.getCouponById as jest.Mock).mockResolvedValue(mockCoupon)

      const request = createMockRequest('http://localhost:3000/api/coupons/coupon1')
      const response = await getCouponById(request, {
        params: Promise.resolve({ id: 'coupon1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.coupon).toEqual(mockCoupon)
    })

    it('should return 404 when coupon not found', async () => {
      ;(couponService.getCouponById as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/coupons/coupon1')
      const response = await getCouponById(request, {
        params: Promise.resolve({ id: 'coupon1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Coupon not found')
    })
  })

  describe('POST /api/coupons/validate', () => {
    it('should validate coupon and return discount', async () => {
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountValue: 10,
      }

      ;(couponService.validateCoupon as jest.Mock).mockResolvedValue({
        valid: true,
        coupon: mockCoupon,
      })
      ;(couponService.calculateDiscount as jest.Mock).mockReturnValue(10.0)

      const request = createMockRequest(
        'http://localhost:3000/api/coupons/validate',
        {
          couponCode: 'SAVE10',
          orderSubtotal: 100.0,
        },
        'POST'
      )

      const response = await validateCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.discount).toBe(10.0)
      expect(data.coupon).toEqual(mockCoupon)
    })

    it('should return error for invalid coupon', async () => {
      ;(couponService.validateCoupon as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Coupon has expired',
      })

      const request = createMockRequest(
        'http://localhost:3000/api/coupons/validate',
        {
          couponCode: 'SAVE10',
          orderSubtotal: 100.0,
        },
        'POST'
      )

      const response = await validateCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.valid).toBe(false)
      expect(data.error).toBe('Coupon has expired')
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/coupons/validate',
        {
          couponCode: '', // Invalid: empty string
          orderSubtotal: 100.0,
        },
        'POST'
      )

      const response = await validateCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors when validating coupon', async () => {
      ;(couponService.validateCoupon as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/coupons/validate',
        {
          couponCode: 'SAVE10',
          orderSubtotal: 100.0,
        },
        'POST'
      )

      const response = await validateCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to validate coupon')
    })
  })

  describe('POST /api/coupons/apply', () => {
    it('should apply coupon and return discount', async () => {
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountValue: 10,
      }

      ;(couponService.applyCoupon as jest.Mock).mockResolvedValue({
        success: true,
        discount: 10.0,
        coupon: mockCoupon,
      })

      const request = createMockRequest(
        'http://localhost:3000/api/coupons/apply',
        {
          couponCode: 'SAVE10',
          orderSubtotal: 100.0,
          orderItems: [],
        },
        'POST'
      )

      const response = await applyCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.discount).toBe(10.0)
      expect(data.coupon).toEqual(mockCoupon)
    })

    it('should return error for failed application', async () => {
      ;(couponService.applyCoupon as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Coupon has expired',
      })

      const request = createMockRequest(
        'http://localhost:3000/api/coupons/apply',
        {
          couponCode: 'SAVE10',
          orderSubtotal: 100.0,
          orderItems: [],
        },
        'POST'
      )

      const response = await applyCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Coupon has expired')
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/coupons/apply',
        {
          couponCode: '', // Invalid: empty string
          orderSubtotal: 100.0,
          orderItems: [],
        },
        'POST'
      )

      const response = await applyCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors when applying coupon', async () => {
      ;(couponService.applyCoupon as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/coupons/apply',
        {
          couponCode: 'SAVE10',
          orderSubtotal: 100.0,
          orderItems: [],
        },
        'POST'
      )

      const response = await applyCoupon(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to apply coupon')
    })
  })
})

