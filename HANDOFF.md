# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-21
> 브랜치: `main` — **모든 변경사항 커밋, 푸시 및 배포(Firebase) 완료**
> 최신 커밋: `bb653e4` Feat: 운동 숨기기 기능 및 운동 이름 편집기 추가

---

## 📌 현재 프로젝트 상태

**MyGym** — 운동 기록 및 AI 코칭을 제공하는 개인 헬스 트래킹 웹 앱.

| 영역 | 상태 | 비고 |
|------|------|------|
| 운동 선택 UI | **안정** | 숨기기 버튼 추가, hidden_exercises 필터링 완료 |
| 운동 숨기기 기능 | **코드 완성 / DB 미적용** | Supabase 컬럼 추가 SQL 미실행 상태 |
| CalendarScreen | **안정** | 장비 설정 UI 제거, 숨긴 운동 관리 모달 추가 |
| AI 코치 | **안정** | 숨긴 운동 제외 필터링 적용됨 |
| 운동 이름 편집기 | **완성** | `/admin/exercise-editor` 접속 가능 |
| 프로필 수정 | **안정** | 400 에러 해결됨, 컬럼 유실 없음 |

---

## ✅ 이번 세션에서 완료한 작업 (최신순)

### 1. 운동 숨기기 기능 전체 구현

**목적**: 특정 운동을 목록에서 제외하고, AI 추천에서도 빼는 기능.

- **`ExerciseSelector.jsx`**:
  - `hiddenExercises` / `onHideExercise` props 추가
  - 각 운동 카드에 눈 모양 숨기기 버튼 추가 (호버 시 주황색)
  - `filteredExercises` useMemo에서 hidden 항목 자동 제외

- **`WorkoutPlanScreen.jsx`**:
  - 마운트 시 Supabase `user_profiles.hidden_exercises` 로드
  - `handleHideExercise`: confirm 다이얼로그 → state 즉시 업데이트 → Supabase 저장
  - `ExerciseSelector`에 `hiddenExercises`, `onHideExercise` props 전달

- **`CalendarScreen.jsx`**:
  - 기존 `EquipmentSettingsModal` 및 관련 상수/state 전체 제거
  - `HiddenExercisesModal` 추가: 숨긴 운동 목록 표시 + 복구 버튼
  - 헤더에 "숨긴 운동" 버튼 추가 (숨긴 개수 뱃지 표시)
  - 마운트 시 `localStorage.removeItem('availableEquipment')` 실행 (기존 데이터 정리)
  - `handleRestoreExercise`: 복구 → state 업데이트 → Supabase 저장

- **`useAiCoach.js`**:
  - `visibleExercises` state 추가 (기본값: 전체 데이터셋)
  - 프로필 로드 시 `hidden_exercises` 기반으로 필터링
  - 루틴 추천 요청 시 `visibleExercises`만 AI에 전달

- **`supabase/migrations/add_hidden_exercises.sql`**:
  - `user_profiles` 테이블에 `hidden_exercises JSONB NOT NULL DEFAULT '[]'` 추가 SQL 작성

### 2. 운동 이름 편집기 (`/admin/exercise-editor`)

- **`src/components/Admin/ExerciseNameEditor.jsx`** 신규 생성
- 가슴 운동 93개 대상 이름 편집 테이블
- 기능: 실시간 편집, 삭제 예정 처리(취소선), 수정 항목 노란 하이라이트
- 통계: 전체 / 수정됨 / 삭제 예정 실시간 표시
- 필터: 전체 / 수정됨 / 삭제 예정 탭 + 이름 검색
- 이상한 이름 찾기: 대문자 영문 포함 항목 감지
- 수정된 JSON 다운로드: 삭제 항목 제외, name 필드 교체
- `src/main.jsx`에 `/admin/exercise-editor` 라우트 추가

### 3. Firebase 배포 완료
- `https://mygym-365.web.app` 최신 빌드 반영 완료

---

## 🛑 지금 멈춘 지점

### [P1] Supabase 마이그레이션 미실행 — 숨기기 기능 작동 안 됨

운동 숨기기 기능의 코드는 완성되어 있으나, DB 컬럼이 없어서 실제 저장이 실패함.

**실행해야 할 SQL** (Supabase Dashboard → SQL Editor):

```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS hidden_exercises JSONB NOT NULL DEFAULT '[]'::jsonb;
```

파일 위치: `supabase/migrations/add_hidden_exercises.sql`

---

## 🚀 다음에 해야 할 작업 (우선순위)

