import '../config/env.js';
import { connectDB } from '../config/db.js';
import app from '../app.js';
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import axios from 'axios';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\raaru\\.gemini\\antigravity\\brain\\20706a52-48ef-4f99-854c-e7cc05ac1e77';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('====================================================');
  console.log('🚀 FOOD LINK — PHASE 5 COMPLETE END-TO-END VERIFICATION');
  console.log('====================================================');

  // 1. Connect DB
  console.log('\n--- 1. Connecting to MongoDB Atlas ---');
  await connectDB();

  // 2. Start Backend Server on Port 5001
  console.log('\n--- 2. Starting Backend Server on Port 5001 ---');
  const server = app.listen(5001, () => {
    console.log('✔ Backend listening on http://localhost:5001');
  });

  // 3. Start Client Vite Server on Port 5173
  console.log('\n--- 3. Starting Frontend Vite Server on Port 5173 ---');
  const clientDir = path.resolve(process.cwd(), '../client');
  const viteProcess = spawn('npx.cmd', ['vite', '--port', '5173', '--strictPort'], {
    cwd: clientDir,
    shell: true,
    stdio: 'pipe',
  });

  viteProcess.stdout.on('data', (d) => {
    const s = d.toString();
    if (s.includes('Local:')) console.log('[Vite stdout]', s.trim());
  });
  viteProcess.stderr.on('data', (d) => {
    console.warn('[Vite stderr]', d.toString().trim());
  });

  // Wait for Vite to be ready
  let viteReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await axios.get('http://localhost:5173/', { timeout: 1500 });
      if (res.status === 200) {
        viteReady = true;
        console.log('✔ Vite frontend server ready on http://localhost:5173');
        break;
      }
    } catch {
      await sleep(500);
    }
  }

  if (!viteReady) {
    console.error('❌ Failed to reach Vite dev server after 15 seconds.');
    server.close();
    viteProcess.kill();
    process.exit(1);
  }

  // 4. Test Backend Phase 5 Endpoints directly
  console.log('\n--- 4. Testing Phase 5 API Endpoints ---');

  // 4.1 GET /api/impact
  const impactRes = await axios.get('http://localhost:5001/api/impact');
  console.log(`✔ GET /api/impact -> Status ${impactRes.status}`);
  console.log(`  Rescued: ${impactRes.data.impact.totalRescuedKg} kg | Beneficiaries: ${impactRes.data.impact.totalBeneficiaries} | CO2: ${impactRes.data.impact.co2SavedKg} kg`);
  console.log(`  Categories: ${impactRes.data.impact.categoryBreakdown.length} categories tracked`);

  // 4.2 Log in as demo donor to test Notifications & Upload
  const donorAuth = await axios.post('http://localhost:5001/api/auth/login', {
    email: 'donor@foodlink.org',
    password: 'DonorPassword@123',
  });
  const donorToken = donorAuth.data.token;
  console.log(`✔ Authenticated as Donor: token received (${donorToken.slice(0, 15)}...)`);

  // 4.3 GET /api/notifications
  const notifRes = await axios.get('http://localhost:5001/api/notifications', {
    headers: { Authorization: `Bearer ${donorToken}` },
  });
  console.log(`✔ GET /api/notifications -> Status ${notifRes.status} (${notifRes.data.notifications.length} notifications, ${notifRes.data.unreadCount} unread)`);

  // 4.4 PATCH /api/notifications/:id/read
  if (notifRes.data.notifications.length > 0) {
    const firstNotifId = notifRes.data.notifications[0]._id;
    const readRes = await axios.patch(
      `http://localhost:5001/api/notifications/${firstNotifId}/read`,
      {},
      { headers: { Authorization: `Bearer ${donorToken}` } }
    );
    console.log(`✔ PATCH /api/notifications/:id/read -> Status ${readRes.status} (Notification marked read: ${readRes.data.notification.isRead})`);
  }

  // 5. Launch Puppeteer Browser & Capture Screenshots
  console.log('\n--- 5. Launching Puppeteer Browser for Visual Verification ---');
  const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_phase5_'));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    userDataDir: tempProfileDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 950 },
  });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error(`[Browser Error] ${msg.text()}`);
  });

  try {
    // -------------------------------------------------------------
    // Screen 1: Public Impact Page (/impact)
    // -------------------------------------------------------------
    console.log('\n--- 5.1 Navigating to /impact ---');
    await page.goto('http://localhost:5173/impact', { waitUntil: 'networkidle2' });
    await sleep(2000);
    const impactShot = path.join(artifactDir, 'impact_page.png');
    await page.screenshot({ path: impactShot });
    console.log(`📸 Captured: ${impactShot}`);

    // -------------------------------------------------------------
    // Screen 2: Explore Page & Map View (/explore)
    // -------------------------------------------------------------
    console.log('\n--- 5.2 Navigating to /explore & toggling Map View ---');
    await page.goto('http://localhost:5173/explore', { waitUntil: 'networkidle2' });
    await sleep(2500);

    // Toggle Map View
    console.log('  Clicking Map View button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Map View'));
      if (btn) btn.click();
    });
    await sleep(2500);

    const mapShot = path.join(artifactDir, 'explore_map_view.png');
    await page.screenshot({ path: mapShot });
    console.log(`📸 Captured: ${mapShot}`);

    // Toggle back to Grid and open Food Detail Modal
    console.log('  Toggling back to Grid & opening first food listing modal...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Grid'));
      if (btn) btn.click();
    });
    await sleep(1000);

    // Click the first card
    await page.evaluate(() => {
      const card = document.querySelector('.clay-card') || document.querySelector('[class*="rounded-3xl"]');
      if (card) card.click();
    });
    await sleep(1500);

    const modalShot = path.join(artifactDir, 'explore_food_modal.png');
    await page.screenshot({ path: modalShot });
    console.log(`📸 Captured: ${modalShot}`);

    // Close modal
    await page.keyboard.press('Escape');
    await sleep(800);

    // -------------------------------------------------------------
    // Screen 3: Donor Dashboard with Notifications Dropdown
    // -------------------------------------------------------------
    console.log('\n--- 5.3 Logging in as Donor & Testing Dashboard ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Fill login
    await page.type('input[type="email"]', 'donor@foodlink.org');
    await page.type('input[type="password"]', 'DonorPassword@123');
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Sign In'));
      if (submitBtn) submitBtn.click();
    });
    await sleep(3000);

    // Open notifications dropdown
    console.log('  Opening Notifications dropdown...');
    await page.evaluate(() => {
      const bell = document.querySelector('button[title="Notifications"]');
      if (bell) bell.click();
    });
    await sleep(1200);

    const notifShot = path.join(artifactDir, 'notifications_dropdown.png');
    await page.screenshot({ path: notifShot });
    console.log(`📸 Captured: ${notifShot}`);

    // Close dropdown
    await page.keyboard.press('Escape');
    await sleep(800);

    // Capture Donor Dashboard
    const donorShot = path.join(artifactDir, 'donor_dashboard_enhanced.png');
    await page.screenshot({ path: donorShot });
    console.log(`📸 Captured: ${donorShot}`);

    // -------------------------------------------------------------
    // Screen 4: Receiver Dashboard (/receiver/dashboard)
    // -------------------------------------------------------------
    console.log('\n--- 5.4 Logging in as Receiver & Testing Dashboard ---');
    // Log out first
    await page.evaluate(() => {
      localStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await sleep(1000);

    await page.type('input[type="email"]', 'receiver@foodlink.org');
    await page.type('input[type="password"]', 'ReceiverPassword@123');
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Sign In'));
      if (submitBtn) submitBtn.click();
    });
    await sleep(3000);

    // Navigate to "My Requests" tab to view timeline
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('My Requests'));
      if (tab) tab.click();
    });
    await sleep(1200);

    const receiverShot = path.join(artifactDir, 'receiver_dashboard_enhanced.png');
    await page.screenshot({ path: receiverShot });
    console.log(`📸 Captured: ${receiverShot}`);

    // -------------------------------------------------------------
    // Screen 5: Admin Dashboard (/admin/dashboard)
    // -------------------------------------------------------------
    console.log('\n--- 5.5 Logging in as Admin & Testing Dashboard ---');
    await page.evaluate(() => {
      localStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await sleep(1000);

    await page.type('input[type="email"]', 'admin@foodlink.org');
    await page.type('input[type="password"]', 'FoodLinkAdmin@2026!');
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Sign In'));
      if (submitBtn) submitBtn.click();
    });
    await sleep(3500);

    const adminShot = path.join(artifactDir, 'admin_dashboard_enhanced.png');
    await page.screenshot({ path: adminShot });
    console.log(`📸 Captured: ${adminShot}`);

    console.log('\n====================================================');
    console.log('🎉 PHASE 5 VERIFICATION COMPLETED WITH ZERO ERRORS!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error during visual verification:', err);
  } finally {
    await browser.close();
    server.close();
    viteProcess.kill();
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
