# Quick Start Testing Guide

## Prerequisites
- MySQL database running
- Node.js installed
- Both `.env` and `.env.local` configured

## Step 1: Start Express Server

```bash
cd server
node src/app.js
```

**Expected Output**:
```
🚀 Server running on port 3001
✅ Database connected successfully
```

## Step 2: Start Next.js Development Server

```bash
# In project root
npm run dev
```

**Expected Output**:
```
✓ Ready in 3.5s
○ Local: http://localhost:3000
```

## Step 3: Test Complete User Flow

### A. Registration & Login
1. Navigate to `http://localhost:3000/auth/register`
2. Register a new student account
3. Login at `http://localhost:3000/auth/login`

**Expected**: Successful login, redirect to onboarding

### B. VARK Assessment
1. Complete VARK assessment at `/onboarding/vark`
2. Answer all 20 questions
3. Click "Complete Setup & Continue"

**Expected**: 
- Profile updated with learning style
- Redirect to `/student/dashboard`
- No console errors

### C. Student Dashboard
1. View dashboard at `/student/dashboard`
2. Check statistics display
3. View recommended modules

**Expected**:
- Stats load correctly
- Modules display
- No "is not a constructor" errors
- No "filter is not a function" errors

### D. VARK Modules
1. Navigate to `/student/vark-modules`
2. Browse available modules
3. Click on a module to view

**Expected**:
- Module list loads
- Module content displays
- Sections are accessible

### E. Profile Update
1. Go to `/student/profile`
2. Update profile information
3. Click "Save Changes"

**Expected**:
- Profile updates successfully
- No "No valid fields to update" error
- Success message displays

## Step 4: Test Teacher Flow (Optional)

### A. Teacher Login
1. Login with teacher account
2. Navigate to `/teacher/dashboard`

**Expected**:
- Dashboard statistics load
- Learning style distribution displays
- Recent completions show

### B. Module Management
1. Go to `/teacher/vark-modules`
2. View module list
3. Edit a module

**Expected**:
- Modules load correctly
- Edit page works
- No API errors

## Common Issues & Solutions

### Issue: "VARKModulesAPI is not a constructor"
**Solution**: Clear Next.js cache and restart
```bash
rmdir /s /q .next
npm run dev
```

### Issue: "modulesData.filter is not a function"
**Solution**: Verify `express-vark-modules.ts` returns array directly
```typescript
// Should be:
return response.data || [];
// NOT:
return { success: true, data: response.data };
```

### Issue: "No valid fields to update"
**Solution**: Check auth controller converts camelCase to snake_case
```javascript
// Should be:
updateData.learning_style = learningStyle;
// NOT:
updateData.learningStyle = learningStyle;
```

### Issue: Express server won't start
**Solution**: Check for syntax errors in controllers
```bash
# Check auth controller
node -c server/src/controllers/auth.controller.js
```

### Issue: Database connection fails
**Solution**: Verify MySQL is running and credentials are correct
```bash
# Test MySQL connection
mysql -u root -p
```

## Verification Checklist

### Backend Health
- [ ] Express server starts without errors
- [ ] Database connection successful
- [ ] All routes registered
- [ ] JWT middleware working

### Frontend Health
- [ ] Next.js compiles without errors
- [ ] No TypeScript errors
- [ ] Environment variables loaded
- [ ] API client configured correctly

### API Endpoints
- [ ] `POST /api/auth/register` works
- [ ] `POST /api/auth/login` works
- [ ] `GET /api/auth/me` works
- [ ] `PUT /api/auth/profile` works
- [ ] `GET /api/modules` works
- [ ] `GET /api/modules/:id` works
- [ ] `GET /api/stats/homepage` works

### User Flows
- [ ] Registration → Login → Onboarding → Dashboard
- [ ] VARK assessment completion
- [ ] Module browsing and viewing
- [ ] Profile updates
- [ ] Progress tracking

## Debug Mode

Enable detailed logging:

**Express Server** (`server/src/app.js`):
```javascript
// Already configured with Winston logger
// Check logs in console and combined.log
```

**Frontend** (Browser Console):
```javascript
// Check for API calls
localStorage.getItem('accessToken') // Should have token
```

## Performance Check

### Expected Response Times
- Authentication: < 500ms
- Module listing: < 1s
- Module content: < 2s
- Profile update: < 500ms
- Dashboard stats: < 1s

### Database Query Performance
```sql
-- Check slow queries
SHOW PROCESSLIST;

-- Check table sizes
SELECT 
  table_name,
  table_rows,
  data_length,
  index_length
FROM information_schema.tables
WHERE table_schema = 'biscas_naga';
```

## Success Indicators

✅ **All Green**:
- No console errors
- All pages load
- All forms submit successfully
- Data displays correctly
- Navigation works smoothly

🎉 **Migration Complete!**

## Next Steps After Testing

1. **Production Deployment**
   - Update production environment variables
   - Run database migrations
   - Deploy Express server
   - Deploy Next.js application

2. **Monitoring Setup**
   - Configure error tracking
   - Set up performance monitoring
   - Enable database query logging
   - Configure alerts

3. **Documentation**
   - Update API documentation
   - Create user guides
   - Document deployment process
   - Create troubleshooting guide

## Support

If you encounter issues:
1. Check the error logs in `server/combined.log`
2. Review browser console for frontend errors
3. Verify environment variables are set correctly
4. Ensure database schema is up to date
5. Check that all dependencies are installed

## Rollback

If critical issues arise:
```env
# In .env and .env.local
NEXT_PUBLIC_USE_NEW_API=false
```

Restart Next.js server - system reverts to Supabase backend.
