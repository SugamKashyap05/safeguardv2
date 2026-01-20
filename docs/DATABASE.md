# Database Schema

## Overview

PostgreSQL database hosted on Supabase with Row Level Security (RLS) enabled.

## Tables

### parents
Primary parent/guardian accounts.
```sql
id            UUID PRIMARY KEY
email         TEXT UNIQUE NOT NULL
name          TEXT
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ
```

### children
Child profiles linked to parents.
```sql
id                    UUID PRIMARY KEY
parent_id             UUID REFERENCES parents(id)
name                  TEXT NOT NULL
age                   INTEGER
pin_hash              TEXT NOT NULL
avatar                TEXT
is_active             BOOLEAN DEFAULT true
paused_until          TIMESTAMPTZ
failed_pin_attempts   INTEGER DEFAULT 0
lockout_until         TIMESTAMPTZ
created_at            TIMESTAMPTZ DEFAULT NOW()
```

### devices
Registered devices per child.
```sql
id            UUID PRIMARY KEY
child_id      UUID REFERENCES children(id)
device_id     TEXT NOT NULL
device_name   TEXT
device_type   TEXT
last_seen     TIMESTAMPTZ
is_active     BOOLEAN DEFAULT true
created_at    TIMESTAMPTZ
```

### screen_time_rules
Per-child screen time configuration.
```sql
id                      UUID PRIMARY KEY
child_id                UUID REFERENCES children(id) UNIQUE
daily_limit_minutes     INTEGER DEFAULT 60
weekday_limit_minutes   INTEGER
weekend_limit_minutes   INTEGER
today_usage_minutes     INTEGER DEFAULT 0
bedtime_mode            JSONB
break_reminder_enabled  BOOLEAN DEFAULT false
break_reminder_interval INTEGER DEFAULT 30
allowed_time_windows    JSONB
updated_at              TIMESTAMPTZ
```

### content_filters
Content filtering rules per child.
```sql
id                UUID PRIMARY KEY
child_id          UUID REFERENCES children(id)
age_restriction   TEXT
blocked_keywords  TEXT[]
blocked_channels  TEXT[]
blocked_videos    TEXT[]
safe_search       BOOLEAN DEFAULT true
updated_at        TIMESTAMPTZ
```

### approved_channels
Whitelisted YouTube channels.
```sql
id                      UUID PRIMARY KEY
child_id                UUID REFERENCES children(id)
channel_id              TEXT NOT NULL
channel_name            TEXT
channel_thumbnail_url   TEXT
approved_by             UUID REFERENCES parents(id)
approved_at             TIMESTAMPTZ
```

### watch_history
Video watching activity log.
```sql
id                UUID PRIMARY KEY
child_id          UUID REFERENCES children(id)
video_id          TEXT NOT NULL
video_title       TEXT
channel_id        TEXT
channel_name      TEXT
thumbnail         TEXT
duration          INTEGER
watched_duration  INTEGER
watch_percentage  INTEGER
completed_watch   BOOLEAN DEFAULT false
was_blocked       BOOLEAN DEFAULT false
block_reason      TEXT
category          TEXT
watched_at        TIMESTAMPTZ DEFAULT NOW()
```

### playlists
User-created playlists.
```sql
id          UUID PRIMARY KEY
child_id    UUID REFERENCES children(id)
name        TEXT NOT NULL
type        TEXT DEFAULT 'custom'
is_default  BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

### playlist_items
Videos in playlists.
```sql
id            UUID PRIMARY KEY
playlist_id   UUID REFERENCES playlists(id)
video_id      TEXT NOT NULL
title         TEXT
thumbnail     TEXT
channel_title TEXT
position      INTEGER
added_at      TIMESTAMPTZ
```

### notifications
Parent notifications and alerts.
```sql
id          UUID PRIMARY KEY
parent_id   UUID REFERENCES parents(id)
child_id    UUID REFERENCES children(id)
type        TEXT NOT NULL
title       TEXT
message     TEXT
priority    TEXT DEFAULT 'normal'
is_read     BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ
```

### activity_logs
General activity events.
```sql
id          UUID PRIMARY KEY
child_id    UUID REFERENCES children(id)
type        TEXT NOT NULL
data        JSONB
timestamp   TIMESTAMPTZ DEFAULT NOW()
```

### child_sessions
Active child login sessions.
```sql
id          UUID PRIMARY KEY
child_id    UUID REFERENCES children(id)
token_hash  TEXT NOT NULL
device_id   TEXT
expires_at  TIMESTAMPTZ
is_active   BOOLEAN DEFAULT true
created_at  TIMESTAMPTZ
```

### approval_requests
Video/channel approval workflow.
```sql
id                UUID PRIMARY KEY
child_id          UUID REFERENCES children(id)
request_type      TEXT (video|channel)
video_id          TEXT
video_title       TEXT
video_thumbnail   TEXT
duration          INTEGER
channel_id        TEXT NOT NULL
channel_name      TEXT
channel_thumbnail TEXT
status            TEXT (pending|approved|rejected)
child_message     TEXT
parent_notes      TEXT
requested_at      TIMESTAMPTZ
reviewed_at       TIMESTAMPTZ
reviewed_by       UUID REFERENCES parents(id)
```

### approved_videos
One-time approved videos.
```sql
id          UUID PRIMARY KEY
child_id    UUID REFERENCES children(id)
video_id    TEXT NOT NULL
approved_by UUID REFERENCES parents(id)
approved_at TIMESTAMPTZ
UNIQUE(child_id, video_id)
```

### child_notifications
Notifications for children.
```sql
id          UUID PRIMARY KEY
child_id    UUID REFERENCES children(id)
type        TEXT NOT NULL
title       TEXT
message     TEXT
data        JSONB
is_read     BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ
```

## Indexes

```sql
CREATE INDEX idx_children_parent ON children(parent_id);
CREATE INDEX idx_watch_history_child ON watch_history(child_id);
CREATE INDEX idx_watch_history_watched_at ON watch_history(watched_at);
CREATE INDEX idx_notifications_parent ON notifications(parent_id);
CREATE INDEX idx_playlist_items_playlist ON playlist_items(playlist_id);
CREATE INDEX idx_approval_requests_child ON approval_requests(child_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approved_videos_child ON approved_videos(child_id);
CREATE INDEX idx_child_notifications_child ON child_notifications(child_id);
```

## Row Level Security

RLS policies ensure:
- Parents can only access their own children's data
- Children can only access their own records
- Service role bypasses RLS for backend operations
