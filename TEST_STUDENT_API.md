# 🧪 Test Student API Endpoints

## 📍 API Endpoints

### 1. Create Single Student
**URL**: `http://localhost:3000/api/students/create`
**Method**: `POST`
**Content-Type**: `application/json`

### 2. Bulk Import Students
**URL**: `http://localhost:3000/api/students/bulk-import`
**Method**: `POST`
**Content-Type**: `application/json`

---

## 🧪 Test Cases

### Test 1: Create Single Student

**Request:**
```bash
curl -X POST http://localhost:3000/api/students/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.student@student.com",
    "password": "learn2025",
    "firstName": "Test",
    "lastName": "Student",
    "gradeLevel": "Grade 7",
    "learningStyle": "visual",
    "preferredModules": ["Visual", "Kinesthetic"],
    "learningType": "Bimodal",
    "onboardingCompleted": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "test.student@student.com",
    "first_name": "Test",
    "last_name": "Student",
    "role": "student",
    ...
  }
}
```

### Test 2: Create Duplicate Student (Should Fail)

**Request:**
```bash
curl -X POST http://localhost:3000/api/students/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.student@student.com",
    "password": "learn2025",
    "firstName": "Test",
    "lastName": "Student"
  }'
```

**Expected Response:**
```json
{
  "error": "A student with email test.student@student.com already exists"
}
```

### Test 3: Bulk Import Students

**Request:**
```bash
curl -X POST http://localhost:3000/api/students/bulk-import \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Doe, John",
      "username": "john.doe",
      "password": "learn2025",
      "preferred_modules": ["Visual", "Kinesthetic"],
      "type": "Bimodal"
    },
    {
      "name": "Smith, Jane Marie",
      "username": "jane.smith",
      "password": "learn2025",
      "preferred_modules": ["Aural", "Read/Write"],
      "type": "Bimodal"
    }
  ]'
```

**Expected Response:**
```json
{
  "success": 2,
  "failed": 0,
  "skipped": 0,
  "errors": []
}
```

---

## 🌐 Browser Testing

### Using Browser Console

Open browser console (F12) and run:

```javascript
// Test 1: Create Single Student
fetch('http://localhost:3000/api/students/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'browser.test@student.com',
    password: 'learn2025',
    firstName: 'Browser',
    lastName: 'Test',
    gradeLevel: 'Grade 7',
    learningStyle: 'visual',
    preferredModules: ['Visual'],
    learningType: 'Unimodal',
    onboardingCompleted: true
  })
})
.then(r => r.json())
.then(data => console.log('✅ Result:', data))
.catch(err => console.error('❌ Error:', err));

// Test 2: Bulk Import
fetch('http://localhost:3000/api/students/bulk-import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([
    {
      name: 'Test, Bulk One',
      username: 'bulk.one',
      password: 'learn2025',
      preferred_modules: ['Visual', 'Kinesthetic'],
      type: 'Bimodal'
    },
    {
      name: 'Test, Bulk Two',
      username: 'bulk.two',
      password: 'learn2025',
      preferred_modules: ['Aural'],
      type: 'Unimodal'
    }
  ])
})
.then(r => r.json())
.then(data => console.log('✅ Bulk Result:', data))
.catch(err => console.error('❌ Error:', err));
```

---

## 📝 Sample JSON Files

### Single Student JSON
**File**: `test-student.json`
```json
{
  "email": "sample.student@student.com",
  "password": "learn2025",
  "firstName": "Sample",
  "middleName": "Middle",
  "lastName": "Student",
  "gradeLevel": "Grade 8",
  "learningStyle": "kinesthetic",
  "preferredModules": ["Kinesthetic", "Visual"],
  "learningType": "Bimodal",
  "onboardingCompleted": true
}
```

