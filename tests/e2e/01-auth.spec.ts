import { test, expect } from '@playwright/test';
import { 
  registerPartner, 
  login, 
  logout, 
  TEST_CREDENTIALS,
  getAccessToken
} from '../helpers';

test.describe('Authentication Flows', () => {
  
  test('should register a new partner', async ({ page }) => {
    const uniqueEmail = `partner-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    
    await registerPartner(
      page,
      uniqueEmail,
      password,
      'Test Partner User',
      'Test Company Inc',
      '+86 138 0000 0000'
    );

    // After registration, should see success message or be logged in on dashboard
    const content = await page.content();
    const hasSuccess = content.includes('Registration Successful');
    const isOnDashboard = page.url().includes('/dashboard');
    expect(hasSuccess || isOnDashboard).toBeTruthy();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Use a pre-existing partner account
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
    
    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Should see dashboard heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should reject login with invalid email', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid email
    await page.locator('input[type="email"]').fill('nonexistent@test.com');
    await page.locator('input[type="password"]').fill('SomePassword123!');
    
    // Click Sign In
    await page.locator('button:has-text("Sign In")').click();
    
    // Should show error message (red box)
    const errorBox = page.locator('.bg-red-50, .bg-red-100');
    await expect(errorBox).toBeVisible({ timeout: 5000 });
  });

  test('should reject login with invalid password', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with valid email but wrong password
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.partner.email);
    await page.locator('input[type="password"]').fill('WrongPassword123!');
    
    // Click Sign In
    await page.locator('button:has-text("Sign In")').click();
    
    // Should show error message
    const errorBox = page.locator('.bg-red-50, .bg-red-100');
    await expect(errorBox).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
    
    // Verify we have a token
    const token = await getAccessToken(page);
    expect(token).toBeTruthy();
    
    // Now logout
    await logout(page);
    
    // Should be back on login page
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    
    // Token should be cleared
    const tokenAfter = await getAccessToken(page);
    expect(tokenAfter).toBeNull();
  });

  test('should prevent access to dashboard when not logged in', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should have access token after login', async ({ page }) => {
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
    
    // Check if access token is stored
    const token = await getAccessToken(page);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  test('should allow access to applications after login', async ({ page }) => {
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
    
    // Navigate to applications page
    await page.goto('/applications');
    
    // Should stay on applications page (not redirected to login)
    await expect(page).toHaveURL(/.*applications/, { timeout: 10000 });
  });
});
