import Link from 'next/link'

interface MenuCategoryCardProps {
  id: string
  name: string
  description?: string | null
  image?: string | null
  itemCount?: number
}

export function MenuCategoryCard({
  id,
  name,
  description,
  image,
  itemCount,
}: MenuCategoryCardProps) {
  return (
    <Link
      href={`/menu?category=${id}`}
      className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-4xl">📷</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{name}</h3>
        {description && (
          <p className="text-gray-600 text-sm mb-2">{description}</p>
        )}
        {itemCount !== undefined && (
          <p className="text-gray-500 text-xs">{itemCount} items</p>
        )}
      </div>
    </Link>
  )
}