### Bulk Import JSON
**File**: `test-bulk-students.json`
```json
[
  {
    "name": "Anderson, Alice Marie",
    "username": "alice.anderson",
    "password": "learn2025",
    "preferred_modules": ["Visual", "Read/Write"],
    "type": "Bimodal"
  },
  {
    "name": "Brown, Bob",
    "username": "bob.brown",
    "password": "learn2025",
    "preferred_modules": ["Kinesthetic"],
    "type": "Unimodal"
  },
  {
    "name": "Chen, Carol Lee",
    "username": "carol.chen",
    "password": "learn2025",
    "preferred_modules": ["Aural", "Visual", "Kinesthetic"],
    "type": "Trimodal"
  },
  {
    "name": "Davis, David",
    "username": "david.davis",
    "password": "learn2025",
    "preferred_modules": ["Visual", "Aural", "Read/Write", "Kinesthetic"],
    "type": "Multimodal"
  }
]
```

---

## 🔍 Debugging

### Check Server Logs

When you make a request, check your terminal where `npm run dev` is running. You should see:

```
Creating student: test.student@student.com
✅ Student created: test.student@student.com
```

Or for bulk import:
```
📥 Starting bulk import of 4 students...
🔍 Checking for existing students...
📋 Found 0 existing students in database
✅ 4 new students to import
⏭️  0 students already exist (skipped)
✅ Created: alice.anderson@student.com
✅ Created: bob.brown@student.com
✅ Created: carol.chen@student.com
✅ Created: david.davis@student.com
📊 Bulk import results: { success: 4, failed: 0, skipped: 0 }
```

### Common Errors

#### Error: "Missing environment variables"
**Solution**: Check `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

#### Error: "duplicate key value violates unique constraint"
**Solution**: Email already exists. Use different email or delete existing student.

#### Error: "Failed to create student"
**Solution**: Check Supabase logs for detailed error.

---

## 🎯 Expected Behavior

### Create Student API:
1. ✅ Checks if email already exists
2. ✅ Returns error if duplicate
3. ✅ Creates auth user
4. ✅ Creates profile
5. ✅ Returns success with student data

### Bulk Import API:
1. ✅ Checks existing emails in database
2. ✅ Skips duplicates gracefully
3. ✅ Creates auth users for new students
4. ✅ Creates profiles
5. ✅ Returns detailed results (success, failed, skipped)

---

## 📊 Verify in Database

After creating students, verify in Supabase:

```sql
-- Check auth users
SELECT id, email, created_at 
FROM auth.users 
WHERE email LIKE '%@student.com'
ORDER BY created_at DESC
LIMIT 10;

-- Check profiles
SELECT id, email, first_name, last_name, role, learning_style
FROM profiles 
WHERE role = 'student'
ORDER BY created_at DESC
LIMIT 10;

-- Check for orphaned auth users (should be 0)
SELECT COUNT(*) as orphaned
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

---

## 🧪 Postman Collection

If you use Postman, import this collection:

```json
{
  "info": {
    "name": "Student API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Single Student",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"postman.test@student.com\",\n  \"password\": \"learn2025\",\n  \"firstName\": \"Postman\",\n  \"lastName\": \"Test\",\n  \"gradeLevel\": \"Grade 7\",\n  \"learningStyle\": \"visual\",\n  \"preferredModules\": [\"Visual\"],\n  \"learningType\": \"Unimodal\",\n  \"onboardingCompleted\": true\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/students/create",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "students", "create"]
        }
      }
    },
    {
      "name": "Bulk Import Students",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "[\n  {\n    \"name\": \"Postman, Test One\",\n    \"username\": \"test.one\",\n    \"password\": \"learn2025\",\n    \"preferred_modules\": [\"Visual\"],\n    \"type\": \"Unimodal\"\n  }\n]"
        },
        "url": {
          "raw": "http://localhost:3000/api/students/bulk-import",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "students", "bulk-import"]
        }
      }
    }
  ]
}
```

---

## ✅ Success Checklist

After testing, you should have:

- [ ] Created at least one student via API
- [ ] Verified student exists in database
- [ ] Tested duplicate email rejection
- [ ] Tested bulk import
- [ ] Verified bulk import results
- [ ] Checked for orphaned auth users (should be 0)
- [ ] Logged in as test student to verify account works

---

**Ready to test!** Use the browser console method for quickest testing. 🚀
