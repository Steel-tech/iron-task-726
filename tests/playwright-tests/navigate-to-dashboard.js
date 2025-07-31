const { chromium } = require('playwright');

async function navigateToDashboard() {
  console.log('🚀 Navigating to FSW Iron Task Dashboard...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
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
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Go to home page
    console.log('📱 Opening FSW Iron Task...');
    await page.goto('http://localhost:3000');
    
    // Click Start Documenting button
    console.log('🔘 Clicking Start Documenting...');
    await page.click('button:has-text("Start Documenting")');
    
    // Wait for login page
    await page.waitForURL('**/login**', { timeout: 5000 });
    console.log('✅ On login page');
    
    // Fill login form
    console.log('🔐 Logging in...');
    await page.fill('input[id="email"]', 'admin@fsw-denver.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✅ Successfully logged in to dashboard!');
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-loaded.png' });
    console.log('📸 Dashboard screenshot saved');
    
    // Navigate to projects
    console.log('📂 Navigating to Projects...');
    await page.click('text=Projects');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'projects-page.png' });
    console.log('📸 Projects page screenshot saved');
    
    // Check for New Project button
    const newProjectBtn = await page.$('text=New Project');
    if (newProjectBtn) {
      console.log('✅ New Project button is available');
      
      // Click it to test
      console.log('➕ Clicking New Project...');
      await newProjectBtn.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'new-project-form.png' });
      console.log('📸 New project form screenshot saved');
    }
    
    console.log('🎉 All navigation successful!');
    console.log('💡 The application is working. You can interact with it in the browser.');
    console.log('⏳ Keeping browser open for 30 seconds...');
    
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'navigation-error.png' });
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

navigateToDashboard().catch(console.error);