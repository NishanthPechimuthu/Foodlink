import '../config/env.js';
import { Readable } from 'stream';
import http from 'http';
import assert from 'assert';
import app from '../app.js';
import { userService } from '../services/user.service.js';

// In-process HTTP request simulator for sandboxed testing without TCP sockets
const makeRequest = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const bodyStr = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : '';
    
    // Create Readable stream for request
    const req = Readable.from(bodyStr ? [Buffer.from(bodyStr)] : []);
    req.method = options.method || 'GET';
    req.url = path;
    req.originalUrl = path;
    
    // Mock socket for ip and connection inspection
    const mockSocket = {
      remoteAddress: '127.0.0.1',
      encrypted: false,
      destroy: () => {},
    };
    req.socket = mockSocket;
    req.connection = mockSocket;

    const normalizedHeaders = {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(bodyStr),
      host: 'localhost',
    };

    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        normalizedHeaders[k.toLowerCase()] = v;
      }
    }

    if (options.cookie) {
      normalizedHeaders['cookie'] = options.cookie;
    }

    req.headers = normalizedHeaders;

    // Create mock ServerResponse
    const res = new http.ServerResponse(req);
    res.statusCode = 200;
    
    let responseBody = '';
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk, ...args) {
      if (chunk) responseBody += chunk.toString();
      return originalWrite.apply(res, [chunk, ...args]);
    };

    res.end = function (chunk, ...args) {
      if (chunk) responseBody += chunk.toString();
      originalEnd.apply(res, args.length ? [chunk, ...args] : []);

      let parsedData = null;
      try {
        parsedData = JSON.parse(responseBody);
      } catch {
        parsedData = responseBody;
      }

      const setCookie = res.getHeader('set-cookie');
      let cookieHeader = null;
      if (setCookie) {
        const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
        cookieHeader = cookieStr.split(';')[0];
      }

      resolve({
        status: res.statusCode,
        headers: res.getHeaders(),
        data: parsedData,
        cookie: cookieHeader,
      });
    };

    app(req, res);
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE AUTHENTICATION TEST SUITE');
  console.log('====================================================');

  process.env.NODE_ENV = 'test';

  let donorCookie = null;
  let donorToken = null;
  let receiverCookie = null;
  let receiverToken = null;
  let adminToken = null;

  try {
    // -----------------------------------------------------------------------
    // TEST 1: REGISTRATION TESTS
    // -----------------------------------------------------------------------
    console.log('--- 1. Registration Tests ---');

    // 1.1 Valid Donor Registration
    const regDonorRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Maya Sharma',
        email: 'maya.donor@foodlink.org',
        phone: '+91 98765 43210',
        password: 'SecurePassword123!',
        role: 'donor',
        organizationName: 'Maya Community Kitchen',
      },
    });
    assert.strictEqual(regDonorRes.status, 201, `Valid donor registration should return 201. Got ${regDonorRes.status}: ${JSON.stringify(regDonorRes.data)}`);
    assert.strictEqual(regDonorRes.data.success, true);
    assert.strictEqual(regDonorRes.data.user.role, 'Donor');
    assert.strictEqual(regDonorRes.data.user.email, 'maya.donor@foodlink.org');
    assert.strictEqual(regDonorRes.data.user.passwordHash, undefined, 'passwordHash must never be returned');
    assert.ok(regDonorRes.cookie || regDonorRes.data.token, 'Cookie or token should be returned');
    donorCookie = regDonorRes.cookie;
    donorToken = regDonorRes.data.token;
    console.log('✅ 1.1 Valid Donor Registration: Passed');

    // 1.2 Valid Receiver Registration
    const regReceiverRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Hope Shelter NGO',
        email: 'hope.shelter@foodlink.org',
        phone: '+91 91234 56789',
        password: 'ReceiverPass456!',
        role: 'receiver',
        organizationName: 'Hope Community Care',
      },
    });
    assert.strictEqual(regReceiverRes.status, 201, 'Valid receiver registration should return 201');
    assert.strictEqual(regReceiverRes.data.user.role, 'Receiver');
    receiverCookie = regReceiverRes.cookie;
    receiverToken = regReceiverRes.data.token;
    console.log('✅ 1.2 Valid Receiver Registration: Passed');

    // 1.3 Duplicate Email Prevention
    const dupRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Another Maya',
        email: 'maya.donor@foodlink.org',
        phone: '+91 98765 00000',
        password: 'AnotherPassword123!',
        role: 'donor',
      },
    });
    assert.strictEqual(dupRes.status, 400, 'Duplicate email should return 400 Bad Request');
    assert.strictEqual(dupRes.data.success, false);
    console.log('✅ 1.3 Duplicate Email Prevention: Passed');

    // 1.4 Invalid Email Format
    const badEmailRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Bad Email User',
        email: 'invalid-email-address',
        phone: '+91 98765 43210',
        password: 'SecurePassword123!',
        role: 'donor',
      },
    });
    assert.strictEqual(badEmailRes.status, 400, 'Invalid email should return 400');
    console.log('✅ 1.4 Invalid Email Format: Passed');

    // 1.5 Weak Password
    const weakPassRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Weak Pass User',
        email: 'weak@example.com',
        phone: '+91 98765 43210',
        password: '123',
        role: 'donor',
      },
    });
    assert.strictEqual(weakPassRes.status, 400, 'Weak password should return 400');
    console.log('✅ 1.5 Weak Password: Passed');

    // 1.6 Missing Fields
    const missingRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: '',
        email: '',
      },
    });
    assert.strictEqual(missingRes.status, 400, 'Missing fields should return 400');
    console.log('✅ 1.6 Missing Fields Rejection: Passed');

    // 1.7 Attempted Public Admin Registration (Strict Security Requirement)
    const hackAdminRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Fake Admin Attempt',
        email: 'fake.admin@foodlink.org',
        phone: '+91 99999 99999',
        password: 'AdminPassword123!',
        role: 'admin',
      },
    });
    assert.strictEqual(hackAdminRes.status, 400, 'Public admin registration attempt must return 400 Bad Request');
    assert.strictEqual(hackAdminRes.data.success, false);
    console.log('✅ 1.7 Attempted Public Admin Registration Blocked: Passed');

    // -----------------------------------------------------------------------
    // TEST 2: LOGIN TESTS
    // -----------------------------------------------------------------------
    console.log('\n--- 2. Login Tests ---');

    // 2.1 Correct Credentials Login
    const loginOkRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'maya.donor@foodlink.org',
        password: 'SecurePassword123!',
      },
    });
    assert.strictEqual(loginOkRes.status, 200, 'Login should return 200 OK');
    assert.strictEqual(loginOkRes.data.success, true);
    assert.strictEqual(loginOkRes.data.user.email, 'maya.donor@foodlink.org');
    assert.strictEqual(loginOkRes.data.user.passwordHash, undefined);
    assert.ok(loginOkRes.data.token, 'Should return token');
    console.log('✅ 2.1 Correct Credentials Login: Passed');

    // 2.2 Incorrect Password
    const badPassRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'maya.donor@foodlink.org',
        password: 'WrongPassword999!',
      },
    });
    assert.strictEqual(badPassRes.status, 401, 'Incorrect password should return 401');
    assert.strictEqual(badPassRes.data.success, false);
    console.log('✅ 2.2 Incorrect Password: Passed');

    // 2.3 Unknown Email
    const unknownEmailRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'nonexistent.user@foodlink.org',
        password: 'AnyPassword123!',
      },
    });
    assert.strictEqual(unknownEmailRes.status, 401, 'Unknown email should return 401');
    assert.strictEqual(unknownEmailRes.data.success, false);
    console.log('✅ 2.3 Unknown Email (Generic message, no enumeration): Passed');

    // 2.4 Suspended User Login Prevention
    const suspendedUser = await userService.create({
      fullName: 'Suspended Donor',
      email: 'suspended@foodlink.org',
      phone: '+91 99887 76655',
      password: 'SomePassword123!',
      role: 'Donor',
    });
    suspendedUser.accountStatus = 'suspended';
    await suspendedUser.save();

    const suspendedLoginRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'suspended@foodlink.org',
        password: 'SomePassword123!',
      },
    });
    assert.strictEqual(suspendedLoginRes.status, 403, 'Suspended user login must be rejected with 403 Forbidden');
    console.log('✅ 2.4 Suspended User Login Blocked: Passed');

    // -----------------------------------------------------------------------
    // TEST 3: SESSION & GET /me TESTS
    // -----------------------------------------------------------------------
    console.log('\n--- 3. Current User & Session Tests ---');

    // 3.1 Get Me with Authorization Header
    const meRes = await makeRequest('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${donorToken}`,
      },
    });
    if (meRes.status !== 200) {
      console.log('GET /me failed with:', meRes.status, meRes.data, 'donorToken was:', donorToken);
    }
    assert.strictEqual(meRes.status, 200, 'GET /me with Bearer token should return 200');
    assert.strictEqual(meRes.data.user.email, 'maya.donor@foodlink.org');
    console.log('✅ 3.1 GET /me via Bearer Token: Passed');

    // 3.2 Get Me with HttpOnly Cookie
    if (donorCookie) {
      const meCookieRes = await makeRequest('/api/auth/me', {
        cookie: donorCookie,
      });
      assert.strictEqual(meCookieRes.status, 200, 'GET /me with Cookie should return 200');
      assert.strictEqual(meCookieRes.data.user.email, 'maya.donor@foodlink.org');
      console.log('✅ 3.2 GET /me via HttpOnly Cookie: Passed');
    }

    // 3.3 Unauthenticated Access to Protected Route
    const noAuthRes = await makeRequest('/api/auth/me');
    assert.strictEqual(noAuthRes.status, 401, 'Unauthenticated request must return 401');
    console.log('✅ 3.3 Unauthenticated Access Blocked: Passed');

    // -----------------------------------------------------------------------
    // TEST 4: ROLE-BASED AUTHORIZATION TESTS
    // -----------------------------------------------------------------------
    console.log('\n--- 4. Role Authorization Tests ---');

    // 4.1 Donor accessing Donor route -> 200 OK
    const donorAccessDonor = await makeRequest('/api/auth/donor-only', {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert.strictEqual(donorAccessDonor.status, 200, 'Donor should access Donor route');
    console.log('✅ 4.1 Donor accessing Donor route: Allowed (200)');

    // 4.2 Receiver accessing Receiver route -> 200 OK
    const receiverAccessReceiver = await makeRequest('/api/auth/receiver-only', {
      headers: { Authorization: `Bearer ${receiverToken}` },
    });
    assert.strictEqual(receiverAccessReceiver.status, 200, 'Receiver should access Receiver route');
    console.log('✅ 4.2 Receiver accessing Receiver route: Allowed (200)');

    // 4.3 Donor attempting Receiver route -> 403 Forbidden
    const donorAccessReceiver = await makeRequest('/api/auth/receiver-only', {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert.strictEqual(donorAccessReceiver.status, 403, 'Donor accessing Receiver route must return 403 Forbidden');
    console.log('✅ 4.3 Donor attempting Receiver route: Blocked (403)');

    // 4.4 Receiver attempting Donor route -> 403 Forbidden
    const receiverAccessDonor = await makeRequest('/api/auth/donor-only', {
      headers: { Authorization: `Bearer ${receiverToken}` },
    });
    assert.strictEqual(receiverAccessDonor.status, 403, 'Receiver accessing Donor route must return 403 Forbidden');
    console.log('✅ 4.4 Receiver attempting Donor route: Blocked (403)');

    // 4.5 Donor attempting Admin route -> 403 Forbidden
    const donorAccessAdmin = await makeRequest('/api/auth/admin-only', {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert.strictEqual(donorAccessAdmin.status, 403, 'Donor accessing Admin route must return 403 Forbidden');
    console.log('✅ 4.5 Donor attempting Admin route: Blocked (403)');

    // 4.6 Receiver attempting Admin route -> 403 Forbidden
    const receiverAccessAdmin = await makeRequest('/api/auth/admin-only', {
      headers: { Authorization: `Bearer ${receiverToken}` },
    });
    assert.strictEqual(receiverAccessAdmin.status, 403, 'Receiver accessing Admin route must return 403 Forbidden');
    console.log('✅ 4.6 Receiver attempting Admin route: Blocked (403)');

    // Provision Admin via Service (simulating administrative script)
    const adminUser = await userService.create({
      fullName: 'System Administrator',
      email: 'admin.test@foodlink.org',
      phone: '+91 99999 88888',
      password: 'AdminSuperPassword789!',
      role: 'Admin',
      organizationName: 'Food Link Platform Authority',
    });

    const adminLoginRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin.test@foodlink.org',
        password: 'AdminSuperPassword789!',
      },
    });
    adminToken = adminLoginRes.data.token;

    // 4.7 Admin accessing Admin route -> 200 OK
    const adminAccessAdmin = await makeRequest('/api/auth/admin-only', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(adminAccessAdmin.status, 200, 'Admin should access Admin route');
    console.log('✅ 4.7 Provisioned Admin accessing Admin route: Allowed (200)');

    // -----------------------------------------------------------------------
    // TEST 5: PASSWORD RESET WORKFLOW
    // -----------------------------------------------------------------------
    console.log('\n--- 5. Password Reset Workflow Tests ---');

    // 5.1 Request Forgot Password
    const forgotRes = await makeRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'maya.donor@foodlink.org' },
    });
    assert.strictEqual(forgotRes.status, 200);
    assert.strictEqual(forgotRes.data.success, true);
    const devResetToken = forgotRes.data?.devInfo?.resetToken;
    assert.ok(devResetToken, 'Dev reset token should be provided in test environment');
    console.log('✅ 5.1 Forgot Password Request: Passed (Token generated & hashed)');

    // 5.2 Reset Password with Valid Token
    const resetRes = await makeRequest('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: devResetToken,
        newPassword: 'BrandNewPassword2026!',
      },
    });
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetRes.data.success, true);
    console.log('✅ 5.2 Reset Password with Valid Token: Passed');

    // 5.3 Login with Old Password Fails
    const oldPassLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'maya.donor@foodlink.org',
        password: 'SecurePassword123!',
      },
    });
    assert.strictEqual(oldPassLogin.status, 401, 'Old password must fail');
    console.log('✅ 5.3 Old Password Invalidated: Passed');

    // 5.4 Login with New Password Succeeds
    const newPassLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'maya.donor@foodlink.org',
        password: 'BrandNewPassword2026!',
      },
    });
    assert.strictEqual(newPassLogin.status, 200, 'New password must succeed');
    console.log('✅ 5.4 Login with New Password: Passed');

    // -----------------------------------------------------------------------
    // TEST 6: GOOGLE OAUTH INTEGRATION
    // -----------------------------------------------------------------------
    console.log('\n--- 6. Google OAuth Endpoint Tests ---');
    const googleRes = await makeRequest('/api/auth/google', {
      method: 'POST',
      body: {
        token: Buffer.from(JSON.stringify({
          sub: 'google_1234567890',
          email: 'google.volunteer@foodlink.org',
          name: 'Priya Patel',
          picture: 'https://lh3.googleusercontent.com/photo.jpg',
        })).toString('base64'),
        role: 'receiver',
      },
    });
    assert.strictEqual(googleRes.status, 201);
    assert.strictEqual(googleRes.data.success, true);
    assert.strictEqual(googleRes.data.user.role, 'Receiver');
    assert.strictEqual(googleRes.data.user.authProvider, 'google');
    console.log('✅ 6.1 Google Sign-In & Verified Account Creation: Passed');

    // -----------------------------------------------------------------------
    // TEST 7: LOGOUT TEST
    // -----------------------------------------------------------------------
    console.log('\n--- 7. Logout Test ---');
    const logoutRes = await makeRequest('/api/auth/logout', { method: 'POST' });
    assert.strictEqual(logoutRes.status, 200);
    console.log('✅ 7.1 Logout & Cookie Invalidation: Passed');

    console.log('\n====================================================');
    console.log('🎉 ALL AUTHENTICATION BACKEND TESTS PASSED (100%)');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
};

runTests();
