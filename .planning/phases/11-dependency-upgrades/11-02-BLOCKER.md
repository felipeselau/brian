# Plan 11-02 BLOCKED: Prisma 5→7 Upgrade

**Status:** ❌ BLOCKED  
**Date:** 2026-03-27  
**Blocker Type:** Out of Scope for Atomic Task  

## Summary

Prisma 7.0 introduces **fundamental architectural breaking changes** that are incompatible with the plan's atomic task execution model. The upgrade requires a full ESM migration, new configuration system, and extensive code refactoring across the entire application.

## Breaking Changes Discovered

### 1. Schema Configuration (Critical)
- **Issue:** `datasource.url` property removed from schema
- **Required:** New `prisma.config.ts` file for database configuration
- **Impact:** Schema validation fails immediately

### 2. ESM Requirement (Critical)
- **Issue:** Prisma 7 ships as ES module only
- **Required:** 
  - `package.json` → `"type": "module"`
  - `tsconfig.json` → ESM configuration
  - All files must use ESM imports
- **Impact:** Full codebase conversion from CommonJS to ESM

### 3. Driver Adapters (Critical)
- **Issue:** New client instantiation pattern required
- **Required:** Database-specific adapter (e.g., `@prisma/adapter-pg` for PostgreSQL)
- **Impact:** Complete refactor of `src/lib/prisma.ts` and all client usage

### 4. Generator Changes (Major)
- **Issue:** `output` field now required in generator block
- **Impact:** Client no longer generated in `node_modules`, all import paths change
- **Required:** Update all `@prisma/client` imports across codebase

### 5. Environment Variables (Major)
- **Issue:** Environment variables no longer auto-loaded
- **Required:** Explicit `dotenv` integration in `prisma.config.ts`

### 6. CLI Changes (Minor)
- Removed: `--skip-generate`, `--skip-seed`, various migrate flags
- Removed: Client middleware API
- Removed: Metrics preview feature

## Files That Would Require Changes

```
package.json           # type: "module"
tsconfig.json          # ESM configuration
prisma/schema.prisma   # Remove datasource url, update generator
prisma.config.ts       # NEW FILE - database configuration
src/lib/prisma.ts      # New adapter-based instantiation
src/lib/auth.ts        # May need updates for adapter changes
src/**/*.ts            # All imports if generator output changes
```

## Attempted Actions

1. ✅ Upgraded packages to 7.5.0
2. ❌ Schema validation failed (url property not supported)
3. ✅ Rollback to Prisma 5.22.0

## Recommendations

### Option 1: Incremental Upgrade (RECOMMENDED)
1. Create new phase: "Prisma 5→6 Upgrade"
   - Prisma 6 has fewer breaking changes
   - Can stay on CommonJS
2. Create separate phase: "ESM Migration"
   - Convert entire codebase to ESM
3. Create separate phase: "Prisma 6→7 Upgrade"
   - Apply driver adapters and config changes

**Effort:** 3 phases, ~2-3 days total  
**Risk:** Low (incremental, testable steps)

### Option 2: Defer to v1.2+ (ALTERNATIVE)
- Mark DEPS-02 and DEPS-03 as deferred
- Focus on v1.1 UX and testing goals
- Prisma 5.x is stable and supported
- Revisit in future milestone

**Effort:** None (focus on other priorities)  
**Risk:** None (stay on stable version)

### Option 3: Full Migration Now (NOT RECOMMENDED)
- Convert to ESM + Prisma 7 in one phase
- Extensive testing required
- High risk of regressions

**Effort:** 2-3 days  
**Risk:** High (too many changes at once)

## Next Steps

1. **Update ROADMAP.md:**
   - Mark Plan 11-02 as BLOCKED
   - Add decision about path forward

2. **Update STATE.md:**
   - Document Prisma 7 blocker
   - Update milestone status

3. **Create revised plans (if choosing Option 1):**
   - New plan: 11-02-prisma6-upgrade.md
   - New plan: 11-03-esm-migration.md
   - New plan: 11-04-prisma7-upgrade.md

4. **Or adjust scope (if choosing Option 2):**
   - Remove DEPS-02, DEPS-03 from v1.1
   - Update Phase 11 to only include Next.js upgrade

## References

- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma 6 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-6)
- [ESM in Next.js](https://nextjs.org/docs/app/building-your-application/configuring/esm)

---

*Created: 2026-03-27*
*Git commit with revert: 10d0e32*
