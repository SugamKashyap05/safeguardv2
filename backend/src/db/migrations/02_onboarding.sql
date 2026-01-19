-- Migration: Add Onboarding Fields to Parents Table
-- Description: Adds columns to track onboarding progress and email verification.
ALTER TABLE public.parents
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token TEXT;