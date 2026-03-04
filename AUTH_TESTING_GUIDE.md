# Authentication Testing Guide

## Quick Start Testing

### Prerequisites
1. Ensure the Express server is running on port 3001
2. Ensure the Next.js frontend is running on port 3000
3. Database should be set up with required tables

### Test Scenarios

## 1. Registration Flow

### Test Case 1.1: Student Registration
**Steps:**
1. Navigate to `http://localhost:3000/auth/register`
2. Select "Student" role
3. Fill in the form:
   - First Name: "Test"
   - Last Name: "Student"
   - Email: "teststudent@example.com"
   - Grade Level: "Grade 10"
   - Password: "TestPass123" (watch the strength indicator)
   - Confirm Password: "TestPass123"
4. Click "Create Account"

**Expected Results:**
- ✅ Password strength indicator shows "Good" or "Strong"
- ✅ Form submits successfully
- ✅ Toast notification shows "Registration Successful!"
- ✅ Redirects to `/onboarding/vark` (VARK assessment)

### Test Case 1.2: Teacher Registration
**Steps:**
1. Navigate to `http://localhost:3000/auth/register`
2. Select "Teacher" role
3. Fill in the form:
   - First Name: "Test"
   - Last Name: "Teacher"
   - Email: "testteacher@example.com"
   - Password: "TeachPass123"
   - Confirm Password: "TeachPass123"
4. Click "Create Account"

**Expected Results:**
- ✅ Password strength indicator shows "Good" or "Strong"
- ✅ Form submits successfully
- ✅ Toast notification shows "Registration Successful!"
- ✅ Redirects to `/teacher/dashboard`

### Test Case 1.3: Weak Password Validation
**Steps:**
1. Navigate to `http://localhost:3000/auth/register`
2. Try password: "test123"

**Expected Results:**
- ✅ Password strength shows "Weak" (red)
- ✅ Error message: "Password must contain at least one uppercase letter"
- ✅ Form cannot be submitted

### Test Case 1.4: Duplicate Email
**Steps:**
1. Try to register with an email that already exists

**Expected Results:**
- ✅ Error toast: "Email already registered"
- ✅ Form stays on registration page

## 2. Login Flow

### Test Case 2.1: Student Login
**Steps:**
1. Navigate to `http://localhost:3000/auth/login`
2. Select "Student" role
3. Enter credentials:
   - Email: "teststudent@example.com"
   - Password: "TestPass123"
4. Click "Sign In"

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Toast notification: "Login Successful!"
- ✅ If onboarding completed: Redirects to `/student/dashboard`
- ✅ If onboarding not completed: Redirects to `/onboarding/vark`

### Test Case 2.2: Teacher Login
**Steps:**
1. Navigate to `http://localhost:3000/auth/login`
2. Select "Teacher" role
3. Enter credentials:
   - Email: "testteacher@example.com"
   - Password: "TeachPass123"
4. Click "Sign In"

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Toast notification: "Login Successful!"
- ✅ Redirects to `/teacher/dashboard`

### Test Case 2.3: Invalid Credentials
**Steps:**
1. Try to login with wrong password

**Expected Results:**
- ✅ Error toast: "Invalid email or password"
- ✅ Form stays on login page

## 3. Password Reset Flow

### Test Case 3.1: Request Password Reset
**Steps:**
1. Navigate to `http://localhost:3000/auth/forgot-password`
2. Enter email: "teststudent@example.com"
3. Click "Send Reset Link"

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Success message: "Check Your Email"
- ✅ Email sent with reset link (if email configured)
- ✅ Message: "We've sent you a password reset link"

### Test Case 3.2: Reset Password with Valid Token
**Steps:**
1. Get reset token from email or database
2. Navigate to `http://localhost:3000/auth/reset-password?token=YOUR_TOKEN`
3. Enter new password: "NewPass123"
4. Confirm password: "NewPass123"
5. Watch password strength indicator
6. Click "Reset Password"

**Expected Results:**
- ✅ Password strength indicator works
- ✅ Form submits successfully
- ✅ Success message: "Password Reset Successful!"
- ✅ Auto-redirects to login page after 3 seconds

### Test Case 3.3: Reset Password with Invalid Token
**Steps:**
1. Navigate to `http://localhost:3000/auth/reset-password?token=invalid`
2. Try to submit form

**Expected Results:**
- ✅ Error message: "Invalid or expired password reset token"
- ✅ Form cannot be submitted

### Test Case 3.4: Reset Password with Expired Token
**Steps:**
1. Use a token that's older than 1 hour
2. Try to reset password

**Expected Results:**
- ✅ Error message: "Invalid or expired password reset token"

## 4. Password Strength Indicator

### Test Case 4.1: Weak Password
**Input:** "test123"
**Expected:**
- ✅ Strength: "Weak" (red)
- ✅ Progress bar: ~40%
- ✅ Missing: uppercase letter

### Test Case 4.2: Fair Password
**Input:** "Test123"
**Expected:**
- ✅ Strength: "Fair" (yellow)
- ✅ Progress bar: ~60%
- ✅ All basic requirements met

### Test Case 4.3: Good Password
**Input:** "TestPass123"
**Expected:**
- ✅ Strength: "Good" (blue)
- ✅ Progress bar: ~80%
- ✅ 12+ characters, mixed case, numbers

### Test Case 4.4: Strong Password
**Input:** "TestPass123!@#"
**Expected:**
- ✅ Strength: "Strong" (green)
- ✅ Progress bar: 100%
- ✅ All requirements met including special characters

## 5. Form Validation

