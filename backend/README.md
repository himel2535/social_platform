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
| `MONGODB_URI` | Yes | Development MongoDB connection string (database: `social_platform`) |
| `MONGODB_URI_TEST` | Tests only | Separate test database URI (database must end with `_test`, e.g. `social_platform_test`) |
| `JWT_SECRET` | Yes | JWT signing secret (use a long random string) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `CLIENT_URL` | No | Production frontend origin for CORS. In development, leave empty — all `localhost` Expo Web ports are allowed automatically. |
| `CORS_ORIGIN` | No | Production fallback: comma-separated extra allowed origins |
| `FIREBASE_PROJECT_ID` | Phase 10+ | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Phase 10+ | Service account email |
| `FIREBASE_PRIVATE_KEY` | Phase 10+ | Service account private key. Wrap newlines as `\\n`. Leave empty to disable push locally. |

Never commit the real `.env` file.

## MongoDB Setup

**Local MongoDB:**

```bash
# macOS with Homebrew
brew services start mongodb-community

# Use in .env (development data — never wiped by tests)
MONGODB_URI=mongodb://127.0.0.1:27017/social_platform
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/social_platform_test
```

**MongoDB Atlas:**

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and allow your IP
3. Copy the connection string into `MONGODB_URI` (use database name `social_platform`)
4. For tests, set `MONGODB_URI_TEST` to the same cluster with database name `social_platform_test`

**Important:** Integration tests only clean the test database (`*_test`). They never use or wipe `MONGODB_URI` / `social_platform`.

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

### DELETE /api/posts/:id

Delete a post. Only the post author can delete their own post.

**Example:**

```bash
curl -X DELETE http://localhost:5000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

**Authorization:**

- Post author → 200
- Other users → 403
- Post not found → 404
- Invalid post ID → 400

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

### GET /api/users/:username/posts

Return paginated posts authored by the given username. Authentication is optional (includes `likedByMe` when JWT is provided).

**Example:**

```bash
curl "http://localhost:5000/api/users/johndoe/posts?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Conversations & Messages Endpoints

All conversation endpoints require authentication:

```
Authorization: Bearer <token>
```

