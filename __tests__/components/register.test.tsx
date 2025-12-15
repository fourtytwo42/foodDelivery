import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import RegisterPage from '@/app/register/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

global.fetch = jest.fn()

describe('RegisterPage', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
  })

  it('should render register form', () => {
    render(<RegisterPage />)
    
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password (min 8 characters)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    const emailInput = screen.getByPlaceholderText('Email address')
    const passwordInput = screen.getByPlaceholderText('Password (min 8 characters)')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByRole('button', { name: /register/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'different')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('should show error when password is too short', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    const emailInput = screen.getByPlaceholderText('Email address')
    const passwordInput = screen.getByPlaceholderText('Password (min 8 characters)')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByRole('button', { name: /register/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'short')
    await user.type(confirmPasswordInput, 'short')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('should call register API on form submit', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: '123', email: 'newuser@example.com' },
      }),
    })

    render(<RegisterPage />)
    
    const emailInput = screen.getByPlaceholderText('Email address')
    const passwordInput = screen.getByPlaceholderText('Password (min 8 characters)')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByRole('button', { name: /register/i })
    
    await user.type(emailInput, 'newuser@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )
    
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining('newuser@example.com'),
    })
  })

  it('should display error message on registration failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'User with this email already exists' }),
    })

    render(<RegisterPage />)
    
    const emailInput = screen.getByPlaceholderText('Email address')
    const passwordInput = screen.getByPlaceholderText('Password (min 8 characters)')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByRole('button', { name: /register/i })
    
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('User with this email already exists')).toBeInTheDocument()
    })
  })

  it('should redirect to dashboard on successful registration', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: '123', email: 'newuser@example.com' },
      }),
    })

    render(<RegisterPage />)
    
    const emailInput = screen.getByPlaceholderText('Email address')
    const passwordInput = screen.getByPlaceholderText('Password (min 8 characters)')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByRole('button', { name: /register/i })
    
    await user.type(emailInput, 'newuser@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      },
      { timeout: 3000 }
    )
  })

  it('should have link to login page', () => {
    render(<RegisterPage />)
    
    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toHaveAttribute('href', '/login')
  })
})

