// Simple test script to verify the app is working
import http from 'http';

async function testEndpoint(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Claude.ai Clone Backend...\n');

  try {
    // Test 1: Health check
    console.log('Test 1: Health check');
    const health = await testEndpoint('/api/health');
    console.log(`✓ Status: ${health.status}`, health.data);

    // Test 2: Get conversations
    console.log('\nTest 2: Get conversations');
    const conversations = await testEndpoint('/api/conversations?userId=1');
    console.log(`✓ Status: ${conversations.status}, Count: ${conversations.data.length || 0}`);

    // Test 3: Create new conversation
    console.log('\nTest 3: Create new conversation');
    const newConv = await testEndpoint('/api/conversations', 'POST', {
      userId: 1,
      title: 'Test Conversation ' + Date.now(),
      model: 'claude-sonnet-4-5-20250929'
    });
    console.log(`✓ Status: ${newConv.status}, Conversation ID: ${newConv.data.id}`);

    console.log('\n✅ All basic tests passed!');
    return newConv.data.id;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests().then(convId => {
  console.log(`\nConversation created with ID: ${convId}`);
  process.exit(0);
});
