# Mini Social Feed — Backend API

Express.js REST API for the Mini Social Feed application.

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

```bash
npm install
cp .env.example .env
```

Configure `.env` with your values (see below).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` / `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret (use a long random string) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `CLIENT_URL` | No | Frontend origin for CORS (preferred) |
| `CORS_ORIGIN` | No | Fallback CORS origin (default: `*`) |
| `FIREBASE_PROJECT_ID` | Phase 10+ | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Phase 10+ | Service account email |
| `FIREBASE_PRIVATE_KEY` | Phase 10+ | Service account private key |

Never commit the real `.env` file.

## MongoDB Setup

**Local MongoDB:**

```bash
# macOS with Homebrew
brew services start mongodb-community

# Use in .env
MONGODB_URI=mongodb://127.0.0.1:27017/social_platform
```

**MongoDB Atlas:**

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and allow your IP
3. Copy the connection string into `MONGODB_URI`

## Running

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

## Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-08-29T...",
  "environment": "development"
}
```

## Authentication Endpoints

All auth responses use a consistent envelope:

**Success:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbG...",
    "user": {
      "_id": "...",
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": "",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

Protected routes require:

```
Authorization: Bearer <token>
```

### POST /api/auth/signup

Create a new account.

**Request:**

```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

**Example:**

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "StrongPassword123"
  }'
```

**Validation rules:**

- `name`: 2–100 characters
- `username`: 3–30 characters, letters/numbers/underscores only, unique
- `email`: valid email format, unique, lowercased
- `password`: 6–128 characters

### POST /api/auth/login

Authenticate with email and password.

**Request:**

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

**Example:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "StrongPassword123"
  }'
```

Returns a generic `Invalid email or password` message for wrong credentials (does not reveal whether the email exists).

### GET /api/auth/me

Return the currently authenticated user.

**Example:**

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing

```bash
# Health check (no MongoDB required)
npm test

# Auth integration tests require a running MongoDB instance
MONGODB_URI=mongodb://127.0.0.1:27017/social_platform_test npm test
```

When MongoDB is unavailable, auth integration tests are skipped automatically and the health test still runs.

## Architecture

```
Routes → Controllers → Services → Models
```

### Folder Structure

```
src/
├── config/       # Database, Firebase
├── controllers/  # Request handlers
├── middleware/   # Auth, validation, errors, rate limiting
├── models/       # Mongoose schemas
├── routes/       # Route definitions
├── services/     # Business logic
├── validators/   # Input validation
└── utils/        # Helpers (JWT, responses, errors)
```

## API Routes

| Method | Endpoint | Auth | Phase |
|--------|----------|------|-------|
| GET | `/api/health` | No | 1 |
| POST | `/api/auth/signup` | No | 2 |
| POST | `/api/auth/login` | No | 2 |
| GET | `/api/auth/me` | Yes | 2 |
| POST | `/api/posts` | Yes | 3+ |
| GET | `/api/posts` | Yes | 3+ |

## Security

- Helmet for HTTP headers
- CORS via `CLIENT_URL` / `CORS_ORIGIN`
- Rate limiting on `/api/*` (100 req / 15 min)
- Stricter auth rate limiting (20 req / 15 min on signup/login)
- JWT authentication
- Password hashing with bcrypt (12 rounds)
- Input validation with express-validator
- Passwords never returned in API responses
- Production errors hide stack traces and internal details

## Mobile Integration Notes

The mobile app (`mobile/src/services/auth.service.ts`) expects:

- Signup/login: `{ user, token }` inside `data` (Phase 3 will wire this)
- GET `/auth/me`: user object inside `data.user`
- Errors: `{ message: string }` minimum
- JWT payload uses `id` matching MongoDB `_id`
