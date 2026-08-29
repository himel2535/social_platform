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
| `CLIENT_URL` | No | Production frontend origin for CORS. In development, leave empty — all `localhost` Expo Web ports are allowed automatically. |
| `CORS_ORIGIN` | No | Production fallback: comma-separated extra allowed origins |
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

## Posts Endpoints

Both post endpoints require authentication:

```
Authorization: Bearer <token>
```

### POST /api/posts

Create a new text-only post. The authenticated user is always set as the author — client-provided author IDs are ignored.

**Request:**

```json
{
  "content": "This is my first post!"
}
```

**Example:**

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"This is my first post!"}'
```

**Validation rules:**

- `content`: required, string, trimmed, 1–1000 characters
- Empty or whitespace-only content is rejected

**Success response (201):**

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      "_id": "...",
      "content": "This is my first post!",
      "author": {
        "_id": "...",
        "name": "John Doe",
        "username": "johndoe",
        "avatar": null
      },
      "likesCount": 0,
      "likedByMe": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### GET /api/posts

Retrieve a paginated feed of posts, newest first.

**Query parameters:**

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | `1` | — | Page number (positive integer) |
| `limit` | `10` | `50` | Posts per page |

**Example:**

```bash
curl "http://localhost:5000/api/posts?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "posts": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Pagination fields:**

- `page` — current page number
- `limit` — number of posts per page
- `total` — total number of posts in the database
- `totalPages` — total number of pages
- `hasNextPage` — `true` if more pages exist after the current page
- `hasPrevPage` — `true` if pages exist before the current page

Author objects include only public fields: `_id`, `name`, `username`, `avatar`. Passwords and other sensitive user fields are never returned. Each post includes `likesCount` and `likedByMe` (whether the authenticated user has liked the post). The internal `likes` array is never exposed.

### POST /api/posts/:id/like

Like a post. The authenticated user is added to the post's likes — client-provided user IDs are ignored.

**Example:**

```bash
curl -X POST http://localhost:5000/api/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Post liked",
  "data": {
    "liked": true,
    "likesCount": 1
  }
}
```

Duplicate like requests are idempotent — the count does not increase twice for the same user.

### DELETE /api/posts/:id/like

Remove the authenticated user's like from a post.

**Example:**

```bash
curl -X DELETE http://localhost:5000/api/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Post unliked",
  "data": {
    "liked": false,
    "likesCount": 0
  }
}
```

Duplicate unlike requests are safe and idempotent.

**Validation:**

- `:id` must be a valid MongoDB ObjectId (400 if malformed)
- Post must exist (404 if not found)

## Comments Endpoints

All comment endpoints require authentication:

```
Authorization: Bearer <token>
```

Feed posts include `commentsCount` reflecting the stored count on each post.

### GET /api/posts/:id/comments

Retrieve paginated comments for a post, newest first.

**Query parameters:**

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | `1` | — | Page number (positive integer) |
| `limit` | `20` | `50` | Comments per page |

**Example:**

```bash
curl "http://localhost:5000/api/posts/POST_ID/comments?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": {
    "comments": [
      {
        "_id": "...",
        "content": "This is a comment",
        "author": {
          "_id": "...",
          "name": "John Doe",
          "username": "johndoe",
          "avatar": null
        },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### POST /api/posts/:id/comments

Add a comment to a post. The authenticated user is always set as the author.

**Request:**

```json
{
  "content": "This is a comment"
}
```

**Validation rules:**

- `content`: required, string, trimmed, 1–500 characters

**Example:**

```bash
curl -X POST http://localhost:5000/api/posts/POST_ID/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"This is a comment"}'
```

**Success response (201):**

```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "comment": {
      "_id": "...",
      "content": "This is a comment",
      "author": {
        "_id": "...",
        "name": "John Doe",
        "username": "johndoe",
        "avatar": null
      },
      "createdAt": "...",
      "updatedAt": "..."
    },
    "commentsCount": 1
  }
}
```

### DELETE /api/comments/:id

Delete a comment. Only the comment author can delete their own comment.

**Example:**

```bash
curl -X DELETE http://localhost:5000/api/comments/COMMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": {
    "commentsCount": 0
  }
}
```

**Authorization:**

- Comment author → 200
- Other users → 403
- Comment not found → 404
- Invalid comment ID → 400

## Users Endpoints

### GET /api/users/me

Return the authenticated user's full profile (includes email).

**Auth:** JWT required

**Example:**

```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": null,
      "bio": "",
      "followersCount": 0,
      "followingCount": 0,
      "createdAt": "..."
    }
  }
}
```

### GET /api/users/:username

Return a public user profile by username. Authentication is optional — when a valid JWT is provided, the response includes whether the authenticated user follows this profile (`following`).

**Example:**

```bash
curl http://localhost:5000/api/users/johndoe
```

With authentication (includes `following` state):

```bash
curl http://localhost:5000/api/users/johndoe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "username": "johndoe",
      "avatar": null,
      "bio": "",
      "followersCount": 0,
      "followingCount": 0,
      "createdAt": "..."
    }
  }
}
```

**Notes:**

- Email and password are never returned
- Non-existent username → 404

### PATCH /api/users/me

Update the authenticated user's profile.

**Auth:** JWT required

**Allowed fields:**

| Field | Rules |
|-------|-------|
| `name` | Optional; if provided: trimmed, 2–100 characters |
| `bio` | Optional; trimmed, max 160 characters |
| `avatar` | Optional; valid HTTP/HTTPS URL or empty string to clear |

**Protected fields (cannot be modified):** `_id`, `username`, `email`, `password`, `roles`, `fcmTokens`

**Example:**

```bash
curl -X PATCH http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","bio":"Hello world!","avatar":"https://example.com/avatar.png"}'
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Jane Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.png",
      "bio": "Hello world!",
      "createdAt": "..."
    }
  }
}
```

### GET /api/users/search

Search users by username or name.

**Auth:** JWT required

**Query parameters:**

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `q` | — | 100 chars | Search query (required, min 1 character) |
| `page` | `1` | — | Page number (positive integer) |
| `limit` | `20` | `50` | Results per page |

**Example:**

```bash
curl "http://localhost:5000/api/users/search?q=john&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "...",
        "name": "John Doe",
        "username": "johndoe",
        "avatar": null,
      "bio": "",
      "followersCount": 25,
      "followingCount": 12,
      "following": true,
      "createdAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

