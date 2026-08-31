# TechZugram

**Mini Social Feed App** — a full-stack mobile social platform built as a monorepo (`backend/` + `mobile/`).

Production API: `https://social-platform-f13o.onrender.com/api`

---

## Project Overview

TechZugram is a social feed mobile app where users sign up, post text updates, like and comment on posts, follow other users, receive push notifications, and chat in real time. The app features a dark glassmorphism UI with custom TechZugram branding.

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo ~57, Expo Router, TypeScript |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Real-time | Socket.io (1-on-1 messaging, typing, read receipts) |
| Push | Firebase Cloud Messaging (FCM) via Firebase Admin + expo-notifications |
| Auth | JWT (bcrypt password hashing) |

---

## Core Requirements

These were the original assignment deliverables:

- **JWT authentication** — email/password signup and login; protected routes on backend and mobile auth guard
- **Text posts** — create and display text-only posts
- **Paginated feed** — server-side pagination (`page`, `limit`)
- **Like / comment** — like/unlike posts; add and view comments with counts
- **FCM push notifications** — push alerts for likes and comments (also extended to follows and DMs)
- **Filter feed by username** — client-side username filter on the feed
- **GitHub repo + README + APK** — monorepo on GitHub, this README, Android APK via EAS Build

---

## Beyond Requirements

> Everything below was built **beyond the original scope** to demonstrate extra effort and production-quality UX.

### Real-Time 1-on-1 Direct Messaging (Socket.io)

- Conversations inbox sorted by most recent activity
- Chat threads with optimistic send and message grouping by sender/day
- Typing indicators (in thread and inbox preview)
- Read receipts (single check = delivered, double teal check = read)
- Compose new conversation from followers/following (searchable)
- **In-app post sharing to chats** — share a post as a `shared_post` message with tappable preview card
- **Push notifications for new messages** when receiver is offline (no active socket)

### Post Interactions (Beyond Like/Comment)

- **Delete** own posts with custom glass confirmation modal; syncs across all local lists via event-based cache
- **Report** post (UI wired; placeholder — no backend endpoint yet)
- **In-app share sheet** — share to recent conversations, mutuals, or following; sends `shared_post` via Socket.io
- **Native OS share fallback** + copy link to post

### UI / UX Polish

- Full **dark glassmorphism theme** (blur cards, toasts, search bar, modals) via `expo-blur` + custom glass tokens
- **Skeleton loading states** for feed, pagination, comments, and messages — replacing spinners
- **Custom app branding** — TechZugram logo, icon, splash screen
- **Optimistic updates** for comments, likes, and sent messages
- **Sticky bottom tab navigation** on all nested screens (post detail, chat thread, profile sub-routes)

### Performance Optimizations

- **FlatList tuning** — `windowSize`, `maxToRenderPerBatch`, `removeClippedSubviews`, stable keys
- **Event-based cache sync** (`feedEvents`, `postCache`) instead of full feed refetches after delete/share actions

### Additional Features Not in Original Brief

- Follow / unfollow users with followers and following lists
- User search by name or username
- Profile view and edit (name, bio, avatar URL)
- In-app notification inbox with unread badges and tap-to-navigate
- Desktop responsive layout with sidebar navigation
- Dev preview mode for UI development without backend

---

## Tech Stack

### Backend

| Package | Why |
|---------|-----|
| **Express** | REST API framework |
| **MongoDB + Mongoose** | Users, posts, comments, conversations, messages, notifications |
| **jsonwebtoken + bcryptjs** | JWT sessions; password hashing (12 rounds) |
| **Socket.io** | Real-time messaging on the same HTTP server |
| **firebase-admin** | Server-side FCM push delivery |
| **express-validator** | Request body/query validation |
| **helmet, cors, express-rate-limit** | Security headers, CORS, rate limiting |

### Mobile

| Package | Why |
|---------|-----|
| **Expo ~57 + Expo Router** | Cross-platform app; file-based navigation (`src/app/`) |
| **React Native** | Native UI components |
| **Axios** | REST API client |
| **socket.io-client** | Real-time messaging |
| **expo-blur, expo-linear-gradient** | Glassmorphism UI |
| **expo-notifications + expo-device** | FCM push (requires EAS build, not Expo Go) |
| **expo-secure-store** | Secure JWT storage on device |
| **expo-clipboard, expo-image** | Copy link; optimized image loading |

