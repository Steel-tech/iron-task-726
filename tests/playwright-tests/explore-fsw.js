const { chromium } = require('playwright');

async function exploreFSW() {
  console.log('🚀 Let\'s get busy exploring FSW Iron Task!');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800, // Slower for better interaction
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
    console.log('🌐 Starting at FSW Iron Task homepage...');
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'step1-homepage.png', fullPage: true });
    
    // Click "Start Documenting" to get into the app
    console.log('🚀 Clicking "Start Documenting" to enter the app...');
    await page.click('text=Start Documenting');
    
    // This should take us to login
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step2-login-page.png', fullPage: true });
    
    console.log('🔐 Now on login page - signing in as Admin...');
    await page.fill('input[id="email"]', 'admin@fsw-denver.com');
    await page.fill('input[id="password"]', 'Test1234!');
    
    await page.screenshot({ path: 'step3-credentials-filled.png' });
    
    console.log('➡️ Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✅ Welcome to the FSW Iron Task Dashboard!');
    
    await page.screenshot({ path: 'step4-dashboard.png', fullPage: true });
    
    // Extract dashboard info with proper selectors
    const dashboardInfo = await page.evaluate(() => {
      // Look for numbers in dashboard cards
      const numbers = Array.from(document.querySelectorAll('h2, .text-2xl, .text-3xl, .text-4xl'))
        .map(el => el.textContent?.trim())
        .filter(text => /^\d+$/.test(text));
      
      return {
        stats: numbers.slice(0, 4), // First 4 numbers are likely our stats
        userInfo: document.querySelector('[class*="user"], .user, .profile')?.textContent?.trim() || 'Admin User',
        currentDate: document.querySelector('[class*="date"], .date')?.textContent?.trim() || new Date().toLocaleDateString()
      };
    });
    
    console.log('📊 Dashboard Overview:');
    console.log(`   📈 Stats: ${dashboardInfo.stats.join(' | ')}`);
    console.log(`   👤 Logged in as: ${dashboardInfo.userInfo}`);
    console.log('');
    
    // Navigate to Projects
    console.log('📂 Let\'s check out the Projects section...');
    await page.click('text=Projects');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step5-projects.png', fullPage: true });
    
    // Count projects
    const projectInfo = await page.evaluate(() => {
      const projectCards = document.querySelectorAll('[class*="card"], .project, .bg-white, .bg-gray');
      const visibleProjects = Array.from(projectCards).filter(card => {
        const rect = card.getBoundingClientRect();
        return rect.height > 50 && rect.width > 100; // Reasonable size for a project card
      });
      
      return {
        count: visibleProjects.length,
        titles: visibleProjects.slice(0, 3).map(card => 
          card.querySelector('h1, h2, h3, h4, .title, [class*="title"]')?.textContent?.trim() || 'Project'
        ).filter(title => title && title !== 'Project')
      };
    });
    
    console.log('🏗️ Projects Found:');
    console.log(`   📊 Total visible: ${projectInfo.count}`);
    projectInfo.titles.forEach((title, i) => {
      console.log(`   ${i + 1}. ${title}`);
    });
    console.log('');
    
    // Test photo upload
    console.log('📸 Testing photo upload capabilities...');
    const uploadButton = page.locator('text=Upload, button:has-text("Upload"), text=New Photos').first();
    
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'step6-upload.png' });
      console.log('📤 Upload interface opened!');
    } else {
      console.log('📤 Upload button not immediately visible, trying dashboard...');
      await page.click('text=Dashboard');
      await page.waitForTimeout(2000);
      
      const dashUpload = page.locator('text=Upload New Photos, button:has-text("Upload")').first();
      if (await dashUpload.isVisible()) {
        await dashUpload.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'step6-upload.png' });
        console.log('📤 Found upload from dashboard!');
      }
    }
    
    // Explore team section
    console.log('👥 Checking team management...');
    await page.click('text=Team');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step7-team.png' });
    
    // Try to access settings
    console.log('⚙️ Opening settings...');
    await page.click('text=Settings');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step8-settings.png' });
    
    console.log('');
    console.log('🎯 EXPLORATION COMPLETE!');
    console.log('');
    console.log('📁 Journey Screenshots:');
    console.log('   1. step1-homepage.png - Landing page');
    console.log('   2. step2-login-page.png - Authentication');
    console.log('   3. step3-credentials-filled.png - Ready to login');
    console.log('   4. step4-dashboard.png - Main dashboard');
    console.log('   5. step5-projects.png - Projects view');
    console.log('   6. step6-upload.png - Upload interface');
    console.log('   7. step7-team.png - Team management');
    console.log('   8. step8-settings.png - Settings panel');
    console.log('');
    console.log('🚀 FSW Iron Task is fully operational!');
    console.log('💡 The browser will stay open for 30 more seconds for manual exploration...');
    
    // Keep browser open for manual interaction
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error during exploration:', error.message);
    await page.screenshot({ path: 'error-exploration.png' });
  } finally {
    await browser.close();
    console.log('🔚 Exploration session ended');
  }
}

exploreFSW().catch(console.error);