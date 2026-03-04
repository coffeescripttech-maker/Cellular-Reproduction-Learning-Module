/**
 * Student Pages Checkpoint Test
 * 
 * This script verifies that all student pages are properly migrated
 * and working with the Express backend.
 */

const axios = require('axios');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test configuration
const TEST_USER = {
  email: 'student@test.com',
  password: 'password123'
};

let authToken = null;
let userId = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status} - ${name}`, color);
  if (details) {
    log(`  ${details}`, 'yellow');
  }
}

// Test 1: Backend Server Health
async function testBackendHealth() {
  logSection('Test 1: Backend Server Health');
  
  try {
    // Test if server is responding
    const response = await axios.get(`${API_URL}/api/modules`, {
      validateStatus: () => true // Accept any status
    });
    
    const isRunning = response.status === 401 || response.status === 200;
    logTest('Backend server is running', isRunning, 
      isRunning ? `Server responded with status ${response.status}` : 'Server not responding');
    
    return isRunning;
  } catch (error) {
    logTest('Backend server is running', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 2: Authentication
async function testAuthentication() {
  logSection('Test 2: Authentication');
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      userId = response.data.user.id;
      logTest('User authentication', true, `Token received for user ${userId}`);
      return true;
    } else {
      logTest('User authentication', false, 'No token in response');
      return false;
    }
  } catch (error) {
    logTest('User authentication', false, `Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 3: Student Dashboard API
async function testStudentDashboardAPI() {
  logSection('Test 3: Student Dashboard API');
  
  if (!authToken || !userId) {
    logTest('Student Dashboard API', false, 'No auth token available');
    return false;
  }
  
  try {
    // Test dashboard stats
    const statsResponse = await axios.get(
      `${API_URL}/api/students/${userId}/dashboard-stats`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const hasStats = statsResponse.data.success && statsResponse.data.data;
    logTest('Dashboard stats endpoint', hasStats, 
      hasStats ? `Stats loaded: ${JSON.stringify(statsResponse.data.data)}` : 'No stats data');
    
    // Test recent activities
    const activitiesResponse = await axios.get(
      `${API_URL}/api/students/${userId}/recent-activities`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const hasActivities = activitiesResponse.data.success;
    logTest('Recent activities endpoint', hasActivities,
      hasActivities ? `Activities count: ${activitiesResponse.data.data?.length || 0}` : 'No activities data');
    
    return hasStats && hasActivities;
  } catch (error) {
    logTest('Student Dashboard API', false, `Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 4: Progress API
async function testProgressAPI() {
  logSection('Test 4: Progress API');
  
  if (!authToken || !userId) {
    logTest('Progress API', false, 'No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/api/progress/student/${userId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const hasProgress = response.data.success;
    logTest('Get student progress', hasProgress,
      hasProgress ? `Progress records: ${response.data.data?.length || 0}` : 'No progress data');
    
    return hasProgress;
  } catch (error) {
    logTest('Progress API', false, `Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 5: Completions API
async function testCompletionsAPI() {
  logSection('Test 5: Completions API');
  
  if (!authToken || !userId) {
    logTest('Completions API', false, 'No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/api/completions/student/${userId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const hasCompletions = response.data.success;
    logTest('Get student completions', hasCompletions,
      hasCompletions ? `Completion records: ${response.data.data?.length || 0}` : 'No completions data');
    
    return hasCompletions;
  } catch (error) {
    logTest('Completions API', false, `Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 6: Submissions API
async function testSubmissionsAPI() {
  logSection('Test 6: Submissions API');
  
  if (!authToken || !userId) {
    logTest('Submissions API', false, 'No auth token available');
    return false;
  }
  
  try {
    // Get all modules first
    const modulesResponse = await axios.get(
      `${API_URL}/api/modules`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (modulesResponse.data.success && modulesResponse.data.data.length > 0) {
      const moduleId = modulesResponse.data.data[0].id;
      
      const response = await axios.get(
        `${API_URL}/api/submissions?student_id=${userId}&module_id=${moduleId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      const hasSubmissions = response.data.success;
      logTest('Get module submissions', hasSubmissions,
        hasSubmissions ? `Submission records: ${response.data.data?.length || 0}` : 'No submissions data');
      
      return hasSubmissions;
    } else {
      logTest('Get module submissions', true, 'No modules available to test');
      return true;
    }
  } catch (error) {
    logTest('Submissions API', false, `Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 7: Modules API
async function testModulesAPI() {
  logSection('Test 7: Modules API');
  
  if (!authToken) {
    logTest('Modules API', false, 'No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/api/modules`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const hasModules = response.data.success && response.data.data;
    logTest('Get all modules', hasModules,
      hasModules ? `Modules count: ${response.data.data.length}` : 'No modules data');
    
    return hasModules;
  } catch (error) {
    logTest('Modules API', false, `Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 8: Classes API
async function testClassesAPI() {
  logSection('Test 8: Classes API');
  
  if (!authToken || !userId) {
    logTest('Classes API', false, 'No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/api/classes/student/${userId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const hasClasses = response.data.success;
    logTest('Get student classes', hasClasses,
      hasClasses ? `Classes count: ${response.data.data?.length || 0}` : 'No classes data');
    
    return hasClasses;
  } catch (error) {
    logTest('Classes API', false, `Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 9: Feature Flag Configuration
async function testFeatureFlag() {
  logSection('Test 9: Feature Flag Configuration');
  
  const useNewAPI = process.env.NEXT_PUBLIC_USE_NEW_API === 'true';
  logTest('Feature flag is set', useNewAPI,
    useNewAPI ? 'NEXT_PUBLIC_USE_NEW_API=true (Express backend)' : 'NEXT_PUBLIC_USE_NEW_API=false (Supabase backend)');
  
  return useNewAPI;
}

// Test 10: Error Handling
async function testErrorHandling() {
  logSection('Test 10: Error Handling');
  
  try {
    // Test with invalid token
    const response = await axios.get(
      `${API_URL}/api/students/invalid-id/dashboard-stats`,
      { 
        headers: { Authorization: 'Bearer invalid-token' },
        validateStatus: () => true
      }
    );
    
    const hasErrorHandling = response.status === 401 || response.status === 403;
    logTest('Invalid token handling', hasErrorHandling,
      hasErrorHandling ? `Server returned ${response.status}` : 'Server did not reject invalid token');
    
    // Test with missing token
    const response2 = await axios.get(
      `${API_URL}/api/students/test-id/dashboard-stats`,
      { validateStatus: () => true }
    );
    
    const hasMissingTokenHandling = response2.status === 401;
    logTest('Missing token handling', hasMissingTokenHandling,
      hasMissingTokenHandling ? `Server returned ${response2.status}` : 'Server did not reject missing token');
    
    return hasErrorHandling && hasMissingTokenHandling;
  } catch (error) {
    logTest('Error handling', false, `Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     STUDENT PAGES API MIGRATION - CHECKPOINT TEST         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    backendHealth: await testBackendHealth(),
    authentication: await testAuthentication(),
    studentDashboard: await testStudentDashboardAPI(),
    progress: await testProgressAPI(),
    completions: await testCompletionsAPI(),
    submissions: await testSubmissionsAPI(),
    modules: await testModulesAPI(),
    classes: await testClassesAPI(),
    featureFlag: await testFeatureFlag(),
    errorHandling: await testErrorHandling()
  };
  
  // Summary
  logSection('Test Summary');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
    passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n✓ ALL TESTS PASSED! Frontend pages are ready.', 'green');
  } else {
    log('\n✗ SOME TESTS FAILED. Please review the errors above.', 'red');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