---

## Project Structure

```
social_platform/
├── README.md                 # This file — single project documentation
├── package.json              # Monorepo convenience scripts
├── backend/                  # Express REST API + Socket.io
│   ├── server.js             # HTTP server + Socket.io init
│   └── src/
│       ├── config/           # Database, Firebase, CORS
│       ├── controllers/
│       ├── middleware/       # Auth, validation, errors, rate limiting
│       ├── models/           # User, Post, Comment, Message, Conversation, Notification
│       ├── routes/
│       ├── services/
│       ├── socket/           # Socket auth + message handlers
│       └── validators/
└── mobile/                   # Expo React Native app
    ├── src/
    │   ├── app/              # Expo Router screens
    │   │   ├── (auth)/       # Login, signup
    │   │   └── (tabs)/       # Tab navigator + nested stacks
    │   │       ├── index.tsx           # Feed
    │   │       ├── messages/           # Inbox, compose, thread
    │   │       ├── post/               # Post detail (hidden tab)
    │   │       └── profile/            # Profile, followers, edit
    │   ├── components/       # UI, feed, messages, comments
    │   ├── context/          # Auth, Socket, Messaging, Notifications
    │   ├── hooks/
    │   ├── services/         # API clients
    │   ├── theme/            # Colors, glass tokens, spacing
    │   └── utils/
    ├── assets/               # App icon, splash, branding
    ├── app.json              # Expo config
    └── eas.json              # EAS Build profiles
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Expo CLI / EAS CLI (for mobile builds)
- Firebase project (for push notifications on device)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, and optional FIREBASE_* vars
npm run dev
```

Health check:

```bash
curl http://localhost:5000/api/health
```

### Mobile

```bash
cd mobile
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL (see Environment Variables)
npx expo start
```

**From repo root (convenience):**

```bash
npm run backend:dev    # Terminal 1
npm run mobile:start   # Terminal 2
```

| Platform | API URL |
|----------|---------|
| iOS Simulator / Web | `http://localhost:5000/api` |
| Android Emulator | `http://10.0.2.2:5000/api` |
| Physical device | `http://<YOUR_LAN_IP>:5000/api` |

Socket.io URL is derived automatically by stripping `/api` from `EXPO_PUBLIC_API_URL`.

### Build APK (EAS)

> Always run EAS commands from `mobile/`, not the monorepo root.

```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

| Profile | Use case | API URL |
|---------|----------|---------|
| `development` | Dev client with debugging | Local (configure manually) |
| `preview` | Internal testing APK | Render production API |
| `production` | Release APK | Render production API |

Requires `google-services.json` (not committed) and EAS credentials for real FCM on device. Download the APK from the EAS dashboard when the build completes.

---

## API Documentation

All REST endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | No | Create account |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/auth/me` | Yes | Current authenticated user |

### Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/posts` | Yes | Paginated feed (`page`, `limit`) |
| POST | `/posts` | Yes | Create text post |
| DELETE | `/posts/:id` | Yes | Delete own post |
| POST | `/posts/:id/like` | Yes | Like post |
| DELETE | `/posts/:id/like` | Yes | Unlike post |

### Comments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/posts/:id/comments` | Yes | Paginated comments |
| POST | `/posts/:id/comments` | Yes | Add comment |
| DELETE | `/comments/:id` | Yes | Delete own comment |

### Users & Follow

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | Yes | Own profile |
| PATCH | `/users/me` | Yes | Update name, bio, avatar |
| GET | `/users/search` | Yes | Search users (`q`, `page`, `limit`) |
| GET | `/users/:username` | Optional | Public profile |
| GET | `/users/:username/posts` | Optional | User's posts |
| POST | `/users/:username/follow` | Yes | Follow user |
| DELETE | `/users/:username/follow` | Yes | Unfollow user |
| GET | `/users/:username/followers` | Yes | Followers list |
| GET | `/users/:username/following` | Yes | Following list |

