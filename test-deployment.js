// Test script to verify deployment
const https = require('https');

console.log('🧪 Testing FSW Iron Task Deployment...\n');

// Test Frontend
function testFrontend(url) {
  console.log('📱 Testing Frontend:', url);
  https.get(url, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   ✅ Frontend is ${res.statusCode === 200 ? 'working!' : 'not ready yet'}\n`);
  }).on('error', (err) => {
    console.log('   ❌ Frontend not accessible yet\n');
  });
}

// Test API
function testAPI(url) {
  console.log('🔧 Testing API:', url);
  https.get(`${url}/health`, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   ✅ API is ${res.statusCode === 200 ? 'working!' : 'not ready yet'}\n`);
  }).on('error', (err) => {
    console.log('   ❌ API not accessible yet\n');
  });
}

// Get URLs from command line or use defaults
const frontendUrl = process.argv[2] || 'https://your-app.vercel.app';
const apiUrl = process.argv[3] || 'https://your-api.railway.app';

console.log('Usage: node test-deployment.js [frontend-url] [api-url]\n');

testFrontend(frontendUrl);
testAPI(apiUrl);

console.log('💡 After deployment, run this script with your actual URLs:');
console.log('   node test-deployment.js https://your-app.vercel.app https://your-api.railway.app');