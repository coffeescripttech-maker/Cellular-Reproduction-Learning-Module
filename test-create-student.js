// Test script to diagnose student creation issue
// Run with: node test-create-student.js

const testData = {
  email: 'dylan@gmail.com',
  password: 'learn2025',
  firstName: 'Dylan',
  middleName: '',
  lastName: 'Test',
  fullName: 'Dylan Test',
  gradeLevel: 'Grade 7',
  learningStyle: 'reading_writing',
  preferredModules: [],
  learningType: '',
  onboardingCompleted: true
};

async function testCreateStudent() {
  try {
    console.log('🧪 Testing student creation...');
    console.log('📤 Sending data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/students/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📥 Response status:', response.status);
    
    const result = await response.json();
    console.log('📥 Response body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('❌ Error:', result.error);
    } else {
      console.log('✅ Success!');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testCreateStudent();
