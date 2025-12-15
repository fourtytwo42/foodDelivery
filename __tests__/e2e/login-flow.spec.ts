import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should display login page with demo accounts', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.getByText('Sign in to your account')).toBeVisible()
    await expect(page.getByPlaceholderText('Email address')).toBeVisible()
    await expect(page.getByPlaceholderText('Password')).toBeVisible()
    await expect(page.getByText('Demo Accounts')).toBeVisible()
  })

  test('should fill credentials when demo account button is clicked', async ({ page }) => {
    await page.goto('/login')
    
    // Click on "Login as Admin" button
    await page.getByRole('button', { name: /login as admin/i }).click()
    
    // Verify fields are filled
    const emailInput = page.getByPlaceholderText('Email address')
    const passwordInput = page.getByPlaceholderText('Password')
    
    await expect(emailInput).toHaveValue('admin@demo.com')
    await expect(passwordInput).toHaveValue('demo123')
  })

  test('should login successfully with demo account', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in credentials
    await page.getByPlaceholderText('Email address').fill('admin@demo.com')
    await page.getByPlaceholderText('Password').fill('demo123')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.getByPlaceholderText('Email address').fill('invalid@example.com')
    await page.getByPlaceholderText('Password').fill('wrongpassword')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should fill all demo account buttons correctly', async ({ page }) => {
    await page.goto('/login')
    
    const demoAccounts = [
      { button: /login as admin/i, email: 'admin@demo.com' },
      { button: /login as manager/i, email: 'manager@demo.com' },
      { button: /login as staff/i, email: 'staff@demo.com' },
      { button: /login as driver/i, email: 'driver@demo.com' },
      { button: /login as customer/i, email: 'customer@demo.com' },
    ]
    
    for (const account of demoAccounts) {
      await page.getByRole('button', { name: account.button }).click()
      await expect(page.getByPlaceholderText('Email address')).toHaveValue(account.email)
      await expect(page.getByPlaceholderText('Password')).toHaveValue('demo123')
    }
  })

  test('should redirect to register page', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByRole('link', { name: /register/i }).click()
    
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByText(/create your account/i)).toBeVisible()
  })
})

