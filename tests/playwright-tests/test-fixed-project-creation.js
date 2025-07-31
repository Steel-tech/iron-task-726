const { chromium } = require('playwright');

async function testFixedProjectCreation() {
  console.log('🔧 Testing FIXED project creation...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
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
    
    // Should now show the form
    console.log('📝 Checking for project creation form...');
    await page.screenshot({ path: 'fixed-new-project-form.png', fullPage: true });
    
    // Look for form inputs
    const hasForm = await page.isVisible('input[name="name"]');
    if (hasForm) {
      console.log('✅ PROJECT CREATION FORM FOUND!');
      
      // Fill out the form
      console.log('✏️ Filling out project form...');
      await page.fill('input[name="name"]', 'Test Steel Building Project');
      await page.fill('input[name="location"]', '456 Construction Ave, Denver, CO');
      await page.fill('textarea[name="description"]', 'A test project for steel construction documentation using FSW Iron Task');
      
      await page.screenshot({ path: 'filled-project-form.png' });
      
      console.log('🚀 Submitting new project...');
      await page.click('button[type="submit"]');
      
      // Wait for success (redirect to project page)
      await page.waitForTimeout(5000);
      const currentUrl = page.url();
      console.log(`📍 After submission: ${currentUrl}`);
      
      await page.screenshot({ path: 'project-created-result.png', fullPage: true });
      
      if (currentUrl.includes('/projects/') && !currentUrl.includes('/new')) {
        console.log('🎉 SUCCESS! Project created and redirected to project page!');
      } else {
        console.log('⚠️ Form submitted but checking result...');
      }
      
    } else {
      console.log('❌ Form not found - still broken');
      
      // Check what's on the page
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()),
          errors: Array.from(document.querySelectorAll('[class*="error"], .text-red')).map(e => e.textContent?.trim())
        };
      });
      
      console.log('Page content:', pageContent);
    }
    
    console.log('⏳ Keeping browser open for 15 seconds for inspection...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
    console.log('🔚 Test completed');
  }
}

testFixedProjectCreation().catch(console.error);