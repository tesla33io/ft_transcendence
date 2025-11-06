# User Service API Guide

Comprehensive reference for exercising the current `user-service` endpoints with Postman or cURL. This version reflects the TypeScript code in `src/routes/users.ts` as of the latest update and removes all legacy JWT / 2FA content.

---

## Base URL & Authentication

- **Base URL** (Docker default): `http://localhost:8000/users`
- Authentication uses an `httpOnly` session cookie named `sessionId`.
  - `POST /auth/register` and `POST /auth/login` both set it.
  - Include the cookie on every subsequent request (Postman: Enable “Automatically follow redirects” and “Retain cookies”).
  - No `Authorization` header is required after login.

### Quick Postman Setup
1. Create a collection and add the base URL as a collection variable, e.g. `{{user_base_url}} = http://localhost:8000/users`.
2. Use the “Cookies” tab to confirm the `sessionId` cookie is stored after calling login/register.
3. For multipart upload (`POST /me/picture`), switch the request body to `form-data` and add a single file field named `file`.

---

## Endpoint Index

| Category  | Method & Path                       | Purpose                                   |
|-----------|-------------------------------------|--------------------------------------------|
| Auth      | `POST /auth/register`               | Create a user and start a session          |
| Auth      | `POST /auth/login`                  | Authenticate existing user                 |
| Profile   | `GET /me`                           | Fetch current user profile & stats         |
| Profile   | `POST /me/picture`                  | Upload or replace the user avatar          |
| Profile   | `PATCH /me`                         | Change username                            |
| Profile   | `PATCH /me/password`                | Change password                            |
| Friends   | `GET /friends`                      | List friends                               |
| Friends   | `POST /friends`                     | Add a friend                               |
| Friends   | `DELETE /friends/:username`         | Remove a friend                            |
| Friends   | `GET /search/:username`             | Search for users to add as friends         |

---

## 1. Authentication

### `POST /auth/register`
Registers a new account and responds with the created user info and session cookie.

- **Body (JSON)**
  ```json
  {
    "username": "string (3-32 chars, letters/digits/_-)",
    "password": "string (8-128 chars, must include upper, lower, digit, special)"
  }
  ```

- **Success (200)**
  ```json
  {
    "id": 1,
    "username": "newuser",
    "message": "User registered successfully"
  }
  ```

- **Errors**
  - `400` Invalid username/password schema
  - `409` Username already exists
  - `500` Server error

### `POST /auth/login`
Authenticates an existing account. Returns the same payload structure and sets/refreshes `sessionId`.

- **Body (JSON)**
  ```json
  {
    "username": "existinguser",
    "password": "SecretPassw0rd!"
  }
  ```

- **Success (200)**
  ```json
  {
    "id": 1,
    "username": "existinguser",
    "lastLogin": "2025-11-05T17:21:34.123Z",
    "message": "Login successful"
  }
  ```

- **Errors**
  - `400` Missing or malformed body
  - `401` Invalid credentials
  - `500` Server error

---

## 2. Profile

### `GET /me`
Returns the authenticated user profile, statistics, and status flags.

- **Headers**
  - `Cookie: sessionId=<value>` (handled automatically once logged in)

- **Success (200)**
  ```json
  {
    "id": 1,
    "username": "existinguser",
    "role": "user",
    "profile": {
      "avatarUrl": "/uploads/profiles/7af0f6c6e3e34703b6c0.png",
      "onlineStatus": "online",
      "activityType": null
    },
    "stats": {
      "totalGames": 42,
      "wins": 20,
      "losses": 18,
      "draws": 4,
      "averageGameDuration": 550,
      "longestGame": 900,
      "bestWinStreak": 5,
      "currentRating": 1040,
      "highestRating": 1085,
      "ratingChange": 12
    },
    "twofa_enabled": false,
    "last_login": "2025-11-05T17:21:34.123Z"
  }
  ```

- **Errors**
  - `401` Not authenticated
  - `404` User missing
  - `500` Server error

### `POST /me/picture`
Uploads or replaces the avatar. Saves under `/public/uploads/profiles` and deletes previous avatar if present.

- **Headers**
  - `Content-Type: multipart/form-data`
- **Body**
  - Single field `file` (type file). Allowed mime types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Max size 5 MB.

- **Success (200)**
  ```json
  {
    "message": "Profile picture uploaded successfully",
    "uri": "/uploads/profiles/7af0f6c6e3e34703b6c0.png"
  }
  ```

- **Errors**
  - `400` No file, unsupported type, or file too large
  - `401` Not authenticated
  - `404` User not found
  - `500` Upload failure

### `PATCH /me`
Allows updating the username. Future profile fields are rejected at the schema level.

- **Body (JSON)**
  ```json
  {
    "username": "new-name"
  }
  ```