**Validation:**

- Empty or missing `q` → 400
- `limit` above 50 → 400
- Password, email, and other sensitive fields are never returned

## Follow Endpoints

All follow endpoints require authentication:

```
Authorization: Bearer <token>
```

### POST /api/users/:username/follow

Follow a user by username.

**Example:**

```bash
curl -X POST http://localhost:5000/api/users/johndoe/follow \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "User followed successfully",
  "data": {
    "following": true,
    "followersCount": 10,
    "followingCount": 5
  }
}
```

**Notes:**

- Cannot follow yourself → 400
- Non-existent username → 404
- Duplicate follow is handled safely (idempotent 200)

### DELETE /api/users/:username/follow

Unfollow a user by username.

**Example:**

```bash
curl -X DELETE http://localhost:5000/api/users/johndoe/follow \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "User unfollowed successfully",
  "data": {
    "following": false,
    "followersCount": 9,
    "followingCount": 5
  }
}
```

**Notes:**

- Repeated unfollow is handled safely (idempotent 200)
- Counts reflect the **target user's** follower/following totals

### GET /api/users/:username/followers

Return a paginated list of users who follow the given username.

**Query parameters:**

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | `1` | — | Page number (positive integer) |
| `limit` | `20` | `50` | Users per page |

**Example:**

```bash
curl "http://localhost:5000/api/users/johndoe/followers?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Followers retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "...",
        "name": "Jane Doe",
        "username": "janedoe",
        "avatar": null,
        "bio": "",
        "createdAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### GET /api/users/:username/following

Return a paginated list of users that the given username follows.

**Example:**

```bash
curl "http://localhost:5000/api/users/johndoe/following?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Uses the same pagination structure and public user fields as the followers endpoint.

## Testing

```bash
# Health check (no MongoDB required)
npm test

# Auth integration tests require a running MongoDB instance
MONGODB_URI=mongodb://127.0.0.1:27017/social_platform_test npm test
```

When MongoDB is unavailable, auth, posts, likes, comments, users, and follow integration tests are skipped automatically and the health/CORS tests still run.

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
| POST | `/api/posts` | Yes | 4 |
| GET | `/api/posts` | Yes | 4 |
| POST | `/api/posts/:id/like` | Yes | 6 |
| DELETE | `/api/posts/:id/like` | Yes | 6 |
| GET | `/api/posts/:id/comments` | Yes | 7 |
| POST | `/api/posts/:id/comments` | Yes | 7 |
| DELETE | `/api/comments/:id` | Yes | 7 |
| GET | `/api/users/me` | Yes | 8 |
| PATCH | `/api/users/me` | Yes | 8 |
| GET | `/api/users/:username` | No | 8 |
| GET | `/api/users/search` | Yes | 8 |
| POST | `/api/users/:username/follow` | Yes | 9 |
| DELETE | `/api/users/:username/follow` | Yes | 9 |
| GET | `/api/users/:username/followers` | Yes | 9 |
| GET | `/api/users/:username/following` | Yes | 9 |

## Security

- Helmet for HTTP headers
- CORS: development allows any `localhost` / `127.0.0.1` origin (Expo Web ports 8081, 8082, etc.); production uses `CLIENT_URL` / `CORS_ORIGIN` allowlist
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
