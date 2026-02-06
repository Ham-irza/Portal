#!/bin/bash
# setup-tests.sh - Initialize test environment for Playwright E2E tests

set -e  # Exit on error

echo "🚀 Setting up test environment..."

# Check if backend is running
BACKEND_URL="http://localhost:8000"
echo "⏳ Checking backend at $BACKEND_URL..."

for i in {1..5}; do
  if curl -s "$BACKEND_URL/api/users/" > /dev/null 2>&1; then
    echo "✓ Backend is running"
    break
  fi
  if [ $i -lt 5 ]; then
    echo "  Attempt $i/5... waiting..."
    sleep 2
  else
    echo "❌ Backend not responding at $BACKEND_URL"
    echo "Start it with: cd backend && python manage.py runserver"
    exit 1
  fi
done

# Create test users
echo ""
echo "📝 Creating test users..."
cd backend
python manage.py create_test_users
cd ..

echo ""
echo "✅ Test environment ready!"
echo ""
echo "Now run tests with:"
echo "  pnpm test:auth              # Auth tests only"
echo "  pnpm test                   # All tests"
echo "  pnpm test --headed          # With visible browser"
