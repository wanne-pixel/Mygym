-- =====================================================
-- Migration: user_profiles에 hidden_exercises 컬럼 추가
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- =====================================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS hidden_exercises JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE user_profiles
SET hidden_exercises = '[]'::jsonb
WHERE hidden_exercises IS NULL;

-- 확인
SELECT user_id, hidden_exercises
FROM user_profiles
LIMIT 5;
