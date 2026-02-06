# Playwright E2E Tests

Comprehensive end-to-end tests for the Hainan Builder Portal, testing all backend endpoints through the frontend using Playwright.

## Test Coverage

- **Authentication** (01-auth.spec.ts)
  - Partner registration
  - Login/logout
  - Invalid credentials handling
  - Pending partner approval flow
  - Token refresh

- **Applicants** (02-applicants.spec.ts)
  - Create, read, update, delete applicants
  - Search and filter applicants
  - Custom field handling
  - Status management

- **Documents** (03-documents.spec.ts)
  - Upload documents
  - Download documents
  - View document list
  - Admin document verification (approve/reject)
  - Document status filtering

- **Payments & Commissions** (04-payments-commissions.spec.ts)
  - Create and update payments
  - Download payment receipts
  - Commission listing and filtering
  - Commission status workflows (pending → processing → paid)
  - Batch commission operations

- **Support Tickets & Reports** (05-tickets-reports.spec.ts)
  - Create support tickets
  - Reply to tickets
  - Ticket status filtering
  - View reports
  - Export reports as CSV
  - Admin access to all tickets

- **Admin Partner Management** (06-admin-partners.spec.ts)
  - View all partners
  - Filter partners by status
  - Edit partner details
  - Block/unblock partners
  - Approve pending partners
  - End-to-end approval workflow

## Setup

### Prerequisites

- Node.js 18+
- Backend running at `http://localhost:8000`
- Test users created in backend (see below)

### Install Dependencies

```bash
pnpm install
```

### Create Test Users

The tests require these users to exist in your backend:

**Admin User:**
```
Email: admin@example.com
Password: AdminPassword123!
```

**Partner User:**
```
Email: partner@example.com
Password: PartnerPassword123!
```

Create them via Django admin:
```bash
cd backend
python manage.py createsuperuser
# Create admin user above

# Create partner user via admin interface or script
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from accounts.models import Partner

User = get_user_model()

# Create partner user
user = User.objects.create_user(
    email='partner@example.com',
    password='PartnerPassword123!'
)

# Create associated partner
Partner.objects.create(
    user=user,
    company_name='Test Partner Co',
    contact_name='Partner Contact',
    contact_phone='+1234567890',
    status=Partner.STATUS_APPROVED  # Set to APPROVED so they can login
)
```

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Specific Test File

```bash
pnpm test tests/e2e/01-auth.spec.ts
```

### Run Tests Matching Pattern

```bash
pnpm test --grep "should approve"
```

### Run in Headed Mode (See Browser)

```bash
pnpm test --headed
```

### Run in Debug Mode

```bash
pnpm test --debug
```

### Run Single Test

```bash
pnpm test -g "should register a new partner"
```

### Run with UI Mode (Interactive)

```bash
pnpm test --ui
```

### View Test Report

After tests complete:

```bash
pnpm test:report
```

This opens the HTML test report in your default browser.

## Configuration

Test environment can be configured via environment variables:

```bash
# Override API base URL (default: http://localhost:5173)
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 pnpm test

# Skip starting dev server
PLAYWRIGHT_SKIP_SERVER=true pnpm test

# Run in CI mode
CI=true pnpm test
```

Add to `.env.test` or shell:

```env
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173
PLAYWRIGHT_SKIP_SERVER=false
```

## Test Structure

Each test file follows this pattern:

```typescript
test.describe('Feature Group', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate, etc
    await login(page, email, password);
  });

  test('should do something', async ({ page }) => {
    // Act: perform user action
    await page.click('button:has-text("Create")');
    
    // Assert: verify result
    await expectSuccessMessage(page, /created/i);
  });
});
```

## Utilities

Helper functions are in `tests/helpers.ts`:

- `login(page, email, password)` - Login to application
- `logout(page)` - Logout
- `registerPartner(page, email, password, company, contact)` - Register new partner
- `expectSuccessMessage(page, message)` - Verify success toast
- `expectErrorMessage(page, message)` - Verify error toast
- `getAccessToken(page)` - Get JWT token from localStorage
- `apiCall(page, method, endpoint, data)` - Make API call with auth
- `uploadFile(page, selector, filePath)` - Upload file to input
- `fillForm(page, fields)` - Fill multiple form fields

## Debugging

### Enable All Logs

```bash
DEBUG=pw:api pnpm test
```

### Run with Screenshots

Screenshots are automatically captured on failure in `test-results/`

### Run with Video

Videos are recorded on failure in `test-results/`

### Use Playwright Inspector

```bash
PWDEBUG=1 pnpm test
```

Opens interactive Playwright Inspector - step through tests, inspect elements, etc.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install frontend deps
        run: pnpm install
      
      - name: Set up backend
        run: |
          cd backend
          pip install -r requirements.txt
          python manage.py migrate
          python manage.py createsuperuser --noinput
      
      - name: Start backend
        run: cd backend && python manage.py runserver &
      
      - name: Run tests
        run: pnpm test
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/
          retention-days: 30
```

## Test Data

Tests create temporary test data with timestamps to avoid conflicts:

- Partner emails: `partner-${timestamp}@test.com`
- Applicant names: `Client ${timestamp}`
- Ticket subjects: `Test Ticket ${timestamp}`

This data is NOT automatically cleaned up. For production testing, add cleanup in `test.afterEach()`.

## Common Issues

### "Target page, context or browser has been closed"

- Check if backend is running
- Check if frontend dev server started
- Increase timeout in `playwright.config.ts`

### "Timeout waiting for selector"

- Element might not be visible yet
- Check selector in browser DevTools first
- Consider using `waitForLoadState('networkidle')`

### Token Expires During Tests

- Tests handle 401 responses and refresh tokens automatically
- If issues persist, check token refresh endpoint works

### "Login fails but works in browser"

- Verify test credentials exist and are correct
- Check auth flow in browser console
- Run test with `--headed --debug` to watch

## Performance

- Tests run sequentially by default (safer for shared data)
- To parallelize, set `workers: 4` in `playwright.config.ts`
- Disable video/screenshots in CI to speed up: `video: 'off'`

## Maintenance

- Update selectors if UI changes
- Add new tests for new endpoints
- Keep helpers.ts utilities up-to-date
- Review test results weekly in CI

## Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:headed": "playwright test --headed",
    "test:report": "playwright show-report",
    "test:auth": "playwright test tests/e2e/01-auth.spec.ts",
    "test:applicants": "playwright test tests/e2e/02-applicants.spec.ts"
  }
}
```

Then run:
```bash
pnpm test:auth
pnpm test:ui
```
