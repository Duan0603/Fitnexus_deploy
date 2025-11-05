# Backend Onboarding Test Suite

Core feature under test: Multi-step Onboarding API.

APIs:
- `GET /api/onboarding/session` — overall status and current/next step
- `GET /api/onboarding/steps/:key` — step metadata + fields
- `POST /api/onboarding/steps/:key/answer` — save answers, validate, compute next step

What is covered
- 15 integration tests using Node test runner + Supertest
- Input validation, allowed values, number range validation, special workout_frequency rules
- Idempotent updates & full completion path (updates user.onboarding_completed_at)
- All DB calls mocked via `test/helpers/mockDb.js` (no real DB required)

Run tests
```bash
# from repo root
npm install
npm run test --workspace=backend

# or inside backend folder
cd packages/backend
npm install
npm test
```

Coverage report
```bash
# from repo root or inside backend folder
npm run test:coverage --workspace=backend
# HTML report at coverage/index.html
```

Structure
- `test/onboarding.test.js` — test cases (15)
- `test/helpers/mockDb.js` — in-memory stubs for Sequelize models & transaction

Notes
- JWT is generated in tests with `process.env.JWT_SECRET = "test_secret_key"`
- Logger/morgan is disabled in NODE_ENV=test for cleaner output

