# IRCT API Documentation

## Architecture Overview

```
Client ──> API Gateway (:4000) ──> User Service (:4001)
                                      │
                                      ├── PostgreSQL (users)
                                      ├── Redis (OTP, tokens, cache)
                                      └── Kafka (email notifications)
```

The **API Gateway** sits as a single entry point. It handles authentication, rate limiting, and proxies requests to backend services. Currently only the **User Service** is implemented.

---

## Base URL

```
http://localhost:4000/api/v1
```

---

## Authentication

### Token-based auth with JWT

| Token          | Lifetime | Storage             | Used For            |
|----------------|----------|---------------------|---------------------|
| `accessToken`  | 15 min   | `Authorization` header or `accessToken` cookie | Authenticated requests |
| `refreshToken` | 7 days   | `refreshToken` cookie (httpOnly) | Token rotation |

### Auth Flow

```
Registration:  POST /users/auth/send-otp ─► POST /users/auth/verify-otp
Login:         POST /users/auth/login ─► returns accessToken + refreshToken
Authenticated: GET  /users/user/profile ─► Bearer <accessToken>
Token refresh: POST /users/auth/refresh-token ─► (cookie) ─► new tokens
```

---

## Rate Limiting

| Scope   | Window | Max Requests |
|---------|--------|-------------|
| Global  | 15 min | 100         |
| Auth    | 15 min | 20          |

---

## Endpoints

### POST /users/auth/send-otp

Send OTP for new user registration.

**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response 200:**
```json
{
  "message": "OTP sent successfully"
}
```
Sets `otpSessionId` cookie.

**Errors:** `400` — All fields required / Passwords don't match

---

### POST /users/auth/verify-otp

Verify OTP and create user account.

**Request:**
```json
{
  "otp": "string"
}
```
Requires `otpSessionId` cookie.

**Response 200:**
```json
{
  "message": "OTP verified successfully",
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "emailVerified": true,
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime"
  }
}
```

**Errors:** `400` — OTP and session ID required / Invalid OTP

---

### POST /users/auth/login

Authenticate existing user.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt-string",
  "refreshToken": "jwt-string",
  "loggedUser": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "emailVerified": true,
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime"
  }
}
```
Also sets `accessToken` and `refreshToken` as httpOnly cookies.

**Errors:** `400` — Email and password required / Invalid email or password

---

### POST /users/auth/refresh-token

Rotate tokens using refresh token cookie.

Requires `refreshToken` cookie.

**Response 200:**
```json
{
  "success": true,
  "message": "Token rotated successfully",
  "accessToken": "new-jwt",
  "refreshToken": "new-jwt"
}
```

**Errors:** `400` — Refresh token required | `401` — Token revoked

---

### GET /users/user/profile

Get authenticated user's profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "emailVerified": true,
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime"
  }
}
```

**Errors:** `401` — Missing or invalid token | `404` — User not found

---

### GET /health

Gateway health check.

**Response 200:**
```json
{
  "success": true,
  "message": "API Gateway is running"
}
```

---

### GET /api/v1/gateway/health

Gateway health check (under /api/v1).

**Response 200:**
```json
{
  "success": true,
  "message": "API Gateway is running",
  "timestamp": "ISO datetime"
}
```

---

## Error Response Format

### Gateway errors:
```json
{
  "success": false,
  "message": "Error description"
}
```

### User-service errors:
```json
{
  "success": false,
  "error": "Error description",
  "statusCode": 400,
  "code": "BAD_REQUEST"
}
```

### HTTP Status Codes

| Code | Meaning              |
|------|----------------------|
| 200  | Success              |
| 400  | Bad request          |
| 401  | Unauthorized         |
| 403  | Forbidden            |
| 404  | Not found            |
| 500  | Internal error       |
| 503  | Service unavailable (circuit breaker open) |

---

## Data Model — User

```prisma
model User {
  id            String   @id @default(cuid())
  firstName     String
  lastName      String
  email         String   @unique
  password      String?
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## Redis Key Patterns

| Key Pattern                    | TTL      | Purpose                       |
|-------------------------------|----------|-------------------------------|
| `otp:session:{sessionId}`     | 5 min    | OTP value (hashed)            |
| `otp:meta:{sessionId}`        | 5 min    | User registration metadata    |
| `otp:{email}`                 | 1 hour   | Rate limit (max 5/hr)         |
| `refresh_token:{jti}`         | 7 days   | Refresh token whitelist       |
| `user:{userId}`               | 5 min    | Profile cache                 |

---

## Services

| Service           | Port | URL                        |
|-------------------|------|----------------------------|
| API Gateway       | 4000 | http://localhost:4000       |
| User Service      | 4001 | http://localhost:4001       |
| PostgreSQL        | 5432 | postgres://localhost:5432   |
| Redis             | 6379 | redis://localhost:6379      |
| Kafka             | 9093 | localhost:9093              |

---

## Getting Started

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Start user service
cd user-service
bun install
bun run dev

# 3. Start gateway
cd api-gateway
bun install
bun run dev
```
