
# CHAPTER-3: CONCEPTUAL STUDY AND SEMINAR WORK

## 3.1 System Architecture

SafeGuard employs a three-tier **Client-Server Architecture** with a real-time communication layer, designed for modularity, scalability, and separation of concerns. The architecture consists of the following primary components:

### 3.1.1 Frontend (Presentation Tier)

The frontend is built using **React 18 with TypeScript** and bundled via **Vite** for optimized development and production builds. It serves two distinct user interfaces through a unified codebase:

**Parent Dashboard:** A comprehensive management interface providing:
- Family overview with real-time activity widgets
- Per-child screen time progress visualization using Recharts
- Content filter configuration panels
- Channel discovery and approval workflow
- Notification center with priority-based alerts
- Weekly report generation and viewing
- Device management console
- Emergency "Pause All" action

**Child Interface:** A simplified, age-appropriate interface featuring:
- Safe video player with custom controls (no direct URL access)
- Personalized content recommendations
- Playlist management (Favorites, Watch Later, Custom)
- Real-time screen time countdown display
- Gamification dashboard (Stars, Badges, Quests, Avatar)
- Break reminder overlays

The frontend utilizes **React Router v6** for client-side routing with protected routes, **React Context API** for global state management (authentication, theme, child selection), and **Framer Motion** for fluid micro-animations and page transitions.

### 3.1.2 Backend (Application Tier)

The backend is implemented using **Node.js with Express.js**, following a layered architecture pattern:

**Controllers Layer (17 controllers):** Handles HTTP request parsing, input validation, and response formatting. Each controller corresponds to a specific domain (auth, children, screentime, channels, etc.) and delegates business logic to the service layer.

**Services Layer (20 services):** Encapsulates all business logic, including content filtering algorithms, screen time calculations, gamification scoring, and report generation. Services are stateless and designed for testability through dependency injection.

**Middleware Layer:** Implements cross-cutting concerns including:
- `requireParent` — JWT-based authentication verification for parent endpoints
- `requireChild` — Token-based session verification for child endpoints
- Error handling middleware with structured error responses
- Request rate limiting for API protection

**Routes Layer (18 route files):** Organized under `/api/v1/` namespace with RESTful resource naming conventions.

### 3.1.3 Database (Data Tier)

**Supabase (PostgreSQL)** serves as the persistent data store, providing:
- Relational data integrity with foreign key constraints
- Row-Level Security (RLS) policies for data isolation
- Built-in authentication service (Supabase Auth)
- Real-time subscriptions for database change notifications
- Automatic REST API generation

The database schema comprises **20+ tables** organized into functional domains: User Management (parents, children), Access Control (devices, child_sessions), Content Management (approved_channels, approved_videos, blocked_content, content_filters), Activity Tracking (watch_history, search_history, activity_logs), Gamification (child_badges, child_inventory, daily_quests), Communication (notifications, child_notifications), and Reporting (weekly_reports).

### 3.1.4 Real-time Communication Layer

**Socket.IO** provides the real-time bidirectional communication channel between parent and child clients via the server. Key event types include:

- `screen:pause` / `screen:resume` — Immediate control propagation
- `screen:timeUpdate` — Heartbeat-based usage synchronization
- `content:blocked` — Real-time content block notifications
- `gamification:reward` — Achievement and reward notifications
- `device:status` — Device online/offline status tracking

*Figure 3.1: System Architecture Diagram*

