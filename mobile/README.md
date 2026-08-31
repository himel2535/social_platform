# TechZugram Mobile

React Native + Expo mobile app for [TechZugram](../README.md) — a social feed with real-time messaging, push notifications, and a dark glassmorphism UI.

## Prerequisites

- Node.js 18+
- npm
- [Expo Go](https://expo.dev/go) or an EAS development build (required for push notifications)
- Running backend (local or deployed on Render)

## Setup

```bash
cd mobile
npm install
cp .env.example .env
```

Configure `EXPO_PUBLIC_API_URL` in `.env` (see [Environment Variables](#environment-variables)).

Start the dev server:

```bash
npx expo start
```

From the repo root:

```bash
npm run mobile:start
```

### Platform notes

| Platform | How to run | API URL |
|----------|------------|---------|
| iOS Simulator | Press `i` in Expo CLI | `http://localhost:5000/api` |
| Android Emulator | Press `a` in Expo CLI | `http://10.0.2.2:5000/api` |
| Physical device | Scan QR code (same Wi-Fi) | `http://<YOUR_LAN_IP>:5000/api` |
| Web | Press `w` in Expo CLI | `http://localhost:5000/api` |

For local overrides without editing `.env`, create `mobile/.env.local`:

```bash
# iOS simulator / web
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# Android emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api

# Physical device (replace with your machine's LAN IP)
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

The Socket.io URL is derived automatically from `EXPO_PUBLIC_API_URL` by removing the `/api` suffix.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend REST API base URL including `/api` |

Default in `.env.example` points to production:

```
EXPO_PUBLIC_API_URL=https://social-platform-f13o.onrender.com/api
```

Never commit real secrets. Only `EXPO_PUBLIC_*` vars are embedded in the client bundle.

## Project Structure

```
mobile/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root providers + stack
│   ├── index.tsx               # Auth redirect
│   ├── (auth)/                 # Login, signup
│   └── (tabs)/                 # Bottom tab navigator
│       ├── index.tsx           # Feed
│       ├── search.tsx          # User search
│       ├── create.tsx          # New post
│       ├── notifications.tsx   # Alerts inbox
│       ├── messages/           # Messaging stack (inbox, compose, thread)
│       ├── post/               # Post detail (hidden from tab bar)
│       └── profile/            # Profile, followers, edit
├── src/
│   ├── components/
│   │   ├── ui/                 # GlassCard, Toast, ConfirmDialog, etc.
│   │   ├── feed/               # PostCard, SearchBar, SharePostSheet
│   │   ├── messages/           # MessageBubble, ConversationListItem
│   │   ├── comments/           # CommentItem, CommentInput
│   │   └── navigation/         # DesktopSidebar, SplashScreenController
│   ├── context/                # Auth, Socket, Messaging, Notifications
│   ├── hooks/                  # useAuth, useSocket, useMessaging, usePushNotifications
│   ├── services/               # API clients (auth, posts, messages, notifications)
│   ├── theme/                  # colors, glass tokens, spacing, typography
│   └── utils/                  # feedEvents, postCache, messageList
├── assets/                     # App icon, splash, branding images
├── app.json                    # Expo config (TechZugram branding)
└── eas.json                    # EAS Build profiles
```

## Features (Mobile)

- **Feed:** paginated posts, username filter, glass cards, skeleton loaders
- **Interactions:** like, comment, share (in-app + native), delete with confirm modal
- **Messaging:** inbox, threads, typing indicators, read receipts, shared post previews
- **Notifications:** in-app list, unread badges, FCM push with tap navigation
- **Profile:** view/edit, followers/following, user search
- **UI:** dark glass theme, sticky bottom tabs on all nested screens, desktop sidebar

## Push Notifications

Push requires a **development build** or **production APK** — Expo Go does not support real FCM.

1. Add `google-services.json` to the project (do not commit)
2. Configure Firebase in EAS credentials
3. Build with EAS (see below)
4. Backend must have `FIREBASE_*` env vars set

The app registers the FCM token on login via `POST /api/notifications/device-token`.

## Build APK (EAS)

Install EAS CLI and log in:

```bash
npm install -g eas-cli
eas login
```

Build profiles in `eas.json`:

| Profile | Use case | API URL |
|---------|----------|---------|
| `development` | Dev client with debugging | Local (configure manually) |
| `preview` | Internal testing APK | Render production API |
| `production` | Release APK | Render production API |

```bash
# Production APK
eas build --platform android --profile production

# Preview / internal testing
eas build --platform android --profile preview
```

Download the APK from the EAS dashboard when the build completes.

## Development Tips

- **Preview mode:** In `__DEV__`, use DevPreviewControls to browse UI with mock data without a backend
- **TypeScript:** Run `npx tsc --noEmit` to type-check
- **Lint:** Run `npm run lint`

## API & Socket Documentation

REST endpoints and Socket.io events are documented in:

- [Root README](../README.md) — overview and endpoint tables
- [Backend README](../backend/README.md) — detailed curl examples and payload shapes

## Deployment

- Mobile builds are produced via **EAS Build** (not committed to the repo)
- Backend is deployed on **Render** and auto-deploys on push to `main`
- Production API: `https://social-platform-f13o.onrender.com/api`
