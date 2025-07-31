const { chromium } = require('playwright');

async function testFinalProjectCreation() {
  console.log('🔧 Testing FINAL project creation with correct fields...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Enhanced logging for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  // Log API responses
  page.on('response', response => {
    if (response.url().includes('/api/projects') && response.request().method() === 'POST') {
      console.log(`📡 API Response: ${response.status()}`);
      response.text().then(body => {
        const data = JSON.parse(body);
        if (response.status() === 200 || response.status() === 201) {
          console.log(`✅ Project created successfully!`);
          console.log(`   ID: ${data.id}`);
          console.log(`   Name: ${data.name}`);
          console.log(`   Job Number: ${data.jobNumber}`);
        } else {
          console.log(`❌ Error: ${JSON.stringify(data, null, 2)}`);
        }
      }).catch(() => {});
    }
  });
  
  try {
    // Login
    console.log('🔐 Logging in as admin...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[id="email"]', 'admin@fsw-denver.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard**');
    console.log('✅ Logged in successfully');
    
    // Navigate to new project form
    console.log('📂 Navigating to new project form...');
    await page.goto('http://localhost:3000/dashboard/projects/new');
    await page.waitForTimeout(2000);
    
    // Fill out the form with correct fields
    console.log('📝 Filling out project form with correct fields...');
    await page.fill('input[name="name"]', 'Steel Frame Office Building');
    await page.fill('input[name="jobNumber"]', 'JOB-2025-001');
    await page.fill('input[name="location"]', 'Downtown Denver, CO');
    await page.fill('input[name="address"]', '1234 Construction Ave, Suite 200');
    
    await page.screenshot({ path: 'final-project-form.png' });
    
    console.log('🚀 Submitting project...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    console.log('⏳ Waiting for response...');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/projects/') && !currentUrl.includes('/new')) {
      console.log('🎉 SUCCESS! Project created and redirected to project page!');
      
      // Take screenshot of the created project
      await page.screenshot({ path: 'created-project-page.png', fullPage: true });
      
      // Check project details
      const projectName = await page.textContent('h1');
      console.log(`📋 Project Name: ${projectName}`);
      
      // Look for job number on the page
      const pageContent = await page.textContent('body');
      if (pageContent.includes('JOB-2025-001')) {
        console.log('✅ Job number displayed correctly!');
      }
    } else {
      console.log('⚠️ Did not redirect - checking for errors...');
      
      const errorElement = await page.$('.text-red-400, [class*="error"]');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log(`❌ Error: "${errorText}"`);
      }
    }
    
    console.log('✨ Test completed! Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'test-error-final.png' });
  } finally {
    await browser.close();
  }
}

testFinalProjectCreation().catch(console.error);