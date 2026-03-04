# How to Clear Vercel Build Cache - Visual Guide

## The Problem
You're seeing this error even though your CSS files are clean:
```
Unexpected token Function("--spacing") at line 4427
```

This is because Vercel is using a **cached version** of your CSS from a previous build.

## Solution: Clear Vercel's Build Cache

### Method 1: Clear Build Cache Button (If Available)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings**
   - Click the **"Settings"** tab at the top
   - You should see: Overview | Deployments | Analytics | Settings | ...

3. **Find General Section**
   - In Settings, look for **"General"** in the left sidebar
   - Or scroll down to the General section

4. **Look for "Clear Build Cache"**
   - Scroll through the General settings
   - Look for a section about **Build & Development Settings**
   - There may be a button labeled **"Clear Build Cache"** or **"Clear Cache"**

5. **Click and Confirm**
   - Click the button
   - Confirm the action
   - Wait for confirmation message

**Note**: Not all Vercel accounts/plans show this button. If you don't see it, use Method 2.

---

### Method 2: Redeploy Without Cache (Always Works)

1. **Go to Deployments Tab**
   - Click **"Deployments"** at the top of your project

2. **Find Latest Deployment**
   - Look at the most recent deployment (top of the list)
   - It should show "Failed" or "Error" status

3. **Open Deployment Menu**
   - Click the **three dots** (⋯) on the right side of the deployment
   - A dropdown menu will appear

4. **Select Redeploy**
   - Click **"Redeploy"**
   - A modal/dialog will appear

5. **IMPORTANT: Uncheck "Use existing Build Cache"**
   - You'll see a checkbox that says **"Use existing Build Cache"**
   - **UNCHECK THIS BOX** ← This is the key step!
   - This forces Vercel to ignore cached files

6. **Click Redeploy**
   - Click the **"Redeploy"** button
   - Wait for the new build to start

---

### Method 3: Environment Variable Trick (Nuclear Option)

If Methods 1 & 2 don't work, force a cache bust:

1. **Go to Settings → Environment Variables**
2. **Add a new variable**:
   - Name: `CACHE_BUST`
   - Value: `2025-01-22` (or current date)
   - Environment: Production
3. **Save**
4. **Redeploy** from Deployments tab

This forces Vercel to rebuild everything from scratch.

---

### Method 4: Delete and Recreate Project (Last Resort)

If nothing else works:

1. **Settings → General**
2. **Scroll to bottom**
3. **Click "Delete Project"**
4. **Confirm deletion**
5. **Go back to Vercel dashboard**
6. **Click "Add New Project"**
7. **Import your repository again**
8. **Deploy**

This gives you a completely fresh start with no cached files.

---

## What to Look For in Build Logs

After redeploying, check the build logs for:

### ✅ Good Signs:
```
🧹 Starting comprehensive cache cleanup...
✅ Cleared: .next
✅ Cleared: .turbo
```

```
Collecting page data  .
Generating static pages (0/61)
Generating static pages (61/61)
✓ Generating static pages (61/61)
```

### ❌ Bad Signs (Cache Still Active):
```
Unexpected token Function("--spacing")
./app/globals.css:4427:20
```

If you still see the error, the cache wasn't cleared. Try the next method.

---

## Why This Happens

Vercel caches:
1. **Build artifacts** (compiled files)
2. **node_modules** (dependencies)
3. **CSS output** (processed stylesheets)
4. **Static assets**

When you delete/rename a CSS file locally, Vercel doesn't know about it until you:
- Clear the cache manually, OR
- Force a fresh build without cache

---

## After Successful Deployment

You should see:
- ✅ Build completes without CSS errors
- ✅ Application loads correctly
- ✅ No `--spacing()` errors in console
- ✅ CSS file is ~168 lines (not 4000+)

---

## Quick Reference

| Method | Difficulty | Success Rate | When to Use |
|--------|-----------|--------------|-------------|
| Clear Build Cache Button | Easy | High | If button is visible |
| Redeploy Without Cache | Easy | Very High | Always try this first |
| Environment Variable | Medium | Very High | If redeploy doesn't work |
| Delete Project | Hard | 100% | Last resort only |

---

## Still Having Issues?

If you've tried all methods and still see the error:

1. **Check your local build**:
   ```bash
   npm run clear-cache
   npm run build
   ```
   If this fails locally, the issue isn't cache.

2. **Verify CSS files**:
   - Check `app/styles.css` has no `--spacing()` functions
   - Check `styles/globals.css` is clean
   - Search entire project: `grep -r "--spacing(" .`

3. **Check Git**:
   - Ensure changes are committed
   - Ensure changes are pushed to the branch Vercel is deploying

4. **Contact Vercel Support**:
   - Share this guide
   - Share build logs
   - Mention "persistent build cache issue"

---

## Prevention Tips

- Run `npm run clear-cache` before major changes
- Use `npm run build:clean` for clean builds
- Commit cache-clearing changes before deploying
- Monitor Vercel build logs for cache indicators
- Consider adding `CACHE_BUST` env var for critical deployments
