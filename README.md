# Safeguard - Kids' Safe YouTube Platform

A comprehensive parental control application for managing children's YouTube viewing experience with screen time limits, content filtering, and activity monitoring.

## 🎯 Overview

Safeguard provides a complete solution for parents to create a safe YouTube experience for their children:

- **Screen Time Management** - Daily limits, weekday/weekend schedules, bedtime mode
- **Content Filtering** - Age-based restrictions, category blocking, channel approval
- **Activity Monitoring** - Watch history, blocked content logs, weekly reports
- **Multiple Child Profiles** - Manage multiple children with individual settings
- **Device Management** - Track and manage connected devices
- **Real-time Controls** - Instant pause/resume, emergency actions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Child Portal │  │Parent Portal │  │   Onboarding Flow    │   │
│  │  Dashboard   │  │  Dashboard   │  │   (Signup/Setup)     │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API + WebSocket
┌───────────────────────────┴─────────────────────────────────────┐
│                     Backend (Node.js/Express)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐   │
│  │   Auth     │  │  Parental  │  │  Content   │  │  Watch   │   │
│  │  Service   │  │  Controls  │  │  Filter    │  │ Tracking │   │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                       Supabase (PostgreSQL)                      │
│  parents, children, devices, screen_time_rules, watch_history   │
│  approved_channels, notifications, playlists, activity_logs    │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

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
│   │   └── db/              # Schema & migrations
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
└── README.md
```

## 🔐 Authentication

### Parent Authentication
- Supabase Auth with email/password
- JWT tokens with 24-hour expiry
- Protected routes via `requireParent` middleware

### Child Authentication  
- PIN-based login (4-6 digits)
- Device-bound sessions
- 2-hour session expiry
- Lockout after 3 failed attempts

## 📱 Features

### Parent Dashboard
- Family overview with activity stats
- Quick actions (Pause All, Reports)
- Per-child screen time progress
- Notification center

### Child Dashboard
- Kid-friendly interface
- Safe video player with custom controls
- Personalized recommendations
- Playlist management
- Real-time timer display

### Screen Time Management
- Daily/weekday/weekend limits
- Bedtime mode with start/end times
- Break reminders
- Extend time on demand
- Pause/resume access

### Content Filtering
- Age-appropriate restrictions
- Category blocking (gaming, ASMR, etc.)
- Channel approval workflow
- Safe search enforcement

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth + custom JWT for children
- **Real-time**: Socket.IO

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Charts**: Recharts
- **State**: React hooks + Context
- **Routing**: React Router v6

## 📊 API Endpoints

See [API Documentation](./docs/API.md) for complete endpoint reference.

### Core APIs
| Endpoint | Description |
|----------|-------------|
| `/auth/*` | Authentication |
| `/parents/*` | Parent management |
| `/children/*` | Child CRUD & status |
| `/screentime/*` | Time rules & usage |
| `/channels/*` | Channel approval |
| `/watch/*` | Video tracking |
| `/playlists/*` | Playlist management |
| `/reports/*` | Weekly reports |
| `/notifications/*` | Alerts & messages |

## 🔄 Recent Updates

### Dashboard Integration (Latest)
- ✅ Reports page with weekly insights
- ✅ Activity page with watch history
- ✅ Emergency Pause All feature
- ✅ Content Filters UI
- ✅ Channel discovery & management
- ✅ Real-time activity widgets

### Previous Features
- ✅ Playlists & Favorites
- ✅ Drag-and-drop reordering
- ✅ Parent settings page
- ✅ Device management
- ✅ Notification system

## 📄 License

MIT License - See LICENSE file for details.
