-- =====================================================
-- Migration: Add active_diet_plan column to user_profiles
-- =====================================================

-- 1. Add active_diet_plan column to user_profiles table.
-- Using JSONB type, default NULL.
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS active_diet_plan JSONB DEFAULT NULL;

-- Note on RLS:
-- The user_profiles table already has Row Level Security (RLS) enabled.
-- The existing policies (users_select_own_profile, users_insert_own_profile, users_update_own_profile)
-- apply to the table level, meaning users can read/write their own profile row.
-- The newly added active_diet_plan column will automatically inherit these policies.
-- No adjustments to RLS policies are needed.