```
┌──────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 18 + TypeScript)                 │
│  ┌────────────────────┐         ┌────────────────────────────────┐  │
│  │   Parent Dashboard  │         │      Child Interface           │  │
│  │  ┌──────────────┐  │         │  ┌──────────────┐             │  │
│  │  │ Activity View│  │         │  │ Video Player │             │  │
│  │  │ Time Controls│  │         │  │ Quest Board  │             │  │
│  │  │ Filters Page │  │         │  │ Badge Gallery│             │  │
│  │  │ Reports Page │  │         │  │ Avatar Room  │             │  │
│  │  │ Devices Page │  │         │  │ Playlists    │             │  │
│  │  └──────────────┘  │         │  └──────────────┘             │  │
│  └─────────┬──────────┘         └──────────┬─────────────────────┘  │
└────────────┼───────────────────────────────┼────────────────────────┘
             │ REST API (HTTPS)              │ REST + WebSocket
             │                               │
┌────────────┴───────────────────────────────┴────────────────────────┐
│                   BACKEND (Node.js + Express)                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │   Auth   │  │  Screen Time │  │ Content  │  │  Gamification  │  │
│  │ Service  │  │   Service    │  │ Filter   │  │    Engine      │  │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────────┘  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Channels │  │   Reports    │  │  Watch   │  │  Notification  │  │
│  │ Service  │  │   Service    │  │ Tracking │  │    Service     │  │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────────┘  │
│                        ┌──────────┐                                  │
│                        │Socket.IO │ (Real-time Events)               │
│                        └──────────┘                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ SQL Queries + Supabase SDK
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                              │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  parents   │  │  children  │  │ screen_time  │  │   watch    │  │
│  │  devices   │  │  sessions  │  │   _rules     │  │  _history  │  │
│  │  badges    │  │   quests   │  │  channels    │  │  reports   │  │
│  └────────────┘  └────────────┘  └──────────────┘  └────────────┘  │
│                    + Supabase Auth + Row Level Security               │
└─────────────────────────────────────────────────────────────────────┘
```

## 3.2 Content Filtering Pipeline

SafeGuard implements a **multi-layered content filtering pipeline** that evaluates video content through four sequential filtering stages before granting or denying access. This pipeline is designed to maximize filtering accuracy while minimizing false positives that would degrade the child's experience.

### 3.2.1 Layer 1: Channel Verification

The first and most efficient filtering layer operates at the channel level. When a child attempts to access a video, the system first checks whether the video's source channel exists in the child's `approved_channels` list. If the channel is explicitly approved by a parent, the video passes this layer. If the channel is found in the `blocked_content` table, the video is immediately rejected. Unknown channels trigger a notification to the parent for approval, while the video is either allowed or blocked based on the `strict_mode` setting in the child's `content_filters` configuration.

### 3.2.2 Layer 2: Category-Based Filtering

Videos that pass channel verification are evaluated against the child's category restrictions. The `content_filters` table maintains both `allowed_categories` and `blocked_categories` arrays. If a video's category matches any entry in `blocked_categories` (e.g., "gaming", "ASMR", "news_politics"), it is rejected. If `allowed_categories` is non-empty, only videos matching these categories are permitted.

### 3.2.3 Layer 3: Keyword-Based Blacklist Matching

The video's metadata—including title, description, and tags—is scanned against the child's `blocked_keywords` array maintained in the `content_filters` table. This layer uses case-insensitive substring matching with word-boundary awareness to detect inappropriate terms while minimizing false positives from partial matches (e.g., "class" should not match "classification").

### 3.2.4 Layer 4: Risk Score Computation

The final layer computes a composite risk score based on multiple signals:

```
RiskScore = (BlacklistMatchCount × 3) + (UnknownChannelPenalty × 2)
            + (CategoryMismatchPenalty × 1) + (DurationExcessPenalty × 0.5)

If RiskScore > ConfiguredThreshold:
    BLOCK video + Log reason + Notify parent
Else:
    ALLOW video + Log access
```

The `max_video_duration_minutes` parameter in `content_filters` penalizes excessively long videos that may indicate binge-watching risks. This scoring mechanism allows for nuanced filtering where borderline content is blocked only when multiple risk factors co-occur.

*Figure 3.2: Content Filtering Pipeline Flowchart — showing the sequential evaluation of video content through four filtering layers with decision points and outcomes.*

## 3.3 Screen Time Management Algorithm

### 3.3.1 Heartbeat-Based Tracking

SafeGuard implements a **heartbeat-based tracking mechanism** to ensure accurate screen time measurement regardless of client-side clock manipulation or network interruptions. The algorithm operates as follows:

**Client-Side (Child Interface):**
- A `useRef`-based timer sends a "heartbeat" HTTP request to the server every **10 seconds** while the child is actively viewing content.
- The heartbeat includes the current video ID and a timestamp.
- If the browser tab loses focus or becomes hidden (detected via the Page Visibility API), heartbeats are paused to avoid counting inactive time.

**Server-Side (Screen Time Service):**
```
ON HEARTBEAT_RECEIVED(child_id, video_id, timestamp):
    current_rules = GET screen_time_rules WHERE child_id = child_id
    
    // Reset daily counter if new day
    IF current_rules.last_reset_date < TODAY:
        current_rules.today_usage_minutes = 0
        current_rules.last_reset_date = TODAY
    
    // Determine applicable limit
    applicable_limit = IS_WEEKEND(TODAY)
        ? current_rules.weekend_limit_minutes
        : current_rules.weekday_limit_minutes
        ?? current_rules.daily_limit_minutes
    
    // Check if within allowed time window
    IF NOT in_allowed_time_window(current_rules.allowed_time_windows):
        EMIT 'screen:blocked' (reason: 'outside_allowed_hours')
        RETURN
    
    // Check bedtime mode
    IF current_rules.bedtime_mode.enabled AND is_bedtime(current_rules.bedtime_mode):
        EMIT 'screen:blocked' (reason: 'bedtime_active')
        RETURN
    
    // Increment usage
    current_rules.today_usage_minutes += (10 / 60)  // 10 seconds in minutes
    
    // Check if limit exceeded
    IF current_rules.today_usage_minutes >= applicable_limit:
        EMIT 'screen:timeUp' (usage: current_rules.today_usage_minutes)
        RETURN
    
    // Check break reminder
    IF current_rules.break_reminder_enabled:
        IF current_rules.today_usage_minutes % current_rules.break_reminder_interval == 0:
            EMIT 'screen:breakReminder'
    
    // Update database
    UPDATE screen_time_rules SET today_usage_minutes, last_reset_date
    
    // Sync to parent dashboard
    EMIT 'screen:timeUpdate' (remaining: applicable_limit - today_usage_minutes)
```

*Figure 3.3: Screen Time Heartbeat Algorithm — illustrating the server-side decision logic for each heartbeat event.*

### 3.3.2 Drift Correction

To address cumulative timer drift, the server maintains an authoritative time source. On each heartbeat, the server validates the time elapsed since the last heartbeat. If the gap exceeds the expected 10 seconds by more than a configurable tolerance (default: 5 seconds), the excess time is not counted, preventing manipulation through client-side clock changes.

## 3.4 Gamification Framework

### 3.4.1 Design Philosophy

SafeGuard's gamification framework is grounded in **Self-Determination Theory (SDT)** by Deci and Ryan, which posits that intrinsic motivation is fostered through three psychological needs: **Autonomy** (choice in how to engage), **Competence** (sense of mastery and achievement), and **Relatedness** (connection to others) [24]. The framework translates these needs into game mechanics:

| Psychological Need | Game Mechanic | Implementation |
|---|---|---|
| Autonomy | Avatar Customization, Playlist Creation | Children choose their avatar appearance and curate personal playlists |
| Competence | XP Progression, Badge Achievement | Watching educational content and completing quests earn measurable rewards |
| Relatedness | Parent Notifications, Shared Reports | Parents acknowledge achievements; weekly reports celebrate milestones |

### 3.4.2 Reward Architecture

**Stars (Virtual Currency):** Earned through daily activities and quest completion. The `children` table tracks `stars` (current balance) and `total_stars_earned` (lifetime total). Stars can be spent on avatar items stored in `child_inventory`.

**Experience Points (XP):** Accumulated through various activities with different XP multipliers:
- Completing an educational video: 10 XP
- Staying within daily screen time limit: 15 XP
- Completing a daily quest: 20 XP
- Voluntary session end before limit: 25 XP (bonus for self-regulation)

