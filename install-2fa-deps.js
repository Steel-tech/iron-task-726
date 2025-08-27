// Script to install 2FA dependencies
const { execSync } = require('child_process');

console.log('Installing 2FA dependencies...');

try {
  execSync('cd api && npm install speakeasy qrcode', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
}
