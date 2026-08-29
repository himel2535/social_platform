# Mini Social Feed App

**Product name:** TechZugram

## Overview

A lightweight social media application where users can sign up, log in, create text-only posts, view a shared feed, like/unlike posts, comment on posts, filter the feed by username, and receive real-time push notifications via Firebase Cloud Messaging.

This repository is a monorepo containing both the backend API and the mobile application.

## Features

- User authentication (signup, login)
- Text-only post creation
- Shared newsfeed with pagination
- Like/unlike posts
- Comment on posts
- Filter feed by username
- Push notifications for likes and comments (Firebase Cloud Messaging)

## Tech Stack

### Backend
- Node.js, Express.js
- MongoDB, Mongoose
- JWT, bcryptjs
- express-validator, Helmet, CORS, rate limiting
- Firebase Admin SDK (FCM)

### Mobile
- React Native, Expo, Expo Router
- Axios
- Firebase Cloud Messaging (via expo-notifications + EAS build)

## Architecture

```
React Native + Expo
│
│ REST API
▼
Node.js + Express
│
▼
MongoDB

Node.js + Express
│
▼
Firebase Admin SDK
│
▼
Firebase Cloud Messaging
│
▼
Android Device
```

## Repository Structure

```
mini-social-feed/
├── backend/          # Express API
├── mobile/           # Expo React Native app
├── README.md
├── .gitignore
└── package.json      # Convenience scripts only
```

## Backend Setup

See [backend/README.md](./backend/README.md) for detailed setup.

```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

## Mobile Setup

```bash
cd mobile
npm install
cp .env.example .env
# Configure EXPO_PUBLIC_API_URL
npx expo start
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | development / production |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token expiry (e.g. 7d) |
| `CORS_ORIGIN` | Allowed CORS origin |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key |

### Mobile (`mobile/.env`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |

## API Documentation

API endpoints will be implemented in subsequent phases:

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/health` | Available |
| POST | `/api/auth/signup` | Phase 2 |
| POST | `/api/auth/login` | Phase 2 |
| GET | `/api/auth/me` | Phase 2 |
| POST | `/api/posts` | Phase 3 |
| GET | `/api/posts` | Phase 3 |
| POST | `/api/posts/:id/like` | Phase 4 |
| POST | `/api/posts/:id/comment` | Phase 5 |
| GET | `/api/posts/:id/comments` | Phase 5 |
| POST | `/api/users/fcm-token` | Phase 10 |

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Add an Android app with the package name from `mobile/app.json`
4. Download `google-services.json` (do not commit)
5. Generate a service account key for the backend Admin SDK
6. Set `FIREBASE_*` environment variables in backend `.env`
7. Configure EAS credentials for FCM when building APK

## Running Locally

```bash
# Terminal 1 - Backend
npm run backend:dev

# Terminal 2 - Mobile
npm run mobile:start
```

## Testing

Testing will be implemented in Phase 13.

## Building APK

APK build via EAS will be documented in Phase 15:

```bash
cd mobile
eas build --platform android --profile production
```

Requires EAS CLI and configured credentials.

## Deployment

Backend deployment to Railway/Render will be documented in Phase 14.

## Screenshots

Screenshots will be added after UI implementation is complete.

## Security Considerations

- Passwords are hashed with bcrypt before storage
- JWT tokens for authentication; secrets stored in environment variables
- Input validation on all API endpoints
- Helmet, CORS, and rate limiting enabled
- Passwords and tokens never returned in API responses
- Firebase credentials never committed to the repository
