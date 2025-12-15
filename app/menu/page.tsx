'use client'

import { useEffect, useState } from 'react'
import { MenuCategoryCard } from '@/components/MenuCategoryCard'
import { MenuItemCard } from '@/components/MenuItemCard'

interface Category {
  id: string
  name: string
  description?: string | null
  image?: string | null
  items?: Array<{ id: string }>
}

interface MenuItem {
  id: string
  name: string
  description?: string | null
  image?: string | null
  price: number | string
  featured?: boolean
  popular?: boolean
  dietaryTags?: string[]
  allergens?: string[]
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchItems()
  }, [])

  useEffect(() => {
    if (selectedCategory || searchTerm) {
      fetchItems(selectedCategory || undefined, searchTerm || undefined)
    } else {
      fetchItems()
    }
  }, [selectedCategory, searchTerm])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchItems = async (categoryId?: string, search?: string) => {
    try {
      const params = new URLSearchParams()
      if (categoryId) params.append('categoryId', categoryId)
      if (search) params.append('search', search)

      const response = await fetch(`/api/menu/items?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cart functionality is now handled by MenuItemCard using cart store

  const filteredItems = items.filter((item) => {
    if (selectedCategory) {
      return true // Already filtered by API
    }
    if (searchTerm) {
      return (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Menu</h1>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading menu...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No items found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                id={item.id}
                menuItemId={item.id}
                name={item.name}
                description={item.description}
                image={item.image}
                price={item.price}
                featured={item.featured}
                popular={item.popular}
                dietaryTags={item.dietaryTags}
                allergens={item.allergens}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

