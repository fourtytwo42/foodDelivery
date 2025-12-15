import { render, screen, fireEvent } from '@testing-library/react'
import { MenuItemCard } from '@/components/MenuItemCard'

describe('MenuItemCard', () => {
  const mockItem = {
    id: '1',
    name: 'Pizza',
    description: 'Delicious pizza',
    price: 14.99,
    featured: false,
    popular: false,
  }

  it('should render menu item details', () => {
    render(<MenuItemCard {...mockItem} />)

    expect(screen.getByText('Pizza')).toBeInTheDocument()
    expect(screen.getByText('Delicious pizza')).toBeInTheDocument()
    expect(screen.getByText('$14.99')).toBeInTheDocument()
  })

  it('should display featured badge when featured', () => {
    render(<MenuItemCard {...mockItem} featured={true} />)

    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('should display popular badge when popular', () => {
    render(<MenuItemCard {...mockItem} popular={true} />)

    expect(screen.getByText('Popular')).toBeInTheDocument()
  })

  it('should display dietary tags', () => {
    render(
      <MenuItemCard
        {...mockItem}
        dietaryTags={['vegetarian', 'vegan']}
      />
    )

    expect(screen.getByText('vegetarian')).toBeInTheDocument()
    expect(screen.getByText('vegan')).toBeInTheDocument()
  })

  it('should display allergens', () => {
    render(
      <MenuItemCard
        {...mockItem}
        allergens={['dairy', 'gluten']}
      />
    )

    expect(screen.getByText(/Contains:/)).toBeInTheDocument()
    expect(screen.getByText(/dairy/)).toBeInTheDocument()
    expect(screen.getByText(/gluten/)).toBeInTheDocument()
  })

  it('should call onAddToCart when Add to Cart button is clicked', () => {
    const mockAddToCart = jest.fn()
    render(
      <MenuItemCard
        {...mockItem}
        onAddToCart={mockAddToCart}
        showAddButton={true}
      />
    )

    const addButton = screen.getByText('Add to Cart')
    fireEvent.click(addButton)

    expect(mockAddToCart).toHaveBeenCalledWith('1')
  })

  it('should not show Add to Cart button when showAddButton is false', () => {
    render(
      <MenuItemCard
        {...mockItem}
        showAddButton={false}
      />
    )

    expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument()
  })

  it('should handle string price', () => {
    render(<MenuItemCard {...mockItem} price="15.50" />)

    expect(screen.getByText('15.50')).toBeInTheDocument()
  })

  it('should handle missing image with placeholder', () => {
    render(<MenuItemCard {...mockItem} />)

    const placeholder = screen.getByText('🍽️')
    expect(placeholder).toBeInTheDocument()
  })

  it('should display image when provided', () => {
    render(<MenuItemCard {...mockItem} image="https://example.com/pizza.jpg" />)

    const image = screen.getByAltText('Pizza')
    expect(image).toHaveAttribute('src', 'https://example.com/pizza.jpg')
  })
})

