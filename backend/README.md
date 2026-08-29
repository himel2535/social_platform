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
| `NODE_ENV` | No | development / production |
| `MONGODB_URI` | Yes* | MongoDB connection string |
| `JWT_SECRET` | Phase 2+ | JWT signing secret |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) |
| `CORS_ORIGIN` | No | Allowed origin (default: *) |
| `FIREBASE_PROJECT_ID` | Phase 10+ | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Phase 10+ | Service account email |
| `FIREBASE_PRIVATE_KEY` | Phase 10+ | Service account private key |

*Server starts without MongoDB in foundation phase but database is required for auth and posts.

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

## Architecture

```
Routes → Controllers → Services → Models
```

### Folder Structure

```
src/
├── config/       # Database, Firebase
├── controllers/  # Request handlers
├── middleware/   # Auth, errors, rate limiting
├── models/       # Mongoose schemas
├── routes/       # Route definitions
├── services/     # Business logic
├── validators/   # Input validation
└── utils/        # Helpers
```

## API Routes (Planned)

| Method | Endpoint | Phase |
|--------|----------|-------|
| GET | `/api/health` | 1 |
| POST | `/api/auth/signup` | 2 |
| POST | `/api/auth/login` | 2 |
| GET | `/api/auth/me` | 2 |
| POST | `/api/posts` | 3 |
| GET | `/api/posts` | 3 |
| POST | `/api/posts/:id/like` | 4 |
| POST | `/api/posts/:id/comment` | 5 |
| GET | `/api/posts/:id/comments` | 5 |
| POST | `/api/users/fcm-token` | 10 |

## Security

- Helmet for HTTP headers
- CORS configuration
- Rate limiting on `/api/*`
- JWT authentication (Phase 2)
- Password hashing with bcryptjs (Phase 2)
- Input validation with express-validator (Phase 2+)
- Passwords never returned in responses
