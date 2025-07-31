const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor responses
  page.on('response', response => {
    if (response.url().includes('/api/media/upload')) {
      console.log(`Upload Response: ${response.status()}`);
      response.text().then(body => {
        console.log('Response body:', body);
      }).catch(() => {});
    }
  });
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[id="email"]', 'pm@fsw-denver.com');
  await page.fill('input[id="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**');
  
  await page.goto('http://localhost:3000/dashboard/projects');
  await page.waitForTimeout(1000);
  
  await page.click('text=Denver Tech Center Tower');
  await page.waitForTimeout(1000);
  
  await page.click('button:has-text("Upload")');
  await page.waitForTimeout(1000);
  
  const testImagePath = path.join(__dirname, 'test-supabase.jpg');
  await page.locator('input[type="file"]').setInputFiles(testImagePath);
  await page.waitForTimeout(500);
  
  await page.click('button:has-text("Upload All Files")');
  console.log('Clicked Upload All Files...');
  
  await page.waitForTimeout(5000);
  await browser.close();
})();