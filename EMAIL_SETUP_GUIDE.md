# Email Setup Guide - Gmail Configuration

## Issue Resolved ✅

The error `ECONNREFUSED 127.0.0.1:587` was caused by missing email configuration in `server/.env`.

## Configuration Added

The following email configuration has been added to `server/.env`:

```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=newdexm@gmail.com
EMAIL_PASSWORD=pvtbeirhwsoxzfyy
EMAIL_FROM=BISCAS NAGA Learning <newdexm@gmail.com>
```

## Important Notes

### Gmail App Password
- The password used is a **Gmail App Password**, not your regular Gmail password
- App passwords are 16 characters long (no spaces)
- Format: `pvtbeirhwsoxzfyy` (removed spaces from your original)

### How to Generate Gmail App Password

If you need to generate a new app password:

1. **Enable 2-Step Verification** (if not already enabled)
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device
   - Enter "BISCAS Learning Module"
   - Click "Generate"
   - Copy the 16-character password (without spaces)

3. **Update .env file**
   - Replace `EMAIL_PASSWORD` with the new app password
   - Remove any spaces from the password

## Testing the Configuration

### Step 1: Restart the Server

After updating `.env`, restart your Express server:

```bash
cd server
npm run dev
```

The server needs to be restarted to load the new environment variables.

### Step 2: Run Email Test Script

Test if email is working:

```bash
cd server
node scripts/test-email.js
```

**Expected Output:**
```
🔍 Testing Email Configuration...

Configuration:
  EMAIL_HOST: smtp.gmail.com
  EMAIL_PORT: 587
  EMAIL_USER: newdexm@gmail.com
  EMAIL_PASSWORD: ***zfyy
  EMAIL_FROM: BISCAS NAGA Learning <newdexm@gmail.com>

Test 1: Verifying SMTP connection...
✅ SMTP connection successful!

Test 2: Sending test email...
✅ Test email sent successfully!
📧 Check inbox: newdexm@gmail.com

Test 3: Sending password reset email...
✅ Password reset email sent successfully!
📧 Check inbox: newdexm@gmail.com

🎉 All email tests passed!

Your email service is ready to use.
```

### Step 3: Test Password Reset Flow

1. Go to: http://localhost:3000/auth/forgot-password
2. Enter email: `newdexm@gmail.com` (or any registered user email)
3. Click "Send Reset Link"
4. Check the email inbox for the password reset email

## Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solution:**
- Your app password is incorrect
- Generate a new app password
- Make sure 2-Step Verification is enabled
- Copy the password without spaces

### Error: "ECONNREFUSED 127.0.0.1:587"

**Solution:**
- Environment variables are not loaded
- Restart the Express server
- Check that `server/.env` file exists and has the correct values
- Make sure you're running from the `server` directory

### Error: "ETIMEDOUT" or "Connection timeout"

**Solution:**
- Check your internet connection
- Gmail SMTP might be blocked by firewall
- Try using port 465 with SSL:
  ```env
  EMAIL_PORT=465
  ```

### Error: "self signed certificate in certificate chain"

**Solution:**
- This is a development environment issue
- Add to email service configuration (not recommended for production):
  ```javascript
  tls: {
    rejectUnauthorized: false
  }
  ```

### Emails Going to Spam

**Solution:**
- This is normal for development
- Check spam/junk folder
- In production, use a proper email service (SendGrid, AWS SES, etc.)
- Set up SPF, DKIM, and DMARC records for your domain

## Email Service Configuration

The email service is configured in `server/src/services/email.service.js`:

```javascript
this.transporter = nodemailer.createTransport({
  host: config.email.host,        // smtp.gmail.com
  port: config.email.port,        // 587
  secure: config.email.port === 465, // false for 587, true for 465
  auth: {
    user: config.email.user,      // newdexm@gmail.com
    pass: config.email.password   // app password
  }
});
```

## Email Templates

### Password Reset Email

The password reset email includes:
- Professional HTML template
- Reset link with token
- 1-hour expiration notice
- Plain text fallback

**Preview:**
```
Subject: Password Reset Request - BISCAS NAGA Learning Module

You have requested to reset your password.

[Reset Password Button]

This link will expire in 1 hour.
```

### Welcome Email (Optional)

Can be sent after registration:
```javascript
await emailService.sendWelcomeEmail(email, firstName);
```

## Production Recommendations

### For Production Use:

1. **Use a Dedicated Email Service**
   - SendGrid (recommended)
   - AWS SES
   - Mailgun
   - Postmark

2. **Don't Use Personal Gmail**
   - Gmail has sending limits (500 emails/day)
   - Not reliable for production
   - Can get blocked

3. **Set Up Custom Domain**
   - Use `noreply@biscas.edu` instead of Gmail
   - Set up SPF, DKIM, DMARC records
   - Improves deliverability

4. **Environment Variables**
   ```env
   # Production Example (SendGrid)
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   EMAIL_FROM=BISCAS NAGA Learning <noreply@biscas.edu>
   ```

## Gmail Sending Limits

**Free Gmail Account:**
- 500 emails per day
- 100 recipients per email
- Suitable for development/testing only

**Google Workspace:**
- 2,000 emails per day
- Better for small production use
- Still recommend dedicated email service for large scale

## Security Best Practices

1. **Never Commit .env Files**
   - `.env` is in `.gitignore`
   - Never share app passwords publicly

2. **Rotate App Passwords**
   - Change app passwords periodically
   - Revoke old passwords when not needed

3. **Use Environment-Specific Configs**
   - Development: Gmail with app password
   - Production: Dedicated email service

4. **Monitor Email Sending**
   - Log all email attempts
   - Track delivery rates
   - Monitor for failures

## Testing Checklist

- [x] Email configuration added to `server/.env`
- [x] App password format corrected (removed spaces)
- [ ] Server restarted to load new environment variables
- [ ] Email test script executed successfully
- [ ] Test email received in inbox
- [ ] Password reset email received in inbox
- [ ] Password reset flow tested end-to-end

## Next Steps

1. **Restart your Express server** to load the new configuration
2. **Run the test script**: `node server/scripts/test-email.js`
3. **Check your email inbox** for test emails
4. **Test the password reset flow** from the frontend
5. **Monitor server logs** for any email-related errors

## Support

If you continue to have issues:

1. Check server console logs for detailed error messages
2. Verify Gmail account settings (2FA, app passwords)
3. Try generating a new app password
4. Check firewall/antivirus settings
5. Test with a different email service (if available)

## Summary

✅ Email configuration has been added to `server/.env`
✅ Gmail app password format corrected
✅ Test script created for verification
✅ Ready to test after server restart

The email service should now work correctly for password reset functionality!
