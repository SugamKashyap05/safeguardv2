-- Migration: Add Lockout Fields to Children Table
-- Description: Adds failed_pin_attempts and lockout_until columns to track failed logins.
ALTER TABLE public.children
ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP
WITH
    TIME ZONE;