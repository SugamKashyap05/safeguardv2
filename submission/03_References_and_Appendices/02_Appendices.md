
# APPENDICES

<br>

## Appendix A: Project Code Structure

```
safeguard/
├── backend/
│   ├── src/
│   │   ├── config/                    # Environment & Supabase configuration
│   │   │   ├── env.ts                 # Environment variable validation
│   │   │   └── supabase.ts            # Supabase client initialization
│   │   ├── controllers/               # HTTP Request Handlers (17 controllers)
│   │   │   ├── authController.ts      # Parent authentication
│   │   │   ├── childAuthController.ts # Child PIN-based authentication
│   │   │   ├── childController.ts     # Child CRUD operations
│   │   │   ├── screenTimeController.ts# Screen time rule management
│   │   │   ├── channelController.ts   # Channel approval/blocking
│   │   │   ├── watchController.ts     # Watch history tracking
│   │   │   ├── filterController.ts    # Content filter configuration
│   │   │   ├── deviceController.ts    # Device management
│   │   │   ├── notificationController.ts # Notification handling
│   │   │   ├── reportController.ts    # Weekly report generation
│   │   │   ├── playlistController.ts  # Playlist management
│   │   │   ├── questController.ts     # Daily quest management
│   │   │   ├── badgeController.ts     # Badge/achievement tracking
│   │   │   ├── searchController.ts    # Safe search functionality
│   │   │   ├── approvalController.ts  # Content approval workflow
│   │   │   ├── gamificationController.ts # XP/Stars management
│   │   │   └── settingsController.ts  # Parent settings
│   │   ├── services/                  # Business Logic Layer (20 services)
│   │   ├── routes/v1/                 # API Routes (18 route files)
│   │   ├── middleware/                # Authentication & error middleware
│   │   ├── utils/                     # Utility functions
│   │   └── db/                        # Database schema & migrations
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                     # Page Components (19 pages)
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── OnboardingPage.tsx
│   │   │   ├── ParentDashboard.tsx
│   │   │   ├── ChildDashboard.tsx
│   │   │   ├── ScreenTimePage.tsx
│   │   │   ├── ContentFiltersPage.tsx
│   │   │   ├── ChannelsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── ActivityPage.tsx
│   │   │   ├── DevicesPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── ChildVideoPlayer.tsx
│   │   │   ├── ChildPlaylistsPage.tsx
│   │   │   ├── ChildQuestsPage.tsx
│   │   │   ├── ChildBadgesPage.tsx
│   │   │   ├── ChildAvatarPage.tsx
│   │   │   └── ChildSearchPage.tsx
│   │   ├── components/                # Reusable Components (23 components)
│   │   ├── services/                  # API Client Services
│   │   ├── contexts/                  # React Context Providers
│   │   ├── hooks/                     # Custom React Hooks
│   │   └── App.tsx                    # Root Component with Routing
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── submission/                        # Documentation (this folder)
└── README.md
```

<br>

## Appendix B: Database Schema (Entity-Relationship Overview)

The complete database schema consists of the following 20+ tables organized by functional domain:

### B.1 User Management
- `parents` — Parent accounts linked to Supabase Auth
- `children` — Child profiles with age restrictions, PIN authentication, and gamification stats

### B.2 Access Control
- `child_sessions` — Token-based session management with expiry
- `devices` — Registered device tracking with pause capabilities

### B.3 Content Management
- `approved_channels` — Parent-approved channel whitelist
- `approved_videos` — Individually approved videos
- `blocked_content` — Explicitly blocked content entries
- `content_filters` — Per-child filtering configuration (keywords, categories, strict mode)
- `approval_requests` — Pending content approval queue

### B.4 Activity Tracking
- `watch_history` — Complete viewing record with duration and completion tracking
- `search_history` — Search queries with flagging capability
- `session_sync` — Cross-device session synchronization
- `activity_logs` — System-wide audit trail

### B.5 Gamification
- `child_badges` — Earned achievement badges
- `child_inventory` — Avatar customization items
- `daily_quests` — Daily challenge tracking

### B.6 Communication
- `notifications` — Parent notification inbox
- `child_notifications` — Child notification inbox

### B.7 Analytics & Reporting
- `weekly_reports` — Automated weekly summary reports
- `screen_time_rules` — Time management configuration and daily usage tracking

### B.8 Content Curation
- `playlists` — User-created content lists
- `playlist_items` — Individual items within playlists

<br>

## Appendix C: API Endpoint Summary

| HTTP Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/signup` | Parent registration |
| POST | `/api/v1/auth/login` | Parent login |
| POST | `/api/v1/auth/child/login` | Child PIN login |
| GET | `/api/v1/parents/profile` | Get parent profile |
| PUT | `/api/v1/parents/profile` | Update parent profile |
| POST | `/api/v1/children` | Create child profile |
| GET | `/api/v1/children` | List all children |
| GET | `/api/v1/children/:id` | Get child details |
| PUT | `/api/v1/children/:id` | Update child profile |
| GET | `/api/v1/screentime/:childId` | Get screen time rules |
| PUT | `/api/v1/screentime/:childId` | Update screen time rules |
| POST | `/api/v1/screentime/:childId/pause` | Pause child access |
| POST | `/api/v1/screentime/:childId/resume` | Resume child access |
| GET | `/api/v1/channels/:childId` | Get approved channels |
| POST | `/api/v1/channels/:childId/approve` | Approve a channel |
| POST | `/api/v1/channels/:childId/block` | Block a channel |
| GET | `/api/v1/watch/:childId/history` | Get watch history |
| POST | `/api/v1/watch/:childId/log` | Log video watch |
| GET | `/api/v1/filters/:childId` | Get content filters |
| PUT | `/api/v1/filters/:childId` | Update content filters |
| GET | `/api/v1/reports/:parentId` | Get weekly reports |
| GET | `/api/v1/notifications` | Get notifications |
| PUT | `/api/v1/notifications/:id/read` | Mark notification read |
| GET | `/api/v1/devices/:childId` | Get registered devices |
| POST | `/api/v1/devices/:childId/register` | Register new device |
| GET | `/api/v1/quests/:childId` | Get daily quests |
| POST | `/api/v1/quests/:childId/progress` | Update quest progress |
| GET | `/api/v1/badges/:childId` | Get earned badges |
| GET | `/api/v1/playlists/:childId` | Get playlists |
| POST | `/api/v1/playlists/:childId` | Create playlist |
| POST | `/api/v1/approval-requests` | Submit approval request |
| GET | `/api/v1/approval-requests/:parentId` | Get pending approvals |
