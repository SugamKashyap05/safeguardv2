# Safeguard API Documentation

Complete reference for all backend API endpoints.

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Parent Token
- Obtained via Supabase Auth login
- Include in all `/parents/*` routes

### Child Token
- Obtained via PIN verification
- Include in child-specific routes

---

## Auth Endpoints

### POST /auth/parent/login
Login parent with email/password (via Supabase)

### POST /auth/child/verify-pin
Verify child PIN and get session token
```json
{
  "childId": "uuid",
  "pin": "1234"
}
```

---

## Parent Endpoints

### GET /parents/me
Get current parent profile

### GET /parents/settings
Get parent settings (notifications, preferences)

### PUT /parents/settings
Update parent settings

### POST /parents/change-password
Change parent password

---

## Children Endpoints

### GET /children
Get all children for parent

### POST /children
Create new child profile
```json
{
  "name": "string",
  "age": 8,
  "pin": "1234",
  "avatar": "emoji"
}
```

### GET /children/:childId
Get specific child

### PUT /children/:childId
Update child profile

### DELETE /children/:childId
Remove child

### GET /children/:childId/status
Get child active/paused status

---

## Screen Time Endpoints

### GET /screentime/:childId
Get screen time rules

### PUT /screentime/:childId
Update screen time rules
```json
{
  "daily_limit_minutes": 60,
  "weekday_limit_minutes": 45,
  "weekend_limit_minutes": 90,
  "bedtime_mode": {
    "enabled": true,
    "startTime": "20:00",
    "endTime": "07:00"
  }
}
```

### POST /screentime/:childId/extend
Add extra screen time
```json
{
  "minutes": 30
}
```

### GET /screentime/:childId/remaining
Get remaining minutes today

### POST /screentime/:childId/pause
Pause child access

### POST /screentime/:childId/resume
Resume child access

---

## Channel Endpoints

### GET /channels/approved/:childId
Get approved channels for child

### GET /channels/pending/:childId
Get pending channel requests

### POST /channels/approve
Approve a pending request
```json
{
  "requestId": "uuid"
}
```

### POST /channels/reject
Reject a pending request

### POST /channels/direct-approve
Directly approve a channel
```json
{
  "childId": "uuid",
  "channel": {
    "channelId": "youtube_id",
    "channelName": "name",
    "thumbnailUrl": "url"
  }
}
```

### DELETE /channels/:channelId/:childId
Remove approved channel

### GET /channels/discover
Get curated channel recommendations

---

## Content Filter Endpoints

### GET /filters/:childId
Get content filter settings

### PUT /filters/:childId
Update content filters
```json
{
  "ageRestriction": "kids",
  "blockedCategories": ["gaming", "asmr"],
  "safeSearch": true
}
```

### POST /filters/check-video
Check if video is allowed
```json
{
  "childId": "uuid",
  "videoId": "youtube_id",
  "title": "string"
}
```

---

## Watch Endpoints

### POST /watch/start
Start a watch session
```json
{
  "childId": "uuid",
  "videoId": "youtube_id",
  "videoTitle": "string",
  "channelId": "string",
  "channelName": "string"
}
```

### PATCH /watch/:sessionId/update
Update watch progress
```json
{
  "watchedDuration": 120,
  "duration": 300
}
```

### POST /watch/:sessionId/complete
Mark video as completed

### GET /watch/history/:childId
Get watch history

### GET /watch/history/:childId/stats
Get watch statistics

---

## Playlist Endpoints

### GET /playlists/:childId
Get child's playlists

### POST /playlists
Create playlist
```json
{
  "childId": "uuid",
  "name": "My Favorites",
  "type": "custom"
}
```

### GET /playlists/detail/:playlistId
Get playlist with videos

### POST /playlists/:playlistId/videos
Add video to playlist
```json
{
  "videoId": "youtube_id",
  "title": "string",
  "thumbnail": "url"
}
```

### DELETE /playlists/:playlistId/videos/:videoId
Remove video from playlist

### PUT /playlists/:playlistId/reorder
Reorder playlist items
```json
{
  "itemIds": ["uuid1", "uuid2", "uuid3"]
}
```

---

## Notification Endpoints

### GET /notifications
Get parent notifications

### GET /notifications/unread-count
Get unread count

### PATCH /notifications/mark-all-read
Mark all as read

### PATCH /notifications/:id/read
Mark single as read

### DELETE /notifications/:id
Delete notification

---

## Report Endpoints

### GET /reports/latest
Get latest weekly report

### GET /reports/weekly/:date
Get report for specific week

---

## Emergency Endpoints

### POST /emergency/pause/:childId
Emergency pause single child

### POST /emergency/resume/:childId
Resume child access

### POST /emergency/panic-pause
Pause ALL children immediately

---

## Device Endpoints

### GET /devices/:childId
Get child's devices

### POST /devices/:childId
Register new device
```json
{
  "deviceName": "iPad",
  "deviceType": "tablet"
}
```

### DELETE /devices/:deviceId
Remove device

---

## Search & Recommendations

### GET /search?q=query&childId=uuid
Search for videos (filtered)

### GET /search/suggestions/:childId
Get search suggestions

### GET /recommendations/:childId/personalized
Get personalized recommendations

### GET /recommendations/:childId/trending
Get trending kid-safe content

### GET /recommendations/:childId/educational
Get educational content

---

## Approval Endpoints

### POST /approvals/request (Child Auth)
Request video/channel approval
```json
{
  "videoId": "youtube_id",
  "videoTitle": "string",
  "videoThumbnail": "url",
  "channelId": "string",
  "channelName": "string",
  "duration": 300,
  "message": "Please can I watch this?",
  "requestType": "video"
}
```

### GET /approvals/pending
Get pending approval requests for parent

### GET /approvals/history?status=approved
Get approval history (filter by status)

### GET /approvals/count
Get pending request count (for badge)

### POST /approvals/:id/review
Approve or reject a request
```json
{
  "decision": "approve",
  "notes": "Optional parent notes"
}
```

### POST /approvals/:id/quick-approve-channel
Approve video AND add entire channel to approved list

### DELETE /approvals/:id
Dismiss/delete a request

---

## Analytics Endpoints

### GET /analytics/child/:childId?range=30
Get comprehensive child analytics
```json
{
  "overview": {
    "totalWatchTime": 420,
    "videosWatched": 25,
    "avgSessionLength": 35,
    "completionRate": 85,
    "educationalPercent": 60
  },
  "trends": {
    "dailyUsage": [{"date": "2026-01-19", "minutes": 45, "limit": 60}],
    "peakHours": [{"hour": 16, "minutes": 120}],
    "dayOfWeekPattern": [{"day": "Mon", "minutes": 45}]
  },
  "content": {
    "topCategories": [{"name": "Education", "value": 200, "color": "#4F46E5"}],
    "topChannels": [{"id": "...", "name": "...", "thumbnail": "...", "watchTime": 60}],
    "topVideos": [{"id": "...", "title": "...", "thumbnail": "...", "views": 5}]
  },
  "safety": {
    "blockedAttempts": 3,
    "approvalRequests": 2,
    "limitHits": 5
  },
  "insights": [
    {"type": "positive", "icon": "📚", "title": "...", "message": "..."}
  ]
}
```

### GET /analytics/parent/dashboard
Get family-level analytics overview

### GET /analytics/insights/:childId
Get AI-generated insights for a child

---

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Server Error |
