# 2FA API Testing Guide

Complete guide for testing Two-Factor Authentication (TOTP) functionality.

## Prerequisites

- User service running on `http://localhost:8000`
- Authenticator app installed (Google Authenticator, Authy, Microsoft Authenticator, etc.)
- `curl` command available
- Cookie files will be created automatically (`cookies.txt`, `cookies2.txt`)

---

## Table of Contents

1. [Registration with 2FA](#1-registration-with-2fa)
2. [Setting Up 2FA After Registration](#2-setting-up-2fa-after-registration)
3. [Verifying 2FA Setup](#3-verifying-2fa-setup)
4. [Login with 2FA](#4-login-with-2fa)
5. [Using Backup Codes](#5-using-backup-codes)
6. [Disabling 2FA](#6-disabling-2fa)
7. [Rate Limiting Tests](#7-rate-limiting-tests)
8. [Error Scenarios](#8-error-scenarios)

---

## 1. Registration with 2FA

### Test 1.1: Register with 2FA Enabled

Register a new user with 2FA enabled. **Important:** The user account is NOT created until 2FA verification is completed.

```bash
curl -X POST http://localhost:8000/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123","enable2FA":true}'
```

**Expected Response:**
```json
{
  "message": "Registration pending 2FA verification",
  "twoFactorSetup": {
    "secret": "JBSWY3DPEHPK3PXP...",
    "qrCodeUrl": "data:image/png;base64,iVBORw0KG...",
    "registrationToken": "a1b2c3d4e5f6...",
    "message": "Scan QR code with authenticator app. You must verify the code to complete registration."
  },
  "nextStep": "POST /users/auth/2fa/verify-registration with registrationToken and code"
}
```

**Important Notes:**
- **No user ID is returned** - the user account doesn't exist yet
- **No session cookie is set** - authentication happens after verification
- **Save the `registrationToken`** - you'll need it for verification
- **Token expires in 15 minutes** - complete verification within this time

**Next Steps:**
1. Copy the `qrCodeUrl` value (data URL)
2. Open it in a browser or use a QR code decoder
3. Scan with your authenticator app
4. Note the 6-digit code displayed in your app
5. Save the `registrationToken` from the response
6. Proceed to [Test 1.3](#13-verify-registration-with-2fa) to complete registration

### Test 1.2: Register without 2FA

Register a user without 2FA (normal registration). The user account is created immediately.

```bash
curl -X POST http://localhost:8000/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}' \
  -c cookies2.txt
```

**Expected Response:**
```json
{
  "id": 2,
  "username": "testuser",
  "message": "User registered successfully"
}
```

**Note:** 
- User account is created immediately
- Session cookie is set automatically
- No `twoFactorSetup` field in response

### Test 1.3: Verify Registration with 2FA

Complete the registration by verifying the 2FA code. This endpoint does NOT require authentication.

```bash
# Get the current 6-digit code from your authenticator app
# Replace "123456" with the actual code from your app
# Replace "a1b2c3d4e5f6..." with the registrationToken from Test 1.1
curl -X POST http://localhost:8000/users/auth/2fa/verify-registration \
  -H "Content-Type: application/json" \
  -d '{"registrationToken":"a1b2c3d4e5f6...","code":"123456"}' \
  -c cookies.txt
```

**Expected Response:**
```json
{
  "id": 1,
  "username": "test2fa",
  "message": "Registration completed successfully. 2FA is now enabled.",
  "backupCodes": [
    "12345678",
    "23456789",
    "34567890",
    "45678901",
    "56789012",
    "67890123",
    "78901234",
    "89012345"
  ],
  "warning": "Save these backup codes in a safe place. They are shown only once."
}
```

**Important:**
- User account is created NOW (after successful verification)
- Session cookie is set automatically
- 2FA is immediately enabled
- **Save the backup codes!** They are shown only once

### Test 1.4: Verify Registration with Invalid Code

Attempt to complete registration with an incorrect 2FA code.

```bash
curl -X POST http://localhost:8000/users/auth/2fa/verify-registration \
  -H "Content-Type: application/json" \
  -d '{"registrationToken":"a1b2c3d4e5f6...","code":"000000"}'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Invalid verification code",
  "details": "The code you entered is incorrect. Please try again."
}
```

**Note:** You can retry with the correct code. The registration token remains valid until it expires (15 minutes).

### Test 1.5: Verify Registration with Expired Token

Attempt to use an expired registration token.

```bash
# Wait 15+ minutes after registration, then try:
curl -X POST http://localhost:8000/users/auth/2fa/verify-registration \
  -H "Content-Type: application/json" \
  -d '{"registrationToken":"expired-token","code":"123456"}'
```

**Expected Response:** `404 Not Found`
```json
{
  "error": "Registration not found or expired",
  "details": "The registration token is invalid or has expired. Please register again."
}
```

---

## 2. Setting Up 2FA After Registration

### Test 2.1: Initiate 2FA Setup (Authenticated)

If you registered without 2FA, you can set it up later. First, ensure you're logged in.

```bash
# Login first (if not already logged in)
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}' \
  -c cookies2.txt

# Then initiate 2FA setup
curl -X POST http://localhost:8000/users/auth/2fa/setup \
  -H "Content-Type: application/json" \
  -b cookies2.txt \
  -d '{"method":"totp"}'
```

**Expected Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP...",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KG...",
  "message": "Scan QR code with authenticator app"
}
```

**Next Steps:**
1. Scan the QR code with your authenticator app
2. Get the 6-digit code from your app
3. Proceed to [Test 3.1](#31-verify-2fa-setup-for-existing-users)

### Test 2.2: Setup 2FA Without Authentication

Attempt to set up 2FA without being logged in.

```bash
curl -X POST http://localhost:8000/users/auth/2fa/setup \
  -H "Content-Type: application/json" \
  -d '{"method":"totp"}'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Not authenticated"
}
```

---

## 3. Verifying 2FA Setup

### Test 3.1: Verify 2FA Setup for Existing Users

After scanning the QR code for an existing user (who registered without 2FA), verify the setup with a code from your authenticator app. **This endpoint requires authentication.**

```bash
# Get the current 6-digit code from your authenticator app
# Replace "123456" with the actual code from your app
curl -X POST http://localhost:8000/users/auth/2fa/verify-setup \
  -H "Content-Type: application/json" \
  -b cookies2.txt \
  -d '{"code":"123456"}'
```

**Expected Response:**
```json
{
  "message": "2FA enabled successfully",
  "backupCodes": [
    "12345678",
    "23456789",
    "34567890",
    "45678901",
    "56789012",
    "67890123",
    "78901234",
    "89012345"
  ],
  "warning": "Save these backup codes in a safe place. They are going to be shown only once."
}
```

**Important:** Save the backup codes! You'll need them if you lose access to your authenticator app.

**Note:** This endpoint is different from `/auth/2fa/verify-registration`:
- `/auth/2fa/verify-setup` - For existing users enabling 2FA (requires session)
- `/auth/2fa/verify-registration` - For new users completing registration (no session required)

### Test 3.2: Verify with Invalid Code

Attempt to verify with an incorrect code.

```bash
curl -X POST http://localhost:8000/users/auth/2fa/verify-setup \
  -H "Content-Type: application/json" \
  -b cookies2.txt \
  -d '{"code":"000000"}'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Invalid verification code"
}
```

### Test 3.3: Verify Without Setup

Attempt to verify 2FA without initiating setup first.

```bash
# Use a different user that hasn't set up 2FA
curl -X POST http://localhost:8000/users/auth/2fa/verify-setup \
  -H "Content-Type: application/json" \
  -b cookies2.txt \
  -d '{"code":"123456"}'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "2FA setup not initiated"
}
```

---

## 4. Login with 2FA

### Test 4.1: Login Without 2FA Code (First Request)

When a user with 2FA enabled tries to log in, they first get a prompt for the 2FA code.

```bash
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123"}' \
  -c cookies.txt
```

**Expected Response:** `200 OK`
```json
{
  "requires2FA": true,
  "method": "totp",
  "message": "Enter code from authenticator app"
}
```

### Test 4.2: Login with Valid 2FA Code

Provide the 6-digit code from your authenticator app.

```bash
# Replace "123456" with the current code from your authenticator app
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123","twoFactorCode":"123456"}' \
  -c cookies.txt
```

**Expected Response:** `200 OK`
```json
{
  "id": 1,
  "username": "test2fa",
  "lastLogin": "2025-11-13T16:00:00.000Z",
  "message": "Login successful"
}
```

### Test 4.3: Login with Invalid 2FA Code

Attempt to log in with an incorrect 2FA code.

```bash
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123","twoFactorCode":"000000"}' \
  -c cookies.txt
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Invalid 2FA code",
  "remainingAttempts": 4
}
```

**Note:** The `remainingAttempts` field shows how many attempts are left before account lockout.

---

## 5. Using Backup Codes

### Test 5.1: Login with Backup Code

If you lose access to your authenticator app, use one of the backup codes you saved during 2FA setup.

```bash
# Replace "12345678" with one of your saved backup codes (8 digits)
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123","twoFactorCode":"12345678"}' \
  -c cookies.txt
```

**Expected Response:** `200 OK`
```json
{
  "id": 1,
  "username": "test2fa",
  "lastLogin": "2025-11-13T16:00:00.000Z",
  "message": "Login successful"
}
```

**Important:** Backup codes are single-use. Once used, they cannot be used again.

### Test 5.2: Login with Already-Used Backup Code

Attempt to use a backup code that was already consumed.

```bash
# Try using the same backup code again
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123","twoFactorCode":"12345678"}' \
  -c cookies.txt
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Invalid 2FA code",
  "remainingAttempts": 4
}
```

---

## 6. Disabling 2FA

### Test 6.1: Disable 2FA

Disable 2FA for your account (requires password confirmation).

```bash
curl -X POST http://localhost:8000/users/auth/2fa/disable \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"password":"testpass123"}'
```

**Expected Response:** `200 OK`
```json
{
  "message": "2FA disabled successfully"
}
```

### Test 6.2: Disable 2FA with Wrong Password

Attempt to disable 2FA with an incorrect password.

```bash
curl -X POST http://localhost:8000/users/auth/2fa/disable \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"password":"wrongpassword"}'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Invalid password"
}
```

### Test 6.3: Disable 2FA Without Authentication

Attempt to disable 2FA without being logged in.

```bash
curl -X POST http://localhost:8000/users/auth/2fa/disable \
  -H "Content-Type: application/json" \
  -d '{"password":"testpass123"}'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Not authenticated"
}
```

---

## 7. Rate Limiting Tests

### Test 7.1: Test Rate Limiting (5 Failed Attempts)

Attempt to log in with invalid 2FA codes 5 times to trigger account lockout.

```bash
# Attempt 1
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123","twoFactorCode":"000000"}' \
  -c cookies.txt

# Attempt 2-5 (repeat the same command 4 more times)
# ... (attempts 2-5)
```

**Expected Response (After 5 Failed Attempts):** `429 Too Many Requests`
```json
{
  "error": "Too many failed attempts",
  "message": "Account temporarily locked. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

### Test 7.2: Attempt Login While Locked

Try to log in while the account is locked.

```bash
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123","twoFactorCode":"123456"}' \
  -c cookies.txt
```

**Expected Response:** `429 Too Many Requests`
```json
{
  "error": "Account temporarily locked",
  "message": "Too many failed 2FA attempts. Please try again in X minute(s).",
  "retryAfter": 900
}
```

### Test 7.3: Successful Login Resets Rate Limit Counter

After a successful login, the failed attempts counter is reset.

```bash
# Login successfully with valid 2FA code
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123","twoFactorCode":"123456"}' \
  -c cookies.txt
```

**Expected Response:** `200 OK` - Login successful, counter reset.

---

## 8. Error Scenarios

### Test 8.1: Login Without 2FA Code When Required

User with 2FA enabled tries to log in without providing a code.

```bash
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123"}' \
  -c cookies.txt
```

**Expected Response:** `200 OK` (prompts for 2FA)
```json
{
  "requires2FA": true,
  "method": "totp",
  "message": "Enter code from authenticator app"
}
```

### Test 8.2: Login with Empty 2FA Code

Provide an empty 2FA code.

```bash
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123","twoFactorCode":""}' \
  -c cookies.txt
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "2FA code is required"
}
```

### Test 8.3: Invalid 2FA Method

Attempt to set up 2FA with an invalid method (only 'totp' is supported).

```bash
curl -X POST http://localhost:8000/users/auth/2fa/setup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"method":"email"}'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Invalid method. Only TOTP is supported."
}
```

### Test 8.4: Missing Required Fields

Attempt registration/login with missing required fields.

```bash
# Missing password
curl -X POST http://localhost:8000/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'

# Missing username
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"testpass123"}'
```

**Expected Response:** `400 Bad Request` with validation errors.

### Test 8.5: Verify Registration with Missing Token

Attempt to verify registration without providing the registration token.

```bash
curl -X POST http://localhost:8000/users/auth/2fa/verify-registration \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Invalid registration token",
  "details": "Registration token is required"
}
```

### Test 8.6: Attempt to Login Before Completing 2FA Registration

If a user starts registration with 2FA but doesn't complete verification, they cannot log in because the account doesn't exist yet.

```bash
# This will fail because the user account was never created
curl -X POST http://localhost:8000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test2fa","password":"testpass123"}'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Invalid credentials",
  "details": "Username or password is incorrect"
}
```

**Note:** This is the expected behavior - if registration with 2FA is not completed, the user account is never created, so login will fail.

---

## Quick Reference

### Endpoints Summary

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/users/auth/register` | POST | No | Register new user (optional `enable2FA`) |
| `/users/auth/2fa/verify-registration` | POST | No | Complete registration after 2FA verification (for new users) |
| `/users/auth/login` | POST | No | Login (requires `twoFactorCode` if 2FA enabled) |
| `/users/auth/2fa/setup` | POST | Yes | Initiate 2FA setup (for existing users) |
| `/users/auth/2fa/verify-setup` | POST | Yes | Verify and enable 2FA (for existing users) |
| `/users/auth/2fa/disable` | POST | Yes | Disable 2FA (requires password) |
| `/users/auth/logout` | POST | Yes | Logout current user |

### Registration Flow Comparison

**Registration WITHOUT 2FA:**
1. `POST /users/auth/register` → User created immediately → Session set → Can login immediately

**Registration WITH 2FA:**
1. `POST /users/auth/register` with `enable2FA: true` → **No user created** → Returns `registrationToken`
2. Scan QR code and get 6-digit code from authenticator app
3. `POST /users/auth/2fa/verify-registration` with `registrationToken` and `code` → **User created** → Session set → 2FA enabled → Can login

### Status Codes

- `200 OK` - Success
- `400 Bad Request` - Validation error or invalid input
- `401 Unauthorized` - Authentication required or invalid credentials
- `403 Forbidden` - HTTPS required (production)
- `404 Not Found` - User not found or registration token expired
- `409 Conflict` - User already logged in or username already taken
- `429 Too Many Requests` - Rate limit exceeded or account locked

### Rate Limiting

- **Max Failed Attempts:** 5
- **Lockout Duration:** 15 minutes
- **Counter Reset:** On successful login or after lockout expires
- **Registration Token Expiry:** 15 minutes (must complete verification within this time)

---

## Tips

1. **Save Backup Codes:** Always save backup codes in a secure location when you enable 2FA.
2. **Save Registration Token:** When registering with 2FA, save the `registrationToken` - you'll need it to complete registration.
3. **Complete Registration Quickly:** Registration tokens expire in 15 minutes. Complete verification promptly.
4. **Time Sync:** Ensure your authenticator app's time is synchronized for accurate codes.
5. **Cookie Files:** Use different cookie files (`cookies.txt`, `cookies2.txt`) for different users.
6. **Development Mode:** In development, 2FA codes are logged for debugging. This is disabled in production.
7. **HTTPS:** In production, 2FA setup requires HTTPS connection.

---

## Troubleshooting

### QR Code Not Displaying
- The `qrCodeUrl` is a data URL. Copy it and paste directly into a browser, or use a QR code decoder.

### Codes Not Working
- Check that your authenticator app's time is synchronized.
- Ensure you're using the correct secret (from the setup response).
- Wait for a new code cycle (codes change every 30 seconds).

### Account Locked
- Wait 15 minutes for the lockout to expire.
- Or contact support if you need immediate access.

### Registration Token Expired
- Registration tokens expire after 15 minutes.
- If your token expired, you must register again.
- The user account is NOT created until verification is complete.

### Cannot Login After Starting 2FA Registration
- If you started registration with `enable2FA: true` but didn't complete verification, the user account was never created.
- You cannot log in because the account doesn't exist.
- You must complete the verification step or register again.

---

## Notes

- All 2FA functionality uses TOTP (Time-based One-Time Password) only.
- Email 2FA has been removed from the system.
- Backup codes are 8 digits and single-use only.
- TOTP codes are 6 digits and time-based (30-second window).
- **Security:** Users who register with `enable2FA: true` are NOT created in the database until 2FA verification is completed. This prevents users from logging in without completing 2FA setup.
- **Registration Token:** Tokens expire after 15 minutes. If verification is not completed within this time, the user must register again.
