# Password Reset Setup & Testing Guide

## Issue: "Invalid or missing reset token"

This error appears because:
1. You accessed `/auth/reset-password` without a token parameter
2. The database table for password reset tokens might not exist

## Quick Fix - Run These Commands

### Step 1: Setup Database Table

```bash
cd server
node scripts/setup-password-reset.js
```

This will:
- Create `password_reset_tokens` table
- Create `refresh_tokens` table (if needed)
- Verify the setup

### Step 2: Test Password Reset Flow

```bash
cd server
node scripts/test-password-reset-flow.js
```

This will:
- Create a test user (test@example.com)
- Generate a password reset token
- Display a working reset URL
- Test the complete flow

**Expected Output:**
```
🔗 Copy this URL to test password reset:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
http://localhost:3000/auth/reset-password?token=abc123...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 3: Test in Browser

Copy the URL from Step 2 and paste it in your browser. You should see:
- Password reset form (not the error)
- Password strength indicator
- Ability to reset password

## How Password Reset Works

### 1. User Requests Reset

**URL:** `http://localhost:3000/auth/forgot-password`

**Flow:**
1. User enters email
2. Frontend calls: `POST /api/auth/forgot-password`
3. Backend generates token (valid for 1 hour)
4. Backend sends email with reset link
5. User sees success message

### 2. User Clicks Reset Link

**URL:** `http://localhost:3000/auth/reset-password?token=abc123...`

**Flow:**
1. Page loads with token from URL
2. User enters new password
3. Frontend calls: `POST /api/auth/reset-password`
4. Backend verifies token
5. Backend updates password
6. Backend marks token as used
7. User redirected to login

### 3. User Logs In

**URL:** `http://localhost:3000/auth/login`

**Flow:**
1. User enters email and new password
2. Login succeeds
3. User redirected to dashboard

## Testing Without Email

If you haven't configured email yet, you can still test:

### Method 1: Use Test Script (Recommended)

```bash
cd server
node scripts/test-password-reset-flow.js
```

This gives you a working reset URL to copy/paste.

### Method 2: Get Token from Database

```sql
-- Find the most recent token
SELECT token, expires_at, used 
FROM password_reset_tokens 
WHERE used = FALSE 
ORDER BY created_at DESC 
LIMIT 1;
```

Then use: `http://localhost:3000/auth/reset-password?token=YOUR_TOKEN`

### Method 3: Create Token Manually

```javascript
// In Node.js console or script
const authService = require('./server/src/services/auth.service');
const token = await authService.generatePasswordResetToken(USER_ID);
console.log(`http://localhost:3000/auth/reset-password?token=${token}`);
```

## Complete Testing Flow

### Test 1: Forgot Password (Without Email)

```bash
# 1. Run test script to get token
cd server
node scripts/test-password-reset-flow.js

# 2. Copy the URL from output
# 3. Paste in browser
# 4. Reset password
# 5. Login with new password
```

### Test 2: Forgot Password (With Email)

```bash
# 1. Make sure email is configured (see EMAIL_QUICK_FIX.md)
# 2. Restart server
cd server
npm run dev

# 3. Go to forgot password page
# http://localhost:3000/auth/forgot-password

# 4. Enter email: test@example.com
# 5. Check email inbox
# 6. Click reset link
# 7. Reset password
# 8. Login
```

## Database Tables

### password_reset_tokens

```sql
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `token` - UUID v4 token (unique)
- `expires_at` - 1 hour from creation
- `used` - Prevents token reuse
- `user_id` - Links to users table

### refresh_tokens

```sql
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `token` - JWT refresh token
- `expires_at` - 7 days from creation
- `user_id` - Links to users table

## Troubleshooting

### Error: "Invalid or missing reset token"

**Causes:**
1. No token in URL
2. Token expired (> 1 hour old)
3. Token already used
4. Token doesn't exist in database

**Solutions:**
1. Generate new token with test script
2. Request new password reset
3. Check token in database:
   ```sql
   SELECT * FROM password_reset_tokens WHERE token = 'YOUR_TOKEN';
   ```

### Error: "Table 'password_reset_tokens' doesn't exist"

**Solution:**
```bash
cd server
node scripts/setup-password-reset.js
```

### Error: "User not found"

**Solution:**
Create a test user:
```bash
cd server
node scripts/test-password-reset-flow.js
```

Or register at: http://localhost:3000/auth/register

### Token Expired

Tokens expire after 1 hour. Generate a new one:
```bash
cd server
node scripts/test-password-reset-flow.js
```

## Security Features

✅ **Token Expiration** - 1 hour validity
✅ **Single Use** - Token marked as used after reset
✅ **Secure Storage** - Tokens stored in database
✅ **Email Enumeration Protection** - Same message for valid/invalid emails
✅ **Password Strength** - Enforced on frontend and backend
✅ **Token Revocation** - All refresh tokens revoked on password reset

## Quick Reference

### Generate Test Token
```bash
cd server
node scripts/test-password-reset-flow.js
```

### Setup Tables
```bash
cd server
node scripts/setup-password-reset.js
```

### Test Email
```bash
cd server
node scripts/test-email.js
```

### Check Database
```sql
-- View all reset tokens
SELECT * FROM password_reset_tokens ORDER BY created_at DESC;

-- View unused tokens
SELECT * FROM password_reset_tokens WHERE used = FALSE;

-- View expired tokens
SELECT * FROM password_reset_tokens WHERE expires_at < NOW();

-- Clean up old tokens
DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE;
```

## Summary

1. **Run setup script** to create tables
2. **Run test script** to get a working reset URL
3. **Copy URL** and test in browser
4. **Reset password** and verify it works
5. **Login** with new password

The password reset functionality is fully implemented and ready to use!
