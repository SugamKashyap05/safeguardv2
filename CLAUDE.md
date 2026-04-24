# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏗️ Architecture Overview

Safeguard is a parental control application for managing children's YouTube viewing experience. The system consists of:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth for parents, custom PIN-based auth for children
- **Real-time**: Socket.IO for real-time updates

### Key Components
- **Parent Portal**: Dashboard for managing children, settings, and monitoring
- **Child Portal**: Kid-friendly interface with safe video player and gamification
- **Content Filtering**: Age-based restrictions and category blocking
- **Screen Time Management**: Daily limits, schedules, and real-time controls
- **Gamification**: Star rewards, badges, and quests for children

## 🚀 Development Commands

### Backend (Node.js/Express)
```bash
cd backend

# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Run database schema migration (Prisma)
npx prisma generate
npx prisma db push

# Apply SQL schema manually
npm run build
tsx src/scripts/apply_schema.ts

# Health check
npm run health-check

# Run manual tests
tsx tests/manual_gamification_test.ts
```

### Frontend (React)
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## 🔧 Environment Setup

### Required Environment Variables (backend/.env)
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Database (Prisma to Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"

# YouTube API
YOUTUBE_API_KEY=your_google_cloud_api_key
YOUTUBE_API_QUOTA_LIMIT=10000

# Security
SESSION_SECRET=your_random_session_secret
JWT_SECRET=your_child_jwt_secret

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 🗄️ Database Management

The application uses two database approaches:

1. **Prisma ORM**: For most data operations with type-safe queries
2. **Raw SQL Schema**: For complex relationships and Supabase RLS policies

### Database Setup Steps
1. Create Supabase project and get connection strings
2. Run Prisma migrations: `npx prisma db push`
3. Apply manual schema: `tsx src/scripts/apply_schema.ts`
4. Verify schema: `tsx scripts/verify-schema.ts`

### Key Database Features
- Row Level Security (RLS) for data isolation
- Complex relationships between parents, children, and content
- Real-time capabilities via Supabase
- Extensive gamification and analytics tables

## 🧪 Testing

### Manual Testing Scripts
- `backend/tests/manual_gamification_test.ts` - Test gamification features
- `backend/scripts/verify-schema.ts` - Verify database schema
- Various migration verification scripts in `backend/scripts/`

### Testing Approach
- Manual integration testing scripts for key features
- No formal unit test suite yet
- Focus on end-to-end functionality verification

## 📁 Project Structure

```
safeguard/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & Supabase config
│   │   ├── controllers/     # Route handlers (17 controllers)
│   │   ├── services/        # Business logic (20 services)
│   │   ├── routes/v1/       # API routes (18 route files)
│   │   ├── middleware/      # Auth middleware
│   │   ├── utils/           # Error handling, response utils
│   │   ├── db/              # Schema & migrations
│   │   ├── scripts/         # Database and utility scripts
│   │   └── tests/           # Manual test scripts
│   ├── prisma/              # Prisma schema and migrations
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components (19 pages)
│   │   ├── components/      # Reusable components (23)
│   │   ├── services/        # API client services
│   │   ├── contexts/        # React contexts
│   │   └── App.tsx          # Routing configuration
│   └── package.json
│
└── CLAUDE.md
```

## 🔐 Authentication System

### Parent Authentication
- Supabase email/password auth
- JWT tokens with 24-hour expiry
- Protected routes via `requireParent` middleware

### Child Authentication  
- PIN-based login (4-6 digits)
- Device-bound sessions with 2-hour expiry
- Lockout after 3 failed attempts
- Custom JWT implementation

## 🎯 Key Features Implementation

### Screen Time Management
- Daily/weekday/weekend limits with rollover logic
- Bedtime mode with configurable hours
- Real-time pause/resume functionality
- Break reminder system

### Content Filtering  
- Age-appropriate level system (preschool to teens)
- Category blocking (gaming, ASMR, etc.)
- Channel approval workflow
- Keyword-based content filtering

### Gamification
- Star reward system for positive behavior
- Badges and achievements
- Daily quests and challenges
- Reward shop system

## 🛠️ Development Tips

1. **Database Changes**: Use Prisma for schema changes, then run `npx prisma generate` and `npx prisma db push`
2. **Complex Features**: Some features require manual SQL schema updates in `src/db/schema.sql`
3. **Real-time**: Use Socket.IO events for real-time parent-child synchronization
4. **YouTube API**: Be mindful of quota limits (10,000 requests/day default)
5. **Security**: All database operations use RLS - test with both parent and child contexts

## 📊 API Structure

The API follows REST conventions with versioning (`/api/v1/`). Key endpoints include:

- `POST /auth/*` - Authentication endpoints
- `GET/PUT /parents/*` - Parent management
- `GET/POST/PUT /children/*` - Child profiles and status
- `GET/PUT /screentime/*` - Screen time rules and usage
- `GET/POST /channels/*` - Channel approval management
- `POST /watch/*` - Video tracking and history
- `GET/POST /playlists/*` - Playlist management
- `GET /reports/*` - Weekly activity reports
- `GET/POST /notifications/*` - Alerts and messages

## 🔄 Recent Development Focus

The project has recently implemented:
- Dashboard integration with weekly reports
- Real-time activity widgets
- Emergency pause all feature
- Content filters UI
- Channel discovery and management
- Playlist drag-and-drop functionality

Use this context to understand the current state and direction of development.