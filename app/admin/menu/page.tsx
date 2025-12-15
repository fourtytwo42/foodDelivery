'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  description?: string | null
  order: number
  active: boolean
  items?: Array<{ id: string }>
}

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/menu/categories?includeInactive=true')
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Menu Management</h1>
          <div className="flex gap-4">
            <Link
              href="/admin/menu/categories"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Manage Categories
            </Link>
            <Link
              href="/admin/menu/items"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Manage Items
            </Link>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Categories Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-4"
                >
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  {category.description && (
                    <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-2">
                    Order: {category.order} | {category.active ? 'Active' : 'Inactive'}
                  </p>
                  {category.items && (
                    <p className="text-gray-500 text-xs">
                      {category.items.length} items
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

