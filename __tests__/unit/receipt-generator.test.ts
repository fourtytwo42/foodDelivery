import { generateReceiptHTML, ReceiptData } from '@/lib/receipt-generator'

describe('Receipt Generator', () => {
  const mockReceiptData: ReceiptData = {
    orderNumber: 'ORD-123',
    orderDate: '2024-01-15 12:00 PM',
    customerName: 'John Doe',
    orderType: 'DELIVERY',
    items: [
      { name: 'Pizza', quantity: 2, price: 14.99 },
      { name: 'Salad', quantity: 1, price: 8.99 },
    ],
    subtotal: 38.97,
    tax: 3.22,
    deliveryFee: 3.99,
    tip: 5.0,
    discount: 0,
    total: 51.18,
    paymentMethod: 'STRIPE',
    paymentStatus: 'PAID',
  }

  describe('generateReceiptHTML', () => {
    it('should generate receipt HTML with all fields', () => {
      const html = generateReceiptHTML(mockReceiptData)

      expect(html).toContain('ORD-123')
      expect(html).toContain('John Doe')
      expect(html).toContain('DELIVERY')
      expect(html).toContain('Pizza')
      expect(html).toContain('Salad')
      expect(html).toContain('$38.97')
      expect(html).toContain('$3.22')
      expect(html).toContain('$3.99')
      expect(html).toContain('$5.00')
      expect(html).toContain('$51.18')
      expect(html).toContain('STRIPE')
      expect(html).toContain('PAID')
    })

    it('should handle receipt without customer name', () => {
      const dataWithoutCustomer = {
        ...mockReceiptData,
        customerName: undefined,
      }

      const html = generateReceiptHTML(dataWithoutCustomer)

      expect(html).not.toContain('Customer:')
    })

    it('should handle receipt without delivery fee', () => {
      const dataWithoutDeliveryFee = {
        ...mockReceiptData,
        deliveryFee: 0,
      }

      const html = generateReceiptHTML(dataWithoutDeliveryFee)

      expect(html).not.toContain('Delivery Fee:')
    })

    it('should handle receipt without tip', () => {
      const dataWithoutTip = {
        ...mockReceiptData,
        tip: 0,
      }

      const html = generateReceiptHTML(dataWithoutTip)

      expect(html).not.toContain('Tip:')
    })

    it('should handle receipt without discount', () => {
      const dataWithoutDiscount = {
        ...mockReceiptData,
        discount: 0,
      }

      const html = generateReceiptHTML(dataWithoutDiscount)

      expect(html).not.toContain('Discount:')
    })

    it('should handle receipt without payment info', () => {
      const dataWithoutPayment = {
        ...mockReceiptData,
        paymentMethod: undefined,
        paymentStatus: undefined,
      }

      const html = generateReceiptHTML(dataWithoutPayment)

      expect(html).not.toContain('Payment Method:')
      expect(html).not.toContain('Payment Status:')
    })

    it('should format prices correctly', () => {
      const html = generateReceiptHTML(mockReceiptData)

      // Check that prices are formatted with 2 decimal places
      expect(html).toMatch(/\$\d+\.\d{2}/)
    })

    it('should include all items in receipt', () => {
      const html = generateReceiptHTML(mockReceiptData)

      const itemCount = (html.match(/Pizza|Salad/g) || []).length
      expect(itemCount).toBeGreaterThanOrEqual(2) // Items appear at least once in the HTML
    })

    it('should calculate item totals correctly', () => {
      const html = generateReceiptHTML(mockReceiptData)

      // Pizza: 14.99 * 2 = 29.98
      expect(html).toContain('$29.98')
      // Salad: 8.99 * 1 = 8.99
      expect(html).toContain('$8.99')
    })
  })
})

