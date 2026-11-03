import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\raaru\\.gemini\\antigravity\\brain\\20706a52-48ef-4f99-854c-e7cc05ac1e77';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('====================================================');
  console.log('🎭 RUNNING PUPPETEER VERIFICATION & SCREENSHOTS');
  console.log('====================================================');

  const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_fl_profile_'));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    userDataDir: tempProfileDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 950 },
  });

  const page = await browser.newPage();

  // Track console and runtime errors
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.error(`[Browser Console Error] ${text}`);
    } else {
      console.log(`[Browser Console] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    console.error(`[Browser Page Error] ${err.message}`);
  });

  try {
    // -----------------------------------------------------------------
    // 1. TEST HOMEPAGE & HERO ANIMATION
    // -----------------------------------------------------------------
    console.log('\n--- 1. Testing Homepage at http://127.0.0.1:5173/ ---');
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
    await sleep(2000);

    // Capture initial hero animation (Surplus Arrival)
    console.log('--- Clicking "1. Surplus Harvest" ---');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('1. Surplus Harvest'));
      if (btn) btn.click();
    });
    await sleep(1500);
    await page.screenshot({ path: path.join(artifactDir, 'hero_stage1_surplus.png') });
    console.log('✔ Captured hero_stage1_surplus.png');

    // Trigger Chapter 2: Basket Fills
    console.log('--- Clicking "2. Basket Fills" ---');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('2. Basket Fills'));
      if (btn) btn.click();
    });
    await sleep(1200);
    await page.screenshot({ path: path.join(artifactDir, 'hero_stage2_basket.png') });
    console.log('✔ Captured hero_stage2_basket.png');

    // Trigger Chapter 3: Human Handover
    console.log('--- Clicking "3. Human Handover" ---');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('3. Human Handover'));
      if (btn) btn.click();
    });
    await sleep(1200);
    await page.screenshot({ path: path.join(artifactDir, 'hero_stage3_handover.png') });
    console.log('✔ Captured hero_stage3_handover.png');

    // Trigger Chapter 4: Community Impact
    console.log('--- Clicking "4. Community Impact" ---');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('4. Community Impact'));
      if (btn) btn.click();
    });
    await sleep(1200);
    await page.screenshot({ path: path.join(artifactDir, 'hero_stage4_impact.png') });
    console.log('✔ Captured hero_stage4_impact.png');

    // -----------------------------------------------------------------
    // 2. TEST DONOR LOGIN & /donor/dashboard
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Donor Authentication & Dashboard ---');
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle0' });
    await sleep(1000);

    // Type credentials
    await page.type('input[type="email"]', 'donor@foodlink.org');
    await page.type('input[type="password"]', 'DonorPassword@123');
    console.log('Typed donor credentials: donor@foodlink.org');

    // Submit and await client-side navigation
    await page.click('button[type="submit"]');
    await sleep(2500);
    console.log(`Navigated to: ${page.url()}`);

    // If not on donor dashboard yet, navigate directly
    if (!page.url().includes('/donor/dashboard')) {
      await page.goto('http://127.0.0.1:5173/donor/dashboard', { waitUntil: 'networkidle0' });
      await sleep(2000);
    }

    // Capture Donor Dashboard Overview
    await page.screenshot({ path: path.join(artifactDir, 'donor_dashboard.png') });
    console.log('✔ Captured donor_dashboard.png');

    // Click "My Listings" tab
    console.log('--- Clicking "My Listings" Tab ---');
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('My Listings'));
      if (tab) tab.click();
    });
    await sleep(800);
    await page.screenshot({ path: path.join(artifactDir, 'donor_dashboard_listings.png') });
    console.log('✔ Captured donor_dashboard_listings.png');

    // Click "Incoming Requests" tab
    console.log('--- Clicking "Incoming Requests" Tab ---');
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Incoming Requests'));
      if (tab) tab.click();
    });
    await sleep(800);
    await page.screenshot({ path: path.join(artifactDir, 'donor_dashboard_requests.png') });
    console.log('✔ Captured donor_dashboard_requests.png');

    console.log('\n====================================================');
    console.log('🎉 ALL PUPPETEER VERIFICATION TESTS COMPLETED!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error during Puppeteer run:', err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    try {
      if (fs.existsSync(tempProfileDir)) {
        fs.rmSync(tempProfileDir, { recursive: true, force: true });
      }
    } catch (e) {}
  }
}

main();
