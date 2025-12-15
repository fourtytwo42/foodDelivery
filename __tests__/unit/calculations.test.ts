import {
  calculateTax,
  calculateDeliveryFee,
  calculateOrderTotal,
  getOrderCalculations,
  decimalToNumber,
} from '@/lib/calculations'

describe('Order Calculations', () => {
  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      const subtotal = 100
      const taxRate = 0.0825 // 8.25%
      const tax = calculateTax(subtotal, taxRate)
      expect(tax).toBe(8.25)
    })

    it('should handle zero subtotal', () => {
      const tax = calculateTax(0, 0.0825)
      expect(tax).toBe(0)
    })

    it('should handle zero tax rate', () => {
      const tax = calculateTax(100, 0)
      expect(tax).toBe(0)
    })
  })

  describe('calculateDeliveryFee', () => {
    it('should return 0 when order subtotal is below minimum', () => {
      const fee = calculateDeliveryFee(undefined, 50, 30) // minOrderAmount=50, orderSubtotal=30
      expect(fee).toBe(0)
    })

    it('should return default fee when order subtotal meets minimum', () => {
      const fee = calculateDeliveryFee(undefined, 50, 50) // minOrderAmount=50, orderSubtotal=50
      expect(fee).toBe(3.99)
    })

    it('should return default fee when minOrderAmount is undefined', () => {
      const fee = calculateDeliveryFee(undefined, undefined, 30)
      expect(fee).toBe(3.99)
    })

    it('should return default fee when orderSubtotal is undefined', () => {
      const fee = calculateDeliveryFee(undefined, 50, undefined)
      expect(fee).toBe(3.99)
    })

    it('should return default fee when all parameters are undefined', () => {
      const fee = calculateDeliveryFee()
      expect(fee).toBe(3.99)
    })

    it('should return default fee when order subtotal exceeds minimum', () => {
      const fee = calculateDeliveryFee(undefined, 50, 60) // minOrderAmount=50, orderSubtotal=60
      expect(fee).toBe(3.99)
    })
  })

  describe('calculateOrderTotal', () => {
    it('should calculate total correctly with all fees', () => {
      const subtotal = 100
      const taxRate = 0.0825
      const deliveryFee = 3.99
      const tip = 5
      const discount = 10
      const total = calculateOrderTotal(
        subtotal,
        taxRate,
        deliveryFee,
        tip,
        discount
      )
      // 100 + 8.25 (tax) + 3.99 (delivery) + 5 (tip) - 10 (discount) = 107.24
      expect(total).toBeCloseTo(107.24, 2)
    })

    it('should never return negative total', () => {
      const subtotal = 10
      const taxRate = 0.0825
      const deliveryFee = 0
      const tip = 0
      const discount = 100 // Large discount
      const total = calculateOrderTotal(
        subtotal,
        taxRate,
        deliveryFee,
        tip,
        discount
      )
      expect(total).toBe(0)
    })

    it('should handle pickup order (no delivery fee)', () => {
      const subtotal = 100
      const taxRate = 0.0825
      const deliveryFee = 0
      const tip = 0
      const discount = 0
      const total = calculateOrderTotal(
        subtotal,
        taxRate,
        deliveryFee,
        tip,
        discount
      )
      expect(total).toBe(108.25)
    })
  })

  describe('getOrderCalculations', () => {
    it('should return all calculations correctly for DELIVERY', () => {
      const subtotal = 100
      const taxRate = 0.0825
      const deliveryFee = 3.99
      const tip = 5
      const discount = 10

      const calculations = getOrderCalculations(
        subtotal,
        taxRate,
        deliveryFee,
        tip,
        discount,
        'DELIVERY'
      )

      expect(calculations.subtotal).toBe(100)
      expect(calculations.tax).toBe(8.25)
      expect(calculations.deliveryFee).toBe(3.99)
      expect(calculations.tip).toBe(5)
      expect(calculations.discount).toBe(10)
      expect(calculations.total).toBeCloseTo(107.24, 2)
    })

    it('should return 0 delivery fee for PICKUP orders', () => {
      const calculations = getOrderCalculations(
        100,
        0.0825,
        3.99,
        5,
        0,
        'PICKUP'
      )

      expect(calculations.deliveryFee).toBe(0)
      expect(calculations.total).toBeCloseTo(113.25, 2) // 100 + 8.25 + 5
    })

    it('should apply discount correctly', () => {
      const calculations = getOrderCalculations(
        100,
        0.0825,
        3.99,
        5,
        10,
        'DELIVERY'
      )

      expect(calculations.discount).toBe(10)
      expect(calculations.total).toBeCloseTo(107.24, 2) // 100 + 8.25 + 3.99 + 5 - 10
    })
  })

  describe('decimalToNumber', () => {
    it('should convert number to number', () => {
      expect(decimalToNumber(10.5)).toBe(10.5)
    })

    it('should convert string to number', () => {
      expect(decimalToNumber('10.5')).toBe(10.5)
    })

    it('should handle Decimal type', () => {
      // Mock Decimal-like object
      const mockDecimal = {
        toString: () => '10.5',
      }
      expect(decimalToNumber(mockDecimal as any)).toBe(10.5)
    })

    it('should handle object with toNumber method', () => {
      const mockDecimal = {
        toNumber: () => 10.5,
      }
      expect(decimalToNumber(mockDecimal as any)).toBe(10.5)
    })

    it('should handle string numbers', () => {
      expect(decimalToNumber('123.45')).toBe(123.45)
    })

    it('should handle negative numbers', () => {
      expect(decimalToNumber(-10.5)).toBe(-10.5)
      expect(decimalToNumber('-10.5')).toBe(-10.5)
    })
  })
})

