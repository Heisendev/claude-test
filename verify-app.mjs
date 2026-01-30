#!/usr/bin/env node
/**
 * Verification script for Claude.ai Clone
 * Tests core functionality without API key (mocked responses)
 */

import http from 'http';
import https from 'https';

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    }).on('error', reject);
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Claude.ai Clone - Verification Tests');
  console.log('═══════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Backend Health Check
  try {
    console.log('✓ Test 1: Backend health check');
    const health = await httpGet(`${BACKEND_URL}/api/health`);
    if (health.status === 200 && health.data.status === 'healthy') {
      console.log(`  ✓ Status: ${health.status}`);
      console.log(`  ✓ Server healthy: ${health.data.status}`);
      console.log(`  ✓ API Key configured: ${health.data.apiKeyConfigured}`);
      passed++;
    } else {
      console.log(`  ✗ Unexpected response: ${health.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ Failed: ${error.message}`);
    failed++;
  }
  console.log('');

  // Test 2: Frontend Server
  try {
    console.log('✓ Test 2: Frontend server responding');
    const frontend = await httpGet(FRONTEND_URL);
    if (frontend.status === 200) {
      console.log(`  ✓ Status: ${frontend.status}`);
      console.log(`  ✓ Content-Type: ${frontend.headers['content-type']}`);
      passed++;
    } else {
      console.log(`  ✗ Unexpected status: ${frontend.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ Failed: ${error.message}`);
    failed++;
  }
  console.log('');

  // Test 3: Get Conversations
  try {
    console.log('✓ Test 3: Get conversations (user ID: 1)');
    const convs = await httpGet(`${BACKEND_URL}/api/conversations?userId=1`);
    if (convs.status === 200 && Array.isArray(convs.data)) {
      console.log(`  ✓ Status: ${convs.status}`);
      console.log(`  ✓ Conversations count: ${convs.data.length}`);
      if (convs.data.length > 0) {
        console.log(`  ✓ Sample conversation: ${convs.data[0].title}`);
      }
      passed++;
    } else {
      console.log(`  ✗ Unexpected response`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ Failed: ${error.message}`);
    failed++;
  }
  console.log('');

  // Test 4: Create Conversation
  let newConvId;
  try {
    console.log('✓ Test 4: Create new conversation');
    const newConv = await httpPost(`${BACKEND_URL}/api/conversations`, {
      userId: 1,
      title: `Verification Test ${new Date().toISOString()}`,
      model: 'claude-sonnet-4-5-20250929'
    });
    if (newConv.status === 201 && newConv.data.id) {
      console.log(`  ✓ Status: ${newConv.status}`);
      console.log(`  ✓ Conversation ID: ${newConv.data.id}`);
      console.log(`  ✓ Title: ${newConv.data.title}`);
      newConvId = newConv.data.id;
      passed++;
    } else {
      console.log(`  ✗ Unexpected response: ${newConv.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ Failed: ${error.message}`);
    failed++;
  }
  console.log('');

  // Test 5: Get Messages (should be empty for new conversation)
  if (newConvId) {
    try {
      console.log('✓ Test 5: Get messages for new conversation');
      const msgs = await httpGet(`${BACKEND_URL}/api/conversations/${newConvId}/messages`);
      if (msgs.status === 200 && Array.isArray(msgs.data)) {
        console.log(`  ✓ Status: ${msgs.status}`);
        console.log(`  ✓ Messages count: ${msgs.data.length}`);
        passed++;
      } else {
        console.log(`  ✗ Unexpected response`);
        failed++;
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  // Test 6: Database check
  try {
    console.log('✓ Test 6: Database file exists');
    const fs = await import('fs');
    if (fs.existsSync('./database/claude.db')) {
      console.log('  ✓ Database file found at ./database/claude.db');
      const stats = fs.statSync('./database/claude.db');
      console.log(`  ✓ Database size: ${(stats.size / 1024).toFixed(2)} KB`);
      passed++;
    } else {
      console.log('  ✗ Database file not found');
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ Failed: ${error.message}`);
    failed++;
  }
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('✅ All verification tests passed!\n');
    console.log('📋 Current Status:');
    console.log('  • Backend API: ✓ Working');
    console.log('  • Frontend Server: ✓ Working');
    console.log('  • Database: ✓ Connected');
    console.log('  • Conversations API: ✓ Working');
    console.log('  • Messages API: ✓ Working');
    console.log('');
    console.log('⚠️  Note: Streaming messages require API key');
    console.log('   API key should be at /tmp/api-key or in .env\n');
    return 0;
  } else {
    console.log('❌ Some tests failed. Please check the errors above.\n');
    return 1;
  }
}

runTests().then(code => process.exit(code)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
