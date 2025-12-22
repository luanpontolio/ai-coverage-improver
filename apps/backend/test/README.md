# Test Database Setup

Tests use a separate SQLite database to avoid interfering with development data.

## How It Works

1. **Test Database Location**: `apps/backend/prisma/test.db`
2. **Environment Variable**: `DATABASE_URL` is automatically set to the test database URL
3. **Global Setup**: Runs migrations before all tests
4. **Test Cleanup**: Database is cleaned between test suites

## Files

- `setup.ts` - Database utilities (clean, setup, teardown)
- `global-setup.ts` - Runs once before all tests (migrates schema)
- `global-teardown.ts` - Runs once after all tests (closes connections)

## Usage in Tests

```typescript
import { cleanDatabase } from './setup';

describe('My Test Suite', () => {
  beforeAll(async () => {
    await cleanDatabase(); // Clean before each suite
  });

  beforeEach(async () => {
    // Optional: clean before each test
    await cleanDatabase();
  });
});
```

## Manual Setup

If you need to manually set up the test database:

```bash
DATABASE_URL="file:./apps/backend/prisma/test.db" pnpm db:migrate
```

## Notes

- Test database is automatically ignored by git (`.gitignore`)
- Test database is separate from `dev.db`
- All tables are cleaned before each test suite
- Migrations run automatically via global setup

