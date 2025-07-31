const { chromium } = require('playwright');

async function testCompleteProjectCreation() {
  console.log('🔧 Testing complete project creation with job number...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Enhanced logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  // Log API responses
  page.on('response', response => {
    if (response.url().includes('/api/projects') && response.request().method() === 'POST') {
      console.log(`📡 POST Response: ${response.status()} ${response.url()}`);
      response.text().then(body => {
        console.log(`   Response body: ${body}`);
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
    
    // Go to projects and click New Project
    console.log('📂 Going to Projects...');
    await page.click('text=Projects');
    await page.waitForTimeout(2000);
    
    console.log('➕ Clicking New Project...');
    await page.click('text=New Project');
    await page.waitForTimeout(3000);
    
    // Fill out the complete form including job number
    console.log('📝 Filling out complete project form...');
    await page.fill('input[name="name"]', 'Complete Test Steel Building');
    await page.fill('input[name="jobNumber"]', 'JOB-2025-TEST-001');
    await page.fill('input[name="location"]', '789 Test Street, Denver, CO');
    await page.fill('textarea[name="description"]', 'A complete test project with job number for FSW Iron Task');
    
    await page.screenshot({ path: 'complete-project-form.png' });
    
    console.log('🚀 Submitting complete project...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`📍 After submission: ${currentUrl}`);
    
    // Check for error messages
    const errorElement = await page.$('.text-red-400, [class*="error"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log(`❌ Error message on page: "${errorText}"`);
    }
    
    await page.screenshot({ path: 'complete-project-result.png', fullPage: true });
    
    if (currentUrl.includes('/projects/') && !currentUrl.includes('/new')) {
      console.log('🎉 SUCCESS! Project created and redirected to project page!');
      
      // Check if project details are displayed
      const projectTitle = await page.textContent('h1');
      console.log(`📋 Project Title: ${projectTitle}`);
    } else {
      console.log('⚠️ Still on form page - checking for issues...');
      
      // Check what's visible on the page
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          formVisible: !!document.querySelector('form'),
          errors: Array.from(document.querySelectorAll('[class*="error"], .text-red-400')).map(e => e.textContent?.trim())
        };
      });
      
      console.log('Page analysis:', JSON.stringify(pageContent, null, 2));
    }
    
    console.log('⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
    console.log('🔚 Test completed');
  }
}

testCompleteProjectCreation().catch(console.error);