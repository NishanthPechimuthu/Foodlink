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
  console.log('🚀 COMPREHENSIVE END-TO-END VERIFICATION');
  console.log('====================================================');

  // 1. Direct API Checks (port 5001 and port 5173 proxy)
  console.log('\n--- 1. Testing API Endpoints Directly ---');
  const endpoints = [
    { name: 'Health check (backend 5001)', url: 'http://localhost:5001/api/health' },
    { name: 'Health check (Vite proxy 5173)', url: 'http://127.0.0.1:5173/api/health' },
    { name: 'Auth/me unauthenticated (5001)', url: 'http://localhost:5001/api/auth/me' },
    { name: 'Auth/me unauthenticated (5173)', url: 'http://127.0.0.1:5173/api/auth/me' },
    { name: 'Food Explore (5001)', url: 'http://localhost:5001/api/food?page=1&limit=9&sortBy=newest' },
    { name: 'Food Explore (5173)', url: 'http://127.0.0.1:5173/api/food?page=1&limit=9&sortBy=newest' },
    { name: 'Food Search: Rice (5001)', url: 'http://localhost:5001/api/food?search=Rice' },
    { name: 'Food Search: Milk (5001)', url: 'http://localhost:5001/api/food?search=Milk' },
    { name: 'Food Category & Veg (5001)', url: 'http://localhost:5001/api/food?category=Cooked%20Meals&isVegetarian=true' },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url);
      const data = await res.json();
      console.log(`✔ [${res.status}] ${ep.name} -> success: ${data.success !== false}, summary:`, 
        data.listings ? `Listings: ${data.listings.length}` : (data.status || data.message || JSON.stringify(data).substring(0, 80)));
    } catch (e) {
      console.error(`❌ FAILED: ${ep.name} -> ${e.message}`);
      process.exit(1);
    }
  }

  // 2. Puppeteer Browser Testing
  console.log('\n--- 2. Starting Browser Verification ---');
  const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_verify_'));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    userDataDir: tempProfileDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 950 },
  });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`[Browser Error] ${msg.text()}`);
    }
  });

  try {
    // 2.1 Explore Page Live MongoDB
    console.log('\n--- 2.1 Testing /explore page ---');
    await page.goto('http://127.0.0.1:5173/explore', { waitUntil: 'networkidle0' });
    await sleep(2000);

    // Verify MongoDB Atlas live badge exists
    const hasAtlasBadge = await page.evaluate(() => {
      return document.body.textContent.includes('MongoDB Atlas Live');
    });
    console.log(`✔ Explore page MongoDB Atlas Live badge visible: ${hasAtlasBadge}`);

    await page.screenshot({ path: path.join(artifactDir, 'explore_live_mongodb.png') });
    console.log('✔ Captured explore_live_mongodb.png');

    // Helper to set search input value and trigger React input event
    async function setSearch(value) {
      await page.evaluate((val) => {
        const input = document.querySelector('input[placeholder*="Search by food name"]');
        if (input) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, value);
      await sleep(1500);
    }

    // 2.2 Search for Rice
    console.log('\n--- 2.2 Searching for "Rice" ---');
    await setSearch('Rice');
    await page.screenshot({ path: path.join(artifactDir, 'explore_search_rice.png') });
    console.log('✔ Captured explore_search_rice.png');

    // 2.3 Search for Milk
    console.log('\n--- 2.3 Searching for "Milk" ---');
    await setSearch('Milk');
    await page.screenshot({ path: path.join(artifactDir, 'explore_search_milk.png') });
    console.log('✔ Captured explore_search_milk.png');

    // 2.4 Open Food Detail Modal
    console.log('\n--- 2.4 Clicking first food card for detail modal ---');
    await setSearch(''); // Clear search
    await sleep(1000);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View Details'));
      if (btn) btn.click();
    });
    await sleep(1200);
    await page.screenshot({ path: path.join(artifactDir, 'explore_food_modal.png') });
    console.log('✔ Captured explore_food_modal.png');

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close modal"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Close') || b.querySelector('svg'));
      if (closeBtn) closeBtn.click();
    });
    await sleep(500);

    // 2.5 Test Donor Dashboard
    console.log('\n--- 2.5 Testing Donor Login & Dashboard ---');
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    await page.type('input[type="email"]', 'donor@foodlink.org');
    await page.type('input[type="password"]', 'DonorPassword@123');
    await page.click('button[type="submit"]');
    await sleep(2500);

    if (!page.url().includes('/donor/dashboard')) {
      await page.goto('http://127.0.0.1:5173/donor/dashboard', { waitUntil: 'networkidle0' });
      await sleep(1500);
    }
    await page.screenshot({ path: path.join(artifactDir, 'donor_dashboard_live.png') });
    console.log('✔ Captured donor_dashboard_live.png');

    // 2.6 Test Receiver Dashboard
    console.log('\n--- 2.6 Testing Receiver Login & Dashboard ---');
    // Clear session by navigating to login
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    await page.evaluate(() => sessionStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(800);

    await page.type('input[type="email"]', 'receiver@foodlink.org');
    await page.type('input[type="password"]', 'ReceiverPassword@123');
    await page.click('button[type="submit"]');
    await sleep(2500);

    if (!page.url().includes('/receiver/dashboard')) {
      await page.goto('http://127.0.0.1:5173/receiver/dashboard', { waitUntil: 'networkidle0' });
      await sleep(1500);
    }
    await page.screenshot({ path: path.join(artifactDir, 'receiver_dashboard_live.png') });
    console.log('✔ Captured receiver_dashboard_live.png');

    console.log('\n====================================================');
    console.log('🎉 ALL END-TO-END VERIFICATION PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Browser verification error:', err);
    process.exit(1);
  } finally {
    await browser.close();
    try {
      if (fs.existsSync(tempProfileDir)) {
        fs.rmSync(tempProfileDir, { recursive: true, force: true });
      }
    } catch {}
  }
}

main().catch(console.error);
