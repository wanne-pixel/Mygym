-- 운동 목표 다중 선택 저장 (최대 2개)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS goals JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 1회 운동 가능 시간
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS available_time TEXT;
