-- =====================================================
-- Migration: user_profiles RLS 정책 추가
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- =====================================================

-- 1. RLS 활성화 (이미 켜져 있어도 안전하게 실행됨)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;


-- 2. SELECT 정책: 본인 행만 조회 가능
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'users_select_own_profile'
  ) THEN
    CREATE POLICY users_select_own_profile
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- 3. INSERT 정책: 본인 행만 삽입 가능 (온보딩 시 사용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'users_insert_own_profile'
  ) THEN
    CREATE POLICY users_insert_own_profile
      ON user_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- 4. UPDATE 정책: 본인 행만 수정 가능 (프로필 수정 시 사용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'users_update_own_profile'
  ) THEN
    CREATE POLICY users_update_own_profile
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- =====================================================
-- 적용 확인 쿼리 (실행 후 아래로 정책 목록 검증)
-- =====================================================
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'user_profiles';
