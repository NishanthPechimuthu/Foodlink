# Deploying Food Link on Render — Step-by-Step Guide

This guide deploys the full stack to [Render](https://render.com):

| Service | Render type | What it hosts |
| --- | --- | --- |
| `foodlink-api` | Web Service (Node) | Express API, JWT auth, OTP, MongoDB, Cloudinary, Google OAuth |
| `foodlink-client` | Static Site | React + Vite frontend |

The recommended setup proxies `/api/*` from the static site to the API. This keeps the browser on a **single origin**, so the HttpOnly auth cookie works without cross-site cookie problems.

```
Browser
  │
  ├── https://foodlink-client.onrender.com  (Static Site / React)
  │        │
  │        └── /api/* rewrite ──► https://foodlink-api.onrender.com/api/*
  │
  └── https://foodlink-api.onrender.com  (Web Service / Express)
           ├── MongoDB Atlas
           ├── Cloudinary (images)
           ├── Brevo SMTP (email verification, password reset, donation codes)
           ├── Twilio (SMS OTP)
           └── Google Identity Services (OAuth)
```

> **Repository layout:** this project lives in the `C and S` folder of the repo. Render's **Root Directory** values below reflect that. If you later move the apps to the repo root, drop the `C and S/` prefix.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Prepare the repository](#2-prepare-the-repository)
3. [Create MongoDB Atlas](#3-create-mongodb-atlas)
4. [Optional: Cloudinary](#4-optional-cloudinary)
5. [Optional: Google OAuth](#5-optional-google-oauth)
6. [Optional: Brevo SMTP + Twilio SMS](#6-optional-brevo-smtp--twilio-sms)
7. [Deploy the backend Web Service](#7-deploy-the-backend-web-service)
8. [Deploy the frontend Static Site](#8-deploy-the-frontend-static-site)
9. [Connect the frontend to the API](#9-connect-the-frontend-to-the-api)
10. [Set the final CLIENT_URL](#10-set-the-final-client_url)
11. [Seed the admin account and demo data](#11-seed-the-admin-account-and-demo-data)
12. [Verify the deployment](#12-verify-the-deployment)
13. [Environment variable reference](#13-environment-variable-reference)
14. [Alternative: direct cross-origin setup](#14-alternative-direct-cross-origin-setup)
15. [Free tier notes](#15-free-tier-notes)
16. [Troubleshooting](#16-troubleshooting)
17. [Deployment checklist](#17-deployment-checklist)

---

## 1. Prerequisites

- A GitHub (or GitLab/Bitbucket) repository containing this project.
- A [Render account](https://dashboard.render.com/register).
- A [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register) (free M0 cluster is enough).
- Optional accounts:
  - [Cloudinary](https://cloudinary.com/) — persistent image uploads.
  - [Google Cloud Console](https://console.cloud.google.com/) — Google sign-in.
  - Brevo account with a verified sender/domain and an SMTP key — verification, password-reset and donation-code emails.
  - [Twilio](https://www.twilio.com/) — SMS OTP for donors and receivers.
- Node.js 18+ locally if you want to run the seed scripts (Node 22 recommended).

> **Without Cloudinary:** uploaded images are converted to base64 data URIs and stored inside MongoDB. This works for a demo but bloats documents. Configure Cloudinary for any real use.
>
> **Without Brevo SMTP or Twilio:** email/SMS falls back to development mode and codes are logged on the server (and shown in the relevant modal). This is convenient for a demo but **must not** be used for a public production launch.

---

## 2. Prepare the repository

1. Push the project to GitHub if it is not already there:

   ```bash
   cd "/path/to/Foodlink"
   git add .
   git commit -m "Prepare Food Link for Render deployment"
   git push origin main
   ```

2. Confirm the repo root contains the `C and S` folder:

   ```
   Foodlink/
   └── C and S/
       ├── client/
       ├── server/
       └── package.json
   ```

3. Make sure `.env` files are **not** committed. `.gitignore` already excludes `.env`.

---

## 3. Create MongoDB Atlas

1. Sign in to MongoDB Atlas and create a **free M0** cluster.
2. Create a database user:
   - **Database Access → Add New Database User**
   - Choose password authentication, set a strong username/password, and give it **Read and write to any database** (or scope it to the `foodlink` database).
3. Allow Render to connect:
   - **Network Access → Add IP Address**
   - Add `0.0.0.0/0` (allow from anywhere). Render does not provide a fixed outbound IP on the free plan.
4. Get the connection string:
   - **Database → Connect → Drivers**
   - Copy the `mongodb+srv://...` URI.
5. Build your final URI, including the database name:

   ```text
   mongodb+srv://foodlink_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/foodlink?retryWrites=true&w=majority
   ```

   - URL-encode special characters in the password (`@` → `%40`, `#` → `%23`, etc.).
   - Keep `foodlink` as the database name, or use your preferred name.
6. Test the URI locally (optional):

   ```bash
   cd "C and S/server"
   MONGODB_URI="mongodb+srv://..." npm run seed:admin
   ```

   If the admin is created, the connection works.

---

## 4. Optional: Cloudinary

1. Create a Cloudinary account and open the **Dashboard**.
2. Copy:
   - **Cloud name**
   - **API Key**
   - **API Secret**
3. Add these to the Render API service later:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

Images are uploaded to the `foodlink/listings` folder with automatic resizing and format optimization.

---

## 5. Optional: Google OAuth

1. Open **Google Cloud Console → APIs & Services → Credentials**.
2. Configure the **OAuth consent screen** (External is fine for testing).
3. Create an **OAuth client ID** with application type **Web application**.
4. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (local development)
   - `https://foodlink-client.onrender.com` (your Render static site URL — use the real one you get in step 8)
5. No redirect URI is required for the Google Identity Services ID-token flow used here.
6. Copy the **Client ID** and **Client Secret**:
   - Server: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - Client: `VITE_GOOGLE_CLIENT_ID` (same client ID)

> The client ID must be present **at build time** for the frontend. If you change `VITE_GOOGLE_CLIENT_ID`, trigger a new deploy of the static site.

---

## 6. Optional: Brevo SMTP + Twilio SMS

Email and SMS are optional for a local demo but **required** for a real launch.

### 6a. Brevo SMTP (transactional email)

Brevo is the only email provider. On Render Free, use **port 2525** because
Render blocks outbound SMTP ports 25, 465, and 587.

1. Create a [Brevo](https://www.brevo.com/) account.
2. Verify a sender address or authenticate your domain under **Senders,
   Domains & Dedicated IPs** in Brevo. Transactional email cannot send from an
   unverified sender.
3. Open **Settings → SMTP & API → SMTP**:
   - Generate an **SMTP key** (not an API key).
   - Copy the **SMTP login** shown there. It may be your Brevo account email or
     an automatically generated `[ID]@smtp-brevo.com` address.
4. Set on the API service:

   ```text
   BREVO_SMTP_HOST=smtp-relay.brevo.com
   BREVO_SMTP_PORT=2525
   BREVO_SMTP_SECURE=false
   BREVO_SMTP_USER=your_smtp_login
   BREVO_SMTP_PASS=your_smtp_key
   BREVO_FROM=Food Link <no-reply@yourdomain.com>
   EMAIL_DEV_MODE=false
   ```

   > - Port `2525` uses STARTTLS and is not blocked by Render Free.
   > - Use `587` (STARTTLS) outside Render Free, or `465` with
   >   `BREVO_SMTP_SECURE=true` for implicit TLS.
   > - `BREVO_SMTP_PASS` must be the **SMTP key**, not a Brevo API key.
   > - `BREVO_FROM` must be a sender address or domain verified in Brevo.
   > - Confirm the deployed configuration in the Render logs:
   >
   >   ```text
   >   [Email Service] brevo-smtp | host=smtp-relay.brevo.com:2525 secure=false ...
   >   ```
   >
   > - Diagnose the server-side configuration with:
   >
   >   ```bash
   >   cd "C and S/server"
   >   npm run test:email -- your-address@example.com
   >   ```
   >
   >   The command prints the effective host/port/credentials status (passwords
   >   masked) and the exact SMTP error.

Email is used for:

- **Signup email verification** — 6-digit code. Login is blocked until the code is entered (`403 EMAIL_NOT_VERIFIED`).
- **Forgot password** — themed reset link to `/reset-password?token=...`.
- **Donation handover codes** — sent to the donor when a listing is published or a code is regenerated.
- **Pickup code fallback** — the receiver's collection code is also emailed, in case SMS delivery is delayed.

### 6b. Twilio (SMS OTP)

1. Create a [Twilio](https://www.twilio.com/) account.
2. Buy or provision an SMS-capable phone number (or create a Messaging Service).
3. Copy the **Account SID** and **Auth Token** from the Twilio Console dashboard.
4. Set on the API service:

   ```text
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   # Or, instead of TWILIO_PHONE_NUMBER:
   TWILIO_MESSAGING_SERVICE_SID=MG...
   SMS_DEV_MODE=false
   OTP_DEV_MODE=false
   ```

   > For Indian numbers, enable the **India SMS** geo-permission on the Twilio number and complete any DLT/regulatory requirements Twilio shows. Numbers are normalised to E.164 (`9876543210` → `+919876543210`).

### 6c. How two-party collection verification works

1. The donor submits a listing and confirms an SMS OTP. The server:
   - publishes the listing,
   - generates a unique **6-digit donation handover code** (stored hashed),
   - shows it once in the modal and emails it to the donor.
2. A receiver requests the food. The donor approves, then taps **Mark Ready for Pickup**. The server:
   - generates a unique **6-digit pickup code** for the receiver,
   - sends it by SMS (email fallback),
   - includes it in dev-mode API responses for local testing.
3. At handover the receiver opens **Confirm Collection** and enters **both**:
   - their pickup code (proves they are the assigned receiver), and
   - the donor's handover code (proves the donor released the food).
4. Only when both match does the API mark the request **Completed**, create the `DonationRecord`, and update the impact dashboard. Wrong codes are rate-limited (5 donation-code attempts per request).

> Lost a donor code? The donor can open **Donor Dashboard → Show donation code** to generate a new one. The old code stops working immediately, and the new code is emailed.
>
> If email or SMS credentials are missing, set `EMAIL_DEV_MODE=true`, `SMS_DEV_MODE=true`, and `OTP_DEV_MODE=true` for a demo. Codes are then returned to the browser/console instead of being sent.

---

## 7. Deploy the backend Web Service

1. In the Render Dashboard, click **New → Web Service**.
2. Connect your Git provider and select the repository.
3. Fill in:

   | Field | Value |
   | --- | --- |
   | **Name** | `foodlink-api` (or any unique name) |
   | **Region** | Closest to your users (e.g. Singapore / Frankfurt / Oregon) |
   | **Branch** | `main` |
   | **Root Directory** | `C and S/server` |
   | **Runtime** | Node |
   | **Build Command** | `npm ci` |
   | **Start Command** | `npm start` |
   | **Health Check Path** | `/api/health` |
   | **Instance Type** | Free (for a demo) or Starter |

4. Add environment variables under **Advanced → Environment Variables**:

   ```text
   NODE_ENV=production
   NODE_VERSION=22

   # Set this after the static site exists (step 10). No trailing slash.
   CLIENT_URL=https://foodlink-client.onrender.com

   MONGODB_URI=mongodb+srv://...

   JWT_SECRET=<long random string, 32+ chars>
   JWT_EXPIRES_IN=7d
   COOKIE_SECRET=<another long random string>

   # Optional integrations
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...

   # Brevo SMTP email
   BREVO_SMTP_HOST=smtp-relay.brevo.com
   BREVO_SMTP_PORT=2525
   BREVO_SMTP_SECURE=false
   BREVO_SMTP_USER=your_smtp_login
   BREVO_SMTP_PASS=your_smtp_key
   BREVO_FROM=Food Link <no-reply@yourdomain.com>
   EMAIL_DEV_MODE=false

   # Twilio SMS
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   # TWILIO_MESSAGING_SERVICE_SID=MG...
   SMS_DEV_MODE=false
   OTP_DEV_MODE=false

   # Used only by seed scripts
   ADMIN_EMAIL=admin@foodlink.org
   ADMIN_PASSWORD=<strong admin password>
   ADMIN_NAME=Food Link Administrator
   ADMIN_PHONE=+91 99999 88888
   ```

   > Do **not** set `PORT`. Render injects it automatically and the server reads `process.env.PORT`.

5. Click **Create Web Service** and wait for the first deploy.
6. Copy the service URL, e.g.:

   ```text
   https://foodlink-api.onrender.com
   ```

7. Test the health endpoint:

   ```bash
   curl https://foodlink-api.onrender.com/api/health
   ```

   Expected response includes:

   ```json
   {
     "status": "healthy",
     "application": "Food Link API",
     "database": { "state": "Connected", "isConnected": true }
   }
   ```

   If `database.isConnected` is `false`, fix `MONGODB_URI` / Atlas network access before continuing.

---

## 8. Deploy the frontend Static Site

1. In Render, click **New → Static Site**.
2. Connect the same repository.
3. Fill in:

   | Field | Value |
   | --- | --- |
   | **Name** | `foodlink-client` (or any unique name) |
   | **Branch** | `main` |
   | **Root Directory** | `C and S/client` |
   | **Build Command** | `npm ci && npm run build` |
   | **Publish Directory** | `dist` |

4. Add environment variables:

   ```text
   VITE_API_BASE_URL=/api
   VITE_GOOGLE_CLIENT_ID=<your Google client ID, if using Google sign-in>
   NODE_VERSION=22
   ```

   > `VITE_API_BASE_URL=/api` intentionally keeps API calls relative so the rewrite in step 9 handles them. `VITE_*` values are baked in at build time — changing one requires a redeploy.

5. Click **Create Static Site** and wait for the build.
6. Copy the site URL, e.g.:

   ```text
   https://foodlink-client.onrender.com
   ```

---

## 9. Connect the frontend to the API

On the **Static Site → Settings → Redirects/Rewrites** page, add **two rewrite rules in this order**:

| # | Action | Source | Destination |
| --- | --- | --- | --- |
| 1 | Rewrite | `/api/*` | `https://foodlink-api.onrender.com/api/*` |
| 2 | Rewrite | `/*` | `/index.html` |

Why the order matters:

- `/api/*` must be matched first so API calls are proxied to the backend.
- `/*` → `/index.html` is the SPA fallback so React Router routes such as `/explore`, `/impact`, and `/donor/dashboard` work on refresh.
- Render serves real files first, so JS/CSS/image assets still load normally.

Replace `foodlink-api.onrender.com` with your actual API URL if the service name is different.

Test the proxy from a terminal:

```bash
curl https://foodlink-client.onrender.com/api/health
```

It should return the same JSON as the API health check. If it returns the React `index.html`, the `/api/*` rewrite is missing or ordered incorrectly.

---

## 10. Set the final CLIENT_URL

The API only allows one production browser origin (`CLIENT_URL`). Set it to the **exact** static site URL:

```text
CLIENT_URL=https://foodlink-client.onrender.com
```

Rules:

- Use `https://`.
- No trailing slash.
- No wildcard.
- Must match the address shown in the browser exactly.

After changing any API environment variable, click **Manual Deploy → Deploy latest commit** (or **Save and redeploy**) so the service restarts with the new value.

---

## 11. Seed the admin account and demo data

### 11a. Create the admin account

**Option A — Render Shell (if available on your plan):**

1. Open the API service in Render.
2. Click **Shell**.
3. Run:

   ```bash
   npm run seed:admin
   ```

   If the shell opens at the repo root instead of the service root:

   ```bash
   cd "C and S/server"
   npm run seed:admin
   ```

The script uses `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and `ADMIN_PHONE` from the API environment. If the email already exists, it elevates that user to `Admin`.

**Option B — Run locally against Atlas:**

```bash
cd "C and S/server"
MONGODB_URI="mongodb+srv://..." \
ADMIN_EMAIL="admin@foodlink.org" \
ADMIN_PASSWORD="YourStrongPassword" \
ADMIN_NAME="Food Link Administrator" \
ADMIN_PHONE="+91 99999 88888" \
npm run seed:admin
```

On Windows PowerShell:

```powershell
cd "C and S\server"
$env:MONGODB_URI="mongodb+srv://..."
$env:ADMIN_EMAIL="admin@foodlink.org"
$env:ADMIN_PASSWORD="YourStrongPassword"
npm run seed:admin
```

**Option C — Temporary start command (free plan without Shell):**

1. Change the API **Start Command** to:

   ```bash
   npm run seed:admin && npm start
   ```

2. Deploy once.
3. Revert the start command to `npm start` and deploy again.

### 11b. Optional demo data

This creates a demo donor, demo receiver, sample listings, requests, impact records, and notifications:

```bash
npm run seed:food
```

Demo credentials created by the seed:

| Role | Email | Password |
| --- | --- | --- |
| Donor | `donor@foodlink.org` | `DonorPassword@123` |
| Receiver | `receiver@foodlink.org` | `ReceiverPassword@123` |

> The seed deletes and recreates the demo donor's listings and requests. Do not run it against production data you want to keep.

---

## 12. Verify the deployment

Run through this flow on the live site:

1. **Home page** loads and the backend health pill shows connected (if present).
2. **Register** a Donor account.
   - A themed verification email should arrive. Enter the 6-digit code in the modal.
   - Without Brevo SMTP (`EMAIL_DEV_MODE=true`), the code is shown in the modal / API response.
3. **Log out** and log back in — the session should persist. Logging in before verification returns `EMAIL_NOT_VERIFIED` and prompts for a fresh code.
4. **Donor dashboard → Add Food Listing**:
   - Fill the form and submit.
   - Confirm the SMS OTP. Without Twilio, dev-mode returns the OTP in the modal.
   - **Save the donation handover code** shown after publishing (also emailed).
   - The listing appears in **Explore Food**.
5. **Register a Receiver** in a second browser/incognito window (verify their email too).
6. **Explore Food → request** part of the listing.
7. **Donor dashboard → Incoming Requests → Approve**, then **Mark Ready for Pickup**. The receiver should get an SMS pickup code.
8. **Receiver dashboard → Ready for Pickup → Confirm Collection**, then enter **both**:
   - the pickup code from their SMS, and
   - the donor's handover code (read out at handover).
9. **Impact page** should now include the completed rescue. The request is only marked `Completed` after both codes pass.
10. **Admin login** with the seeded admin account:
    - Overview metrics load.
    - Users, listings, and requests tabs load.
    - Suspending/reactivating a test user works.
11. Check the **notification bell** for new-request and status-update notifications.
12. Test **Forgot password**: the themed email should contain a link to `/reset-password?token=...`.

Also check the browser console/network tab for CORS or 401 errors.

---

## 13. Environment variable reference

### API Web Service

| Variable | Required | Example / Notes |
| --- | --- | --- |
| `NODE_ENV` | Yes | `production` |
| `PORT` | No | Set automatically by Render |
| `CLIENT_URL` | Yes | `https://foodlink-client.onrender.com` (exact origin, no slash) |
| `MONGODB_URI` | Yes | Atlas SRV connection string |
| `JWT_SECRET` | Yes | Long random secret; do not use the dev fallback |
| `JWT_EXPIRES_IN` | No | `7d` |
| `COOKIE_SECRET` | Yes | Long random secret |
| `GOOGLE_CLIENT_ID` | Optional | Required for real Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Optional | Stored for completeness; the current ID-token flow does not require it |
| `CLOUDINARY_CLOUD_NAME` | Optional | Enables persistent image uploads |
| `CLOUDINARY_API_KEY` | Optional | |
| `CLOUDINARY_API_SECRET` | Optional | |
| `BREVO_SMTP_HOST` | Optional | `smtp-relay.brevo.com` |
| `BREVO_SMTP_PORT` | Optional | `2525` on Render Free; `587` STARTTLS elsewhere |
| `BREVO_SMTP_SECURE` | Optional | `false` for 2525/587; `true` for 465 |
| `BREVO_SMTP_USER` | Optional | Brevo SMTP login; required for real email |
| `BREVO_SMTP_PASS` | Optional | Brevo SMTP key (not an API key) |
| `BREVO_FROM` | Optional | Verified Brevo sender, e.g. `Food Link <no-reply@yourdomain.com>` |
| `EMAIL_DEV_MODE` | No | `true` logs emails to the server console |
| `TWILIO_ACCOUNT_SID` | Optional | Required for real SMS OTP |
| `TWILIO_AUTH_TOKEN` | Optional | |
| `TWILIO_PHONE_NUMBER` | Optional | E.164 sender, e.g. `+12025550123` |
| `TWILIO_MESSAGING_SERVICE_SID` | Optional | Alternative to `TWILIO_PHONE_NUMBER` |
| `SMS_DEV_MODE` | No | `true` logs SMS to the server console |
| `OTP_DEV_MODE` | No | `true` to return OTP codes in API responses; `false` in production |
| `OTP_EXPIRY_MINUTES` | No | Declared but currently hardcoded to 5 minutes |
| `OTP_RESEND_COOLDOWN_SECONDS` | No | Declared but currently hardcoded to 60 seconds |
| `ADMIN_EMAIL` | Seed only | Admin login email |
| `ADMIN_PASSWORD` | Seed only | Admin login password |
| `ADMIN_NAME` | Seed only | Display name |
| `ADMIN_PHONE` | Seed only | Contact phone |
| `NODE_VERSION` | No | `22` (recommended) |

### Static Site

| Variable | Required | Example / Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | `/api` when using the rewrite setup |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Same client ID as the API |
| `NODE_VERSION` | No | `22` |

---

## 14. Alternative: direct cross-origin setup

If you do **not** want to configure the `/api/*` rewrite, point the frontend directly at the API:

1. Set the static site variable:

   ```text
   VITE_API_BASE_URL=https://foodlink-api.onrender.com/api
   ```

2. Redeploy the static site (Vite variables are build-time).
3. Keep `CLIENT_URL=https://foodlink-client.onrender.com` on the API.

Login still works because the API returns a JWT that the client stores in `sessionStorage` and sends as `Authorization: Bearer <token>`. However, the `token` cookie is `SameSite=Strict` in production, so browsers may block it across sites. Consequences:

- The current tab stays logged in via the Bearer token.
- A new tab may require signing in again.
- Third-party cookie blocking in some browsers can prevent cookie-based session restoration.

**Recommendation:** use the `/api/*` rewrite from step 9. It keeps everything same-origin and the HttpOnly cookie works as designed.

---

## 15. Free tier notes

- **Web Service cold starts:** free instances spin down after inactivity. The first request can take ~30–60 seconds. This is normal on Render's free plan.
- **Static Sites** are free with global CDN and automatic HTTPS.
- **MongoDB Atlas M0** is free but has storage/connection limits.
- **Cloudinary**, **Twilio**, and **Brevo** have free tiers with their own quotas. Brevo has daily sending limits.
- **Render Shell** availability depends on your plan. Use the local seeding option if the shell is unavailable.
- Free web services may restart during deploys; no data is stored on the local filesystem, so this is safe.

---

## 16. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Blocked by CORS policy` in the browser | `CLIENT_URL` does not exactly match the browser origin | Set `CLIENT_URL` to the exact `https://...onrender.com` URL, no trailing slash, then redeploy the API |
| `/api/...` returns the React HTML page | Missing or misordered static rewrite | Add `/api/* → https://api.../api/*` **before** `/* → /index.html` |
| 404 on refresh at `/explore` or `/donor/dashboard` | SPA fallback missing | Add the `/* → /index.html` rewrite |
| API returns `503 Database service is currently connecting` | MongoDB not connected | Check `MONGODB_URI`, Atlas user password, and Atlas IP allowlist (`0.0.0.0/0`) |
| `database.isConnected: false` on `/api/health` | Same as above | Fix Atlas connectivity; check Render logs |
| Login succeeds but requests return 401 | Cookie blocked / CORS origin mismatch | Use the rewrite setup and verify `CLIENT_URL`; check `withCredentials` and HTTPS |
| Images disappear after redeploy / Mongo documents are huge | Cloudinary not configured; images stored as base64 data URIs | Set `CLOUDINARY_*` variables |
| OTP never arrives | Twilio not configured, wrong number, or geo-permissions/DLT missing | Configure `TWILIO_*`, use E.164 numbers, or set `OTP_DEV_MODE=true` for a demo |
| Verification/reset email never arrives | **Render Free blocks SMTP ports 25/465/587**, or the Brevo SMTP login/key is wrong, or `BREVO_FROM` is unverified | Set `BREVO_SMTP_PORT=2525`, use the **SMTP key** (not an API key), verify `BREVO_FROM` in Brevo, and run `npm run test:email -- you@example.com`; check Render logs |
| Login returns `EMAIL_NOT_VERIFIED` | Account email has not been confirmed | Enter the 6-digit email code, or use **Resend code** in the modal |
| "Incorrect donor handover code" at collection | Wrong code, or the donor regenerated it | Ask the donor to read the current code from their dashboard / email |
| "No handover code yet" on old listings | Listing predates handover codes | Donor taps **Show donation code** once; the code is then generated and emailed |
| Google button does not initialize | `VITE_GOOGLE_CLIENT_ID` missing at build time or origin not authorized | Set the variable and redeploy the static site; add the client URL to Google authorized origins |
| Build fails at `vite: not found` | Wrong root directory or dependencies not installed | Confirm Root Directory is `C and S/client`; use `npm ci && npm run build` |
| Build fails because of the space in `C and S` | Some tooling handles spaces poorly | Rename the folder to `c-and-s` (and update paths) or move `client`/`server` to the repo root |
| Admin seed says it cannot connect | Seed run without env vars / wrong working directory | Run from `C and S/server`, or pass `MONGODB_URI` inline |
| Free API takes ~1 minute to wake up | Free instance spin-down | Expected; upgrade to a paid instance for always-on behavior |

Useful log locations:

- **API:** Render Dashboard → `foodlink-api` → **Logs**.
- **Static build:** Render Dashboard → `foodlink-client` → **Events / Logs**.

---

## 17. Deployment checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created, user created, `0.0.0.0/0` allowed
- [ ] API Web Service created with root `C and S/server`
- [ ] API build `npm ci`, start `npm start`, health check `/api/health`
- [ ] All required API environment variables set
- [ ] `/api/health` returns `database.isConnected: true`
- [ ] Static Site created with root `C and S/client`
- [ ] Static build `npm ci && npm run build`, publish `dist`
- [ ] `VITE_API_BASE_URL=/api` set
- [ ] Static rewrites: `/api/*` → API URL, then `/*` → `/index.html`
- [ ] `CLIENT_URL` set to the exact static site URL
- [ ] Admin account seeded
- [ ] Optional demo data seeded
- [ ] Brevo SMTP credentials set (`BREVO_SMTP_USER`, `BREVO_SMTP_PASS`, `BREVO_FROM`), `BREVO_SMTP_PORT=2525`, `EMAIL_DEV_MODE=false`
- [ ] `TWILIO_*` credentials set (`SMS_DEV_MODE=false`, `OTP_DEV_MODE=false`)
- [ ] Register/login tested (email verification blocks login until confirmed)
- [ ] Forgot-password email + `/reset-password` link tested
- [ ] Listing + SMS OTP publish + handover code tested
- [ ] Two-party collection tested (pickup SMS code + donor handover code)
- [ ] Impact page updates after collection
- [ ] Admin dashboard tested
- [ ] Google OAuth tested (if configured)
- [ ] Image upload tested (Cloudinary or inline fallback)

---

## Related documentation

- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) — full project architecture, features, data models, API reference, and local setup.
- [README.md](./README.md) — quick project overview.