- **Success (200)**
  ```json
  {
    "message": "Profile updated successfully",
    "user": {
      "id": 1,
      "username": "new-name"
    }
  }
  ```

- **Errors**
  - `400` Invalid username format
  - `401` Not authenticated
  - `404` User not found
  - `409` Username already taken

### `PATCH /me/password`
Changes the current user password after verifying the existing one and validating the new one.

- **Body (JSON)**
  ```json
  {
    "currentPassword": "OldPassw0rd!",
    "newPassword": "Sup3rSecure!"
  }
  ```

- **Success (200)**
  ```json
  {
    "message": "Password updated successfully"
  }
  ```

- **Errors**
  - `400` Missing fields, invalid format, or wrong current password
  - `401` Not authenticated
  - `404` User not found

---

## 3. Friends & Discovery

### `GET /friends`
Returns the current user’s friends with presence data.

- **Success (200)**
  ```json
  {
    "friends": [
      {
        "id": 2,
        "username": "ally",
        "avatarUrl": "/uploads/profiles/a1.png",
        "onlineStatus": "offline",
        "activityType": null,
        "lastLogin": "2025-11-05T10:32:11.000Z"
      }
    ]
  }
  ```

- **Errors**
  - `401` Not authenticated
  - `404` User missing
  - `500` Server error

### `POST /friends`
Adds another user as a mutual friend.

- **Body (JSON)**
  ```json
  {
    "username": "ally"
  }
  ```

- **Success (200)**
  ```json
  {
    "message": "Friend added successfully",
    "friend": {
      "id": 2,
      "username": "ally",
      "onlineStatus": "offline"
    }
  }
  ```

- **Errors**
  - `400` Missing username or trying to add yourself
  - `401` Not authenticated
  - `404` User not found
  - `409` Already friends
  - `500` Server error

### `DELETE /friends/:username`
Removes the friendship both ways.

- **Success (200)**
  ```json
  {
    "message": "Friend removed successfully"
  }
  ```

- **Errors**
  - `401` Not authenticated
  - `404` User not found or not a friend
  - `500` Server error

### `GET /search/:username`
Performs a case-insensitive LIKE search to find other users (excludes the requester).

- **Query Params** (optional)
  - `limit` (default 20)
  - `offset` (default 0)

- **Success (200)**
  ```json
  {
    "users": [
      {
        "id": 3,
        "username": "ally-cat",
        "avatarUrl": null,
        "onlineStatus": "online",
        "activityType": null
      }
    ]
  }
  ```

- **Errors**
  - `401` Not authenticated

---

## 4. Testing With cURL

```bash
# 1) Register (stores cookie.jar with sessionId)
curl -i -c cookie.jar -X POST "http://localhost:8000/users/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"Sup3rSecure!"}'

# 2) Login (optional refresh of session)
curl -i -b cookie.jar -c cookie.jar -X POST "http://localhost:8000/users/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"Sup3rSecure!"}'

# 3) Fetch profile
curl -b cookie.jar "http://localhost:8000/users/me"

# 4) Update username
curl -b cookie.jar -X PATCH "http://localhost:8000/users/me" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo-updated"}'

# 5) Change password
curl -b cookie.jar -X PATCH "http://localhost:8000/users/me/password" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Sup3rSecure!","newPassword":"EvenB3tter!"}'

# 6) Add friend
curl -b cookie.jar -X POST "http://localhost:8000/users/friends" \
  -H "Content-Type: application/json" \
  -d '{"username":"ally"}'

# 7) Search for users
curl -b cookie.jar "http://localhost:8000/users/search/al"

# 8) Delete friend
curl -b cookie.jar -X DELETE "http://localhost:8000/users/friends/ally"
```

To upload an avatar with cURL (example using PNG):

```bash
curl -b cookie.jar -X POST "http://localhost:8000/users/me/picture" \
  -F "file=@/absolute/path/to/avatar.png"
```

---

## 5. Troubleshooting Checklist

- **401 Unauthorized**: ensure `sessionId` cookie is stored and sent; sessions expire after 24 hours.
- **409 Conflicts**: username exists or user already in friends list.
- **Avatar upload fails**: confirm file type/size, and that the `public/uploads/profiles` directory is writable (Docker entrypoint creates it automatically).
- **Better-SQLite3 binary mismatch**: rebuild dependencies inside the container using `docker compose run --rm user-service npm install --build-from-source`.

---

## 6. Related Resources

- Swagger UI (development only): `http://localhost:8000/docs`
- Database migrations run automatically on container start via `docker-entrypoint.sh`.
- Session implementation: `src/utils/SessionManager.ts`

This document should now be in sync with the actual handlers and schemas. Update it alongside `users.ts` whenever endpoints or payload contracts change.
