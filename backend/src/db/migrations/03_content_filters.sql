-- 18. Content Filters
CREATE TABLE IF NOT EXISTS public.content_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID UNIQUE NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  blocked_keywords TEXT[] DEFAULT '{}',
  allowed_categories TEXT[] DEFAULT '{}',
  max_video_duration_minutes INTEGER DEFAULT 15,
  allow_comments BOOLEAN DEFAULT false,
  strict_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.content_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_filters_parent ON public.content_filters
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );


-- 19. Approved Videos
CREATE TABLE IF NOT EXISTS public.approved_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_thumbnail TEXT,
  approved_by UUID NOT NULL REFERENCES public.parents(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(child_id, video_id)
);

ALTER TABLE public.approved_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY approved_videos_parent ON public.approved_videos
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approved_videos_child_id ON public.approved_videos(child_id);
