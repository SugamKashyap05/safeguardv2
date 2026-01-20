-- Approval Requests Table
-- For video/channel approval workflow
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    child_id UUID REFERENCES children (id) ON DELETE CASCADE NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('video', 'channel')),
    -- Video fields
    video_id TEXT,
    video_title TEXT,
    video_thumbnail TEXT,
    duration INTEGER,
    -- Channel fields (also used for video requests)
    channel_id TEXT NOT NULL,
    channel_name TEXT,
    channel_thumbnail TEXT,
    subscriber_count INTEGER,
    -- Status and review
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    child_message TEXT,
    parent_notes TEXT,
    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW (),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES parents (id),
    created_at TIMESTAMPTZ DEFAULT NOW (),
    updated_at TIMESTAMPTZ DEFAULT NOW ()
);

-- Approved Videos table (for one-time video approvals)
CREATE TABLE IF NOT EXISTS approved_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    child_id UUID REFERENCES children (id) ON DELETE CASCADE NOT NULL,
    video_id TEXT NOT NULL,
    approved_by UUID REFERENCES parents (id),
    approved_at TIMESTAMPTZ DEFAULT NOW (),
    UNIQUE (child_id, video_id)
);

-- Child Notifications table (for child-facing notifications)
CREATE TABLE IF NOT EXISTS child_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    child_id UUID REFERENCES children (id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW ()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_requests_child ON approval_requests (child_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests (status);

CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_at ON approval_requests (requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_approved_videos_child ON approved_videos (child_id);

CREATE INDEX IF NOT EXISTS idx_child_notifications_child ON child_notifications (child_id);