-- Avatar System Tables & Columns

-- Add avatar_config to children if not exists (handling if it was migrated before or fresh)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'avatar_config') THEN
        ALTER TABLE children ADD COLUMN avatar_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Inventory Table
CREATE TABLE IF NOT EXISTS child_inventory (
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL, -- 'hat', 'glasses', 'skin', 'background'
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (child_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_child ON child_inventory(child_id);