### Conversations & Messages (REST)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/conversations` | Yes | List conversation previews |
| GET | `/conversations/:userId/messages` | Yes | Message history (`limit`, `before` cursor) |

Real-time send/receive uses Socket.io (below).

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Yes | Paginated notifications + unread count |
| PATCH | `/notifications/:id/read` | Yes | Mark one read |
| PATCH | `/notifications/read-all` | Yes | Mark all read |
| POST | `/notifications/device-token` | Yes | Register FCM token |
| DELETE | `/notifications/device-token` | Yes | Remove FCM token |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Server health check |

---

## Socket.io Events

Connect to the same host as the API (no `/api` suffix), e.g. `http://localhost:5000`. Authenticate with JWT in the handshake:

```js
io(url, { auth: { token: '<jwt>' } })
```

On connect, the server joins the socket to room `user:<userId>`.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `send_message` | `{ receiverId, text?, type?, postId? }` | Send text or `shared_post` message. Ack: `{ success, message?, code?, data? }` |
| `mark_read` | `{ conversationId }` | Mark conversation read for current user |
| `user_typing` | `{ receiverId }` | Notify receiver of typing |
| `user_stopped_typing` | `{ receiverId }` | Notify receiver typing stopped |

**`send_message` types:**

- `text` (default): `text` required (1–2000 chars)
- `shared_post`: `postId` required; `text` defaults to `"Shared a post"`

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ message, conversation }` | New message for sender or receiver |
| `messages_read` | `{ conversationId, readByUserId, readAt }` | Other user read messages |
| `user_typing` | `{ conversationId, userId }` | Someone is typing |
| `user_stopped_typing` | `{ conversationId, userId }` | Typing stopped |
| `error` | `{ message, code }` | Validation / rate limit / server error |

**Message object shape:**

```json
{
  "_id": "...",
  "conversationId": "userId1_userId2",
  "senderId": "...",
  "receiverId": "...",
  "type": "text",
  "text": "Hello",
  "postId": null,
  "readAt": null,
  "createdAt": "..."
}
```

When the receiver has no active socket, the server creates a `message` notification and sends an FCM push.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `5000`) |
| `NODE_ENV` | No | `development` / `production` / `test` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_URI_TEST` | Tests | Separate test DB (name must end with `_test`) |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | No | Token expiry (default `7d`) |
| `CLIENT_URL` | Prod | Frontend origin for CORS |
| `CORS_ORIGIN` | No | Comma-separated extra allowed origins |
| `FIREBASE_PROJECT_ID` | Push | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Push | Service account email |
| `FIREBASE_PRIVATE_KEY` | Push | Service account key (`\n` for newlines). Empty = push disabled locally |

### Mobile (`mobile/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API base URL including `/api` |

**Local overrides** (create `mobile/.env.local`):

| Platform | Example URL |
|----------|-------------|
| iOS simulator / web | `http://localhost:5000/api` |
| Android emulator | `http://10.0.2.2:5000/api` |
| Physical device | `http://<YOUR_LAN_IP>:5000/api` |

Never commit real secrets. Only `EXPO_PUBLIC_*` vars are embedded in the client bundle.

---

## Deployment

### Backend (Render)

- Hosted on Render; **auto-deploys on push to `main`**
- Set all backend env vars in the Render dashboard
- Production URL: `https://social-platform-f13o.onrender.com`

### Mobile (EAS Build)

- Android APK builds via EAS (`eas build --platform android` from `mobile/`)
- `preview` and `production` profiles point to the Render API
- Push notifications require a physical device or dev/production build with FCM configured

---

## Testing

```bash
cd backend
npm test
```

Integration tests cover auth, posts, likes, comments, users, follow, notifications, and messages. Tests use `MONGODB_URI_TEST` only.

---

## Security

- Passwords hashed with bcrypt; never returned in API responses
- JWT secrets and Firebase credentials in environment variables only
- Input validation on all endpoints; Helmet, CORS, and rate limiting enabled
- Message rate limiting on socket send
- Post/comment delete restricted to authors

---

## License

ISC (backend). Private monorepo.
