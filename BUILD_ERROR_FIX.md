# Build Error Fix - Maximum Call Stack Size Exceeded

## Issues Fixed

### 1. Viewport Metadata Configuration (Next.js 15)
**Problem:** Viewport configuration was in the `metadata` export, which is deprecated in Next.js 15.

**Fix:** Moved viewport configuration to a separate `viewport` export in `app/layout.tsx`:

```typescript
// Before (in metadata export)
viewport: 'minimum-scale=1, initial-scale=1, width=device-width...'

// After (separate export)
export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  width: 'device-width',
  viewportFit: 'cover'
};
```

### 2. SSR/Build Time Auth Check
**Problem:** Auth provider was trying to check authentication during server-side rendering/build time, causing infinite loops.

**Fix:** Added SSR guard in `hooks/useExpressAuth.tsx`:

```typescript
useEffect(() => {
  // Skip auth check during SSR/build
  if (typeof window === 'undefined') {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    return;
  }
  // ... rest of auth check
}, []);
```

### 3. Custom Not-Found Page
**Problem:** Default not-found page was causing rendering issues.

**Fix:** Created custom `app/not-found.tsx` with simple, static content.

### 4. Loading State
**Fix:** Added `app/loading.tsx` for better loading state handling during navigation.

## Module Creation JSON Upload Fix

### Problem
When creating new modules via Express API, the `json_content_url` column was empty because the frontend wasn't uploading the JSON to Supabase storage.

### Solution
Added storage upload logic to `createModule` method in `lib/api/express-vark-modules.ts`:

```typescript
async createModule(data: CreateVARKModuleData) {
  // Check if module has content
  const hasLargeContent = data.content_structure?.sections?.length > 0;
  
  if (hasLargeContent && typeof window !== 'undefined') {
    // Generate temp ID
    const tempId = self.crypto.randomUUID();
    
    // Upload JSON to Supabase Storage
    const jsonString = JSON.stringify(fullModuleData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    await supabase.storage
      .from('module-content')
      .upload(`vark-modules/module-${tempId}.json`, blob);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('module-content')
      .getPublicUrl(`vark-modules/module-${tempId}.json`);
    
    // Add to create data
    createData.json_content_url = urlData.publicUrl;
  }
  
  // Send to backend
  await expressClient.post('/api/modules', createData);
}
```

Now both `createModule` and `updateModule` properly upload JSON to storage and save the URL.

## Testing

1. Try building locally: `npm run build`
2. If successful, deploy to Vercel
3. Test module creation to verify `json_content_url` is populated

## Notes

- The auth provider now safely handles SSR/build scenarios
- Module content is stored in Supabase storage, not in MySQL
- Database only stores metadata + URL to the JSON file
