import type { Metadata } from 'next'
import { Cart } from '@/components/cart/Cart'
import { CartButton } from '@/components/cart/CartButton'
import './globals.css'

export const metadata: Metadata = {
  title: 'Food Delivery App',
  description: 'Order food online',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <a href="/" className="text-xl font-bold text-indigo-600">
                Food Delivery
              </a>
              <div className="flex items-center gap-4">
                <a
                  href="/menu"
                  className="text-gray-700 hover:text-indigo-600"
                >
                  Menu
                </a>
                <CartButton />
              </div>
            </div>
          </div>
        </nav>
        {children}
        <Cart />
      </body>
    </html>
  )
}
