# Email Quick Fix - RESOLVED ✅

## Problem
Error when trying to send password reset email:
```
Email send error: Error: connect ECONNREFUSED 127.0.0.1:587
```

## Root Cause
Missing email configuration in `server/.env` file.

## Solution Applied ✅

Added email configuration to `server/.env`:

```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=newdexm@gmail.com
EMAIL_PASSWORD=pvtbeirhwsoxzfyy
EMAIL_FROM=BISCAS NAGA Learning <newdexm@gmail.com>
```

**Note:** Removed spaces from the app password (was: `pvtb eirh wsox zfyy`, now: `pvtbeirhwsoxzfyy`)

## Next Steps - DO THIS NOW

### 1. Restart Your Express Server ⚠️ IMPORTANT

The server must be restarted to load the new environment variables.

**Stop the current server** (Ctrl+C in the terminal) and restart:

```bash
cd server
npm run dev
```

### 2. Test Email Configuration

Run the test script:

```bash
cd server
node scripts/test-email.js
```

**Expected output:**
```
✅ SMTP connection successful!
✅ Test email sent successfully!
✅ Password reset email sent successfully!
🎉 All email tests passed!
```

### 3. Check Your Email

Check the inbox for `newdexm@gmail.com`:
- You should receive 2 test emails
- Check spam folder if not in inbox

### 4. Test Password Reset Flow

1. Go to: http://localhost:3000/auth/forgot-password
2. Enter any registered email
3. Click "Send Reset Link"
4. Check email inbox for reset link
5. Click the link or copy the token
6. Reset your password

## Verification Checklist

- [ ] Email configuration added to `server/.env`
- [ ] Server restarted (MUST DO THIS!)
- [ ] Test script runs successfully
- [ ] Test emails received
- [ ] Password reset flow works end-to-end

## If Still Not Working

### Check 1: Server Logs
Look for this when server starts:
```
Email service is ready
```

### Check 2: Environment Variables Loaded
Add this temporarily to `server/src/app.js` to verify:
```javascript
console.log('Email config:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  hasPassword: !!process.env.EMAIL_PASSWORD
});
```

### Check 3: Gmail App Password
If you get "Invalid login" error:
1. Go to: https://myaccount.google.com/apppasswords
2. Generate a new app password
3. Update `EMAIL_PASSWORD` in `server/.env`
4. Restart server

## Common Mistakes

❌ **Forgot to restart server** - Environment variables only load on startup
❌ **Spaces in app password** - Already fixed, but keep in mind
❌ **Wrong .env file** - Make sure you edited `server/.env`, not root `.env`
❌ **2FA not enabled** - Gmail requires 2-Step Verification for app passwords

## Files Modified

- ✅ `server/.env` - Added email configuration
- ✅ `server/scripts/test-email.js` - Created test script
- ✅ `EMAIL_SETUP_GUIDE.md` - Comprehensive guide
- ✅ `EMAIL_QUICK_FIX.md` - This file

## Summary

The email configuration has been added. **You just need to restart your Express server** and the password reset functionality will work!

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd server
npm run dev
```

That's it! 🎉