### 1. [P1] Supabase 마이그레이션 실행
- Supabase SQL Editor에서 `add_hidden_exercises.sql` 내용 실행
- 실행 후 기능 테스트 (아래 검증 방법 참고)

### 2. [P2] 운동 이름 편집기로 exercises.json 정제
- `https://mygym-365.web.app/admin/exercise-editor` 접속
- 가슴 운동 이름 수정/삭제 편집 후 JSON 다운로드
- 다운로드된 `chest_exercises_modified.json`의 데이터를 `exercises.json`의 가슴 운동 항목에 반영
- 이후 다른 bodyPart 운동도 동일한 방식으로 순차 정제

### 3. [P3] 인바디 정보 저장 방식 결정
- 현재 UI에는 인바디 입력란 있으나 DB 컬럼 없어 저장 비활성화(주석 처리) 상태
- `user_profiles`에 컬럼 추가 또는 JSONB 통합 저장 중 결정 필요

---

## 🛠 관련 파일 및 역할

| 파일 | 역할 |
|------|------|
| `src/components/Exercise/ExerciseSelector.jsx` | 운동 선택 UI. `hiddenExercises` prop으로 필터링, `onHideExercise` prop으로 숨기기 처리 |
| `src/components/WorkoutPlan/WorkoutPlanScreen.jsx` | hidden_exercises 로드·저장 주체. ExerciseSelector에 props 전달 |
| `src/components/Calendar/CalendarScreen.jsx` | 숨긴 운동 관리 모달(복구 기능). 장비 설정 코드는 완전 제거됨 |
| `src/components/AiCoach/useAiCoach.js` | AI 추천 시 visibleExercises(숨긴 운동 제외) 사용 |
| `src/components/Admin/ExerciseNameEditor.jsx` | 가슴 운동 이름 편집 도구. 로그인 불필요, `/admin/exercise-editor`로 접근 |
| `src/data/exercises.json` | 전체 운동 데이터 (599개). bodyPart 기준으로 필터링됨 |
| `supabase/migrations/add_hidden_exercises.sql` | hidden_exercises 컬럼 추가 마이그레이션. **아직 Supabase에 적용 안 됨** |
| `src/main.jsx` | 라우팅 정의. `/admin/exercise-editor` 라우트 포함 |

---

## ⚠️ 수정 시 주의사항

### hidden_exercises 관련
- `hidden_exercises` 값은 운동 **ID 배열** (`["0024", "0025"]`) — 이름이 아님
- WorkoutPlanScreen과 CalendarScreen이 각각 독립적으로 Supabase에서 로드하므로, 한쪽에서 변경해도 다른 화면은 다음 마운트 시 반영됨 (실시간 동기화 없음)
- 복구(CalendarScreen) 후 WorkoutPlanScreen을 새로 열어야 반영됨

### user_profiles UPDATE 시
- `update` 페이로드에 `experience_level`, `equipment_access`, `limitations`를 반드시 포함할 것 — 누락 시 기존값 유실 위험
- `height`, `weight`, `age`는 반드시 숫자형으로 변환 후 전송

### ExerciseNameEditor
- `/admin/exercise-editor`는 인증 없이 접근 가능 — 프로덕션 공개 전 보호 필요 여부 검토
- 다운로드된 JSON은 가슴 운동만 포함됨 — `exercises.json`에 병합 시 다른 bodyPart 데이터 덮어쓰지 않도록 주의

---

## ✅ 검증 방법

### 운동 숨기기 기능 (마이그레이션 실행 후)
1. `/app?tab=루틴구성` → 가슴 > 바벨 진입
2. 임의 운동의 눈 아이콘 클릭 → confirm 확인
3. 해당 운동이 목록에서 즉시 사라지는지 확인
4. 브라우저 새로고침 후 여전히 안 보이는지 확인
5. Supabase Dashboard → `user_profiles` → `hidden_exercises` 컬럼에 ID가 추가됐는지 확인
6. `/app?tab=달력` → "숨긴 운동" 버튼 → 목록에 표시되는지 확인
7. "복구" 클릭 → 운동 목록에 다시 나타나는지 확인

### 운동 이름 편집기
1. `https://mygym-365.web.app/admin/exercise-editor` 접속
2. 이름 수정 → 노란 배경 표시 확인
3. `삭제` 입력 → 취소선 + 회색 처리 확인
4. "수정된 JSON 다운로드" → 삭제 항목 제외, 수정 이름 반영 확인
