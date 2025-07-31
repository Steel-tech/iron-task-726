#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  password: 'Test123!',
  name: 'Test User'
};

let accessToken = '';
let refreshToken = '';
let cookies = '';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${JSON.stringify(error.response.data)}`);
    }
  }
}

async function register() {
  const response = await axios.post(`${API_URL}/auth/register`, TEST_USER);
  accessToken = response.data.accessToken;
  cookies = response.headers['set-cookie'];
  
  // Extract refresh token from cookies
  const refreshCookie = cookies.find(c => c.includes('fsw_iron_task_session'));
  if (refreshCookie) {
    refreshToken = refreshCookie.split('=')[1].split(';')[0];
  }
}

async function login() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  accessToken = response.data.accessToken;
  cookies = response.headers['set-cookie'];
  
  // Extract refresh token from cookies
  const refreshCookie = cookies.find(c => c.includes('fsw_iron_task_session'));
  if (refreshCookie) {
    refreshToken = refreshCookie.split('=')[1].split(';')[0];
  }
}

async function refreshAccessToken() {
  const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
    headers: {
      Cookie: cookies.join('; ')
    }
  });
  
  const newAccessToken = response.data.accessToken;
  const newCookies = response.headers['set-cookie'];
  
  if (newCookies) {
    cookies = newCookies;
    const refreshCookie = cookies.find(c => c.includes('fsw_iron_task_session'));
    if (refreshCookie) {
      const newRefreshToken = refreshCookie.split('=')[1].split(';')[0];
      if (newRefreshToken === refreshToken) {
        throw new Error('Refresh token was not rotated!');
      }
      refreshToken = newRefreshToken;
    }
  }
  
  accessToken = newAccessToken;
}

async function getSessions() {
  const response = await axios.get(`${API_URL}/auth/sessions`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  return response.data.sessions;
}

async function revokeSession(sessionId) {
  await axios.delete(`${API_URL}/auth/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

async function logout() {
  await axios.post(`${API_URL}/auth/logout`, {}, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Cookie: cookies.join('; ')
    }
  });
}

async function runTests() {
  console.log('🔐 Testing Refresh Token Security Implementation\n');
  
  // Test 1: Register and get tokens
  await test('User registration with tokens', async () => {
    await register();
    if (!accessToken) throw new Error('No access token received');
    if (!refreshToken) throw new Error('No refresh token received');
  });
  
  // Test 2: Refresh token rotation
  await test('Refresh token rotation', async () => {
    const oldRefreshToken = refreshToken;
    await refreshAccessToken();
    if (refreshToken === oldRefreshToken) {
      throw new Error('Refresh token was not rotated');
    }
  });
  
  // Test 3: Get active sessions
  await test('Get active sessions', async () => {
    const sessions = await getSessions();
    if (!sessions || sessions.length === 0) {
      throw new Error('No active sessions found');
    }
  });
  
  // Test 4: Multiple logins create multiple sessions
  await test('Multiple logins create multiple sessions', async () => {
    // Login again from different "device"
    await login();
    const sessions = await getSessions();
    if (sessions.length < 2) {
      throw new Error('Expected multiple sessions');
    }
  });
  
  // Test 5: Revoke specific session
  await test('Revoke specific session', async () => {
    const sessions = await getSessions();
    const sessionToRevoke = sessions[0];
    await revokeSession(sessionToRevoke.id);
    
    // Verify session was revoked
    const remainingSessions = await getSessions();
    const found = remainingSessions.find(s => s.id === sessionToRevoke.id);
    if (found) {
      throw new Error('Session was not revoked');
    }
  });
  
  // Test 6: Logout revokes all sessions
  await test('Logout revokes all sessions', async () => {
    await logout();
    
    // Try to use the access token - should fail
    try {
      await getSessions();
      throw new Error('Access token should be invalid after logout');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected
        return;
      }
      throw error;
    }
  });
  
  // Test 7: Reuse of rotated token should fail
  await test('Reuse of rotated token triggers security', async () => {
    // Login fresh
    await login();
    const oldCookies = [...cookies];
    
    // Refresh once
    await refreshAccessToken();
    
    // Try to use old refresh token
    try {
      await axios.post(`${API_URL}/auth/refresh`, {}, {
        headers: {
          Cookie: oldCookies.join('; ')
        }
      });
      throw new Error('Rotated token reuse should fail');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected - token family should be revoked
        return;
      }
      throw error;
    }
  });
  
  console.log('\n✨ All tests completed!');
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite failed:', error.message);
  process.exit(1);
});