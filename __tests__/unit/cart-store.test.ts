import { useCartStore, CartItem } from '@/stores/cart-store'
import { act, renderHook } from '@testing-library/react'

// Mock zustand persist middleware
jest.mock('zustand/middleware', () => ({
  persist: (config: any) => config,
}))

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useCartStore())
    act(() => {
      result.current.clearCart()
    })
  })

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [],
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].name).toBe('Pizza')
      expect(result.current.items[0].quantity).toBe(1)
    })

    it('should increment quantity for existing item with same modifiers', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [],
        })
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [],
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)
    })

    it('should create separate items for different modifiers', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [
            {
              modifierId: 'mod1',
              modifierName: 'Size',
              optionId: 'opt1',
              optionName: 'Small',
              price: 0,
            },
          ],
        })
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [
            {
              modifierId: 'mod1',
              modifierName: 'Size',
              optionId: 'opt2',
              optionName: 'Large',
              price: 2,
            },
          ],
        })
      })

      expect(result.current.items).toHaveLength(2)
    })
  })

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [],
        })
      })

      const itemId = result.current.items[0].id

      act(() => {
        result.current.removeItem(itemId)
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('updateItemQuantity', () => {
    it('should update item quantity', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [],
        })
      })

      const itemId = result.current.items[0].id

      act(() => {
        result.current.updateItemQuantity(itemId, 3)
      })

      expect(result.current.items[0].quantity).toBe(3)
    })

    it('should remove item when quantity is 0', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [],
        })
      })

      const itemId = result.current.items[0].id

      act(() => {
        result.current.updateItemQuantity(itemId, 0)
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('getItemCount', () => {
    it('should return total item count', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [],
          quantity: 2,
        })
        result.current.addItem({
          menuItemId: 'item2',
          name: 'Burger',
          price: 11.99,
          modifiers: [],
          quantity: 3,
        })
      })

      expect(result.current.getItemCount()).toBe(5)
    })
  })

  describe('getSubtotal', () => {
    it('should calculate subtotal correctly', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 14.99,
          modifiers: [],
          quantity: 2,
        })
        result.current.addItem({
          menuItemId: 'item2',
          name: 'Burger',
          price: 11.99,
          modifiers: [
            {
              modifierId: 'mod1',
              modifierName: 'Toppings',
              optionId: 'opt1',
              optionName: 'Cheese',
              price: 1.5,
            },
          ],
          quantity: 1,
        })
      })

      // Pizza: 14.99 * 2 = 29.98
      // Burger: 11.99 * 1 + 1.5 * 1 = 13.49
      // Total: 43.47
      expect(result.current.getSubtotal()).toBeCloseTo(43.47, 2)
    })
  })

  describe('getTotalWithTaxAndFees', () => {
    it('should calculate total with tax and fees', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({
          menuItemId: 'item1',
          name: 'Pizza',
          price: 100,
          modifiers: [],
          quantity: 1,
        })
      })

      const total = result.current.getTotalWithTaxAndFees(
        0.0825, // tax rate
        3.99, // delivery fee
        5, // tip
        10 // discount
      )

      // 100 + 8.25 (tax) + 3.99 (delivery) + 5 (tip) - 10 (discount) = 107.24
      expect(total).toBeCloseTo(107.24, 2)
    })
  })

  describe('cart open/close', () => {
    it('should open and close cart', () => {
      const { result } = renderHook(() => useCartStore())

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.openCart()
      })

      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.closeCart()
      })

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.toggleCart()
      })

      expect(result.current.isOpen).toBe(true)
    })
  })
})

