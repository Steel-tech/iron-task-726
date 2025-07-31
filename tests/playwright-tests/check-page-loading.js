const { chromium } = require('playwright');

async function checkPageLoading() {
  console.log('🔍 Checking page loading issues...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    devtools: true,
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
  
  // Log all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
    } else if (type === 'warn') {
      console.log(`⚠️ Console Warning: ${text}`);
    } else {
      console.log(`📝 Console [${type}]: ${text}`);
    }
  });
  
  // Log page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  // Log failed requests
  page.on('requestfailed', request => {
    console.log(`❌ Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  // Log responses
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`⚠️ HTTP ${response.status()}: ${response.url()}`);
    }
  });
  
  try {
    console.log('📱 Opening http://localhost:3000...');
    
    // Set a longer timeout
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded');
    
    // Check what's on the page
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check if we're on login page or dashboard
    const url = page.url();
    console.log(`📍 Current URL: ${url}`);
    
    // Check for loading indicators
    const loadingElement = await page.$('[class*="loading"], [class*="spinner"], [role="status"]');
    if (loadingElement) {
      console.log('⏳ Found loading indicator on page');
      const loadingText = await loadingElement.textContent();
      console.log(`   Loading text: ${loadingText}`);
    }
    
    // Check for error messages
    const errorElement = await page.$('[class*="error"], .text-red-400, .text-red-500');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log(`❌ Error message found: ${errorText}`);
    }
    
    // Wait a bit to see if anything changes
    console.log('⏳ Waiting 10 seconds to observe page behavior...');
    await page.waitForTimeout(10000);
    
    // Take a screenshot
    await page.screenshot({ path: 'page-loading-state.png', fullPage: true });
    console.log('📸 Screenshot saved as page-loading-state.png');
    
    // Check final state
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);
    
    // Get page content summary
    const bodyText = await page.evaluate(() => {
      const body = document.body;
      return {
        hasContent: body.textContent.trim().length > 0,
        visibleElements: document.querySelectorAll('*:not(script):not(style)').length,
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length
      };
    });
    
    console.log('📊 Page content summary:', bodyText);
    
    console.log('⏳ Keeping browser open for manual inspection...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
    console.log('🔚 Check completed');
  }
}

checkPageLoading().catch(console.error);