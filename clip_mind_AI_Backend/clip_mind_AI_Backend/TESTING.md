# ClipMind AI — Project Testing Guide

This guide verifies every layer of the stack: infrastructure, backend APIs,
authentication/authorization, Celery worker, and the React frontend.

Work through the sections in order — each section assumes the previous one passed.

---

## Table of Contents

1. [Infrastructure Checks](#1-infrastructure-checks)
2. [Django Backend Startup](#2-django-backend-startup)
3. [Authentication API Tests](#3-authentication-api-tests)
4. [Authorization / JWT Tests](#4-authorization--jwt-tests)
5. [Token Rotation & Refresh Tests](#5-token-rotation--refresh-tests)
6. [Celery Worker Tests](#6-celery-worker-tests)
7. [Frontend UI Tests](#7-frontend-ui-tests)
8. [Error & Edge-Case Tests](#8-error--edge-case-tests)
9. [Quick Smoke-Test Checklist](#9-quick-smoke-test-checklist)

---

## 1. Infrastructure Checks

### 1.1 Memurai (Redis-compatible broker)

```powershell
memurai-cli ping
```

**Expected:** `PONG`

```powershell
# Verify both Celery DB (0) and Cache DB (1) are reachable
memurai-cli -n 0 ping
memurai-cli -n 1 ping
```

**Expected:** `PONG` for both.

---

### 1.2 PostgreSQL

```powershell
# Windows: check the service is running
Get-Service -Name postgresql*
```

**Expected:** `Status = Running`

```powershell
# Verify the clipmind_ai database exists
psql -U postgres -c "\l" | Select-String clipmind_ai
```

**Expected:** `clipmind_ai` listed.

---

### 1.3 Django migrations are applied

```powershell
cd "c:\Users\khand\OneDrive\Desktop\clip_mind_AI_Backend"
.\venv\Scripts\python.exe manage.py showmigrations accounts
```

**Expected:** All migrations marked `[X]` (no `[ ]` remaining).

If any migration is unapplied:

```powershell
.\venv\Scripts\python.exe manage.py migrate
```

---

## 2. Django Backend Startup

### 2.1 Start the server

Open **Terminal 1**:

```powershell
cd "c:\Users\khand\OneDrive\Desktop\clip_mind_AI_Backend"
.\venv\Scripts\python.exe manage.py runserver
```

**Expected output:**

```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

---

### 2.2 Verify the Swagger docs load

Open in browser: **http://localhost:8000/api/docs/**

**Expected:** Swagger UI loads and lists the `Authentication` tag with all 8 endpoints.

---

### 2.3 Django admin

Open in browser: **http://localhost:8000/admin/**

**Expected:** Django login page loads.

Create a superuser (first time only):

```powershell
.\venv\Scripts\python.exe manage.py createsuperuser
```

Follow the prompts and verify you can log in to the admin panel.

---

## 3. Authentication API Tests

All tests below use `curl`. Run them from any PowerShell terminal while the
Django server is running.

> **Tip:** You can also run every test directly in the Swagger UI at
> **http://localhost:8000/api/docs/**

---

### 3.1 Register a new user

```powershell
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirm_password": "TestPass123!"
  }'
```

**Expected response (`201`):**

```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "id": "<uuid>",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "full_name": "Test User",
    "role": "user",
    "profile_image": null,
    "is_verified": false,
    "created_at": "<timestamp>"
  }
}
```

---

### 3.2 Register with duplicate email (should fail)

```powershell
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "first_name": "Duplicate",
    "last_name": "User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirm_password": "TestPass123!"
  }'
```

**Expected response (`400`):**

```json
{
  "success": false,
  "message": "Registration failed.",
  "errors": { "email": ["Email already registered."] }
}
```

---

### 3.3 Register with mismatched passwords (should fail)

```powershell
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "first_name": "Test",
    "email": "new@example.com",
    "password": "TestPass123!",
    "confirm_password": "WrongPass999"
  }'
```

**Expected response (`400`):** `confirm_password: Passwords do not match.`

---

### 3.4 Login

```powershell
curl -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email": "test@example.com", "password": "TestPass123!"}'
```

**Expected response (`200`):**

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": { "id": "...", "email": "test@example.com", ... },
    "tokens": {
      "access": "<JWT_ACCESS_TOKEN>",
      "refresh": "<JWT_REFRESH_TOKEN>"
    }
  }
}
```

**Save both tokens** — they are needed for the tests below.

```powershell
# PowerShell convenience: parse tokens from response
$login = curl -s -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"TestPass123!"}' | ConvertFrom-Json

$ACCESS  = $login.data.tokens.access
$REFRESH = $login.data.tokens.refresh

Write-Host "Access : $ACCESS"
Write-Host "Refresh: $REFRESH"
```

---

### 3.5 Login with wrong password (should fail)

```powershell
curl -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email": "test@example.com", "password": "WrongPassword"}'
```

**Expected response (`401 Unauthorized`):** `Invalid email or password.`

---

### 3.6 Get own profile (requires auth)

```powershell
curl -X GET http://localhost:8000/api/v1/auth/profile `
  -H "Authorization: Bearer $ACCESS"
```

**Expected response (`200`):**

```json
{
  "success": true,
  "message": "Profile retrieved.",
  "data": { "id": "...", "email": "test@example.com", "full_name": "Test User", ... }
}
```

---

### 3.7 Update profile (PATCH)

```powershell
curl -X PATCH http://localhost:8000/api/v1/auth/profile `
  -H "Authorization: Bearer $ACCESS" `
  -H "Content-Type: application/json" `
  -d '{"first_name": "Updated"}'
```

**Expected response (`200`):** Profile returned with `first_name: "Updated"`.

---

### 3.8 Change password (while logged in)

```powershell
curl -X POST http://localhost:8000/api/v1/auth/change-password `
  -H "Authorization: Bearer $ACCESS" `
  -H "Content-Type: application/json" `
  -d '{
    "old_password": "TestPass123!",
    "new_password": "NewPass456!",
    "confirm_password": "NewPass456!"
  }'
```

**Expected response (`200`):** `Password changed successfully.`

Change it back so the other tests keep working:

```powershell
curl -X POST http://localhost:8000/api/v1/auth/change-password `
  -H "Authorization: Bearer $ACCESS" `
  -H "Content-Type: application/json" `
  -d '{
    "old_password": "NewPass456!",
    "new_password": "TestPass123!",
    "confirm_password": "TestPass123!"
  }'
```

---

### 3.9 Forgot password (request a reset token)

```powershell
curl -X POST http://localhost:8000/api/v1/auth/forgot-password `
  -H "Content-Type: application/json" `
  -d '{"email": "test@example.com"}'
```

**Expected response (`200`):**

```json
{
  "success": true,
  "message": "If this email is registered, a password reset link has been sent."
}
```

> **Note:** Email sending is not yet wired up. Retrieve the token directly
> from Memurai (DB 1) for testing:
>
> ```powershell
> memurai-cli -n 1 KEYS "pwd_reset:*"
> # Copy the key suffix — that is the raw token
> ```

---

### 3.10 Reset password (using the token from Memurai)

Replace `<TOKEN>` with the value retrieved from Memurai in step 3.9:

```powershell
curl -X POST http://localhost:8000/api/v1/auth/reset-password `
  -H "Content-Type: application/json" `
  -d '{
    "token": "<TOKEN>",
    "password": "ResetPass789!",
    "confirm_password": "ResetPass789!"
  }'
```

**Expected response (`200`):** `Password has been reset successfully.`

Reset back to the original password:

```powershell
# Login with new password first
$login2 = curl -s -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"ResetPass789!"}' | ConvertFrom-Json
$ACCESS2 = $login2.data.tokens.access

curl -X POST http://localhost:8000/api/v1/auth/change-password `
  -H "Authorization: Bearer $ACCESS2" `
  -H "Content-Type: application/json" `
  -d '{"old_password":"ResetPass789!","new_password":"TestPass123!","confirm_password":"TestPass123!"}'
```

---

### 3.11 Logout (blacklist refresh token)

```powershell
curl -X POST http://localhost:8000/api/v1/auth/logout `
  -H "Authorization: Bearer $ACCESS" `
  -H "Content-Type: application/json" `
  -d "{\"refresh\": \"$REFRESH\"}"
```

**Expected response (`200`):** `Logged out successfully.`

---

## 4. Authorization / JWT Tests

### 4.1 Access a protected endpoint without a token (should fail)

```powershell
curl -X GET http://localhost:8000/api/v1/auth/profile
```

**Expected response (`401`):** `Authentication credentials were not provided.`

---

### 4.2 Access a protected endpoint with an invalid token (should fail)

```powershell
curl -X GET http://localhost:8000/api/v1/auth/profile `
  -H "Authorization: Bearer this.is.invalid"
```

**Expected response (`401`):** `Given token not valid for any token type.`

---

### 4.3 Use a blacklisted refresh token after logout (should fail)

After running the logout in step 3.11, try to use the same `$REFRESH` token:

```powershell
curl -X POST http://localhost:8000/api/v1/auth/refresh `
  -H "Content-Type: application/json" `
  -d "{\"refresh\": \"$REFRESH\"}"
```

**Expected response (`401`):** `Token is blacklisted.` or `Invalid or expired refresh token.`

---

## 5. Token Rotation & Refresh Tests

Log in fresh to get new tokens:

```powershell
$login = curl -s -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"TestPass123!"}' | ConvertFrom-Json
$ACCESS  = $login.data.tokens.access
$REFRESH = $login.data.tokens.refresh
```

### 5.1 Refresh the access token

```powershell
curl -X POST http://localhost:8000/api/v1/auth/refresh `
  -H "Content-Type: application/json" `
  -d "{\"refresh\": \"$REFRESH\"}"
```

**Expected response (`200`):**

```json
{
  "success": true,
  "message": "Token refreshed.",
  "data": {
    "access": "<NEW_ACCESS_TOKEN>",
    "refresh": "<NEW_REFRESH_TOKEN>"
  }
}
```

> Because `ROTATE_REFRESH_TOKENS = True` and `BLACKLIST_AFTER_ROTATION = True`
> are set in `SIMPLE_JWT`, each refresh call returns a brand-new refresh token
> and invalidates the old one.

### 5.2 Confirm the old refresh token is now blacklisted

```powershell
curl -X POST http://localhost:8000/api/v1/auth/refresh `
  -H "Content-Type: application/json" `
  -d "{\"refresh\": \"$REFRESH\"}"
```

**Expected response (`401`):** Token is blacklisted / invalid.

---

## 6. Celery Worker Tests

### 6.1 Start the Celery worker

Open **Terminal 2**:

```powershell
cd "c:\Users\khand\OneDrive\Desktop\clip_mind_AI_Backend"
.\venv\Scripts\celery.exe -A config worker --pool=solo -l info
```

**Expected startup output (key lines):**

```
[config] .> transport:   redis://localhost:6379/0
[config] .> results:     redis://localhost:6379/0
[tasks]
  . config.celery.debug_task
celery@<hostname> ready.
```

---

### 6.2 Run the built-in debug task

With the worker running, open a **new PowerShell tab** and run:

```powershell
cd "c:\Users\khand\OneDrive\Desktop\clip_mind_AI_Backend"
$env:DJANGO_SETTINGS_MODULE = "config.settings"
.\venv\Scripts\python.exe -c "
from config.celery import debug_task
result = debug_task.delay()
print('Task ID:', result.id)
import time; time.sleep(2)
print('State:', result.state)
"
```

**Expected output:**

```
Task ID: <uuid>
State: SUCCESS
```

**In the Celery terminal you should see:**

```
[INFO/MainProcess] Task config.celery.debug_task[<uuid>] received
Celery debug task | request=...
[INFO/MainProcess] Task config.celery.debug_task[<uuid>] succeeded
```

---

### 6.3 Verify task result is stored in Memurai

```powershell
memurai-cli -n 0 KEYS "celery-task-meta-*" | Select-Object -First 3
```

**Expected:** One or more `celery-task-meta-<uuid>` keys listed.

---

### 6.4 Verify Memurai cache is working (password reset tokens)

```powershell
# Trigger a forgot-password to write to cache DB 1
curl -s -X POST http://localhost:8000/api/v1/auth/forgot-password `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com"}' | Out-Null

# Check DB 1 for the reset token
memurai-cli -n 1 KEYS "pwd_reset:*"
```

**Expected:** At least one `pwd_reset:<token>` key listed.

---

## 7. Frontend UI Tests

Start the frontend dev server in **Terminal 3**:

```powershell
cd "c:\Users\khand\OneDrive\Desktop\clip_mind_AI"
npm run dev
```

Open **http://localhost:5173** in your browser.

---

### 7.1 Home page loads

- **URL:** `http://localhost:5173/`
- **Expected:** Home page with Hero, Features, HowItWorks sections visible.

---

### 7.2 Register flow

1. Click **Register** or navigate to `http://localhost:5173/register`
2. Fill in **First Name**, **Email**, **Password**, **Confirm Password**
3. Click **Register**
4. **Expected:** Redirect to `/login` (no errors, no alert dialogs)

---

### 7.3 Login flow

1. Navigate to `http://localhost:5173/login`
2. Enter the email and password used in step 7.2
3. Click **Login**
4. **Expected:** Redirect to `/dashboard`
5. Dashboard shows **"Welcome Back, \<your first name\> 👋"**
6. Top navbar shows your name and role

---

### 7.4 Protected route redirect (not logged in)

1. Open a new **incognito/private** browser window
2. Navigate directly to `http://localhost:5173/dashboard`
3. **Expected:** Immediately redirected to `/login` (no flash of dashboard content)

---

### 7.5 Session persistence after page refresh

1. Log in (step 7.3)
2. Hard-refresh the browser (`Ctrl+Shift+R`)
3. **Expected:** Dashboard remains visible — user is NOT logged out.
   (The AuthContext restores the session using the stored tokens.)

---

### 7.6 Logout flow

1. While logged in, click the **Logout** button in the top navbar
2. **Expected:**
   - Redirected to `/login`
   - `localStorage` no longer contains `access_token` or `refresh_token`
   - Navigating to `/dashboard` redirects back to `/login`

Verify tokens are cleared:

```javascript
// In the browser DevTools console while on the login page:
console.log(localStorage.getItem("access_token"));   // null
console.log(localStorage.getItem("refresh_token"));  // null
```

---

### 7.7 Forgot password flow

1. Navigate to `http://localhost:5173/forgot-password`
2. Enter `test@example.com`
3. Click **Send Reset Link**
4. **Expected:** Success state with "Check your email" message — no redirect to reset page

---

### 7.8 Reset password flow (with token from Memurai)

1. Get the token from Memurai: `memurai-cli -n 1 KEYS "pwd_reset:*"`  
   The key format is `pwd_reset:<TOKEN>` — copy everything after `pwd_reset:`
2. Navigate to: `http://localhost:5173/reset-password?token=<TOKEN>`
3. Enter a new password and confirm it
4. Click **Reset Password**
5. **Expected:** Redirected to `/login`
6. Log in with the new password — it should work

---

### 7.9 Login with wrong password (UI error display)

1. Navigate to `/login`
2. Enter correct email, wrong password
3. Click **Login**
4. **Expected:** Red error banner appears below the form title:  
   `"Invalid email or password."` — NO browser alert dialog

---

### 7.10 Register with duplicate email (UI error display)

1. Navigate to `/register`
2. Register with an email that already exists
3. **Expected:** Red error banner showing `"Email already registered."`

---

### 7.11 Register with mismatched passwords (client-side validation)

1. Navigate to `/register`
2. Enter different values in **Password** and **Confirm Password**
3. Click **Register**
4. **Expected:** Error displayed inline — no API call made

---

### 7.12 Dashboard navigation links

While logged in, verify each sidebar link loads the correct page:

| Link | Expected page |
|---|---|
| 🏠 Dashboard | Overview with stats cards |
| 📤 Upload Video | Upload form with drag-and-drop area |
| ⏳ Processing | Processing steps with progress bars |
| 📄 Transcript | Transcript viewer |
| 🤖 AI Summary | Summary with word count / reading time cards |
| ⭐ Key Moments | List of timestamped key moments |
| 🎬 Generated Clips | Grid of clip cards |
| 📊 Analytics | Analytics stats + chart placeholder |

---

## 8. Error & Edge-Case Tests

### 8.1 Backend offline — frontend shows errors gracefully

1. Stop the Django server (`Ctrl+C` in Terminal 1)
2. In the browser, try to log in
3. **Expected:** Error banner with a user-friendly message (not a crash or blank screen)
4. Restart the server

---

### 8.2 Memurai offline — Django cache gracefully errors

1. Stop Memurai (`memurai-cli shutdown` or stop the Windows service)
2. Call the `forgot-password` API:

```powershell
curl -X POST http://localhost:8000/api/v1/auth/forgot-password `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com"}'
```

3. Check the `logs/api.log` and `logs/errors.log` for error entries
4. Restart Memurai

---

### 8.3 CORS — verify requests from Vite are allowed

In the browser DevTools **Network** tab:

1. Log in from the frontend
2. Find the `login` request
3. Verify the response has:
   - `Access-Control-Allow-Origin: http://localhost:5173`
   - No CORS errors in the console

---

### 8.4 Weak password rules (should fail)

**All-numeric password** (rejected by `NumericPasswordValidator`):

```powershell
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"first_name":"Test","email":"num@test.com","password":"12345678","confirm_password":"12345678"}'
```

**Expected response (`400`):** `This password is entirely numeric.`

> **Important:** The passwords `12345678`, `password`, `11111111` etc. are all
> rejected by Django's built-in validators. Use a strong password like
> `Mahak@2103` or `MyPass!99` when testing — mix letters, numbers, and symbols.

**Short password** (< 8 chars):

```powershell
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"first_name":"Short","email":"short@test.com","password":"abc","confirm_password":"abc"}'
```

**Expected response (`400`):** Password too short (min 8 characters).

---

## 9. Quick Smoke-Test Checklist

Use this checklist for a rapid daily / pre-deploy verification:

```
Infrastructure
[ ] memurai-cli ping → PONG
[ ] PostgreSQL service Running
[ ] Django check → 0 issues

Backend APIs
[ ] POST /api/v1/auth/register  → 201 (use strong password e.g. Mahak@2103)
[ ] POST /api/v1/auth/login     → 200 with tokens
[ ] GET  /api/v1/auth/profile   → 200 with user data
[ ] POST /api/v1/auth/refresh   → 200 with new tokens (old token blacklisted)
[ ] POST /api/v1/auth/logout    → 200

Authorization
[ ] GET /api/v1/auth/profile (no token)  → 401
[ ] POST /api/v1/auth/login (wrong pass) → 401
[ ] Refresh blacklisted token            → 401
[ ] Register all-numeric password        → 400

Email
[ ] POST /api/v1/auth/forgot-password   → 200 (email sent to inbox)
[ ] memurai-cli -n 1 KEYS "pwd_reset:*" → token key listed

Celery
[ ] Worker starts without error
[ ] debug_task.delay() → State: SUCCESS
[ ] celery-task-meta-* key exists in Memurai DB 0

Frontend
[ ] Home page loads at localhost:5173
[ ] Register with strong password (e.g. Mahak@2103) → redirects to /login
[ ] Login → redirects to /dashboard, shows real user name
[ ] Logout → clears tokens, redirects to /login
[ ] Direct /dashboard visit while logged out → redirect to /login
[ ] Session survives page refresh (Ctrl+Shift+R)
[ ] Wrong password on login → red error banner (not alert dialog)
[ ] Numeric/short password on register → red error banner
[ ] Forgot password → success state message shown
[ ] Reset password page without token → warning banner shown
```

---

## Appendix — Useful Commands

```powershell
# Tail backend logs
Get-Content -Wait "c:\Users\khand\OneDrive\Desktop\clip_mind_AI_Backend\logs\api.log"

# List all Memurai keys in DB 0 (Celery)
memurai-cli -n 0 KEYS "*"

# List all Memurai keys in DB 1 (Cache)
memurai-cli -n 1 KEYS "*"

# Flush Celery results (DB 0) — CAUTION: clears task history
memurai-cli -n 0 FLUSHDB

# Run Django migrations
.\venv\Scripts\python.exe manage.py migrate

# Create a Django superuser
.\venv\Scripts\python.exe manage.py createsuperuser

# Open Django shell
.\venv\Scripts\python.exe manage.py shell

# Check a specific user in Django shell
# from apps.accounts.models import User
# User.objects.get(email='test@example.com')
```
