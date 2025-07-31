const { chromium } = require('playwright');

async function testFSWLogin() {
  console.log('🚀 Starting FSW Iron Task login automation...');
  
  // Launch browser with WSL-compatible configuration
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000, // Slow down for demonstration
    args: [
      '--no-sandbox',                    // Critical: Disable sandboxing (WSL requirement)
      '--disable-setuid-sandbox',        // Disable setuid sandbox for WSL
      '--disable-dev-shm-usage',         // Prevent shared memory issues in WSL
      '--no-first-run',                  // Skip first run setup
      '--disable-extensions',            // Disable extensions for cleaner testing
      '--no-default-browser-check',      // Skip default browser check
      '--disable-background-timer-throttling' // Prevent throttling issues
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to FSW Iron Task login page...');
    await page.goto('http://localhost:3000/login');
    
    console.log('⏳ Waiting for login page to load...');
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });
    
    console.log('✏️ Filling in admin credentials...');
    await page.fill('input[id="email"]', 'admin@fsw-denver.com');
    await page.fill('input[id="password"]', 'Test1234!');
    
    console.log('📷 Taking screenshot of login form...');
    await page.screenshot({ 
      path: 'login-form.png',
      fullPage: true 
    });
    
    console.log('🔐 Clicking login button...');
    await page.click('button[type="submit"]');
    
    console.log('⏳ Waiting for navigation or error message...');
    try {
      await page.waitForURL('**/dashboard**', { timeout: 5000 });
    } catch (error) {
      console.log('⚠️ No immediate redirect, checking for error messages...');
      
      // Check for error messages
      const errorElement = page.locator('text=Invalid email or password').first();
      if (await errorElement.isVisible()) {
        console.log('❌ Login failed: Invalid credentials');
        await page.screenshot({ path: 'login-error.png' });
        return;
      }
      
      // Wait a bit more for potential delayed navigation
      console.log('⏳ Waiting longer for navigation...');
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
    }
    
    console.log('📷 Taking screenshot of dashboard...');
    await page.screenshot({ 
      path: 'dashboard.png',
      fullPage: true 
    });
    
    console.log('✅ Login automation completed successfully!');
    console.log('📁 Screenshots saved: login-form.png, dashboard.png');
    
    // Test navigation
    console.log('🔍 Testing navigation...');
    const projectsLink = await page.locator('text=Projects').first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'projects-page.png' });
      console.log('📁 Projects page screenshot saved: projects-page.png');
    }
    
  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

// Run the test
testFSWLogin().catch(console.error);