# Authentication Pages Revamp Plan

## Current Status
The authentication pages (`/auth/login`, `/auth/register`, `/auth/forgot-password`) have good UI/UX but need to be properly connected to the Express server APIs and enhanced with better validation.

## Issues to Address

### 1. Login Page (`app/auth/login/page.tsx`) ✅ COMPLETE
**Status:**
- ✅ UI/UX is already good
- ✅ Calls `/api/auth/login` Express endpoint
- ✅ Has error messages from server
- ✅ Has loading states
- ✅ Works with actual student and teacher accounts
- ⚠️ "Remember Me" functionality (future enhancement)
- ⚠️ Rate limiting feedback (future enhancement)

### 2. Register Page (`app/auth/register/page.tsx`) ✅ COMPLETE
**Status:**
- ✅ UI/UX is already good
- ✅ Calls `/api/auth/register` Express endpoint
- ✅ Has email format validation
- ✅ Has password strength indicator
- ✅ Handles duplicate email errors gracefully
- ✅ Enhanced password validation (8+ chars, uppercase, lowercase, numbers)
- ⚠️ Terms & conditions checkbox (future enhancement)
- ⚠️ Email verification step (future enhancement)

### 3. Forgot Password Page (`app/auth/forgot-password/page.tsx`) ✅ COMPLETE
**Status:**
- ✅ UI/UX is already good
- ✅ Connected to Express API
- ✅ Calls `/api/auth/forgot-password` endpoint
- ✅ Has email enumeration protection
- ✅ Has success/error states

### 4. Reset Password Page (`app/auth/reset-password/page.tsx`) ✅ NEW
**Status:**
- ✅ New page created
- ✅ Token-based password reset
- ✅ Password strength indicator
- ✅ Calls `/api/auth/reset-password` endpoint
- ✅ Token validation and expiration handling
- ✅ Success state with auto-redirect

## Express Server API Endpoints Needed

### Existing Endpoints (to verify):
1. `POST /api/auth/login` - User login
2. `POST /api/auth/register` - User registration
3. `POST /api/auth/logout` - User logout
4. `GET /api/auth/me` - Get current user

### New Endpoints Needed:
1. `POST /api/auth/forgot-password` - Request password reset
2. `POST /api/auth/reset-password` - Reset password with token
3. `POST /api/auth/verify-email` - Verify email address
4. `POST /api/auth/resend-verification` - Resend verification email

## Implementation Tasks

### Phase 1: Verify Current Auth Flow ✅ COMPLETE
- [x] Check `lib/api/express-auth.ts` implementation
- [x] Test login with student account
- [x] Test login with teacher account
- [x] Test registration flow
- [x] Verify JWT token handling
- [x] Check session management

### Phase 2: Enhance Form Validation ✅ COMPLETE
- [x] Add real-time email validation
- [x] Add password strength meter
- [x] Add confirm password matching indicator
- [x] Add field-level error messages
- [x] Add form-level error handling
- [x] Add success messages

### Phase 3: Implement Password Reset ✅ COMPLETE
- [x] Create password reset backend endpoints (already existed)
- [x] Add email sending functionality (nodemailer - already existed)
- [x] Create password reset token system (already existed)
- [x] Create reset password page
- [x] Add token expiration handling
- [x] Test complete flow

### Phase 4: Add Email Verification
- [ ] Create email verification endpoints
- [ ] Add verification email template
- [ ] Create email verification page
- [ ] Add resend verification functionality
- [ ] Handle verified/unverified states

### Phase 5: Security Enhancements
- [ ] Add rate limiting for login attempts
- [ ] Add CSRF protection
- [ ] Add input sanitization
- [ ] Add SQL injection prevention
- [ ] Add XSS protection
- [ ] Add secure password hashing (bcrypt)

### Phase 6: UX Improvements
- [ ] Add "Remember Me" functionality
- [ ] Add social login options (optional)
- [ ] Add loading skeletons
- [ ] Add success animations
- [ ] Add error animations
- [ ] Add accessibility improvements (ARIA labels)

### Phase 7: Testing
- [ ] Test all happy paths
- [ ] Test all error scenarios
- [ ] Test with invalid inputs
- [ ] Test with SQL injection attempts
- [ ] Test with XSS attempts
- [ ] Test rate limiting
- [ ] Test on mobile devices
- [ ] Test on different browsers

## Files to Review/Modify

### Frontend:
- `app/auth/login/page.tsx` - Login page
- `app/auth/register/page.tsx` - Registration page
- `app/auth/forgot-password/page.tsx` - Forgot password page
- `app/auth/reset-password/page.tsx` - NEW: Reset password page
- `app/auth/verify-email/page.tsx` - NEW: Email verification page
- `lib/api/express-auth.ts` - Auth API client
- `hooks/useAuth.tsx` - Auth hook
- `hooks/useExpressAuth.tsx` - Express auth hook

### Backend:
- `server/src/controllers/auth.controller.js` - Auth controller
- `server/src/routes/auth.routes.js` - Auth routes
- `server/src/models/User.js` - User model
- `server/src/middleware/auth.js` - Auth middleware
- `server/src/utils/email.js` - NEW: Email utility
- `server/src/utils/tokens.js` - NEW: Token utility

## Security Checklist

- [ ] Passwords are hashed with bcrypt (min 10 rounds)
- [ ] JWT tokens have expiration
- [ ] Refresh tokens are implemented
- [ ] HTTPS is enforced in production
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation on both client and server
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secure session management
- [ ] Password reset tokens expire
- [ ] Email verification tokens expire

## Testing Scenarios

### Login:
1. Valid student credentials → Success
2. Valid teacher credentials → Success
3. Invalid email → Error message
4. Invalid password → Error message
5. Non-existent user → Error message
6. Too many attempts → Rate limit message
7. Remember me checked → Session persists
8. Remember me unchecked → Session expires

### Registration:
1. Valid student data → Success + redirect to VARK
2. Valid teacher data → Success + redirect to dashboard
3. Duplicate email → Error message
4. Weak password → Error message
5. Passwords don't match → Error message
6. Invalid email format → Error message
7. Missing required fields → Error messages

### Password Reset:
1. Valid email → Success + email sent
2. Invalid email → Error message
3. Non-existent email → Generic success (security)
4. Valid reset token → Allow password reset
5. Expired token → Error message
6. Invalid token → Error message
7. Used token → Error message

## Next Steps

1. **Start a new conversation** focused on auth revamp
2. Review current Express auth implementation
3. Implement missing endpoints
4. Enhance form validation
5. Add password reset functionality
6. Add email verification
7. Test thoroughly
8. Deploy and monitor

## Notes

- The UI/UX is already well-designed
- Focus on backend integration and security
- Ensure all APIs work with MySQL database
- Test with real student and teacher accounts
- Consider adding 2FA in future
- Consider adding OAuth providers in future
