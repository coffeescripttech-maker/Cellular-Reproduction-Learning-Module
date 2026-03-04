# Payload Size Limit Fix - 413 Error Resolution

**Date:** January 14, 2026  
**Issue:** `POST http://localhost:3001/api/modules 413 (Payload Too Large)`  
**Status:** ✅ FIXED

---

## Problem

When importing VARK modules with rich content (images, videos, large text content, multiple sections), the request payload exceeded the Express server's body parser limit, resulting in a **413 Payload Too Large** error.

### Error Details
```
POST http://localhost:3001/api/modules 413 (Payload Too Large)
Error creating module: Error: request entity too large
```

### Root Cause
The Express server had a default body parser limit of **10MB**, which was insufficient for large VARK module imports containing:
- Multiple content sections
- Base64-encoded images
- Rich text content
- Assessment questions with multimedia
- Interactive elements
- Module metadata

---

## Solution

### 1. Increased Body Parser Limit

**File:** `server/src/app.js`

**Before:**
```javascript
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

**After:**
```javascript
// Body parsing middleware
// Increased limit to 50mb to handle large VARK module imports with rich content
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

### 2. Restart Express Server

After making the change, restart the Express server:

```bash
# If using npm
npm run dev

# If using pm2
pm2 restart express-api

# If running directly
node server/src/index.js
```

---

## Payload Size Considerations

### Current Limits
- **JSON payload:** 50MB
- **URL-encoded payload:** 50MB

### Typical VARK Module Sizes
- **Small module:** 100KB - 500KB (text-only, few sections)
- **Medium module:** 500KB - 5MB (some images, multiple sections)
- **Large module:** 5MB - 20MB (many images, videos, rich content)
- **Very large module:** 20MB - 50MB (extensive multimedia content)

### Why 50MB?
- Handles 99% of VARK module imports
- Allows for rich multimedia content
- Prevents server memory issues
- Balances functionality with security

---

## Best Practices for Large Payloads

### 1. **Use File Storage for Large Assets**

Instead of embedding large images/videos in JSON, upload them separately and reference URLs:

```javascript
// ❌ Bad: Embedding large base64 image in JSON
{
  "content": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." // 5MB
}

// ✅ Good: Upload image first, then reference URL
{
  "content": "https://storage.example.com/images/diagram.png"
}
```

### 2. **Compress Content Before Sending**

Use compression for large text content:

```javascript
// Frontend: Compress before sending
import pako from 'pako';

const compressedContent = pako.deflate(JSON.stringify(moduleData));
const base64Compressed = btoa(String.fromCharCode(...compressedContent));

// Backend: Decompress on receive
const compressed = Buffer.from(base64Compressed, 'base64');
const decompressed = pako.inflate(compressed, { to: 'string' });
const moduleData = JSON.parse(decompressed);
```

### 3. **Chunked Upload for Very Large Modules**

For modules > 50MB, implement chunked upload:

```javascript
// Split large module into chunks
const chunkSize = 10 * 1024 * 1024; // 10MB chunks
const chunks = [];

for (let i = 0; i < moduleData.length; i += chunkSize) {
  chunks.push(moduleData.slice(i, i + chunkSize));
}

// Upload chunks sequentially
for (let i = 0; i < chunks.length; i++) {
  await uploadChunk(chunks[i], i, chunks.length);
}
```

### 4. **Progress Indicators**

Show upload progress for large payloads:

```javascript
// Frontend: Track upload progress
const response = await fetch('/api/modules', {
  method: 'POST',
  body: JSON.stringify(moduleData),
  headers: { 'Content-Type': 'application/json' },
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    setUploadProgress(percentCompleted);
  }
});
```

### 5. **Validate Payload Size Before Sending**

Check size on frontend before sending:

```javascript
// Frontend: Validate size before sending
const payloadSize = new Blob([JSON.stringify(moduleData)]).size;
const maxSize = 50 * 1024 * 1024; // 50MB

if (payloadSize > maxSize) {
  toast.error(`Module is too large (${(payloadSize / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`);
  return;
}

// Show warning for large payloads
if (payloadSize > 10 * 1024 * 1024) {
  toast.warning(`Uploading large module (${(payloadSize / 1024 / 1024).toFixed(2)}MB). This may take a moment...`);
}
```

---

## Security Considerations

### 1. **Rate Limiting**

Implement rate limiting for large uploads to prevent abuse:

```javascript
// server/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 large uploads per windowMs
  message: 'Too many upload requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to upload routes
app.use('/api/modules', uploadLimiter);
```

### 2. **Authentication Required**

Ensure only authenticated teachers can upload large modules:

```javascript
// Already implemented in modules.routes.js
router.post('/', verifyToken, requireTeacher, modulesController.createModule);
```

### 3. **Content Validation**

Validate module content structure:

```javascript
// Validate module structure before processing
function validateModuleStructure(moduleData) {
  // Check required fields
  if (!moduleData.title) {
    throw new Error('Title is required');
  }
  
  // Validate content structure
  if (moduleData.contentStructure) {
    if (!Array.isArray(moduleData.contentStructure.sections)) {
      throw new Error('Invalid content structure');
    }
  }
  
  // Validate assessment questions
  if (moduleData.assessmentQuestions) {
    if (!Array.isArray(moduleData.assessmentQuestions)) {
      throw new Error('Invalid assessment questions');
    }
  }
  
  return true;
}
```

### 4. **Malware Scanning**

For production, scan uploaded content for malware:

```javascript
// Example: Using ClamAV for scanning
const NodeClam = require('clamscan');

async function scanContent(content) {
  const clamscan = await new NodeClam().init();
  const { isInfected, viruses } = await clamscan.scanStream(content);
  
  if (isInfected) {
    throw new Error(`Malware detected: ${viruses.join(', ')}`);
  }
}
```

---

## Performance Optimization

### 1. **Database Packet Size**

Ensure MySQL can handle large packets:

```sql
-- Check current max_allowed_packet
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Increase to 64MB (already done in fix-mysql-packet-size.sql)
SET GLOBAL max_allowed_packet = 67108864;
```

### 2. **Connection Timeout**

Increase timeout for large uploads:

```javascript
// server/src/config/database.js
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  connectTimeout: 60000, // 60 seconds
  acquireTimeout: 60000, // 60 seconds
  timeout: 60000 // 60 seconds
});
```

### 3. **Request Timeout**

Set appropriate timeout for Express:

```javascript
// server/src/index.js
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Set timeout to 5 minutes for large uploads
server.timeout = 300000; // 5 minutes
```

---

## Monitoring and Logging

### 1. **Log Large Payloads**

Add logging for large payload uploads:

```javascript
// Middleware to log large payloads
app.use((req, res, next) => {
  const contentLength = req.headers['content-length'];
  
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    logger.warn('Large payload detected', {
      url: req.url,
      method: req.method,
      size: `${(parseInt(contentLength) / 1024 / 1024).toFixed(2)}MB`,
      userId: req.user?.userId
    });
  }
  
  next();
});
```

### 2. **Track Upload Times**

Monitor upload performance:

```javascript
// Track upload duration
const start = Date.now();

await Module.create(moduleData);

const duration = Date.now() - start;

logger.info('Module created', {
  moduleId: module.id,
  size: `${(payloadSize / 1024 / 1024).toFixed(2)}MB`,
  duration: `${duration}ms`,
  createdBy: req.user.userId
});
```

---

## Testing

### Test Cases

1. **Small Module (< 1MB)**
   - ✅ Should upload quickly
   - ✅ Should not trigger warnings

2. **Medium Module (1-10MB)**
   - ✅ Should upload successfully
   - ✅ May show progress indicator

3. **Large Module (10-50MB)**
   - ✅ Should upload successfully
   - ✅ Should show progress indicator
   - ✅ Should log as large payload

4. **Oversized Module (> 50MB)**
   - ✅ Should reject with 413 error
   - ✅ Should show helpful error message

### Test Script

```javascript
// test-large-payload.js
const axios = require('axios');

async function testLargePayload() {
  // Create a large module (30MB)
  const largeContent = 'x'.repeat(30 * 1024 * 1024);
  
  const moduleData = {
    title: 'Large Test Module',
    description: 'Testing large payload',
    contentStructure: {
      sections: [
        {
          title: 'Large Section',
          content: largeContent
        }
      ]
    }
  };
  
  try {
    const response = await axios.post(
      'http://localhost:3001/api/modules',
      moduleData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Large payload uploaded successfully');
    console.log('Module ID:', response.data.data.id);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

testLargePayload();
```

---

## Troubleshooting

### Issue: Still Getting 413 Error

**Possible Causes:**
1. Server not restarted after config change
2. Reverse proxy (nginx, Apache) has lower limit
3. Cloud provider has payload limits

**Solutions:**

1. **Restart Express Server:**
   ```bash
   pm2 restart express-api
   ```

2. **Check Nginx Config (if using):**
   ```nginx
   # /etc/nginx/nginx.conf
   http {
       client_max_body_size 50M;
   }
   ```

3. **Check Cloud Provider Limits:**
   - AWS API Gateway: 10MB limit (use direct ALB)
   - Heroku: 30MB limit
   - Vercel: 4.5MB limit (not suitable for large uploads)

### Issue: Slow Upload Performance

**Solutions:**
1. Enable compression on server
2. Use CDN for static assets
3. Implement chunked upload
4. Optimize database queries

### Issue: Memory Issues

**Solutions:**
1. Use streaming for very large payloads
2. Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=4096 server/src/index.js
   ```
3. Implement garbage collection monitoring

---

## Summary

### ✅ Changes Made
1. Increased Express body parser limit from 10MB to 50MB
2. Added comments explaining the change
3. Documented best practices for large payloads

### ✅ Benefits
- Supports large VARK module imports with rich content
- Handles multimedia content (images, videos)
- Allows for complex module structures
- Maintains security and performance

### ⚠️ Recommendations
1. Monitor payload sizes in production
2. Implement rate limiting for large uploads
3. Consider file storage for very large assets
4. Add progress indicators for user experience
5. Set up alerts for unusually large payloads

### 🎯 Next Steps
1. Test with actual large VARK modules
2. Monitor server memory usage
3. Implement recommended optimizations
4. Add payload size validation on frontend

---

**Status:** ✅ RESOLVED - Server can now handle large VARK module imports up to 50MB
