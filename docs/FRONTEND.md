# Frontend Architecture

## Overview

React 18 application with TypeScript, Tailwind CSS, and Framer Motion for animations.

## Directory Structure

```
frontend/src/
├── App.tsx              # Main routing configuration
├── main.tsx             # React entry point
├── index.css            # Global styles
│
├── pages/
│   ├── auth/            # Login pages
│   │   ├── ChildLoginPage.tsx
│   │   └── ParentLoginPage.tsx
│   │
│   ├── onboarding/      # Signup wizard
│   │   ├── SignupPage.tsx
│   │   └── steps/
│   │       ├── ParentInfoStep.tsx
│   │       ├── ChildProfileStep.tsx
│   │       └── TutorialStep.tsx
│   │
│   ├── dashboard/       # Main app pages
│   │   ├── ParentDashboardPage.tsx
│   │   ├── ChildDashboardPage.tsx
│   │   ├── ChildManagementPage.tsx
│   │   ├── ManageChildPage.tsx
│   │   ├── ChannelManagementPage.tsx
│   │   ├── NotificationCenterPage.tsx
│   │   ├── ParentSettingsPage.tsx
│   │   ├── ParentActivityPage.tsx
│   │   └── ReportsPage.tsx
│   │
│   └── child/           # Child-specific pages
│       ├── PlaylistsPage.tsx
│       └── PlaylistDetailPage.tsx
│
├── components/
│   ├── children/        # Child-related components
│   │   ├── ChildCard.tsx
│   │   ├── ChildTimer.tsx
│   │   ├── SafeVideoPlayer.tsx
│   │   └── AddChildModal.tsx
│   │
│   ├── dashboard/       # Dashboard widgets
│   │   ├── StatsOverview.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── HistoryList.tsx
│   │   └── ActivityStats.tsx
│   │
│   ├── playlists/       # Playlist components
│   │   ├── PlaylistCard.tsx
│   │   └── SortableVideoItem.tsx
│   │
│   └── layouts/         # Layout wrappers
│       └── OnboardingLayout.tsx
│
├── services/            # API clients
│   ├── api.ts           # Axios instance
│   ├── auth.service.ts
│   ├── parent.service.ts
│   ├── child-controls.service.ts
│   └── playlist.service.ts
│
├── contexts/            # React contexts
│   └── SocketContext.tsx
│
└── types/               # TypeScript definitions
    └── index.ts
```

## Routing

```tsx
// Parent Routes
/login                    → ParentLoginPage
/signup                   → SignupWizard
/parent/dashboard         → ParentDashboardPage
/parent/children          → ChildManagementPage
/parent/child/:id/manage  → ManageChildPage
/parent/channels/:id      → ChannelManagementPage
/parent/notifications     → NotificationCenterPage
/parent/settings          → ParentSettingsPage
/parent/reports           → ReportsPage
/parent/activity/:id      → ParentActivityPage

// Child Routes
/child/login              → ChildLoginPage
/child/dashboard          → ChildDashboardPage
/child/playlists          → PlaylistsPage
/child/playlists/:id      → PlaylistDetailPage
```

## Key Components

### SafeVideoPlayer
Custom YouTube player with:
- No YouTube controls exposed
- Custom play/pause/seek
- Volume control
- Fullscreen toggle
- Recommendations sidebar
- Watch session tracking

### ChildTimer
Screen time display:
- Floating time pill
- Low-time warnings
- Time's up blocker

### ManageChildPage
Complete child controls:
- Screen time settings
- Bedtime mode
- Break reminders
- Content filters
- Quick navigation links

## State Management

Using React hooks and context:
- `useState` for local state
- `useEffect` for data fetching
- `SocketContext` for real-time updates

## API Integration

All API calls go through `api.ts`:
```typescript
import { api } from '../services/api';

// Example usage
const data = await api.get('/children');
await api.post('/screentime/:id/extend', { minutes: 30 });
```

## Styling

- **Tailwind CSS** for utility classes
- **Framer Motion** for animations
- **clsx** for conditional classes
- **Lucide React** for icons

## Design Principles

1. **Kid-friendly UI** - Large buttons, bright colors, emojis
2. **Parent-focused controls** - Clean, professional dashboard
3. **Responsive design** - Mobile-first approach
4. **Accessibility** - Proper focus states, labels
5. **Real-time updates** - Socket.IO integration