### Test Case 5.1: Email Validation
**Steps:**
1. Enter invalid email: "notanemail"

**Expected Results:**
- ✅ Error: "Please enter a valid email address"

### Test Case 5.2: Required Fields
**Steps:**
1. Try to submit form with empty fields

**Expected Results:**
- ✅ Error messages for all required fields
- ✅ Form cannot be submitted

### Test Case 5.3: Password Mismatch
**Steps:**
1. Password: "TestPass123"
2. Confirm Password: "TestPass456"

**Expected Results:**
- ✅ Error: "Passwords don't match"

## 6. UI/UX Testing

### Test Case 6.1: Show/Hide Password
**Steps:**
1. Click eye icon on password field

**Expected Results:**
- ✅ Password toggles between visible and hidden
- ✅ Icon changes between Eye and EyeOff

### Test Case 6.2: Loading States
**Steps:**
1. Submit any form

**Expected Results:**
- ✅ Button shows loading spinner
- ✅ Button text changes to "Signing In..." or similar
- ✅ Button is disabled during loading

### Test Case 6.3: Role Selection
**Steps:**
1. Switch between Student and Teacher tabs

**Expected Results:**
- ✅ Active tab is highlighted
- ✅ Form role value updates
- ✅ Smooth transition animation

### Test Case 6.4: Responsive Design
**Steps:**
1. Test on mobile viewport (375px)
2. Test on tablet viewport (768px)
3. Test on desktop viewport (1920px)

**Expected Results:**
- ✅ All elements are properly sized
- ✅ No horizontal scrolling
- ✅ Touch-friendly buttons on mobile

## 7. Security Testing

### Test Case 7.1: SQL Injection
**Steps:**
1. Try email: "admin'--"
2. Try password: "' OR '1'='1"

**Expected Results:**
- ✅ No SQL errors
- ✅ Invalid credentials error

### Test Case 7.2: XSS Prevention
**Steps:**
1. Try name: "<script>alert('xss')</script>"

**Expected Results:**
- ✅ Script is not executed
- ✅ Input is sanitized

### Test Case 7.3: Email Enumeration
**Steps:**
1. Request password reset for non-existent email

**Expected Results:**
- ✅ Same success message as valid email
- ✅ No indication if email exists or not

## 8. Session Management

### Test Case 8.1: Token Persistence
**Steps:**
1. Login successfully
2. Refresh the page

**Expected Results:**
- ✅ User stays logged in
- ✅ No redirect to login page

### Test Case 8.2: Token Expiration
**Steps:**
1. Wait for access token to expire (15 minutes)
2. Make an API request

**Expected Results:**
- ✅ Token is automatically refreshed
- ✅ Request succeeds

### Test Case 8.3: Logout
**Steps:**
1. Login
2. Logout
3. Try to access protected page

**Expected Results:**
- ✅ Tokens are cleared
- ✅ Redirects to login page

## Email Configuration Testing

### If Email is Configured:

**Test Case 9.1: Password Reset Email**
**Steps:**
1. Request password reset
2. Check email inbox

**Expected Results:**
- ✅ Email received within 1 minute
- ✅ Email has reset link
- ✅ Link contains valid token
- ✅ Email is properly formatted (HTML)

### If Email is NOT Configured:

**Expected Behavior:**
- ✅ Frontend still shows success message
- ✅ No error in console
- ✅ Backend logs email error
- ✅ User experience is not broken

## Common Issues and Solutions

### Issue 1: "Network Error"
**Solution:**
- Check if Express server is running on port 3001
- Check CORS configuration
- Check browser console for details

### Issue 2: "Invalid Token"
**Solution:**
- Check JWT_SECRET in server/.env
- Ensure tokens are being stored correctly
- Check token expiration times

### Issue 3: "Email Not Sent"
**Solution:**
- Check EMAIL_* variables in server/.env
- Test email service connection
- Check spam folder

### Issue 4: "Redirect Not Working"
**Solution:**
- Check user role in database
- Check onboarding_completed flag
- Check browser console for errors

## Performance Testing

### Test Case 10.1: Form Submission Speed
**Expected:**
- ✅ Login: < 1 second
- ✅ Register: < 2 seconds
- ✅ Password reset request: < 1 second

### Test Case 10.2: Password Strength Calculation
**Expected:**
- ✅ Real-time updates (no lag)
- ✅ Smooth progress bar animation

## Accessibility Testing

### Test Case 11.1: Keyboard Navigation
**Steps:**
1. Use Tab key to navigate form
2. Use Enter to submit

**Expected Results:**
- ✅ All fields are reachable
- ✅ Focus indicators are visible
- ✅ Form submits on Enter

### Test Case 11.2: Screen Reader
**Steps:**
1. Use screen reader to navigate

**Expected Results:**
- ✅ Labels are read correctly
- ✅ Error messages are announced
- ✅ Button states are announced

## Checklist Summary

- [ ] Student registration works
- [ ] Teacher registration works
- [ ] Password strength indicator works
- [ ] Student login works
- [ ] Teacher login works
- [ ] Role-based redirects work
- [ ] Password reset request works
- [ ] Password reset with token works
- [ ] Email validation works
- [ ] Form validation works
- [ ] Loading states work
- [ ] Error handling works
- [ ] Toast notifications work
- [ ] Responsive design works
- [ ] Security measures work
- [ ] Session management works

## Notes

- Test with real email addresses if email service is configured
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on multiple devices (mobile, tablet, desktop)
- Check browser console for any errors
- Check server logs for any errors
- Monitor network tab for API calls
