-- Add is_paused column to devices table
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- Update RLS if needed (parents generally have full access, so existing policies likely cover update)
-- Existing policy usually allows ALL for parents.