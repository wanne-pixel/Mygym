# 📊 DB_SCHEMA.md

## 🗄️ Supabase 테이블 구조
### 1. `exercises` (운동 마스터 데이터)
- **Columns**: 
  - `id`: 고유 식별자 (TEXT, PK)
  - `name`: 운동 명칭 (KO)
  - `name_en`: 운동 명칭 (EN)
  - `body_part`: 대분류 (가슴, 등, 어깨, 하체, 팔, 복부 등)
  - `sub_category`: 중분류 (상부, 하부, 넓이, 두께, 대퇴사두 등)
  - `equipment`: 필요 도구 (덤벨, 바벨, 머신, 맨몸 등)
  - `sub_target_ko` / `sub_target_en`: 세부 타겟 근육
  - `secondary_muscles`: 협응근 (JSONB)
  - `instructions`: 운동 방법 (TEXT)
  - `video_url` / `gif_url`: 가이드 영상/이미지 경로
- **Feature**: 앱 내 API 레이어에서 카멜 케이스(`bodyPart`, `subCategory` 등)로 매핑되어 소비됨.

### 2. `workout_logs` (운동 기록)
- **Columns**: 
  - `id`: 기록 ID (BIGINT, PK)
  - `user_id`: 사용자 ID (UUID, FK)
  - `exercise`: 운동 명칭 (TEXT)
  - `sets_data`: 세트별 상세 데이터 (JSONB: `kg`, `reps`, `isDropSet` 포함)
  - `created_at`: 기록 일시 (TIMESTAMP)
- **Feature**: 유저별 PR(Personal Record) 계산의 원천 데이터.

### 3. `user_profiles` (사용자 설정)
- **Columns**: 
  - `user_id`: 사용자 ID (UUID, PK, FK)
  - `level`: 숙련도 (Beginner, Intermediate, Advanced)
  - `goal`: 대표 목표 (TEXT)
  - `goals`: 다중 목표 (JSONB, 최대 2개 선택 가능)
  - `available_time`: 1회 운동 가능 시간 (TEXT)
  - `split_preference`: 분할 선호도 (Full Body, 2-Split, 3-Split 등)

## 🌐 AI Coach 통신 규약 (Edge Function: `ai-coach`)
- **Request Payload**:
  - `type`: 'chat' (자유 대화) | 'recommendation' (루틴 추천 전용)
  - `lang`: 현재 앱 언어 설정 (ko/en)
  - `userProfile`: 유저 숙련도, 목표, 가용 시간 정보
  - `recentWorkouts`: 최근 5일간의 운동 로그 데이터
  - `exercises`: 전체 운동 마스터 데이터셋
  - `chatHistory`: 대화 문맥 (최대 10개, role/content 구조)
  - `userPrompt`: (type: 'chat' 시) 유저 입력 텍스트
  - `selectedMode`: (type: 'recommendation' 시) 'today_routine' 등 추천 모드
- **Response Format**:
  ```json
  {
    "reply": "AI의 텍스트 답변",
    "parsedData": {
      "routines": [
        { "exercise": "운동명", "part": "부위", "sets_data": [...] }
      ],
      "recommendationReason": "추천 근거"
    }
  }
  ```

## 🔐 보안 및 인증
- **RLS (Row Level Security)**:
  - `exercises`: Public Read 허용 (누구나 조회 가능).
  - `workout_logs`: `auth.uid() = user_id` 조건으로 본인 데이터만 CRUD 가능.
  - `user_profiles`: `auth.uid() = user_id` 조건으로 본인 프로필만 관리 가능.
- **Session**: `supabase.auth` 기반 세션 유지 및 `sessionStorage`를 통한 비회원 대화 히스토리 임시 관리.
