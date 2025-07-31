const { chromium } = require('playwright');

async function debugSaveError() {
  console.log('🔍 Debugging project save error...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    devtools: true // Open developer tools
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Enhanced logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    } else {
      console.log(`🖥️ Console [${msg.type()}]: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  // Log all network requests
  page.on('request', request => {
    if (request.url().includes('/api/') && request.method() === 'POST') {
      console.log(`📡 POST Request: ${request.url()}`);
      console.log(`   Headers: ${JSON.stringify(request.headers(), null, 2)}`);
      console.log(`   Body: ${request.postData()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/') && response.request().method() === 'POST') {
      console.log(`📡 POST Response: ${response.status()} ${response.url()}`);
      response.text().then(body => {
        console.log(`   Response body: ${body}`);
      }).catch(() => {});
    }
  });
  
  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[id="email"]', 'admin@fsw-denver.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard**');
    console.log('✅ Logged in successfully');
    
    // Go directly to new project page
    console.log('📂 Going to new project page...');
    await page.goto('http://localhost:3000/dashboard/projects/new');
    await page.waitForTimeout(2000);
    
    // Wait for form to load
    await page.waitForSelector('input[name="name"]');
    console.log('✅ Form loaded');
    
    // Fill form with test data
    console.log('✏️ Filling form...');
    await page.fill('input[name="name"]', 'Debug Test Project');
    await page.fill('input[name="location"]', 'Test Location, Denver');
    await page.fill('textarea[name="description"]', 'Testing project creation to debug error');
    
    await page.screenshot({ path: 'debug-before-submit.png' });
    
    // Open browser developer tools network tab
    console.log('📊 Opening DevTools Network tab...');
    
    // Submit form
    console.log('🚀 Clicking Create Project button...');
    await page.click('button[type="submit"]');
    
    // Wait a bit to see what happens
    await page.waitForTimeout(5000);
    
    // Check for error messages
    const errorElement = await page.$('.text-red-400, [class*="error"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log(`❌ Error message on page: "${errorText}"`);
    }
    
    // Take screenshot of result
    await page.screenshot({ path: 'debug-after-submit.png', fullPage: true });
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Manual API test
    console.log('🧪 Testing API directly...');
    const apiTest = await page.evaluate(async () => {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      try {
        const response = await fetch('http://localhost:3002/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'API Test Project',
            description: 'Direct API test',
            location: 'API Test Location',
            companyId: user.companyId || 'fsw-default-company'
          })
        });
        
        const data = await response.text();
        return {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 Direct API Test Result:');
    console.log(JSON.stringify(apiTest, null, 2));
    
    console.log('⏳ Keeping browser open for 30 seconds to inspect DevTools...');
    console.log('💡 Check the Network tab in DevTools for the failed request!');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'debug-error-state.png' });
  } finally {
    await browser.close();
  }
}

debugSaveError().catch(console.error);