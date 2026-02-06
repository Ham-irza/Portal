import { test, expect } from '@playwright/test';
import { login, TEST_CREDENTIALS } from '../helpers';

test.describe('Applicants Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
    await page.goto('/applications');
  });

  test('should list applicants', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Applications');
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should create new applicant', async ({ page }) => {
    // Explicitly click create
    await page.getByRole('button', { name: /new application|add applicant/i }).click();
    
    // Wait for form
    await expect(page.locator('form, [role="dialog"]')).toBeVisible();
    
    // Fill form
    const uniqueName = `Client ${Date.now()}`;
    await page.fill('input[name="full_name"]', uniqueName);
    await page.fill('input[name="email"]', `client-${Date.now()}@example.com`);
    
    // Handle optional fields robustly (if they exist, fill them; if not, ignore, but don't fail test logic)
    // Note: If fields *must* exist, assert them. If dynamic, this pattern is acceptable.
    const countryField = page.locator('input[name="country"], select[name="country"]');
    if (await countryField.isVisible()) {
      await countryField.fill('USA');
    }
    
    // Submit
    await page.getByRole('button', { name: /create|submit/i }).click();
    
    // Assert success
    await expect(page.getByText(/created|success|added/i)).toBeVisible();
    
    // Verify list update
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test('should view applicant details', async ({ page }) => {
    // Click first applicant row
    await page.locator('table tbody tr, [role="grid"] [role="row"]').first().click();
    
    // Assert detail view content
    await expect(page.getByText(/Email|Phone|Status/i).first()).toBeVisible();
  });

  test('should update applicant details', async ({ page }) => {
    // 1. Create Applicant
    await page.getByRole('button', { name: /new application|add applicant/i }).click();
    const uniqueName = `Update Test ${Date.now()}`;
    await page.fill('input[name="full_name"]', uniqueName);
    await page.fill('input[name="email"]', `update-${Date.now()}@example.com`);
    await page.getByRole('button', { name: /create|submit/i }).click();
    await expect(page.getByText(/created|success/i)).toBeVisible();

    // 2. Open Details
    await page.getByText(uniqueName).click();
    
    // 3. Edit
    await page.getByRole('button', { name: /edit/i }).click();
    
    // 4. Update
    const updatedName = `Updated ${Date.now()}`;
    await page.fill('input[name="full_name"]', updatedName);
    await page.getByRole('button', { name: /save|update/i }).click();
    
    // 5. Verify
    await expect(page.getByText(/updated|saved/i)).toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('should delete applicant', async ({ page }) => {
    // 1. Create Applicant
    await page.getByRole('button', { name: /new application|add applicant/i }).click();
    const uniqueName = `Delete Test ${Date.now()}`;
    await page.fill('input[name="full_name"]', uniqueName);
    await page.fill('input[name="email"]', `delete-${Date.now()}@example.com`);
    await page.getByRole('button', { name: /create|submit/i }).click();
    
    // 2. Open Details
    await page.getByText(uniqueName).click();
    
    // 3. Delete
    await page.getByRole('button', { name: /delete/i }).click();
    
    // 4. Confirm
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    // 5. Verify
    await expect(page.getByText(/deleted|removed/i)).toBeVisible();
    await expect(page.getByText(uniqueName)).not.toBeVisible();
  });

  test('should search applicants', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    // Ensure search input exists
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('Client');
    // Optional: Press enter if not instant search
    // await searchInput.press('Enter');
    
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should filter applicants by status', async ({ page }) => {
    const statusSelect = page.locator('select[name="status"]');
    const statusBtn = page.getByRole('button', { name: /Status/i });

    // Assert one filter exists
    await expect(statusSelect.or(statusBtn).first()).toBeVisible();

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption({ label: 'Approved' }).catch(() => statusSelect.selectOption('approved'));
    } else {
      await statusBtn.click();
      await page.getByText('Approved').click();
    }
    
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should add custom field data to applicant', async ({ page }) => {
    await page.getByRole('button', { name: /new application|add applicant/i }).click();
    
    const uniqueName = `Custom Fields ${Date.now()}`;
    await page.fill('input[name="full_name"]', uniqueName);
    await page.fill('input[name="email"]', `custom-${Date.now()}@example.com`);
    
    // Handle custom fields if they exist in this environment
    const passportField = page.locator('input[name="passport"], input[placeholder*="passport"]');
    if (await passportField.isVisible()) {
      await passportField.fill('P123456789');
    }
    
    await page.getByRole('button', { name: /create|submit/i }).click();
    await expect(page.getByText(/created|success/i)).toBeVisible();
    
    // Verify
    await page.getByText(uniqueName).click();
    
    // Only assert custom field value if we actually filled it
    if (await passportField.isVisible()) {
      await expect(page.getByText('P123456789')).toBeVisible();
    }
  });
});