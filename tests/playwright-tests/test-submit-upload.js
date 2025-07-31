const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testSubmitUpload() {
  console.log('🚀 Testing Supabase Storage upload with submit...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Monitor upload responses
  page.on('response', response => {
    if (response.url().includes('/api/media/upload')) {
      console.log(`📡 Upload Response: ${response.status()}`);
      response.text().then(body => {
        try {
          const data = JSON.parse(body);
          if (response.status() === 200) {
            console.log('✅ Upload successful!');
            console.log(`   Media ID: ${data.id}`);
            console.log(`   File URL: ${data.fileUrl}`);
          } else {
            console.log(`❌ Upload failed: ${data.error || data.message}`);
          }
        } catch (e) {
          console.log(`   Response: ${body}`);
        }
      }).catch(() => {});
    }
  });
  
  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[id="email"]', 'pm@fsw-denver.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard**');
    console.log('✅ Logged in');
    
    // Navigate to project
    console.log('📂 Navigating to project...');
    await page.goto('http://localhost:3000/dashboard/projects');
    await page.waitForTimeout(2000);
    
    // Click on Denver Tech Center Tower project
    const projectCard = await page.$('text=Denver Tech Center Tower');
    if (projectCard) {
      await projectCard.click();
      console.log('✅ Opened project');
      await page.waitForTimeout(2000);
    }
    
    // Click upload button
    const uploadButton = await page.$('button:has-text("Upload")');
    if (uploadButton) {
      await uploadButton.click();
      console.log('✅ Clicked upload button');
      await page.waitForTimeout(2000);
    }
    
    // Create test image if needed
    const testImagePath = path.join(__dirname, 'test-supabase.jpg');
    if (!fs.existsSync(testImagePath)) {
      console.log('📝 Creating test image...');
      // Minimal JPEG
      const jpegData = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
        0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
        0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
        0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
        0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
        0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
        0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
        0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
        0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
        0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
        0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
        0x00, 0x00, 0x3F, 0x00, 0xFD, 0xFC, 0xA2, 0x8A, 0x28, 0x03, 0xFF, 0xD9
      ]);
      fs.writeFileSync(testImagePath, jpegData);
    }
    
    // Upload file
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('📤 Selecting file for upload...');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Check if form needs to be submitted
      console.log('🔍 Looking for submit button...');
      
      // First, let's see what's visible on the page
      const visibleButtons = await page.$$eval('button', buttons => 
        buttons.filter(b => b.offsetParent !== null).map(b => b.textContent.trim())
      );
      console.log('Visible buttons:', visibleButtons);
      
      // Try to find and click submit button
      const submitSelectors = [
        'button:has-text("Upload Files")',
        'button:has-text("Submit")',
        'button:has-text("Start Upload")',
        'button[type="submit"]:visible',
        'button:visible:has-text("Upload")'
      ];
      
      let clicked = false;
      for (const selector of submitSelectors) {
        try {
          const button = await page.$(selector);
          if (button && await button.isVisible()) {
            console.log(`✅ Clicking: ${selector}`);
            await button.click();
            clicked = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!clicked) {
        // Try form submit
        const form = await page.$('form');
        if (form) {
          console.log('📋 Submitting form directly...');
          await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) form.submit();
          });
        } else {
          console.log('⚠️ No submit button or form found');
        }
      }
      
      // Wait for upload response
      console.log('⏳ Waiting for upload response...');
      await page.waitForTimeout(5000);
      
      // Check for success messages
      const successIndicators = [
        'text=/upload.*success/i',
        'text=/successfully.*uploaded/i',
        'img[src*="supabase"]',
        '.success-message',
        '[class*="success"]'
      ];
      
      let uploadSuccess = false;
      for (const selector of successIndicators) {
        const element = await page.$(selector);
        if (element) {
          uploadSuccess = true;
          console.log(`✅ Upload confirmed with: ${selector}`);
          break;
        }
      }
      
      if (!uploadSuccess) {
        console.log('ℹ️ Checking if files were uploaded...');
        // Check if we're back at the media list
        const mediaItems = await page.$$('img[src*="blob:"], img[src*="supabase"]');
        if (mediaItems.length > 0) {
          console.log(`✅ Found ${mediaItems.length} media items`);
        }
      }
      
      await page.screenshot({ path: 'supabase-upload-final.png' });
      console.log('📸 Screenshot saved: supabase-upload-final.png');
    } else {
      console.log('❌ No file input found');
    }
    
    console.log('\n📋 To verify upload:');
    console.log('1. Check Supabase dashboard > Storage > media bucket');
    console.log('2. Check API logs for upload requests');
    console.log('3. Look at the media list in the UI');
    
    console.log('\n⏳ Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'upload-error.png' });
  } finally {
    await browser.close();
    console.log('🔚 Test completed');
  }
}

testSubmitUpload().catch(console.error);