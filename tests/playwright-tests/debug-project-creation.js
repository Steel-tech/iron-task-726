const { chromium } = require('playwright');

async function debugProjectCreation() {
  console.log('🔍 Debugging project creation issue...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Listen for console logs and errors
  page.on('console', msg => {
    console.log(`🖥️ Console [${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  // Listen for network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`📡 API Request: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`📡 API Response: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // Login process
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[id="email"]', 'admin@fsw-denver.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard**');
    console.log('✅ Logged in successfully');
    
    // Go to projects page
    console.log('📂 Navigating to Projects...');
    await page.click('text=Projects');
    await page.waitForTimeout(2000);
    
    // Take screenshot of projects page
    await page.screenshot({ path: 'debug-projects-page.png', fullPage: true });
    
    // Look for New Project button
    console.log('🔍 Looking for New Project button...');
    const newProjectSelectors = [
      'text=New Project',
      'text=Create New Project', 
      'button:has-text("New")',
      'button:has-text("Create")',
      '[class*="new-project"]',
      '[data-testid*="new-project"]',
      'a[href*="new"]'
    ];
    
    let foundButton = false;
    for (const selector of newProjectSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found New Project button with selector: ${selector}`);
          foundButton = true;
          
          // Try clicking it
          console.log('🖱️ Clicking New Project button...');
          await element.click();
          await page.waitForTimeout(3000);
          
          // Check what happened after click
          await page.screenshot({ path: 'debug-after-new-project-click.png', fullPage: true });
          
          // Look for form or modal
          const currentUrl = page.url();
          console.log(`📍 URL after click: ${currentUrl}`);
          
          // Check for form elements
          const formElements = await page.evaluate(() => {
            const forms = document.querySelectorAll('form, [role="dialog"], .modal, .popup');
            return Array.from(forms).map(form => ({
              tagName: form.tagName,
              className: form.className,
              id: form.id,
              visible: form.offsetWidth > 0 && form.offsetHeight > 0
            }));
          });
          
          console.log('📝 Form elements found:', formElements);
          
          // Look for input fields
          const inputs = await page.evaluate(() => {
            const inputElements = document.querySelectorAll('input, textarea, select');
            return Array.from(inputElements).map(input => ({
              type: input.type || input.tagName,
              name: input.name,
              placeholder: input.placeholder,
              visible: input.offsetWidth > 0 && input.offsetHeight > 0
            })).filter(input => input.visible);
          });
          
          console.log('🔤 Visible input fields:', inputs);
          
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!foundButton) {
      console.log('❌ No New Project button found with standard selectors');
      console.log('🔍 Searching for all buttons on the page...');
      
      const allButtons = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        return Array.from(buttons).map(btn => ({
          text: btn.textContent?.trim().substring(0, 50),
          className: btn.className,
          href: btn.href,
          visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
        })).filter(btn => btn.visible && btn.text);
      });
      
      console.log('🔘 All visible buttons/links:');
      allButtons.forEach((btn, i) => {
        console.log(`   ${i + 1}. "${btn.text}" (${btn.className})`);
      });
    }
    
    // Test API directly
    console.log('🧪 Testing project creation API directly...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            name: 'Test Project via API',
            description: 'Testing direct API call',
            location: 'Test Location',
            companyId: 'fsw-default-company'
          })
        });
        
        return {
          status: response.status,
          statusText: response.statusText,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 API Test Result:', apiResponse);
    
    console.log('⏳ Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugProjectCreation().catch(console.error);