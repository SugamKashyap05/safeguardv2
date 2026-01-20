# Backend Architecture

## Overview

The backend is built with Node.js, Express, and TypeScript, using Supabase as the database.

## Directory Structure

```
backend/src/
├── config/
│   ├── env.ts           # Environment variables
│   └── supabase.ts      # Supabase client configuration
│
├── controllers/         # HTTP request handlers
│   ├── auth.controller.ts
│   ├── channel.controller.ts
│   ├── child.controller.ts
│   ├── content-filter.controller.ts
│   ├── dashboard.controller.ts
│   ├── device.controller.ts
│   ├── emergency.controller.ts
│   ├── health.controller.ts
│   ├── notification.controller.ts
│   ├── parent.controller.ts
│   ├── playlist.controller.ts
│   ├── recommendation.controller.ts
│   ├── report.controller.ts
│   ├── screen-time.controller.ts
│   ├── search.controller.ts
│   ├── watch.controller.ts
│   └── youtube.controller.ts
│
├── services/            # Business logic layer
│   ├── auth.service.ts
│   ├── child-auth.service.ts      # Child PIN login
│   ├── child.service.ts
│   ├── content-filter.service.ts  # Video filtering logic
│   ├── device.service.ts
│   ├── notification.service.ts
│   ├── parent.service.ts
│   ├── playlist.service.ts
│   ├── recommendation.service.ts
│   ├── report.service.ts
│   ├── screen-time.service.ts
│   ├── search.service.ts          # Safe search
│   └── activity-tracking.service.ts
│
├── middleware/
│   └── auth.middleware.ts         # JWT verification
│
├── routes/v1/           # API route definitions
│   ├── index.ts         # Route aggregator
│   └── [feature].routes.ts
│
├── utils/
│   ├── AppError.ts      # Custom error class
│   ├── asyncWrapper.ts  # Async error handling
│   ├── httpStatus.ts    # Status code constants
│   └── response.ts      # Standard API responses
│
└── db/
    └── schema.sql       # Database schema
```

## Key Services

### ChildAuthService
Handles child PIN-based authentication with:
- PIN verification with bcrypt
- Lockout after failed attempts
- Session token generation
- Screen time & bedtime validation

### ContentFilterService
Manages video content filtering:
- Age-based restrictions
- Category blocking
- Channel whitelist/blacklist
- Keyword detection

### ScreenTimeService
Controls screen time rules:
- Daily/weekly limits
- Usage tracking
- Bedtime mode enforcement
- Time extension grants

### ActivityTrackingService
Logs all viewing activity:
- Watch session start/end
- Progress updates
- Blocked attempt logging
- Statistics generation

## Database Schema

### Core Tables
- `parents` - Parent accounts
- `children` - Child profiles
- `devices` - Registered devices

### Rules & Filters
- `screen_time_rules` - Time limits per child
- `content_filters` - Filter settings
- `approved_channels` - Whitelisted channels

### Activity
- `watch_history` - Video watching logs
- `activity_logs` - General activity events
- `notifications` - Parent alerts

### Content
- `playlists` - User playlists
- `playlist_items` - Videos in playlists

## Authentication Flow

### Parent Login
1. Frontend calls Supabase Auth
2. Supabase returns JWT
3. JWT included in API requests
4. `requireParent` middleware validates

### Child Login
1. Frontend sends childId + PIN
2. `ChildAuthService.loginChild()` validates
3. Checks: PIN, lockout, pause, screen time, bedtime
4. Returns custom JWT (2-hour expiry)
5. `requireChild` middleware validates

## Error Handling

All errors use `AppError` class:
```typescript
throw new AppError('Message', HTTP_STATUS.BAD_REQUEST);
```

Async wrapper catches all errors:
```typescript
router.get('/path', asyncWrapper(controller.method));
```

## Environment Variables

```env
PORT=5000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
JWT_SECRET=xxx
YOUTUBE_API_KEY=xxx (optional)
```
