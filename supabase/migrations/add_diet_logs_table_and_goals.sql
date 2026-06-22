-- =====================================================
-- Migration: Add diet logs table and goals to user_profiles
-- =====================================================

CREATE TABLE IF NOT EXISTS diet_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    meals JSONB DEFAULT '{"breakfast": [], "lunch": [], "dinner": [], "snack": []}'::jsonb,
    water_ml INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

ALTER TABLE diet_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diet logs" ON diet_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diet logs" ON diet_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diet logs" ON diet_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diet logs" ON diet_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Add diet_goals column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS diet_goals JSONB DEFAULT NULL;
