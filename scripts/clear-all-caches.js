#!/usr/bin/env node

/**
 * Comprehensive cache clearing script for Windows
 * Clears all Next.js, Turbopack, and build caches
 */

const fs = require('fs');
const path = require('path');

const cachePaths = [
  '.next',
  '.turbo',
  'node_modules/.cache',
  'out',
  '.vercel',
  'app/.next',
  'styles/.next',
];

console.log('🧹 Starting comprehensive cache cleanup...\n');

let clearedCount = 0;
let errorCount = 0;

cachePaths.forEach((cachePath) => {
  const fullPath = path.resolve(process.cwd(), cachePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      console.log(`🗑️  Removing: ${cachePath}`);
      fs.rmSync(fullPath, { recursive: true, force: true });
      clearedCount++;
      console.log(`✅ Cleared: ${cachePath}\n`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to clear ${cachePath}:`, error.message, '\n');
    }
  } else {
    console.log(`⏭️  Skipping (not found): ${cachePath}\n`);
  }
});

console.log('━'.repeat(50));
console.log(`\n✨ Cache cleanup complete!`);
console.log(`   Cleared: ${clearedCount} directories`);
if (errorCount > 0) {
  console.log(`   Errors: ${errorCount}`);
}

console.log('\n📝 Next steps:');
console.log('   1. Run: npm run build');
console.log('   2. If deploying to Vercel, redeploy from dashboard');
console.log('   3. In Vercel, go to: Settings → General → "Clear Build Cache"');
console.log('\n');
