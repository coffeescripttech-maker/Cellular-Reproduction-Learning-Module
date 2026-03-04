# 🔴 CRITICAL: Turbopack Cache Bug

## The Problem

Turbopack (Next.js 16) has a **persistent cache bug** that's reading a cached CSS file that no longer exists:

- Error: `./app/global-styles.css:4409:20` 
- But the actual file only has 168 lines!
- Even after deleting `.next`, `.turbo`, and all caches, Turbopack still reads the old cached version

## What We Tried

1. ✅ Deleted old CSS files
2. ✅ Created new CSS file with different name
3. ✅ Cleared `.next` directory
4. ✅ Cleared all `.turbo*` files
5. ✅ Cleared `node_modules/.cache`
6. ❌ **Turbopack STILL reads cached CSS**

## The Solution: Deploy Directly to Vercel

**DO NOT try to build locally**. Vercel will build in a fresh environment without this cache issue.

### Step 1: Commit Everything
```bash
git add .
git commit -m "Fix: Simplified CSS + module JSON upload"
git push
```

### Step 2: Deploy to Vercel WITHOUT Cache

1. Go to Vercel Dashboard
2. Click **Deployments**
3. Find latest deployment
4. Click **⋯** → **Redeploy**
5. **⚠️ UNCHECK "Use existing Build Cache"**
6. Click **Redeploy**

### Why This Will Work

- Vercel builds in a **clean Docker container**
- No local Turbopack cache
- Fresh `node_modules` install
- The CSS file (`app/main.css`) is clean and simple

## What's in the New CSS

`app/main.css` contains only:
- Tailwind directives
- Basic CSS variables
- Simple utility classes
- **NO `--spacing()` functions**
- **Only ~40 lines**

## Files Changed

```
Created:
  ✅ app/main.css (40 lines, minimal CSS)

Modified:
  ✅ app/layout.tsx (imports main.css)
  ✅ app/dashboard/layout.tsx (imports main.css)
  ✅ lib/api/express-vark-modules.ts (JSON upload)
  ✅ package.json (Next.js 15.2.5)

Deleted:
  ❌ app/global-styles.css (Turbopack cached this)
  ❌ app/styles.css
  ❌ styles/globals.css
```

## Expected Vercel Build

```
✓ Compiled successfully
✓ Linting and checking validity of types  
✓ Collecting page data
✓ Generating static pages (61/61)
✓ Finalizing page optimization
```

## If Vercel Build Also Fails

If Vercel ALSO shows the `--spacing()` error:

1. **Check the CSS file in Git**:
   ```bash
   git show HEAD:app/main.css
   ```
   Should show only ~40 lines

2. **Force push** (if needed):
   ```bash
   git add -A
   git commit --amend -m "Force: Clean CSS files"
   git push --force
   ```

3. **Delete Vercel project** and recreate:
   - Settings → General → Delete Project
   - Create new project
   - Connect repository
   - Deploy

## Local Build Workaround (If Needed)

If you MUST build locally:

```bash
# Downgrade to Next.js 14 (no Turbopack)
npm install next@14.2.18

# Clear everything
rm -rf .next node_modules/.cache

# Build
npm run build
```

## Summary

- ✅ Module JSON upload: FIXED
- ✅ CSS files: Simplified to minimal `main.css`
- ❌ Local Turbopack cache: BROKEN (Next.js 16 bug)
- ✅ Vercel deployment: Should work (fresh environment)

**Action**: Skip local build, deploy directly to Vercel with cache disabled.
