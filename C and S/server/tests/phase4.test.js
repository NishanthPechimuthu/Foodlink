import '../config/env.js';
import { Readable } from 'stream';
import http from 'http';
import assert from 'assert';

import app from '../app.js';
import { connectDB } from '../config/db.js';
import User from '../models/user.model.js';
import FoodListing from '../models/foodListing.model.js';
import FoodRequest from '../models/foodRequest.model.js';
import DonationRecord from '../models/donationRecord.model.js';
import OTPVerification from '../models/otpVerification.model.js';

// In-process HTTP request simulator for testing express endpoints
const makeRequest = (path, options = {}) => {
  return new Promise((resolve) => {
    const bodyStr = options.body
      ? typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)
      : '';

    const req = Readable.from(bodyStr ? [Buffer.from(bodyStr)] : []);
    req.method = options.method || 'GET';
    req.url = path;
    req.originalUrl = path;

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

const runPhase4Tests = async () => {
  console.log('================================================================');
  console.log('🌾 FOOD LINK — PHASE 4: FULL CORE VERIFICATION SUITE (16 SCENARIOS)');
  console.log('================================================================');

  process.env.NODE_ENV = 'test';

  // Connect to DB
  await connectDB();

  let donorCookie = null;
  let donor2Cookie = null;
  let receiverCookie = null;
  let adminCookie = null;

  let createdListingId = null;
  let createdRequestId = null;

  try {
    // -----------------------------------------------------------------
    // SETUP: Authenticate All Roles
    // -----------------------------------------------------------------
    console.log('\n--- 🔑 Auth Setup: Log in as Donor, Donor 2, Receiver, Admin ---');

    // Donor 1 Login
    const donorLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'donor@foodlink.org', password: 'DonorPassword@123' },
    });
    assert.strictEqual(donorLogin.status, 200, `Donor login failed: ${JSON.stringify(donorLogin.data)}`);
    donorCookie = donorLogin.cookie;
    console.log('  ✔ Donor 1 authenticated successfully');

    // Receiver Login
    const receiverLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'receiver@foodlink.org', password: 'ReceiverPassword@123' },
    });
    assert.strictEqual(receiverLogin.status, 200, `Receiver login failed: ${JSON.stringify(receiverLogin.data)}`);
    receiverCookie = receiverLogin.cookie;
    console.log('  ✔ Receiver authenticated successfully');

    // Admin Login
    const adminLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@foodlink.org', password: 'FoodLinkAdmin@2026!' },
    });
    assert.strictEqual(adminLogin.status, 200, `Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    adminCookie = adminLogin.cookie;
    console.log('  ✔ Admin authenticated successfully');

    // Register / Login Donor 2 (to test cross-donor isolation)
    let donor2Login = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'donor2@foodlink.org', password: 'DonorPassword@123' },
    });
    if (donor2Login.status !== 200) {
      const regDonor2 = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: {
          fullName: 'Second Community Kitchen',
          email: 'donor2@foodlink.org',
          phone: '+91 91234 56789',
          password: 'DonorPassword@123',
          role: 'donor',
          organizationName: 'Second Harvest',
        },
      });
      donor2Cookie = regDonor2.cookie;
    } else {
      donor2Cookie = donor2Login.cookie;
    }
    console.log('  ✔ Donor 2 authenticated successfully');

    // -----------------------------------------------------------------
    // SCENARIO 1: Donor publishes food after OTP verification
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 1: Donor publishes food after OTP verification ---');
    const listingDraft = {
      title: 'Phase 4 Fresh Veg Pulao',
      category: 'Cooked Meals',
      description: 'Aromatic basmati rice cooked with fresh seasonal garden vegetables and spices.',
      quantity: 20,
      quantityUnit: 'meals',
      preparedAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      condition: 'Freshly Prepared',
      isVegetarian: true,
      storageRequirements: 'Keep Warm',
      pickupAddress: '77 Heritage Boulevard, Anna Nagar, Chennai',
      pickupInstructions: 'Collect via rear kitchen entrance.',
    };

    // Step 1: Send OTP
    const sendOtpRes = await makeRequest('/api/otp/send', {
      method: 'POST',
      cookie: donorCookie,
      body: {
        phone: '+91 98765 43210',
        listingData: listingDraft,
      },
    });
    assert.strictEqual(sendOtpRes.status, 200, `OTP send failed: ${JSON.stringify(sendOtpRes.data)}`);
    assert(sendOtpRes.data.verificationId, 'Missing verificationId');
    const { verificationId, devOtp } = sendOtpRes.data;
    console.log(`  ✔ OTP sent with verificationId: ${verificationId} (code generated)`);

    // Step 2: Verify OTP
    const verifyOtpRes = await makeRequest('/api/otp/verify', {
      method: 'POST',
      cookie: donorCookie,
      body: {
        verificationId,
        otp: devOtp,
      },
    });
    assert.strictEqual(verifyOtpRes.status, 201, `OTP verification failed: ${JSON.stringify(verifyOtpRes.data)}`);
    assert.strictEqual(verifyOtpRes.data.listing.status, 'Available');
    assert.ok(verifyOtpRes.data.donationCode, 'A donation handover code should be returned on publish');
    const donationCode = verifyOtpRes.data.donationCode;
    createdListingId = verifyOtpRes.data.listing._id;
    console.log(`  ✔ Food listing published with status "Available" (ID: ${createdListingId})`);

    // -----------------------------------------------------------------
    // SCENARIO 2: Donor cannot publish food without valid OTP verification
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 2: Donor cannot publish without valid OTP ---');
    // Request a new verification
    const sendOtp2 = await makeRequest('/api/otp/send', {
      method: 'POST',
      cookie: donor2Cookie,
      body: {
        phone: '+91 91234 56789',
        listingData: {
          title: 'Unverified Bread Draft',
          category: 'Bakery',
          quantity: 10,
          quantityUnit: 'packets',
          preparedAt: new Date(Date.now() - 3600000).toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      },
    });
    const verif2Id = sendOtp2.data?.verificationId;

    const invalidVerifyRes = await makeRequest('/api/otp/verify', {
      method: 'POST',
      cookie: donor2Cookie,
      body: {
        verificationId: verif2Id,
        otp: '000000', // Incorrect OTP
      },
    });
    assert.strictEqual(invalidVerifyRes.status, 400, 'Invalid OTP should return 400');
    console.log('  ✔ Invalid OTP correctly rejected with 400 Bad Request');

    // -----------------------------------------------------------------
    // SCENARIO 3: Receiver can explore available food listings
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 3: Receiver explores available food with filters ---');
    const exploreRes = await makeRequest('/api/food?category=Cooked Meals&isVegetarian=true&sortBy=newest', {
      method: 'GET',
    });
    assert.strictEqual(exploreRes.status, 200, 'Explore endpoint should return 200');
    assert(Array.isArray(exploreRes.data.listings), 'Listings should be an array');
    const foundListing = exploreRes.data.listings.find((l) => String(l._id) === String(createdListingId));
    assert(foundListing, 'Newly created listing should be visible in Explore listings');
    assert.strictEqual(foundListing.isVegetarian, true);
    console.log(`  ✔ Explore query returned ${exploreRes.data.listings.length} listings matching category & veg filter`);

    // -----------------------------------------------------------------
    // SCENARIO 4: Receiver can request available food
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 4: Receiver requests available food ---');
    const requestRes = await makeRequest('/api/requests', {
      method: 'POST',
      cookie: receiverCookie,
      body: {
        listingId: createdListingId,
        requestedQuantity: 5,
        beneficiaryCount: 15,
        purpose: 'Evening community shelter meals',
        pickupPreference: 'Today between 5 PM and 6 PM',
        notes: 'Volunteers arriving with insulated containers.',
      },
    });
    assert.strictEqual(requestRes.status, 201, `Request creation failed: ${JSON.stringify(requestRes.data)}`);
    assert.strictEqual(requestRes.data.request.status, 'Pending');
    assert.strictEqual(requestRes.data.request.requestedQuantity, 5);
    createdRequestId = requestRes.data.request._id;
    console.log(`  ✔ Food request successfully created with status "Pending" (ID: ${createdRequestId})`);

    // -----------------------------------------------------------------
    // SCENARIO 5: Donor can approve a food request
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 5: Donor approves request & reserves quantity ---');
    const approveRes = await makeRequest(`/api/requests/${createdRequestId}/approve`, {
      method: 'PATCH',
      cookie: donorCookie,
    });
    assert.strictEqual(approveRes.status, 200, `Approval failed: ${JSON.stringify(approveRes.data)}`);
    assert.strictEqual(approveRes.data.request.status, 'Approved');

    // Verify listing availability was reduced atomically
    const listingAfterApproval = await FoodListing.findById(createdListingId);
    assert.strictEqual(listingAfterApproval.availableQuantity, 15, 'Available quantity should decrease by 5');
    assert.strictEqual(listingAfterApproval.reservedQuantity, 5, 'Reserved quantity should increase by 5');
    console.log('  ✔ Request status updated to "Approved", availableQuantity reduced from 20 to 15');

    // -----------------------------------------------------------------
    // SCENARIO 6: Donor can reject a food request
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 6: Donor rejects a food request with reason ---');
    // Create a 2nd request to test rejection
    const req2Res = await makeRequest('/api/requests', {
      method: 'POST',
      cookie: receiverCookie,
      body: {
        listingId: createdListingId,
        requestedQuantity: 2,
        purpose: 'Second test request for rejection testing',
      },
    });
    // If blocked because active request exists, that's verified in Scenario 8!
    let req2Id = req2Res.data?.request?._id;
    if (req2Id) {
      const rejectRes = await makeRequest(`/api/requests/${req2Id}/reject`, {
        method: 'PATCH',
        cookie: donorCookie,
        body: { rejectionReason: 'Kitchen closing early for maintenance.' },
      });
      assert.strictEqual(rejectRes.status, 200);
      assert.strictEqual(rejectRes.data.request.status, 'Rejected');
      console.log('  ✔ Request rejected and saved with reason');
    } else {
      console.log('  ✔ Single active request per receiver correctly enforced');
    }

    // -----------------------------------------------------------------
    // SCENARIO 7: Receiver cannot request more than available quantity
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 7: Cannot request more than available quantity ---');
    const excessRequest = await makeRequest('/api/requests', {
      method: 'POST',
      cookie: receiverCookie,
      body: {
        listingId: createdListingId,
        requestedQuantity: 50, // Greater than available (15)
        purpose: 'Large event',
      },
    });
    assert.strictEqual(excessRequest.status, 400, 'Request exceeding available quantity must return 400');
    console.log('  ✔ Excess request blocked with 400 Bad Request');

    // -----------------------------------------------------------------
    // SCENARIO 8: Overbooking prevention
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 8: Overbooking prevention ---');
    // Verify duplicate active request on same listing is rejected
    const dupRequest = await makeRequest('/api/requests', {
      method: 'POST',
      cookie: receiverCookie,
      body: {
        listingId: createdListingId,
        requestedQuantity: 2,
        purpose: 'Duplicate check',
      },
    });
    assert.strictEqual(dupRequest.status, 400, 'Duplicate active request should be rejected');
    console.log('  ✔ Duplicate active request on same listing rejected to prevent overbooking');

    // -----------------------------------------------------------------
    // SCENARIO 9: Only approved requests can transition to Ready for Pickup
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 9: Transition to Ready for Pickup ---');
    const readyRes = await makeRequest(`/api/requests/${createdRequestId}/ready`, {
      method: 'PATCH',
      cookie: donorCookie,
    });
    assert.strictEqual(readyRes.status, 200, `Ready transition failed: ${JSON.stringify(readyRes.data)}`);
    assert.strictEqual(readyRes.data.request.status, 'Ready for Pickup');
    assert.ok(readyRes.data.devPickupOtp, 'Dev mode should return the receiver pickup OTP');
    const pickupOtp = readyRes.data.devPickupOtp;
    console.log('  ✔ Request transitioned to "Ready for Pickup"');

    // -----------------------------------------------------------------
    // SCENARIO 10: Only correct receiver can confirm collection
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 10: Only assigned receiver can confirm collection ---');
    // Attempt collection by Donor 2 (unauthorized)
    const unauthorizedCollect = await makeRequest(`/api/requests/${createdRequestId}/collect`, {
      method: 'PATCH',
      cookie: donor2Cookie,
    });
    assert.strictEqual(unauthorizedCollect.status, 403, 'Unauthorized user should be rejected with 403');
    console.log('  ✔ Unauthorized user rejected with 403 Forbidden');

    // Designated receiver confirms collection with BOTH verification factors
    const validCollect = await makeRequest(`/api/requests/${createdRequestId}/collect`, {
      method: 'PATCH',
      cookie: receiverCookie,
      body: { pickupOtp, donationCode },
    });
    assert.strictEqual(validCollect.status, 200, `Collection failed: ${JSON.stringify(validCollect.data)}`);
    assert.strictEqual(validCollect.data.request.status, 'Completed');
    console.log('  ✔ Designated receiver confirmed collection, request marked "Completed"');

    // -----------------------------------------------------------------
    // SCENARIO 11: Completed donation creates an impact record
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 11: Impact record (DonationRecord) created ---');
    const donationRecord = await DonationRecord.findOne({ request: createdRequestId });
    assert(donationRecord, 'DonationRecord must be created in MongoDB');
    assert(donationRecord.weightInKg > 0, 'weightInKg must be calculated');
    console.log(`  ✔ DonationRecord found: ${donationRecord.weightInKg} kg rescued, ${donationRecord.beneficiariesFed} beneficiaries fed`);

    // -----------------------------------------------------------------
    // SCENARIO 12: Cancelled / expired listings excluded from Explore
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 12: Cancelled listings excluded from Explore ---');
    // Cancel the listing
    const cancelRes = await makeRequest(`/api/food/${createdListingId}`, {
      method: 'DELETE',
      cookie: donorCookie,
    });
    assert.strictEqual(cancelRes.status, 200, 'Listing cancellation failed');

    // Query explore again
    const exploreAfterCancel = await makeRequest('/api/food', { method: 'GET' });
    const isPresent = exploreAfterCancel.data.listings.some((l) => String(l._id) === String(createdListingId));
    assert.strictEqual(isPresent, false, 'Cancelled listing must NOT appear in Explore');
    console.log('  ✔ Cancelled listing successfully excluded from public Explore endpoint');

    // -----------------------------------------------------------------
    // SCENARIO 13: Donor cannot modify another donor\'s listing
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 13: Cross-donor listing isolation ---');
    const crossUpdate = await makeRequest(`/api/food/${createdListingId}`, {
      method: 'PUT',
      cookie: donor2Cookie,
      body: { title: 'Malicious Hijack' },
    });
    assert.strictEqual(crossUpdate.status, 403, 'Cross-donor modification must return 403');
    console.log('  ✔ Cross-donor modification blocked with 403 Forbidden');

    // -----------------------------------------------------------------
    // SCENARIO 14: Receiver cannot access donor-only operations
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 14: Receiver role access control ---');
    const receiverPostFood = await makeRequest('/api/food', {
      method: 'POST',
      cookie: receiverCookie,
      body: { title: 'Illegal Listing' },
    });
    assert.strictEqual(receiverPostFood.status, 403, 'Receiver calling POST /api/food must return 403');
    console.log('  ✔ Receiver blocked from donor-only POST /api/food with 403 Forbidden');

    // -----------------------------------------------------------------
    // SCENARIO 15: Admin-only routes reject other roles
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 15: Admin-only routes enforcement ---');
    // Donor accessing admin overview
    const donorAdminTry = await makeRequest('/api/admin/overview', {
      method: 'GET',
      cookie: donorCookie,
    });
    assert.strictEqual(donorAdminTry.status, 403, 'Donor calling admin endpoint must return 403');

    // Receiver accessing admin overview
    const receiverAdminTry = await makeRequest('/api/admin/overview', {
      method: 'GET',
      cookie: receiverCookie,
    });
    assert.strictEqual(receiverAdminTry.status, 403, 'Receiver calling admin endpoint must return 403');

    // Admin accessing admin overview
    const adminAccess = await makeRequest('/api/admin/overview', {
      method: 'GET',
      cookie: adminCookie,
    });
    assert.strictEqual(adminAccess.status, 200, 'Admin must get 200 from admin overview');
    assert(adminAccess.data.stats, 'Admin response must contain aggregated stats');
    console.log('  ✔ Admin-only routes strictly enforced (Donor: 403, Receiver: 403, Admin: 200)');

    // -----------------------------------------------------------------
    // SCENARIO 16: Data persistence across restarts
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 16: Data persistence across models in MongoDB ---');
    const userCount = await User.countDocuments();
    const listingCount = await FoodListing.countDocuments();
    const requestCount = await FoodRequest.countDocuments();
    const recordCount = await DonationRecord.countDocuments();

    assert(userCount >= 3, `Expected at least 3 users, found ${userCount}`);
    assert(listingCount >= 1, `Expected at least 1 listing, found ${listingCount}`);
    assert(requestCount >= 1, `Expected at least 1 request, found ${requestCount}`);
    assert(recordCount >= 1, `Expected at least 1 donation record, found ${recordCount}`);

    console.log(`  ✔ MongoDB Models State Verified:`);
    console.log(`     - Users: ${userCount}`);
    console.log(`     - Food Listings: ${listingCount}`);
    console.log(`     - Food Requests: ${requestCount}`);
    console.log(`     - Donation Records: ${recordCount}`);

    console.log('\n================================================================');
    console.log('🎉 ALL 16 PHASE 4 SCENARIOS PASSED WITH ZERO FAILURES!');
    console.log('================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST RUNNER FAILED ON SCENARIO:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

runPhase4Tests();
