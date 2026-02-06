import { expect, Page } from '@playwright/test';

/**
 * Test utilities for authentication and common operations
 * Built on actual frontend implementation (Register, Login, Dashboard pages)
 */

// Test credentials - these should exist in your backend
export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  },
  partner: {
    email: 'partner@hainanbuilder.com',
    password: 'PartnerPassword123!',
  },
  newPartner: {
    email: `partner-${Date.now()}@test.com`,
    password: 'NewPartner123password!', // Min 12 characters per Register.tsx
    fullName: 'Test Partner User',
    companyName: 'Test Company Ltd',
    phone: '+86 138 0000 0000',
  },
};

/**
 * Ensure backend is running and initialize test users
 * Run this once at the beginning of tests (e.g., in beforeAll hook)
 */
export async function ensureTestUsersExist() {
  const backendUrl = process.env.PLAYWRIGHT_TEST_BACKEND_URL || 'http://localhost:8000';
  const maxRetries = 5;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${backendUrl}/api/users/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok || response.status === 401) {
        // 401 is fine - backend is running, just need auth
        console.log('✓ Backend is responsive');
        return;
      }
    } catch (err) {
      if (i < maxRetries - 1) {
        console.log(`⏳ Waiting for backend (attempt ${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }
  
  throw new Error(
    `❌ Backend not responsive at ${backendUrl}\n` +
    `Please start the backend:\n` +
    `  cd backend && python manage.py migrate && python manage.py runserver`
  );
}

/**
 * Register a new partner via /register route
 * Matches actual Register.tsx implementation:
 * - Fields: fullName, companyName, email, phone (optional), password
 * - Button text: "Create Account"
 * - Success shows: "Registration Successful!" message and "Go to Login" link
 */
export async function registerPartner(
  page: Page,
  email: string,
  password: string,
  fullName: string,
  companyName: string,
  phone?: string
) {
  // Navigate to registration page and wait for form to be interactive
  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  // Fill registration form - inputs use state onChange, no name attributes
  // Full Name input (first text input likely)
  const fullNameInput = page.locator('input[type="text"]').first();
  await fullNameInput.fill(fullName);

  // Company Name input (second text input likely)
  const companyInput = page.locator('input[type="text"]').nth(1);
  await companyInput.fill(companyName);

  // Email input (type="email)
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill(email);

  // Phone input (optional, type="tel")
  if (phone) {
    const phoneInput = page.locator('input[type="tel"]');
    if (await phoneInput.count() > 0) {
      await phoneInput.fill(phone);
    }
  }

  // Password input (type="password", high specificity since there's only one)
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);

  // Click "Create Account" button (orange button with UserPlus icon)
  const submitButton = page.locator('button:has-text("Create Account")');
  await submitButton.click();

  // Wait for either:
  // 1. Success message: "Registration Successful!"
  // 2. Or redirect to /dashboard (auto-login) or /login
  await Promise.race([
    // Success screen (Register.tsx shows success state with checkmark)
    expect(page.getByText(/Registration Successful/)).toBeVisible({ timeout: 10000 }),
    // Or redirect to dashboard (auth context auto-logs in)
    page.waitForURL(/.*dashboard/, { timeout: 10000 }),
  ]).catch((err) => {
    throw new Error(`Registration did not complete: ${err.message}`);
  });
}


/**
 * Login to the application
 * Matches actual Login.tsx implementation:
 * - Fields: email (type="email"), password (type="password")
 * - Button text: "Sign In"
 * - Success navigates to /dashboard
 * - Error shows in red box with error.message
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  // Fill email - type="email"
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill(email);

  // Fill password - type="password"
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);

  // Click "Sign In" button
  const submitButton = page.locator('button:has-text("Sign In")');
  await submitButton.click();

  // Wait for successful login - navigation to /dashboard
  // If login fails, an error message appears in a red box
  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  } catch (err) {
    // Check for error message in the red error box
    const errorBox = page.locator('.bg-red-50, .bg-red-100');
    if (await errorBox.count() > 0) {
      const errorText = await errorBox.textContent();
      
      // Provide helpful context for common errors
      if (errorText?.includes('throttled')) {
        throw new Error(
          `⚠️ Backend rate limiting (too many failed login attempts). ` +
          `Wait a few minutes and try again. Error: ${errorText}`
        );
      }
      if (errorText?.includes('No active account') || errorText?.includes('not found')) {
        throw new Error(
          `❌ User not found or inactive: ${email}\n` +
          `Solution: Run: cd backend && python manage.py create_test_users\n` +
          `Full error: ${errorText}`
        );
      }
      throw new Error(`Login failed: ${errorText}`);
    }
    throw err;
  }

  // Verify dashboard is loaded (wait for main content)
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
}


/**
 * Logout from the application
 * Matches actual Layout.tsx implementation:
 * - Click "Sign Out" button in sidebar (bottom of sidebar)
 * - Redirects to /login
 */
export async function logout(page: Page) {
  // On mobile, open sidebar first
  const isMobile = await page.locator('.lg\\:hidden').count() > 0;
  if (isMobile) {
    const menuButton = page.locator('button[class*="p-2"]').filter({ hasText: /(Menu|X)/ });
    if (await menuButton.count() > 0) {
      await menuButton.click();
    }
  }

  // Click the "Sign Out" button (in the sidebar footer)
  const signOutButton = page.locator('button:has-text("Sign Out")');
  await signOutButton.click();

  // Verify redirected to login page
  await expect(page).toHaveURL('**/login', { timeout: 10000 });
  
  // Verify login form is visible
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
}


/**
 * Check if user sees an error message
 */
export async function expectErrorMessage(page: Page, message: string | RegExp) {
  const errorBox = page.locator('.bg-red-50, .bg-red-100, [role="alert"]');
  if (await errorBox.count() > 0) {
    await expect(errorBox.first()).toContainText(message);
  } else {
    // Fallback: look for text anywhere on page
    await expect(page.getByText(message)).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Check if user sees a success message
 */
export async function expectSuccessMessage(page: Page, message: string | RegExp) {
  const successBox = page.locator('.bg-green-50, .bg-green-100, [role="status"]');
  if (await successBox.count() > 0) {
    await expect(successBox.first()).toContainText(message);
  } else {
    // Fallback: look for text anywhere on page
    await expect(page.getByText(message)).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Get storage state after login (for session reuse)
 */
export async function saveLoginState(page: Page, filePath: string) {
  await page.context().storageState({ path: filePath });
}

/**
 * Extract API token from localStorage
 */
export async function getAccessToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('access_token'));
}

/**
 * Make a direct API call (useful for setup/teardown)
 * Fix: Uses page.request to access the BrowserContext's APIRequestContext
 */
export async function apiCall(
  page: Page,
  method: string,
  endpoint: string,
  data?: any
) {
  const token = await getAccessToken(page);
  
  // FIX: Use page.request.fetch instead of native fetch.
  // This automatically uses the baseURL from playwright.config.ts
  const response = await page.request.fetch(endpoint, {
    method,
    headers: token ? {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    } : {
      'Content-Type': 'application/json'
    },
    data,
  });
  
  if (!response.ok()) {
    throw new Error(`API error: ${response.status()} ${response.statusText()}`);
  }
  
  // Handle empty responses gracefully
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Wait for API response with specific params
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  responseChecker?: (response: any) => boolean
) {
  return page.waitForResponse(
    async (response) => {
      const matches = typeof urlPattern === 'string' 
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url());
      
      if (!matches || response.status() !== 200) return false;

      if (responseChecker) {
        try {
            const json = await response.json();
            return responseChecker(json);
        } catch {
            return false;
        }
      }
      return true;
    },
    { timeout: 10000 }
  );
}

/**
 * Navigate and wait for page load
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  // 'domcontentloaded' is often safer and faster than 'networkidle' for SPAs
  await page.waitForLoadState('domcontentloaded'); 
}

/**
 * Fill and submit a form
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
  }
}

/**
 * Upload a file using a file input
 */
export async function uploadFile(page: Page, inputSelector: string, filePath: string) {
  const fileInput = page.locator(inputSelector);
  await fileInput.setInputFiles(filePath);
}