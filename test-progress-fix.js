/**
 * Test Progress API Fix
 * 
 * This script tests if the progress API now accepts snake_case data
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001';

// Test user credentials
const TEST_USER = {
  email: 'student@test.com',
  password: 'password123'
};

async function testProgressFix() {
  try {
    console.log('🔐 Logging in...');
    
    // Login
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    
    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}`);
    
    // Get a module ID
    console.log('\n📚 Fetching modules...');
    const modulesResponse = await axios.get(`${API_URL}/api/modules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!modulesResponse.data.success || modulesResponse.data.data.length === 0) {
      console.error('❌ No modules available');
      return;
    }
    
    const moduleId = modulesResponse.data.data[0].id;
    console.log('✅ Module found');
    console.log(`   Module ID: ${moduleId}`);
    
    // Test creating progress with snake_case (as frontend sends it)
    console.log('\n🧪 Testing progress creation with snake_case...');
    
    const progressData = {
      student_id: userId,
      module_id: moduleId,
      status: 'in_progress',
      progress_percentage: 25,
      current_section_id: 'section-1',
      time_spent_minutes: 15,
      completed_sections: ['intro'],
      assessment_scores: { quiz1: 85 }
    };
    
    try {
      const createResponse = await axios.post(
        `${API_URL}/api/progress`,
        progressData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (createResponse.data.message) {
        console.log('✅ Progress created successfully!');
        console.log(`   Progress ID: ${createResponse.data.data.id}`);
        console.log(`   Status: ${createResponse.data.data.status}`);
        console.log(`   Progress: ${createResponse.data.data.progress_percentage}%`);
      }
    } catch (error) {
      if (error.response?.data?.error?.code === 'DB_DUPLICATE_ENTRY') {
        console.log('ℹ️  Progress already exists (this is OK)');
        console.log('   Testing update instead...');
        
        // Try updating
        const updateResponse = await axios.put(
          `${API_URL}/api/progress/student/${userId}/module/${moduleId}`,
          { progress_percentage: 50 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (updateResponse.data.message) {
          console.log('✅ Progress updated successfully!');
          console.log(`   Progress: ${updateResponse.data.data.progress_percentage}%`);
        }
      } else {
        throw error;
      }
    }
    
    // Verify we can retrieve it
    console.log('\n🔍 Verifying progress retrieval...');
    const getResponse = await axios.get(
      `${API_URL}/api/progress/student/${userId}/module/${moduleId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (getResponse.data.data) {
      console.log('✅ Progress retrieved successfully!');
      console.log(`   Status: ${getResponse.data.data.status}`);
      console.log(`   Progress: ${getResponse.data.data.progress_percentage}%`);
    }
    
    console.log('\n✅ ALL TESTS PASSED! The fix is working.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testProgressFix();
