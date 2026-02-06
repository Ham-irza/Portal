import { test, expect } from '@playwright/test';
import { login, TEST_CREDENTIALS } from '../helpers'; // Removed expectSuccessMessage import

test.describe('Support Tickets', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
  });

  test('should create a support ticket', async ({ page }) => {
    await page.goto('/support');
    
    // Explicitly click create (Playwright will auto-wait)
    await page.getByRole('button', { name: /new ticket|create ticket/i }).click();
    
    // Fill ticket form
    const subject = `Test Ticket ${Date.now()}`;
    await page.fill('input[name="subject"]', subject);
    
    // Handle message field (textarea or input)
    const messageField = page.locator('textarea[name="message"], textarea[name="initial_message"], input[name="message"]').first();
    await messageField.fill('This is a test support ticket');
    
    // Submit
    await page.getByRole('button', { name: /create|submit|save/i }).click();
    
    // Verify creation by checking if subject appears in the list
    await expect(page.getByText(subject)).toBeVisible();
  });

  test('should view support tickets', async ({ page }) => {
    await page.goto('/support');
    
    // Assert structural elements
    await expect(page.locator('h1')).toContainText(/Support|Tickets/i);
    // Ensure the list container exists
    await expect(page.locator('table, [role="grid"], ul')).toBeVisible();
  });

  test('should view ticket details', async ({ page }) => {
    await page.goto('/support');
    
    // Click the first ticket in the list
    await page.locator('table tbody tr, [role="grid"] [role="row"], ul li').first().click();
    
    // Verify detail view headers
    await expect(page.locator('h1, h2')).toBeVisible();
    await expect(page.getByText(/Status/i)).toBeVisible();
  });

  test('should reply to a ticket', async ({ page }) => {
    await page.goto('/support');
    
    // Open first ticket
    await page.locator('table tbody tr, [role="grid"] [role="row"], ul li').first().click();
    
    // Fill reply
    const replyField = page.locator('textarea[name="reply"], textarea[name="message"], input[name="reply"]').first();
    await replyField.fill('This is a reply to the support ticket');
    
    // Send
    await page.getByRole('button', { name: /send|reply|submit/i }).click();
    
    // FIX: Use native assertion for Regex support
    await expect(page.getByText(/sent|added|success/i)).toBeVisible();
  });

  test('should filter tickets by status', async ({ page }) => {
    await page.goto('/support');
    
    const statusFilter = page.locator('select[name="status"]');
    const buttonFilter = page.getByRole('button', { name: /Status/i });

    // Robustly handle UI variations
    if (await statusFilter.isVisible()) {
      // Use label matching if possible, otherwise value
      await statusFilter.selectOption({ label: 'Open' }).catch(() => statusFilter.selectOption('open'));
    } else {
      await buttonFilter.click();
      await page.getByText('Open').first().click();
    }
    
    // Assert table is still visible after update
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });
});

test.describe('Admin Support Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);
  });

  test('should view all support tickets as admin', async ({ page }) => {
    await page.goto('/admin/tickets');
    
    await expect(page.locator('h1')).toContainText(/Tickets|Support/i);
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });

  test('should reply to ticket as admin', async ({ page }) => {
    await page.goto('/admin/tickets');
    
    // Open first ticket
    await page.locator('table tbody tr, [role="grid"] [role="row"]').first().click();
    
    // Fill reply
    const replyField = page.locator('textarea[name="reply"], textarea[name="message"], textarea[name="body"]').first();
    await replyField.fill('Admin response to ticket');
    
    await page.getByRole('button', { name: /send|reply|submit/i }).click();
    
    // FIX: Native assertion
    await expect(page.getByText(/sent|added|success/i)).toBeVisible();
  });

  test('should update ticket status', async ({ page }) => {
    await page.goto('/admin/tickets');
    
    // Open first ticket
    await page.locator('table tbody tr, [role="grid"] [role="row"]').first().click();
    
    // Change status
    const statusSelect = page.locator('select[name="status"]');
    await statusSelect.selectOption('resolved');
    
    // Save if a save button exists (handle auto-save vs manual save)
    const saveButton = page.getByRole('button', { name: /save|update/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
    
    // FIX: Native assertion
    await expect(page.getByText(/updated|success/i)).toBeVisible();
  });
});

test.describe('Reports', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
  });

  test('should view partner reports', async ({ page }) => {
    const response = await page.goto('/reports');
    // Proper way to skip if feature is missing
    test.skip(response?.status() === 404, 'Reports page not available');
    
    await expect(page.locator('h1, h2')).toContainText(/Report/i);
  });

  test('should filter reports by date range', async ({ page }) => {
    const response = await page.goto('/reports');
    test.skip(response?.status() === 404, 'Reports page not available');
    
    const startDate = page.locator('input[name="start_date"], input[type="date"]').first();
    const endDate = page.locator('input[name="end_date"], input[type="date"]').last();
    
    await startDate.fill('2026-01-01');
    await endDate.fill('2026-12-31');
    
    await page.getByRole('button', { name: /apply|filter/i }).click();
    
    // Wait for the UI to acknowledge the action
    await expect(page.locator('table, [role="grid"], .chart-container')).toBeVisible();
  });
});

test.describe('Admin Reports', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);
  });

  test('should view admin reports dashboard', async ({ page }) => {
    const response = await page.goto('/admin/analytics');
    test.skip(response?.status() === 404, 'Admin Analytics page not available');
    
    await expect(page.locator('h1, h2')).toContainText(/Analytics|Report|Statistics/i);
    // Ensure stats exist
    await expect(page.locator('[role="region"], .stats-card').first()).toBeVisible();
  });

  test('should export report as CSV', async ({ page }) => {
    const response = await page.goto('/admin/analytics');
    test.skip(response?.status() === 404, 'Admin Analytics page not available');
    
    // Setup download listener before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click export (first one found)
    await page.getByRole('button', { name: /export|csv|download/i }).first().click();
    
    const download = await downloadPromise;
    // Standard Regex match
    expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/i);
  });

  test('should view partner performance metrics', async ({ page }) => {
    const response = await page.goto('/admin/analytics');
    test.skip(response?.status() === 404, 'Admin Analytics page not available');
    
    // Look for specific table headers
    await expect(page.getByText(/Partner|Referrals|Commission|Revenue/i).first()).toBeVisible();
    await expect(page.locator('table, [role="grid"]')).toBeVisible();
  });
});