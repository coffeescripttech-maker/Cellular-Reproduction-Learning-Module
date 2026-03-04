# Fix "Invalid or missing reset token" Error

## Problem
When you go to `/auth/reset-password`, you see: **"Invalid or missing reset token"**

## Why This Happens
The reset password page needs a `token` parameter in the URL, like:
```
http://localhost:3000/auth/reset-password?token=abc123...
```

You can't just go to the page directly without a token.

## Solution: Run Setup Script

### Step 1: Setup Database Tables

Open a terminal in your project and run:

```bash
cd server
node scripts/setup-password-reset.js
```

This creates the required database tables.

### Step 2: Get a Test Reset URL

```bash
cd server
node scripts/test-password-reset-flow.js
```

This will:
- Create a test user (test@example.com)
- Generate a password reset token
- Show you a complete URL like:
  ```
  http://localhost:3000/auth/reset-password?token=abc123-def456-...
  ```

### Step 3: Test the URL

1. Copy the URL from Step 2
2. Paste it in your browser
3. You should now see the password reset form (not the error!)
4. Enter a new password
5. Submit and verify it works

## How to Use Password Reset Normally

### For End Users:

1. **Go to Forgot Password page:**
   ```
   http://localhost:3000/auth/forgot-password
   ```

2. **Enter email address** and click "Send Reset Link"

3. **Check email inbox** for the reset link
   - If email is configured, you'll receive an email
   - Click the link in the email

4. **Reset password** on the page that opens

5. **Login** with new password

### For Testing (Without Email):

Use the test script to generate a working URL:
```bash
cd server
node scripts/test-password-reset-flow.js
```

## Quick Commands

```bash
# Setup tables
cd server
node scripts/setup-password-reset.js

# Get test URL
cd server
node scripts/test-password-reset-flow.js

# Test email (if configured)
cd server
node scripts/test-email.js
```

## What Each Script Does

### setup-password-reset.js
- Creates `password_reset_tokens` table
- Creates `refresh_tokens` table
- Verifies setup

### test-password-reset-flow.js
- Creates test user
- Generates reset token
- Gives you working URL
- Tests complete flow

### test-email.js
- Tests email configuration
- Sends test emails
- Verifies SMTP connection

## Summary

The error happens because you need a token in the URL. Run the test script to get a working URL, or use the forgot password flow to receive one via email.

**Quick fix:**
```bash
cd server
node scripts/test-password-reset-flow.js
# Copy the URL it gives you and test in browser
```
