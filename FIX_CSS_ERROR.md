# Fix CSS Error on Vercel

## Error
```
Unexpected token Function("--spacing")
at ./app/globals.css:4427:20
```

## Cause
This error is from a cached build. The current `globals.css` file is clean and doesn't have this problematic line.

## Solution

### Option 1: Clear Vercel Build Cache (Recommended)
1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Scroll to "Build & Development Settings"
4. Click "Clear Build Cache"
5. Redeploy

### Option 2: Force Rebuild
1. Make a small change to trigger a new build (add a comment to any file)
2. Commit and push
3. Vercel will rebuild from scratch

### Option 3: Manual Cache Clear
Add this to your `package.json` scripts:
```json
"clean": "rm -rf .next node_modules/.cache"
```

Then run locally:
```bash
npm run clean
npm run build
```

## Verification
After clearing the cache, the build should succeed without the CSS error. The current `globals.css` is valid and contains only:
- Tailwind directives
- Color palette variables
- Safe area support
- Custom scrollbar styles
- Senior-friendly utility classes

## If Error Persists
If you still see this error after clearing cache:
1. Check if there are any other CSS files being imported
2. Search for `--spacing` in your codebase
3. Make sure no old CSS files are being referenced

The error references line 4427, but the current `globals.css` only has ~200 lines, confirming this is a cache issue.