**Badges:** Achievement-based rewards tracked in `child_badges`. Examples include:
- "Scholar" — Watch 10 educational videos
- "Time Master" — Stay within limits for 7 consecutive days
- "Explorer" — Watch content from 5 different approved channels
- "Bookworm" — Complete all daily quests in a week

**Daily Quests:** Generated daily via the `daily_quests` table with varying objectives:
- "Watch 2 educational videos today"
- "Take a break every 30 minutes"
- "Explore a new channel"
Each quest has a `target`, `progress`, `is_completed` status, and `reward_stars`.

*Figure 3.4: Gamification Reward Loop — showing the cyclical relationship between activities, rewards, progression, and motivation.*

## 3.5 Database Design

The SafeGuard database schema comprises 20+ tables designed with **Third Normal Form (3NF)** normalization to eliminate data redundancy while maintaining query performance through strategic indexing. The core entities and their relationships are:

**Table 3.2: Database Schema Summary**

| Table Name | Primary Purpose | Key Fields | Relationships |
|---|---|---|---|
| `parents` | Parent user accounts | id, email, name, subscription_tier | FK → auth.users(id) |
| `children` | Child profiles | id, parent_id, name, age, pin_hash, stars | FK → parents(id) |
| `devices` | Registered devices | id, child_id, device_id, device_type | FK → children(id) |
| `screen_time_rules` | Time management config | child_id, daily_limit, weekday/weekend limits, bedtime | FK → children(id), UNIQUE(child_id) |
| `content_filters` | Filtering configuration | child_id, blocked_keywords, allowed/blocked_categories | FK → children(id), UNIQUE(child_id) |
| `approved_channels` | Channel whitelist | child_id, channel_id, channel_name, approved_by | FK → children(id), parents(id) |
| `blocked_content` | Content blacklist | child_id, video_id, channel_id, reason | FK → children(id) |
| `watch_history` | Viewing records | child_id, video_id, watched_duration, was_blocked | FK → children(id) |
| `child_badges` | Achievement tracking | child_id, badge_id, earned_at | FK → children(id) |
| `daily_quests` | Daily challenges | child_id, type, target, progress, reward_stars | FK → children(id) |
| `notifications` | Parent alerts | parent_id, child_id, type, priority, is_read | FK → parents(id), children(id) |
| `weekly_reports` | Automated reports | parent_id, week_start, summary | FK → parents(id) |
| `approval_requests` | Content approval queue | child_id, request_type, status | FK → children(id), parents(id) |
| `playlists` | Curated content lists | child_id, name, type | FK → children(id) |
| `activity_logs` | System audit trail | child_id, parent_id, type, data | FK → children(id), parents(id) |

*Figure 3.5: Entity-Relationship (ER) Diagram — showing the relationships between all 20+ tables with cardinality notations.*

## 3.6 Tools and Technologies

**Table 3.1: Tools and Technologies Comparison**

