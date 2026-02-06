# Setting Up Playwright E2E Tests

## Prerequisites

- **Backend running**: Django server at `http://localhost:8000`
- **Frontend running**: Vite dev server at `http://localhost:5173`
- **Node.js**: v18+ (for Playwright)
- **Python**: 3.9+ with Django and dependencies

## Quick Start

### 1. Create Test Users in Backend

The backend must have test user accounts before tests can run.

```bash
cd backend
python manage.py migrate  # If not done yet
python manage.py create_test_users
```

Look for output like:
```
✓ Created admin user: admin@example.com
✓ Created partner user: partner@hainanbuilder.com
✓ Created partner profile: Test Partner Company

✅ Test users created successfully!

Test Credentials:
  Admin: admin@example.com / AdminPassword123!
  Partner: partner@hainanbuilder.com / PartnerPassword123!
```

### 2. Start Backend Server

```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

Keep this running in a separate terminal.

### 3. Start Frontend Dev Server

```bash
pnpm dev
```

This starts Vite at `http://localhost:5173`. Keep running in a separate terminal.

### 4. Run Tests

In a third terminal:

```bash
# Run all tests
pnpm test

# Run only auth tests
pnpm test:auth

# Run with browser visible
pnpm test -- --headed

# Run with debug UI
pnpm test:ui

# Show HTML report
pnpm test:report
```

## Troubleshooting

### ❌ `ERR_CONNECTION_REFUSED at http://localhost:5173`

**Frontend dev server is not running.**

Solution:
```bash
pnpm dev
```

### ❌ `No active account found with the given credentials`

**Test user doesn't exist or is not approved.**

Solutions:
```bash
# Create test users
cd backend
python manage.py create_test_users

# Or manually verify they exist
python manage.py shell
>>> from accounts.models import User, Partner
>>> u = User.objects.get(email='partner@hainanbuilder.com')
>>> p = Partner.objects.get(user=u)
>>> print(f"Status: {p.status}")  # Should be "approved"
```

Test credentials must have `Partner.status = 'approved'` to login.

### ⚠️ `Request was throttled. Expected available in XXXX seconds`

**Too many failed login attempts triggered rate limiting.**

Solution: Wait (rate limiting resets after ~30 minutes) or:
1. Clear the cache in the backend
2. Restart the backend server
3. Check that test credentials are correct

### ❌ `TestTimeout: Test timeout of 30000ms exceeded`

**Page is taking too long to load.**

Likely causes:
- Frontend or backend not responding
- Page is stuck loading

Solutions:
```bash
# Check both are running
curl http://localhost:5173      # Frontend
curl http://localhost:8000/api  # Backend

# Run with more verbose output
pnpm test -- --headed --debug
```

## Test Structure

Tests are organized by feature:
- `tests/e2e/01-auth.spec.ts` - Registration, login, logout
- `tests/e2e/02-applicants.spec.ts` - Applicant CRUD operations
- `tests/e2e/03-documents.spec.ts` - Document upload and verification
- (more spec files...)

## Important Notes

1. **Sequential Execution**: Tests run sequentially (workers: 1) to avoid race conditions
2. **Test Data Reset**: Each test uses dynamic test data (timestamps in email) to avoid conflicts
3. **Timeout**: Default 30 seconds per test; increase with `test.setTimeout(60000)`
4. **Debug Mode**: Run `pnpm test:debug` to step through tests in debugger

## Environment Variables

```bash
# Configure base URLs
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173
PLAYWRIGHT_TEST_BACKEND_URL=http://localhost:8000

# Skip auto-starting the dev server
PLAYWRIGHT_SKIP_SERVER=1

# Run only in CI mode (forbid .only, no retries on single worker)
CI=1
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all tests |
| `pnpm test:auth` | Auth tests only |
| `pnpm test -- --headed` | Tests with visible browser |
| `pnpm test:ui` | Interactive test explorer |
| `pnpm test:report` | View HTML report |
| `pnpm test -- --debug` | Step-through debugger |

## Adding New Tests

1. Create a new `.spec.ts` file in `tests/e2e/`
2. Import helpers from `tests/helpers.ts`
3. Use `test.describe()` and `test()` from `@playwright/test`
4. Follow Arrange-Act-Assert pattern
5. Use dynamic test data to avoid conflicts

Example:
```typescript
import { test, expect } from '@playwright/test';
import { login, TEST_CREDENTIALS } from '../helpers';

test.describe('Your Feature', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await login(page, TEST_CREDENTIALS.partner.email, TEST_CREDENTIALS.partner.password);
    
    // Act
    await page.goto('/applications');
    
    // Assert
    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible();
  });
});
```

## Support

For issues or questions:
1. Check test output with `pnpm test -- --headed`
2. Review HTML report: `pnpm test:report`
3. Check Playwright trace (screenshots/videos in `test-results/`)
4. Check browser console for frontend errors
5. Check backend logs for API errors
