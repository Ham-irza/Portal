import { test, expect } from '@playwright/test';
import { login, TEST_CREDENTIALS } from '../helpers';

test.describe('Payments Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
  });

  test('should list payments', async ({ page }) => {
    await page.goto('/payments');
    
    await expect(page.locator('h1')).toContainText(/Payments/i);
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should create a new payment', async ({ page }) => {
    await page.goto('/payments');
    
    // Explicitly click create
    await page.getByRole('button', { name: /new payment|add payment/i }).click();
    
    // Fill payment form
    await page.fill('input[name="amount"]', '150.00');
    
    // Select currency if the input exists (robust handling)
    const currencySelect = page.locator('select[name="currency"]');
    if (await currencySelect.isVisible()) {
      await currencySelect.selectOption('USD');
    }
    
    // Select applicant if required
    const applicantSelect = page.locator('select[name="applicant"], [name="applicant_id"]');
    if (await applicantSelect.isVisible()) {
      // Ensure options exist before selecting
      await expect(applicantSelect.locator('option').nth(1)).toBeAttached();
      await applicantSelect.selectOption({ index: 1 });
    }
    
    // Submit
    await page.getByRole('button', { name: /create|submit/i }).click();
    
    // Native Regex Assertion
    await expect(page.getByText(/created|success/i)).toBeVisible();
  });

  test('should filter payments by status', async ({ page }) => {
    await page.goto('/payments');
    
    const statusSelect = page.locator('select[name="status"]');
    const statusBtn = page.getByRole('button', { name: /Status/i });

    // Assert at least one filter control exists
    await expect(statusSelect.or(statusBtn).first()).toBeVisible();

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('pending');
    } else {
      await statusBtn.click();
      await page.getByText('Pending').click();
    }
    
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should update payment status', async ({ page }) => {
    await page.goto('/payments');
    
    // Click first payment row
    await page.locator('table tbody tr, [role="grid"] [role="row"]').first().click();
    
    // Click Update/Mark Paid button
    await page.getByRole('button', { name: /mark as paid|update status/i }).click();
    
    // Handle confirmation if needed
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    // Native Regex Assertion
    await expect(page.getByText(/updated|success/i)).toBeVisible();
  });

  test('should download payment receipt', async ({ page }) => {
    await page.goto('/payments');
    
    // Ensure we have a download button before trying
    const downloadBtn = page.getByRole('button', { name: /download|receipt/i }).first();
    await expect(downloadBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.(pdf|doc|docx|txt)$/i);
  });
});

test.describe('Commissions Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
  });

  test('should view commissions', async ({ page }) => {
    const response = await page.goto('/commissions');
    // Skip if feature is disabled/missing
    test.skip(response?.status() === 404, 'Commissions page not available');
    
    await expect(page.locator('h1, h2')).toContainText(/Commission/i);
  });

  test('should view commission summary in dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Explicit assertion for commission card
    await expect(page.getByText(/Commission|Earned|Pending/i).first()).toBeVisible();
  });
});

test.describe('Admin Commission Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);
  });

  test('should access admin commissions page', async ({ page }) => {
    await page.goto('/admin/commissions');
    await expect(page.locator('h1')).toContainText(/Commission/i);
  });

  test('should list all commissions', async ({ page }) => {
    await page.goto('/admin/commissions');
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should filter commissions by status', async ({ page }) => {
    await page.goto('/admin/commissions');
    
    const statusSelect = page.locator('select[name="status"]');
    const statusBtn = page.getByRole('button', { name: /Status/i });

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('pending');
    } else {
      await statusBtn.click();
      await page.getByText('Pending').click();
    }
    
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should approve pending commission', async ({ page }) => {
    await page.goto('/admin/commissions');
    
    // Ensure filters are applied to find pending items
    const statusSelect = page.locator('select[name="status"]');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('pending');
    }

    // Explicitly wait for an approve button
    const approveBtn = page.getByRole('button', { name: /process|approve/i }).first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();
    
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    await expect(page.getByText(/updated|success/i)).toBeVisible();
  });

  test('should mark commission as paid', async ({ page }) => {
    await page.goto('/admin/commissions');
    
    // Filter to processing
    const statusSelect = page.locator('select[name="status"]');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('processing');
    }
    
    const paidBtn = page.getByRole('button', { name: /mark paid/i }).first();
    await expect(paidBtn).toBeVisible();
    await paidBtn.click();
    
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    await expect(page.getByText(/paid|success/i)).toBeVisible();
  });

  test('should batch approve commissions', async ({ page }) => {
    await page.goto('/admin/commissions');
    
    // Filter to pending
    const statusSelect = page.locator('select[name="status"]');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('pending');
    }
    
    // Ensure checkboxes exist
    const checkboxes = page.locator('input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();
    
    // Select first
    await checkboxes.first().click();
    
    // Click batch button
    await page.getByRole('button', { name: /approve selected|process selected/i }).click();
    
    await expect(page.getByText(/approved|updated/i)).toBeVisible();
  });

  test('should view commission rules', async ({ page }) => {
    await page.goto('/admin/commissions');
    
    // Navigate to rules tab/section
    await page.getByRole('button', { name: /rules/i }).click();
    
    // Verify content
    await expect(page.getByText(/Base Rate|Bonus Rate|Tier/i).first()).toBeVisible();
  });
});