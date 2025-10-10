# User CRUD API Documentation

## Overview
This API provides comprehensive user management functionality with authentication, profile management, password changes, 2FA support, and account deletion.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "displayName": "string (optional)"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "newuser",
    "role": "user"
  }
}
```

#### POST /auth/login
Login with username and password.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "newuser",
    "role": "user"
  }
}
```

### 2. User Profile Endpoints

#### GET /users/me
Get current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "username": "newuser",
  "role": "user",
  "profile": {
    "displayName": "New User",
    "firstName": null,
    "lastName": null,
    "avatarUrl": null,
    "hasCustomAvatar": false
  },
  "settings": {
    "theme": "light",
    "language": "en",
    "timezone": "UTC",
    "profileVisibility": "public",
    "statusVisibility": "friends",
    "matchHistoryVisibility": "friends"
  },
  "stats": {
    "totalGames": 0,
    "wins": 0,
    "losses": 0,
    "winPercentage": 0,
    "currentRating": 1000,
    "highestRating": 1000
  },
  "twofa_enabled": false,
  "created_at": "2025-09-28T11:24:26.791Z",
  "last_login": null
}
```

#### PATCH /users/me
Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string (optional)",
  "profile": {
    "displayName": "string (optional)",
    "firstName": "string (optional)",
    "lastName": "string (optional)",
    "avatarUrl": "string (optional)",
    "hasCustomAvatar": "boolean (optional)"
  },
  "settings": {
    "profileVisibility": "string (optional)",
    "statusVisibility": "string (optional)",
    "matchHistoryVisibility": "string (optional)"
  }
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "newuser"
  }
}
```

**Error Responses:**
- `409` - Username already taken
- `400` - Invalid input data

### 3. Password Management

#### PATCH /users/me/password
Change user password.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required)"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `400` - Current password is incorrect
- `400` - Missing required fields

### 4. Two-Factor Authentication (2FA)

#### POST /users/me/2fa/setup
Initialize 2FA setup process.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "otpauth_url": "otpauth://totp/ft_transcendence:username?secret=SECRET&issuer=ft_transcendence",
  "qr_data": "data:image/png;base64,<base64-encoded-qr-code>",
  "backup_codes": ["ABC123", "DEF456", "..."]
}
```

**Error Responses:**
- `400` - 2FA is already enabled

#### POST /users/me/2fa/confirm
Confirm and enable 2FA.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "otp": "string (required)",
  "tempSecretToken": "string (required)"
}
```

**Response:**
```json
{
  "message": "2FA enabled successfully"
}
```

**Error Responses:**
- `400` - Invalid OTP
- `400` - Missing required fields

#### POST /users/me/2fa/disable
Disable 2FA.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "otp": "string (optional)",
  "recovery_code": "string (optional)"
}
```

**Response:**
```json
{
  "message": "2FA disabled successfully"
}
```

**Error Responses:**
- `400` - Invalid OTP or recovery code
- `400` - 2FA is not enabled

### 5. Account Management

#### DELETE /users/me
Delete user account (soft delete).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "string (optional)",
  "otp": "string (optional)"
}
```

**Response:**
```
204 No Content
```

**Error Responses:**
- `400` - Invalid password or OTP
- `400` - Missing required fields

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Security Features

1. **JWT Authentication** - All protected endpoints require valid JWT tokens
2. **Password Hashing** - Passwords are hashed using bcrypt with salt rounds
3. **2FA Support** - Optional two-factor authentication with TOTP
4. **Backup Codes** - Recovery codes for 2FA access
5. **Soft Delete** - Account deletion preserves data integrity
6. **Input Validation** - All inputs are validated before processing

## Testing

### Manual Testing with curl

1. **Register a new user:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123", "displayName": "Test User"}'
```

2. **Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

3. **Get profile (replace TOKEN with actual token):**
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer TOKEN"
```

4. **Update profile:**
```bash
curl -X PATCH http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profile": {"displayName": "Updated Name", "bio": "My bio"}}'
```

### Automated Testing

Run the test suite:
```bash
node test-api.js
```

## Implementation Notes

### Database Integration
- The current implementation uses in-memory storage for demonstration
- For production, integrate with the MikroORM entities:
  - `User` entity for user data
  - `UserStatistics` entity for game stats
  - `UserPreferences` entity for user settings
  - `UserSessions` entity for session management

### 2FA Implementation
- Current implementation uses simplified OTP verification
- For production, integrate with libraries like `speakeasy` or `otplib`
- Generate proper QR codes using `qrcode` library
- Store encrypted secrets in database

### Security Considerations
- Use environment variables for JWT secrets
- Implement rate limiting for authentication endpoints
- Add request logging and monitoring
- Use HTTPS in production
- Implement proper session management

## File Structure

```
backend/
├── src/
│   ├── entities/           # MikroORM entities
│   ├── routes/            # API route handlers
│   │   ├── auth.ts        # Authentication routes
│   │   └── users.ts       # User management routes
│   ├── services/          # Business logic services
│   │   └── auth.ts        # Authentication service
│   └── server.ts          # Main server file
├── simple-server.js       # Standalone server for testing
├── test-api.js           # API test suite
└── USER_CRUD_API.md      # This documentation
```

## Next Steps

1. **Database Integration** - Connect to actual database using MikroORM
2. **Real 2FA** - Implement proper TOTP with speakeasy
3. **Validation** - Add comprehensive input validation
4. **Rate Limiting** - Implement rate limiting middleware
5. **Logging** - Add structured logging
6. **Testing** - Expand test coverage
7. **Documentation** - Add OpenAPI/Swagger documentation
