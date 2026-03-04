# Student Creation Error - RESOLVED

## Issue
Student creation was failing with error: `data and salt arguments required`

## Root Cause
The controller was hashing the password itself using bcrypt, then passing `passwordHash` to `User.create()`. However, `User.create()` expects a plain `password` field and hashes it internally using `AuthService.hashPassword()`.

When the controller passed `passwordHash`, the User model tried to hash `userData.password` which was undefined, causing bcrypt to fail.

## Stack Trace Analysis
```
at AuthService.hashPassword (auth.service.js:16:19)
at User.create (User.js:58:43)
at create (students.controller.js:146:18)
```

The error occurred in `AuthService.hashPassword`, not in the controller, which was the key clue.

## Solution
Changed the controller to pass plain `password` instead of `passwordHash`:

**Before:**
```javascript
const passwordHash = await bcrypt.hash(passwordToHash, 10);
await User.create({
  id: userId,
  email,
  passwordHash,  // ❌ Wrong field name
  role: 'student',
  emailVerified: true
});
```

**After:**
```javascript
await User.create({
  id: userId,
  email,
  password: passwordToHash,  // ✅ Correct - User.create will hash it
  role: 'student',
  emailVerified: true
});
```

## Files Modified
1. `server/src/controllers/students.controller.js`
   - Fixed `create()` method
   - Fixed `bulkImport()` method
   - Removed unnecessary bcrypt import

## Testing
Try creating a student through the teacher dashboard. It should now work correctly.
