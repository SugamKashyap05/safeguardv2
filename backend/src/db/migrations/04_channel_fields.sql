-- Add thumbnail_url to approved_channels
ALTER TABLE public.approved_channels
ADD COLUMN IF NOT EXISTS channel_thumbnail_url TEXT;

-- Update approval_requests to better support channel requests
ALTER TABLE public.approval_requests
ADD COLUMN IF NOT EXISTS channel_name TEXT,
ADD COLUMN IF NOT EXISTS channel_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.parents (id);

-- Who reviewed it
-- Add RLS policy for approval_requests updates by parent
CREATE POLICY "Parents can update requests for their children" ON public.approval_requests FOR
UPDATE USING (
    EXISTS (
        SELECT
            1
        FROM
            public.children
        WHERE
            public.children.id = public.approval_requests.child_id
            AND public.children.parent_id = auth.uid ()
    )
);