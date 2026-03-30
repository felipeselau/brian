# CI/CD Documentation

This document describes the CI/CD pipeline for the Brian project.

## Overview

The project uses GitHub Actions for continuous integration and deployment, optimized for GitHub Free tier (2000 minutes/month).

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Pull Request                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  typecheck (parallel)  │  test (parallel)  │  build         │
│  - TypeScript check    │  - Unit tests     │  - Next.js     │
│  - ESLint              │  - Integration    │    build       │
│                        │  - Coverage       │                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (after typecheck + test pass)
┌─────────────────────────────────────────────────────────────┐
│                        e2e                                   │
│  - Build app                                                 │
│  - Run Playwright (Chromium only)                           │
│  - Upload artifacts on failure                               │
└─────────────────────────────────────────────────────────────┘
```

## Jobs

### typecheck

**Runs on:** All pushes and PRs
**Timeout:** 5 minutes
**Purpose:** Verify TypeScript types and ESLint rules

```yaml
steps:
  - Checkout
  - Setup Node.js
  - Install dependencies (cached)
  - Run TypeScript
  - Run ESLint
```

### test

**Runs on:** All pushes and PRs
**Timeout:** 10 minutes
**Services:** PostgreSQL 16
**Purpose:** Run unit and integration tests with coverage

```yaml
steps:
  - Checkout
  - Setup Node.js
  - Install dependencies (cached)
  - Generate Prisma Client
  - Push DB Schema
  - Run Tests with Coverage
  - Upload Coverage Report
  - Check Coverage Thresholds
```

Coverage thresholds (blocking):

- Lines: 70%
- Functions: 75%
- Branches: 60%
- Statements: 70%

### e2e

**Runs on:** All pushes and PRs (after typecheck + test pass)
**Timeout:** 20 minutes
**Services:** PostgreSQL 16
**Purpose:** Run Playwright E2E tests

```yaml
steps:
  - Checkout
  - Setup Node.js
  - Install dependencies (cached)
  - Install Playwright Browsers (Chromium only)
  - Generate Prisma Client
  - Push DB Schema
  - Seed Test Data
  - Build Application
  - Run E2E Tests
  - Upload Reports (on failure)
```

### build

**Runs on:** All pushes and PRs (after typecheck)
**Timeout:** 10 minutes
**Purpose:** Verify production build succeeds

```yaml
steps:
  - Checkout
  - Setup Node.js
  - Install dependencies (cached)
  - Generate Prisma Client
  - Build Application
  - Check Bundle Size
```

## Optimization Strategies

### 1. Dependency Caching

npm dependencies are cached using `actions/setup-node@v4`:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: "npm"
```

This saves ~1-2 minutes per job.

### 2. Concurrency Control

Concurrent runs are cancelled when new commits are pushed:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### 3. Single Browser in CI

Playwright runs only Chromium in CI (not Firefox/Safari):

```typescript
// playwright.config.ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ...(!process.env.CI ? [
    { name: 'firefox', ... },
    { name: 'webkit', ... },
  ] : []),
]
```

This saves ~50% of E2E test time.

### 4. Sequential Worker in CI

Playwright uses 1 worker in CI to reduce resource contention:

```typescript
workers: process.env.CI ? 1 : undefined,
```

### 5. Conditional E2E

E2E tests only run after typecheck + test pass:

```yaml
e2e:
  needs: [typecheck, test]
```

## Estimated Time Usage

Per PR (average):

- typecheck: ~2 min
- test: ~5 min
- build: ~3 min
- e2e: ~10 min
- **Total: ~20 min**

Monthly budget at 2000 min:

- ~100 PRs/month possible
- Or ~3 PRs/day

## Artifacts

### Coverage Report

Available for 7 days after test run:

- HTML report in `coverage/`
- Summary in GitHub Actions summary

### Playwright Reports (on failure)

Available for 7 days after E2E failure:

- HTML report in `playwright-report/`
- Screenshots and traces in `test-results/`

## Local CI Simulation

### Run All Checks Locally

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Tests with coverage
npm run test:coverage

# E2E tests
npm run build && npx playwright test
```

### Using act (Optional)

```bash
# Install act
brew install act

# Run CI locally
act push
```

## Secrets Required

Configure in GitHub repository settings:

| Secret | Required | Purpose                                |
| ------ | -------- | -------------------------------------- |
| None   | -        | Currently no deployment secrets needed |

For future Vercel deployment:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Monitoring

### GitHub Actions Summary

Each run generates a summary with:

- Coverage percentages
- Build size
- Test results

### Viewing Logs

1. Go to Actions tab in GitHub
2. Click on workflow run
3. Click on job name
4. Expand steps to see logs

### Downloading Artifacts

1. Go to Actions tab
2. Click on workflow run
3. Scroll to "Artifacts" section
4. Click to download

## Troubleshooting

### Job Fails: "Connection refused"

PostgreSQL service might not be ready. The service has health checks configured:

```yaml
options: >-
  --health-cmd pg_isready
  --health-interval 10s
  --health-timeout 5s
  --health-retries 5
```

If still failing, increase retries or timeout.

### Job Fails: "Coverage below threshold"

Add more tests. Check coverage report to see which files need coverage.

### E2E Fails: "Page not found"

Build might have failed silently. Check:

1. Build logs for errors
2. That all routes exist
3. Environment variables are set

### Timeout

Job might be hanging. Check:

1. Unclosed database connections
2. Infinite loops
3. Network requests to external services

### Out of Minutes

If approaching limit:

1. Skip CI for documentation-only changes: `[skip ci]` in commit message
2. Run E2E less frequently (only on main)
3. Upgrade to GitHub Team/Enterprise

## Future Improvements

1. **Deploy Preview** - Add Vercel preview deployments for PRs
2. **Visual Regression** - Add Percy or Chromatic for UI testing
3. **Performance Testing** - Add Lighthouse CI
4. **Security Scanning** - Add Dependabot and CodeQL
5. **Staging Deployment** - Auto-deploy to staging on main
