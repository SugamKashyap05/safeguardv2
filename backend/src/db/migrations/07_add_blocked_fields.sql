-- Add blocked status columns to watch_history if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'watch_history' AND column_name = 'was_blocked') THEN
        ALTER TABLE public.watch_history ADD COLUMN was_blocked BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'watch_history' AND column_name = 'block_reason') THEN
        ALTER TABLE public.watch_history ADD COLUMN block_reason TEXT;
    END IF;
END $$;
