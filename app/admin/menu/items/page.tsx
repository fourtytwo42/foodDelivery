'use client'

import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
}

interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number | string
  categoryId: string
  category?: { name: string }
  featured: boolean
  popular: boolean
  active: boolean
}

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    featured: false,
    popular: false,
  })

  useEffect(() => {
    fetchCategories()
    fetchItems()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/menu/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
        if (data.categories.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({
            ...prev,
            categoryId: data.categories[0].id,
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/admin/menu/items')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingItem
        ? `/api/admin/menu/items/${editingItem.id}`
        : '/api/admin/menu/items'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchItems()
        setShowForm(false)
        setEditingItem(null)
        setFormData({
          name: '',
          description: '',
          price: '',
          categoryId: categories[0]?.id || '',
          featured: false,
          popular: false,
        })
      }
    } catch (error) {
      console.error('Error saving item:', error)
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    const priceValue = typeof item.price === 'string' ? item.price : item.price.toString()
    setFormData({
      name: item.name,
      description: item.description || '',
      price: priceValue,
      categoryId: item.categoryId,
      featured: item.featured,
      popular: item.popular,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchItems()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingItem(null)
              setFormData({
                name: '',
                description: '',
                price: '',
                categoryId: categories[0]?.id || '',
                featured: false,
                popular: false,
              })
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Add Item
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem ? 'Edit Menu Item' : 'New Menu Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Featured
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) =>
                      setFormData({ ...formData, popular: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Popular
                </label>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingItem(null)
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Flags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${typeof item.price === 'string' ? item.price : Number(item.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {item.featured && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                            Featured
                          </span>
                        )}
                        {item.popular && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

