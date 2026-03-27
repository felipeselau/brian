# CONCERNS.md — Technical Debt & Concerns

**Generated:** 2026-03-27
**Focus:** Known issues and areas of concern

## High Priority Concerns

### 1. No Test Suite
- **Issue:** No tests exist for the codebase
- **Risk:** Bugs may go undetected
- **Mitigation:** Add Vitest + React Testing Library + E2E tests

### 2. Some TypeScript Errors in LSP
- **Issue:** Minor type errors showing in IDE
- **Files affected:**
  - `page.tsx` (BoardWrapper type mismatch)
  - `approve/route.ts` (status type)
  - `settings/page.tsx` (form export)
- **Mitigation:** Fix type definitions, use proper type assertions

### 3. Environment Setup Required
- **Issue:** `.env` required to run (database URL, auth secrets)
- **Mitigation:** `.env.example` exists but may be incomplete

## Medium Priority Concerns

### 4. No File Upload Implementation
- **Issue:** Attachments are URL references only, no actual upload
- **Context:** `@vercel/blob` is in dependencies but not used
- **Mitigation:** Implement actual file upload when needed

### 5. OAuth Not Implemented
- **Issue:** Only credentials (email/password) auth works
- **Deferred:** To v2 (out of scope for MVP)
- **Mitigation:** None needed for MVP

### 6. JSON Data Storage
- **Issue:** Columns and lifecycle logs stored as JSON
- **Risk:** Limited querying capability
- **Mitigation:** Acceptable trade-off for MVP flexibility

## Technical Debt

### 7. Duplicate Exports (Fixed)
- Was in `src/components/board/index.ts` — already fixed

### 8. Missing Error Boundaries
- **Issue:** No React error boundaries implemented
- **Risk:** Uncaught errors could crash entire app

### 9. No Real-time Updates
- **Issue:** No WebSocket or polling for live updates
- **Mitigation:** User manually refreshes (`router.refresh()`)

## Security Considerations

### 10. Password Storage
- Using `bcryptjs` for password hashing ✓
- Credentials only (no OAuth) — but that's acceptable for MVP

### 11. Environment Secrets
- Secrets in `.env` file (not committed) ✓
- `NEXTAUTH_SECRET` is required ✓

### 12. API Authorization
- Proper session checks in all API routes ✓
- Owner/member role checks on mutations ✓

## Known Bugs

### 13. Minor TypeScript Warnings
- Some `any` type assertions used
- Should be addressed in cleanup phase

## Recommendations for Next Steps

1. **Fix remaining type errors** in the codebase
2. **Add test suite** before adding more features
3. **Implement file upload** when attachments need real files
4. **Add error boundaries** for production robustness

## Overall Assessment

The codebase is functional and follows good patterns. The main concern is the lack of tests, which should be the first priority for improving code quality.