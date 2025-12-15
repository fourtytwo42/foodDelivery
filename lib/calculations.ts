import { Decimal } from '@prisma/client/runtime/library'

export interface OrderCalculations {
  subtotal: number
  tax: number
  deliveryFee: number
  tip: number
  discount: number
  total: number
}

/**
 * Calculate tax based on subtotal and tax rate
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * taxRate
}

/**
 * Calculate delivery fee based on distance and order amount
 * This is a simplified version - can be enhanced with zone-based pricing
 */
export function calculateDeliveryFee(
  distance?: number,
  minOrderAmount?: number,
  orderSubtotal?: number
): number {
  // If order is below minimum, return 0 (should be handled in validation)
  if (minOrderAmount && orderSubtotal && orderSubtotal < minOrderAmount) {
    return 0
  }

  // Simple flat fee for now - can be enhanced with distance-based calculations
  // For example: baseFee + (distance * ratePerMile)
  return 3.99 // Default delivery fee
}

/**
 * Calculate the total order amount including all fees
 */
export function calculateOrderTotal(
  subtotal: number,
  taxRate: number,
  deliveryFee: number,
  tip: number,
  discount: number
): number {
  const tax = calculateTax(subtotal, taxRate)
  const total = subtotal + tax + deliveryFee + tip - discount
  return Math.max(0, total) // Ensure total is never negative
}

/**
 * Get all order calculations in one function
 */
export function getOrderCalculations(
  subtotal: number,
  taxRate: number,
  deliveryFee: number,
  tip: number,
  discount: number,
  orderType: 'DELIVERY' | 'PICKUP'
): OrderCalculations {
  const tax = calculateTax(subtotal, taxRate)
  const finalDeliveryFee = orderType === 'PICKUP' ? 0 : deliveryFee
  const total = calculateOrderTotal(subtotal, taxRate, finalDeliveryFee, tip, discount)

  return {
    subtotal,
    tax,
    deliveryFee: finalDeliveryFee,
    tip,
    discount,
    total,
  }
}

/**
 * Convert Decimal to number for calculations
 */
export function decimalToNumber(value: Decimal | number | string | { toNumber?: () => number }): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  // Handle Prisma Decimal or mock objects with toNumber method
  if (value && typeof value === 'object' && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber()
  }
  return parseFloat(value.toString())
}

