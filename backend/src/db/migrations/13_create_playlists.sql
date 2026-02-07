-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('favorites', 'watch_later', 'custom')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create playlist_items table
CREATE TABLE IF NOT EXISTS public.playlist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    video_metadata JSONB DEFAULT '{}'::jsonb,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_playlists_child_id ON public.playlists(child_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON public.playlist_items(playlist_id);

-- RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- Policies
-- Playlists
CREATE POLICY "Parents can manage playlists" ON public.playlists
    FOR ALL USING (
        auth.uid() IN (SELECT parent_id FROM public.children WHERE id = playlists.child_id)
    );

-- Items
CREATE POLICY "Parents can manage playlist items" ON public.playlist_items
    FOR ALL USING (
        playlist_id IN (
            SELECT id FROM public.playlists WHERE child_id IN (
                SELECT id FROM public.children WHERE parent_id = auth.uid()
            )
        )
    );
