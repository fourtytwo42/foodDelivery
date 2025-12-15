import { render, screen } from '@testing-library/react'
import { MenuCategoryCard } from '@/components/MenuCategoryCard'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('MenuCategoryCard', () => {
  const mockCategory = {
    id: '1',
    name: 'Appetizers',
    description: 'Start your meal right',
  }

  it('should render category details', () => {
    render(<MenuCategoryCard {...mockCategory} />)

    expect(screen.getByText('Appetizers')).toBeInTheDocument()
    expect(screen.getByText('Start your meal right')).toBeInTheDocument()
  })

  it('should link to menu page with category filter', () => {
    render(<MenuCategoryCard {...mockCategory} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/menu?category=1')
  })

  it('should display item count when provided', () => {
    render(<MenuCategoryCard {...mockCategory} itemCount={5} />)

    expect(screen.getByText('5 items')).toBeInTheDocument()
  })

  it('should handle missing image with placeholder', () => {
    render(<MenuCategoryCard {...mockCategory} />)

    const placeholder = screen.getByText('📷')
    expect(placeholder).toBeInTheDocument()
  })

  it('should display image when provided', () => {
    render(
      <MenuCategoryCard
        {...mockCategory}
        image="https://example.com/appetizers.jpg"
      />
    )

    const image = screen.getByAltText('Appetizers')
    expect(image).toHaveAttribute('src', 'https://example.com/appetizers.jpg')
  })

  it('should handle missing description', () => {
    render(<MenuCategoryCard id="1" name="Entrees" />)

    expect(screen.getByText('Entrees')).toBeInTheDocument()
    expect(screen.queryByText(/Start your meal/)).not.toBeInTheDocument()
  })
})

