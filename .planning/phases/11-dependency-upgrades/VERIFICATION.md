# Next.js 16 Upgrade Verification Checklist

**Date:** 2026-03-27
**Upgrade:** Next.js 14.2.18 → 16.2.1

## Automated Checks ✅

- [x] Next.js 16.2.1 installed (`npm list next`)
- [x] TypeScript compilation succeeds (`npx tsc --noEmit`)
- [x] Production build succeeds (`npm run build`)
- [x] All 13 API routes compiled successfully
- [x] All page routes compiled successfully

## Manual Verification Required

### 1. Authentication
- [ ] Login with existing credentials works
- [ ] Register new user works
- [ ] Logout works from any page
- [ ] Session persists across browser refresh

### 2. Project CRUD
- [ ] View project list on dashboard
- [ ] Create new project
- [ ] Edit project details
- [ ] Archive project

### 3. Board
- [ ] Board loads with columns
- [ ] Drag-and-drop cards between columns works (@dnd-kit)
- [ ] Quick add card from board works

### 4. Requests
- [ ] Create request
- [ ] Edit request details
- [ ] Change request status
- [ ] View request modal

### 5. Other Features
- [ ] File uploads work (Vercel Blob)
- [ ] Comments work
- [ ] Hours tracking works
- [ ] Lifecycle log updates correctly
- [ ] Approvals work

## Known Changes

### Breaking Changes Applied
1. **Async Params (Next.js 15+):**
   - All page components now use `params: Promise<{...}>`
   - All API routes now use `params: Promise<{...}>`
   - All params accessed via `await params`

2. **API Route Structure:**
   - Attachments DELETE now uses query param: `?attachmentId=...`
   - Comments DELETE now uses query param: `?commentId=...`

3. **Scripts:**
   - `npm run lint` removed (integrated into build)
   - `npm run typecheck` added for explicit TS validation

### No Changes Required
- NextAuth v5 configuration remains compatible
- Prisma client usage unchanged
- React 18 maintained (no React 19 upgrade)
- Tailwind v3 maintained (no v4 upgrade)

## Issues Found

None during automated verification.

## Next Steps

- Run manual verification checklist above
- If all tests pass, proceed to Plan 11-02 (Prisma 5→7 upgrade)
- If issues found, document and fix before proceeding