Messages are sent and received in real time via Socket.io (see [Socket.io Events](#socketio-events) below). REST endpoints provide conversation list and message history.

### GET /api/conversations

Return all conversations for the authenticated user, sorted by most recent activity.

**Example:**

```bash
curl http://localhost:5000/api/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": {
    "conversations": [
      {
        "conversationId": "userId1_userId2",
        "participant": {
          "_id": "...",
          "name": "Jane Doe",
          "username": "janedoe",
          "avatar": null
        },
        "lastMessage": {
          "text": "Hello!",
          "senderId": "...",
          "createdAt": "...",
          "type": "text",
          "postId": null
        },
        "lastMessageAt": "...",
        "unreadCount": 2
      }
    ]
  }
}
```

### GET /api/conversations/:userId/messages

Return paginated message history with a specific user. Messages are returned newest-first; the client reverses for display.

**Query parameters:**

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `limit` | `30` | `50` | Messages per page |
| `before` | — | — | Message `_id` cursor for loading older messages |

**Example:**

```bash
curl "http://localhost:5000/api/conversations/USER_ID/messages?limit=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": {
    "conversationId": "userId1_userId2",
    "messages": [
      {
        "_id": "...",
        "conversationId": "userId1_userId2",
        "senderId": "...",
        "receiverId": "...",
        "type": "text",
        "text": "Hello!",
        "postId": null,
        "readAt": null,
        "createdAt": "..."
      }
    ],
    "pagination": {
      "limit": 30,
      "hasMore": false,
      "nextBefore": null
    }
  }
}
```

**Message types:**

| Type | Fields | Description |
|------|--------|-------------|
| `text` | `text` required | Standard text message (1–2000 chars) |
| `shared_post` | `postId` required | Shared post reference; `text` defaults to `"Shared a post"` |

## Notifications Endpoints

All notification endpoints require authentication:

```
Authorization: Bearer <token>
```

Notification types: `like`, `comment`, `follow`, `message`.

### GET /api/notifications

Return paginated notifications and unread count for the authenticated user.

**Query parameters:**

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | `1` | — | Page number |
| `limit` | `20` | `50` | Notifications per page |

**Example:**

```bash
curl "http://localhost:5000/api/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "_id": "...",
        "type": "like",
        "read": false,
        "createdAt": "...",
        "actor": {
          "_id": "...",
          "name": "Jane Doe",
          "username": "janedoe",
          "avatar": null
        },
        "post": { "_id": "..." },
        "comment": null,
        "conversationId": null
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

For `message` notifications, `conversationId` is populated and `post`/`comment` are null.

### PATCH /api/notifications/:id/read

Mark a single notification as read.

**Example:**

```bash
curl -X PATCH http://localhost:5000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### PATCH /api/notifications/read-all

Mark all notifications as read for the authenticated user.

**Example:**

```bash
curl -X PATCH http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### POST /api/notifications/device-token

Register an FCM device token for push notifications.

**Request:**

```json
{
  "token": "fcm-device-token-string"
}
```

**Example:**

```bash
curl -X POST http://localhost:5000/api/notifications/device-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_FCM_TOKEN"}'
```

### DELETE /api/notifications/device-token

Remove an FCM device token (e.g. on logout).

**Request:**

```json
{
  "token": "fcm-device-token-string"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:5000/api/notifications/device-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_FCM_TOKEN"}'
```

## Socket.io Events

Socket.io runs on the same HTTP server as the REST API (no `/api` prefix). Connect with JWT authentication in the handshake:

```js
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

On connection, the server joins the socket to room `user:<userId>` for targeted delivery.

### Client → Server Events

#### send_message

Send a text or shared-post message. Uses an acknowledgment callback.

**Payload:**

```json
{
  "receiverId": "USER_OBJECT_ID",
  "text": "Hello!",
  "type": "text",
  "postId": null
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `receiverId` | Yes | Recipient user ID |
| `text` | For `text` type | Message body (1–2000 chars) |
| `type` | No | `text` (default) or `shared_post` |
| `postId` | For `shared_post` | Post ID to share |

**Ack success:**

```json
{
  "success": true,
  "message": "Message sent",
  "data": {
    "message": { "_id": "...", "type": "text", "text": "Hello!", "...": "..." },
    "conversation": { "conversationId": "...", "...": "..." }
  }
}
```

**Ack error:**

```json
{
  "success": false,
  "message": "Too many messages. Please slow down.",
  "code": "RATE_LIMITED"
}
```

#### mark_read

Mark all messages in a conversation as read.

**Payload:** `{ "conversationId": "userId1_userId2" }`

**Ack success:**

```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "conversationId": "...",
    "readByUserId": "...",
    "readAt": "..."
  }
}
```

#### user_typing / user_stopped_typing

**Payload:** `{ "receiverId": "USER_OBJECT_ID" }`

No acknowledgment. Emits to receiver's room.

### Server → Client Events

#### new_message

Emitted to both sender and receiver after a successful `send_message`.

```json
{
  "message": {
    "_id": "...",
    "conversationId": "...",
    "senderId": "...",
    "receiverId": "...",
    "type": "text",
    "text": "Hello!",
    "postId": null,
    "readAt": null,
    "createdAt": "..."
  },
  "conversation": {
    "conversationId": "...",
    "lastMessage": { "text": "Hello!", "senderId": "...", "createdAt": "..." },
    "lastMessageAt": "...",
    "unreadCount": 1
  }
}
```

#### messages_read

Emitted to the other participant when messages are marked read.

```json
{
  "conversationId": "...",
  "readByUserId": "...",
  "readAt": "..."
}
```

#### user_typing / user_stopped_typing

```json
{
  "conversationId": "userId1_userId2",
  "userId": "TYPING_USER_ID"
}
```

#### error

```json
{
  "message": "Validation error description",
  "code": "VALIDATION_ERROR"
}
```

Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED`, `SERVER_ERROR`.

### Push on Offline Receiver

When `send_message` succeeds and the receiver has no active socket in room `user:<receiverId>`, the server creates a `message` notification and sends an FCM push with data:

```json
{
  "type": "message",
  "senderId": "...",
  "conversationId": "...",
  "actorUsername": "...",
  "notificationId": "..."
}
```

## Testing

```bash
npm test
```

Tests connect only to `MONGODB_URI_TEST` (default: `mongodb://127.0.0.1:27017/social_platform_test`). The test suite refuses to run destructive cleanup unless:

- `NODE_ENV=test`
- the database name ends with `_test`
- the database name is not `social_platform`

Set `MONGODB_URI_TEST` in `.env` for Atlas (e.g. same cluster, database `social_platform_test`).

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
├── socket/       # Socket.io auth and message handlers
├── validators/   # Input validation
└── utils/        # Helpers (JWT, responses, errors)
```

## API Routes

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | No |
| POST | `/api/auth/signup` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/me` | Yes |
| POST | `/api/posts` | Yes |
| GET | `/api/posts` | Yes |
| DELETE | `/api/posts/:id` | Yes |
| POST | `/api/posts/:id/like` | Yes |
| DELETE | `/api/posts/:id/like` | Yes |
| GET | `/api/posts/:id/comments` | Yes |
| POST | `/api/posts/:id/comments` | Yes |
| DELETE | `/api/comments/:id` | Yes |
| GET | `/api/users/me` | Yes |
| PATCH | `/api/users/me` | Yes |
| GET | `/api/users/:username` | No |
| GET | `/api/users/search` | Yes |
| GET | `/api/users/:username/posts` | Optional |
| POST | `/api/users/:username/follow` | Yes |
| DELETE | `/api/users/:username/follow` | Yes |
| GET | `/api/users/:username/followers` | Yes |
| GET | `/api/users/:username/following` | Yes |
| GET | `/api/conversations` | Yes |
| GET | `/api/conversations/:userId/messages` | Yes |
| GET | `/api/notifications` | Yes |
| PATCH | `/api/notifications/:id/read` | Yes |
| PATCH | `/api/notifications/read-all` | Yes |
| POST | `/api/notifications/device-token` | Yes |
| DELETE | `/api/notifications/device-token` | Yes |

Real-time messaging uses Socket.io events documented above (`send_message`, `mark_read`, `user_typing`, `user_stopped_typing`, `new_message`, `messages_read`, `error`).

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

The mobile app expects:

- Signup/login: `{ user, token }` inside `data`
- GET `/auth/me`: user object inside `data.user`
- Errors: `{ message: string }` minimum
- JWT payload uses `id` matching MongoDB `_id`
- Socket.io: connect to host without `/api`, auth via `{ auth: { token } }`
- Push: register FCM token via `POST /api/notifications/device-token`

See the root [README.md](../README.md) and [mobile/README.md](../mobile/README.md) for full mobile setup.