| Category | Technology Selected | Alternatives Considered | Justification for Selection |
|---|---|---|---|
| **Frontend Framework** | React 18 (TypeScript) | Vue.js 3, Angular 17, Svelte | React's extensive ecosystem, mature TypeScript support, component reusability, and dominant industry adoption. Server Components readiness for future migration. |
| **Build Tool** | Vite 5 | Create React App, Webpack 5 | Vite's native ES modules support provides 10–100x faster HMR (Hot Module Replacement) compared to Webpack-based solutions. |
| **CSS Framework** | Tailwind CSS 3 | Vanilla CSS, Styled Components, CSS Modules | Utility-first approach enables rapid prototyping; JIT mode minimizes production bundle size; excellent responsive design utilities. |
| **Animation Library** | Framer Motion | React Spring, GSAP, CSS Animations | Declarative API aligns with React paradigm; AnimatePresence enables exit animations; gesture support for interactive elements. |
| **Charting Library** | Recharts | Chart.js, D3.js, Nivo | React-native component approach; composable chart elements; responsive by default; active maintenance. |
| **Backend Runtime** | Node.js 18+ | Deno, Bun, Python (FastAPI) | Mature ecosystem, JavaScript/TypeScript isomorphism with frontend, extensive npm package availability, proven scalability. |
| **Backend Framework** | Express.js 4 | Fastify, Koa, NestJS | Industry-standard routing and middleware patterns; extensive community resources; minimal learning curve for maintenance. |
| **Database** | Supabase (PostgreSQL 15) | Firebase, MongoDB Atlas, PlanetScale | Relational integrity for complex parent-child-device relationships; built-in Auth service; real-time subscriptions; Row-Level Security; SQL power with cloud convenience. |
| **Real-time** | Socket.IO 4 | WebSocket API, SSE, Pusher | Auto-reconnection, room-based routing, event namespacing; fallback transport support; extensive documentation. |
| **Authentication** | Supabase Auth + Custom JWT | Auth0, Firebase Auth, Passport.js | Native integration with Supabase database; parent auth handled by Supabase; custom JWT for child PIN-based sessions with controlled expiry. |
| **Version Control** | Git + GitHub | GitLab, Bitbucket | Industry-standard; GitHub Actions integration; collaborative review features. |
| **IDE** | Visual Studio Code | WebStorm, Vim/Neovim | Extensive extension ecosystem; TypeScript intelligence; integrated terminal; Git integration. |
| **API Testing** | Postman, Thunder Client | Insomnia, cURL | GUI-based request building; collection management; environment variables; automated testing. |

## 3.7 Workflow Diagram

### 3.7.1 Data Flow Diagram — Level 0

*Figure 3.6: Context-Level Data Flow Diagram*

```
                        ┌─────────────┐
    Rules, Approvals    │             │    Filtered Content
    ──────────────────▶ │             │ ──────────────────▶
    Reports, Alerts     │  SAFEGUARD  │    Rewards, Quests
  ◀──────────────────── │   SYSTEM    │ ◀──────────────────
                        │             │    Watch Activity
      [PARENT]          │             │       [CHILD]
                        └──────┬──────┘
                               │
                               │ Video Metadata
                               ▼
                        ┌─────────────┐
                        │  YouTube    │
                        │  Data API  │
                        └─────────────┘
```

### 3.7.2 Data Flow Diagram — Level 1

*Figure 3.7: Level-1 Data Flow Diagram*

```
[Parent] ──▶ 1.0 Authentication ──▶ [Parent Session]
                                          │
                                          ▼
[Parent] ──▶ 2.0 Rule Configuration ──▶ [Screen Time Rules DB]
                                          │     [Content Filters DB]
                                          │     [Approved Channels DB]
                                          │
[Child]  ──▶ 3.0 Content Request ──▶ 4.0 Filtering Pipeline ──▶ Allow/Block
                                          │
                                          ▼
                                    5.0 Watch Tracking ──▶ [Watch History DB]
                                          │
                                          ▼
                                    6.0 Gamification ──▶ [Badges DB]
                                          │                [Quests DB]
                                          ▼
                                    7.0 Reporting ──▶ [Reports DB] ──▶ [Parent]
```

### 3.7.3 User Journey: Child Video Access

The complete workflow for a child requesting video content:

1. **Child Login:** Child selects their profile and enters their 4–6 digit PIN.
2. **Session Validation:** Server validates PIN hash, checks lockout status, and creates a time-limited session (2-hour expiry).
3. **Content Browse/Search:** Child browses recommended content or searches within the safe search scope.
4. **Video Selection:** Child clicks on a video.
5. **Filtering Pipeline:** Video metadata passes through all four filtering layers (Channel → Category → Keyword → Risk Score).
6. **Access Decision:** If approved, video loads in the safe player; if blocked, a child-friendly message is displayed and the parent is notified.
7. **Heartbeat Tracking:** Every 10 seconds, the client sends a heartbeat to track usage.
8. **Break Reminders:** At configured intervals, a gentle reminder overlay appears.
9. **Time Limit Enforcement:** When the daily limit is reached, the interface locks with a friendly "Time's Up" screen.
10. **Quest Progress:** Relevant daily quest progress is updated based on the activity.
11. **Report Generation:** All activity data feeds into the weekly report generation pipeline.
