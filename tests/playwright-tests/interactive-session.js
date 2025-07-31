const { chromium } = require('playwright');

async function startInteractiveSession() {
  console.log('🚀 Starting interactive FSW Iron Task session...');
  
  // Launch browser with slow motion for better visibility and WSL compatibility
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500, // Half second delay between actions
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
    // Navigate to the site
    console.log('🌐 Navigating to FSW Iron Task...');
    await page.goto('http://localhost:3000');
    
    console.log('📸 Taking homepage screenshot...');
    await page.screenshot({ path: 'homepage.png', fullPage: true });
    
    // Check if we're on login page or redirected
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('🔐 On login page - let\'s sign in as admin!');
      
      // Wait for and fill login form
      await page.waitForSelector('input[id="email"]');
      await page.fill('input[id="email"]', 'admin@fsw-denver.com');
      await page.fill('input[id="password"]', 'Test1234!');
      
      console.log('📸 Login form filled - taking screenshot...');
      await page.screenshot({ path: 'login-ready.png' });
      
      console.log('🚀 Submitting login...');
      await page.click('button[type="submit"]');
      
      // Wait for dashboard
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      console.log('✅ Successfully logged in to dashboard!');
    }
    
    // Take dashboard screenshot
    await page.screenshot({ path: 'interactive-dashboard.png', fullPage: true });
    
    console.log('🎯 Dashboard loaded! Let\'s explore...');
    
    // Get dashboard stats
    const stats = await page.evaluate(() => {
      const projectCount = document.querySelector('text=Total Projects')?.parentElement?.querySelector('h2')?.textContent || '0';
      const photoCount = document.querySelector('text=Total Photos')?.parentElement?.querySelector('h2')?.textContent || '0';
      const teamCount = document.querySelector('text=Team Members')?.parentElement?.querySelector('h2')?.textContent || '0';
      return { projectCount, photoCount, teamCount };
    });
    
    console.log('📊 Dashboard Stats:');
    console.log(`   📁 Projects: ${stats.projectCount || 'Loading...'}`);
    console.log(`   📷 Photos: ${stats.photoCount || 'Loading...'}`);
    console.log(`   👥 Team: ${stats.teamCount || 'Loading...'}`);
    
    // Navigate to Projects
    console.log('📂 Clicking on Projects...');
    await page.click('text=Projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'projects-view.png', fullPage: true });
    
    // Get project list
    const projects = await page.evaluate(() => {
      const projectCards = Array.from(document.querySelectorAll('[class*="project"], .card'));
      return projectCards.map(card => ({
        title: card.querySelector('h3, h4, [class*="title"]')?.textContent?.trim() || 'Unknown Project',
        status: card.querySelector('[class*="status"], .badge')?.textContent?.trim() || 'Unknown Status'
      })).filter(p => p.title !== 'Unknown Project').slice(0, 5);
    });
    
    console.log('🏗️  Active Projects:');
    projects.forEach((project, i) => {
      console.log(`   ${i + 1}. ${project.title} - ${project.status}`);
    });
    
    // Test project creation
    console.log('➕ Testing project creation...');
    const createButton = page.locator('text=Create New Project, text=New Project, button:has-text("Create")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'project-creation.png' });
      console.log('📝 Project creation form opened!');
    }
    
    // Navigate back to dashboard
    console.log('🏠 Returning to dashboard...');
    await page.click('text=Dashboard');
    await page.waitForTimeout(1000);
    
    // Test upload functionality
    console.log('📤 Testing upload features...');
    const uploadButton = page.locator('text=Upload, text=Upload Photos, text=Upload New Photos').first();
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'upload-area.png' });
      console.log('📸 Upload interface ready!');
    }
    
    console.log('');
    console.log('🎉 Interactive session complete!');
    console.log('📁 Screenshots saved:');
    console.log('   - homepage.png');
    console.log('   - login-ready.png');
    console.log('   - interactive-dashboard.png');
    console.log('   - projects-view.png');
    console.log('   - project-creation.png');
    console.log('   - upload-area.png');
    console.log('');
    console.log('💡 Browser window is still open for manual exploration!');
    console.log('   Close this terminal or press Ctrl+C to close browser');
    
    // Keep browser open for manual interaction
    console.log('⏳ Keeping browser open for 60 seconds...');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('❌ Error during interactive session:', error.message);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
    console.log('🔚 Browser session ended');
  }
}

// Start the interactive session
startInteractiveSession().catch(console.error);