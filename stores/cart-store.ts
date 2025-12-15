import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartModifier {
  modifierId: string
  modifierName: string
  optionId: string
  optionName: string
  price: number
}

export interface CartItem {
  id: string
  menuItemId: string
  name: string
  description?: string
  image?: string
  price: number
  quantity: number
  modifiers: CartModifier[]
  specialInstructions?: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  
  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateItemQuantity: (id: string, quantity: number) => void
  updateItemModifiers: (id: string, modifiers: CartModifier[]) => void
  updateItemSpecialInstructions: (id: string, instructions: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  
  // Computed
  getItemCount: () => number
  getSubtotal: () => number
  getTotalWithTaxAndFees: (taxRate: number, deliveryFee: number, tip: number, discount: number) => number
}

let itemIdCounter = 0

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const existingItemIndex = get().items.findIndex(
          (i) =>
            i.menuItemId === item.menuItemId &&
            JSON.stringify(i.modifiers.sort((a, b) => a.modifierId.localeCompare(b.modifierId))) ===
              JSON.stringify(item.modifiers.sort((a, b) => a.modifierId.localeCompare(b.modifierId)))
        )

        if (existingItemIndex >= 0) {
          // Item with same modifiers exists, increase quantity
          const existingItem = get().items[existingItemIndex]
          set({
            items: get().items.map((i, idx) =>
              idx === existingItemIndex
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          })
        } else {
          // New item, add to cart
          const newItem: CartItem = {
            ...item,
            id: `cart-item-${++itemIdCounter}-${Date.now()}`,
            quantity: item.quantity || 1,
          }
          set({ items: [...get().items, newItem] })
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) })
      },

      updateItemQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })
      },

      updateItemModifiers: (id, modifiers) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, modifiers } : item
          ),
        })
      },

      updateItemSpecialInstructions: (id, instructions) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, specialInstructions: instructions } : item
          ),
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen })
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const itemTotal = item.price * item.quantity
          const modifierTotal = item.modifiers.reduce(
            (modSum, mod) => modSum + mod.price * item.quantity,
            0
          )
          return sum + itemTotal + modifierTotal
        }, 0)
      },

      getTotalWithTaxAndFees: (taxRate, deliveryFee, tip, discount) => {
        const subtotal = get().getSubtotal()
        const tax = subtotal * taxRate
        const total = subtotal + tax + deliveryFee + tip - discount
        return Math.max(0, total)
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items, not isOpen
    }
  )
)

