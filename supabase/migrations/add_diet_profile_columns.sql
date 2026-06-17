-- =====================================================
-- Migration: Add diet profile columns to user_profiles
-- =====================================================

-- Add gender column (TEXT), default NULL
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT NULL;

-- Add age column (INTEGER), default NULL
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT NULL;

-- Add height column (NUMERIC), default NULL
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS height NUMERIC DEFAULT NULL;

-- Add weight column (NUMERIC), default NULL
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT NULL;

-- Add activity_level column (TEXT), default NULL
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT NULL;
