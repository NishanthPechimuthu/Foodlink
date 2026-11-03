import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\raaru\\.gemini\\antigravity\\brain\\20706a52-48ef-4f99-854c-e7cc05ac1e77';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map((a) => a.value || a.description).join(' ');
        console.log(`[Browser Console] ${msg.params.type}: ${text}`);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('❌ Browser Runtime Exception:', msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async screenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
    console.log(`📸 Screenshot saved: ${outputPath}`);
  }
}

async function run() {
  console.log('====================================================');
  console.log('📸 FOOD LINK — VISUAL VERIFICATION & SCREENSHOT SUITE');
  console.log('====================================================');

  // Step 1: Authenticate with Backend directly to obtain JWT token
  console.log('\n--- 1. Authenticating as Donor (donor@foodlink.org) ---');
  const loginFetch = await fetch('http://127.0.0.1:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'donor@foodlink.org', password: 'DonorPassword@123' }),
  });
  const loginData = await loginFetch.json();
  if (!loginData.success || !loginData.token) {
    throw new Error(`Donor login failed: ${JSON.stringify(loginData)}`);
  }
  const donorToken = loginData.token;
  console.log(`✔ Authenticated as: ${loginData.user.fullName} (${loginData.user.role})`);

  // Step 2: Launch Headless Chrome
  console.log('\n--- 2. Launching Headless Chrome via CDP ---');
  const chromeProcess = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--window-size=1280,950',
      '--no-sandbox',
      '--disable-gpu',
    ],
    { stdio: 'ignore' }
  );

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error('No WebSocket URL from Chrome');

    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');

    // -------------------------------------------------------------
    // 3. CAPTURE HOMEPAGE HERO ANIMATION AT STAGES
    // -------------------------------------------------------------
    console.log('\n--- 3. Navigating to Homepage (http://127.0.0.1:5173/) ---');
    await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await sleep(2000);

    // Screenshot 1: Surplus Harvest
    await client.screenshot(path.join(artifactDir, 'homepage_hero.png'));

    // Trigger Chapter 2: Basket Fills
    console.log('--- Triggering Chapter 2: Basket Fills ---');
    await client.send('Runtime.evaluate', {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('2. Basket Fills'));
        if (btn) btn.click();
      `,
    });
    await sleep(800);
    await client.screenshot(path.join(artifactDir, 'hero_stage2_basket.png'));

    // Trigger Chapter 3: Human Handover
    console.log('--- Triggering Chapter 3: Human Handover ---');
    await client.send('Runtime.evaluate', {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3. Human Handover'));
        if (btn) btn.click();
      `,
    });
    await sleep(800);
    await client.screenshot(path.join(artifactDir, 'hero_stage3_handover.png'));

    // Trigger Chapter 4: Community Impact
    console.log('--- Triggering Chapter 4: Community Impact ---');
    await client.send('Runtime.evaluate', {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('4. Community Impact'));
        if (btn) btn.click();
      `,
    });
    await sleep(800);
    await client.screenshot(path.join(artifactDir, 'hero_stage4_impact.png'));

    // -------------------------------------------------------------
    // 4. INJECT SESSION TOKEN & CAPTURE DONOR DASHBOARD
    // -------------------------------------------------------------
    console.log('\n--- 4. Setting Session Token & Navigating to /donor/dashboard ---');

    // Set cookie
    await client.send('Network.setCookie', {
      name: 'token',
      value: donorToken,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: false,
    });

    // Also set sessionStorage on the client
    await client.send('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('food_link_session_token', '${donorToken}');
      `,
    });

    // Navigate to Donor Dashboard
    await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/donor/dashboard' });
    await sleep(2500);

    // Capture Donor Dashboard Overview
    await client.screenshot(path.join(artifactDir, 'donor_dashboard.png'));

    // Switch to "My Listings" tab on Donor Dashboard
    console.log('--- Switching to "My Listings" Tab on Donor Dashboard ---');
    await client.send('Runtime.evaluate', {
      expression: `
        const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('My Listings'));
        if (tab) tab.click();
      `,
    });
    await sleep(600);
    await client.screenshot(path.join(artifactDir, 'donor_dashboard_listings.png'));

    // Switch to "Incoming Requests" tab on Donor Dashboard
    console.log('--- Switching to "Incoming Requests" Tab on Donor Dashboard ---');
    await client.send('Runtime.evaluate', {
      expression: `
        const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Incoming Requests'));
        if (tab) tab.click();
      `,
    });
    await sleep(600);
    await client.screenshot(path.join(artifactDir, 'donor_dashboard_requests.png'));

    console.log('\n====================================================');
    console.log('🎉 ALL SCREENSHOTS SUCCESSFULLY CAPTURED!');
    console.log('====================================================\n');
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
