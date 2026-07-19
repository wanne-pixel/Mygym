-- =====================================================
-- Migration: RLS 정책 강화 및 메타데이터(JSONB) 확장
-- 실행 위치: Supabase 대시보드 > SQL Editor 또는 CLI
-- =====================================================

-- 1. 테이블 구조 확장 (JSONB)
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. exercises 테이블 RLS 적용 (Public Read Only)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exercises' AND policyname = 'exercises_select_all'
  ) THEN
    CREATE POLICY exercises_select_all ON exercises FOR SELECT USING (true);
  END IF;
END $$;
-- INSERT, UPDATE, DELETE는 별도의 허용 정책이 없으므로 암묵적으로 거부됨

-- 3. workout_logs 테이블 RLS 적용 (본인 데이터만 CRUD)
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'workout_logs_select_own') THEN
    CREATE POLICY workout_logs_select_own ON workout_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'workout_logs_insert_own') THEN
    CREATE POLICY workout_logs_insert_own ON workout_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'workout_logs_update_own') THEN
    CREATE POLICY workout_logs_update_own ON workout_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'workout_logs_delete_own') THEN
    CREATE POLICY workout_logs_delete_own ON workout_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. feedback 테이블 RLS 적용 (본인 데이터만 Insert)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'feedback_insert_own') THEN
    CREATE POLICY feedback_insert_own ON feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
