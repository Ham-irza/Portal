import { test, expect } from '@playwright/test';
import { login, TEST_CREDENTIALS, registerPartner, expectSuccessMessage, expectErrorMessage } from '../helpers';

test.describe('Admin Partner Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);
  });

  test('should view all partners in admin panel', async ({ page }) => {
    await page.goto('/admin/partners');
    
    // Assert elements exist (auto-waits)
    await expect(page.locator('h1')).toContainText('Partners');
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should filter partners by status', async ({ page }) => {
    await page.goto('/admin/partners');
    
    // Wait for at least one filter control to be visible
    const selectFilter = page.locator('select[name="status"]');
    const buttonFilter = page.locator('button:has-text("Status")');
    
    // Fail if neither exists (prevents false positive)
    await expect(selectFilter.or(buttonFilter).first()).toBeVisible();

    if (await selectFilter.isVisible()) {
      await selectFilter.selectOption('pending');
    } else {
      await buttonFilter.click();
      await page.locator('text=Pending').click();
    }
    
    // Verify the table is still visible after filtering
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should search partners by email', async ({ page }) => {
    await page.goto('/admin/partners');
    
    // Use a broad locator to catch various search input implementations
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill(TEST_CREDENTIALS.partner.email);
    // Optional: Press enter if search isn't instant
    // await searchInput.press('Enter'); 
    
    // Ensure the specific partner row appears
    await expect(page.locator('tr').filter({ hasText: TEST_CREDENTIALS.partner.email })).toBeVisible();
  });

  test('should edit partner information', async ({ page }) => {
    await page.goto('/admin/partners');
    
    // Click the first row directly (will auto-wait)
    await page.locator('table tbody tr, [role="grid"] [role="row"]').first().click();
    
    // Click Edit
    await page.locator('button:has-text("Edit")').click();
    
    // Update commission rate
    const rateInput = page.locator('input[name="commission_rate"]');
    await rateInput.fill('15.00');
    
    // Save
    await page.locator('button:has-text("Save"), button:has-text("Update")').click();
    
    // FIX: Use standard Playwright assertion for Regex to avoid TS error
    await expect(page.getByText(/updated|saved/i)).toBeVisible();
  });

  test('should block a partner', async ({ page }) => {
    await page.goto('/admin/partners');

    // Select first partner row
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Click Block
    await page.locator('button:has-text("Block")').click();

    // Handle Confirm Modal if it appears
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // FIX: Use standard Playwright assertion for Regex
    await expect(page.getByText(/blocked|updated/i)).toBeVisible();
  });

  test('should unblock a partner', async ({ page }) => {
    await page.goto('/admin/partners');

    // Select first partner row
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Click Unblock
    await page.locator('button:has-text("Unblock")').click();

    // Handle Confirm Modal
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // FIX: Use standard Playwright assertion for Regex
    await expect(page.getByText(/unblocked|updated/i)).toBeVisible();
  });
});

test.describe('Partner Approval Workflow', () => {
  // Serial mode is REQUIRED here because steps share state (the created user)
  test.describe.configure({ mode: 'serial' });

  const newPartnerEmail = `approval-${Date.now()}@test.com`;

  test('should register pending partner', async ({ page }) => {
    await registerPartner(
      page,
      newPartnerEmail,
      'ApprovalTest123!',
      'Approval Test Company',
      'Test Contact'
    );
    // FIX: Regex assertion
    await expect(page.getByText(/success|pending/i)).toBeVisible();
  });

  test('should prevent pending partner from logging in', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', newPartnerEmail);
    await page.fill('input[name="password"]', 'ApprovalTest123!');
    await page.click('button:has-text("Login")');
    
    // FIX: Regex assertion
    await expect(page.getByText(/pending|approval|wait/i)).toBeVisible();
  });

  test('should approve pending partner as admin', async ({ page }) => {
    await login(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);
    
    await page.goto('/admin/partners');
    
    // Find the row for our specific test user
    const partnerRow = page.locator('tr').filter({ hasText: newPartnerEmail });
    
    // Fail if row not found (removes false positive)
    await expect(partnerRow).toBeVisible();

    // Try finding an Approve button inside the row
    const inlineApprove = partnerRow.locator('button:has-text("Approve")');
    
    if (await inlineApprove.isVisible()) {
      await inlineApprove.click();
    } else {
      // Fallback: Click row to open details, then click Approve
      await partnerRow.click();
      await page.locator('button:has-text("Approve")').click();
    }
    
    // Handle Confirmation
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    // FIX: Regex assertion
    await expect(page.getByText(/approved|success/i)).toBeVisible();
  });

  test('should allow approved partner to login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', newPartnerEmail);
    await page.fill('input[name="password"]', 'ApprovalTest123!');
    await page.click('button:has-text("Login")');
    
    // Verify successful navigation
    await expect(page).toHaveURL(/\/(dashboard|home|applications)/);
  });
});