'use client'

import { useCartStore } from '@/stores/cart-store'

interface MenuItemCardProps {
  id: string
  menuItemId?: string // For cart integration
  name: string
  description?: string | null
  image?: string | null
  price: number | string
  featured?: boolean
  popular?: boolean
  dietaryTags?: string[]
  allergens?: string[]
  onAddToCart?: (itemId: string) => void
  showAddButton?: boolean
}

export function MenuItemCard({
  id,
  menuItemId,
  name,
  description,
  image,
  price,
  featured,
  popular,
  dietaryTags,
  allergens,
  onAddToCart,
  showAddButton = true,
}: MenuItemCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)
  
  const priceNum = typeof price === 'string' ? parseFloat(price) : price
  const itemId = menuItemId || id

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(itemId)
    } else {
      // Default: add to cart using cart store
      addItem({
        menuItemId: itemId,
        name,
        description: description || undefined,
        image: image || undefined,
        price: priceNum,
        modifiers: [], // Will be enhanced with modifier selector later
      })
      openCart()
    }
  }
  const priceFormatted =
    typeof price === 'string' ? price : `$${Number(price).toFixed(2)}`

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-4xl">🍽️</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <span className="text-xl font-bold text-indigo-600">
            {priceFormatted}
          </span>
        </div>
        {description && (
          <p className="text-gray-600 text-sm mb-3">{description}</p>
        )}
        <div className="flex flex-wrap gap-2 mb-3">
          {featured && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              Featured
            </span>
          )}
          {popular && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
              Popular
            </span>
          )}
          {dietaryTags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        {allergens && allergens.length > 0 && (
          <p className="text-xs text-red-600 mb-3">
            Contains: {allergens.join(', ')}
          </p>
        )}
        {showAddButton && (
          <button
            onClick={handleAddToCart}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}

