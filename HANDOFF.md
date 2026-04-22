# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-22
> 브랜치: `main` — **운동 데이터 전면 다국어 처리 완료**
> 최신 커밋: `5d8fb53` feat: 다국어 지원(한/영) 및 자동 언어 감지 추가
> ⚠️ 위 커밋 이후 추가 작업이 있었으나 아직 커밋되지 않음 (git status: 18개 파일 수정)

---

## 📌 현재 프로젝트 상태

**MyGym** — 운동 기록 및 AI 코칭을 제공하는 개인 헬스 트래킹 웹 앱.
배포 환경: Cloudflare Pages (GitHub 연동 자동 배포)
스택: React + Vite + Tailwind CSS v4 + Supabase + i18next

**전체 기능 완성도**

- 인증: Google OAuth + 이메일/OTP, 세션은 sessionStorage (브라우저 종료 시 만료)
- 온보딩: 목표 다중 선택, 운동 가능 시간, 기존 유저 스킵 로직
- 반응형 레이아웃: 모든 탭 max-w-6xl 통일, 모바일/PC 대응
- AI 코칭: 루틴 추천(balanced/hard mode), 채팅, 부위별 분석, 훈련 종합 분석
- 다국어(i18n): 한/영 전면 지원 — UI, AI 답변, 운동명, 부위명, 기구명 모두 포함
- Supabase 에지 함수 (`ai-coach`): 현재 `--no-verify-jwt` 플래그로 배포됨 (이유 아래 설명)

---

## ✅ 방금까지 완료한 작업 (이번 세션)

### 1. `ai-coach` 에지 함수 배포 및 언어 동기화 검증
- `npx supabase functions deploy ai-coach --no-verify-jwt` 로 배포 완료.
- `lang=ko` / `lang=en` 요청 모두 실제 API 호출로 검증 완료.
- **`--no-verify-jwt` 사용 이유**: 프로젝트가 새 Supabase 키 시스템(`sb_publishable_*`)을 사용하며, 이 키가 발행하는 JWT는 ES256 알고리즘. Supabase 에지 함수 게이트웨이가 HS256만 지원하므로 게이트웨이 JWT 검증을 비활성화함. 함수 내부 코드가 `recommendation` 타입에 한해 `supabase.auth.getUser(token)` 으로 자체 검증하므로 보안은 유지됨.

### 2. 운동 데이터 전면 다국어 처리

#### `src/data/exercises.json`
- 161개 전체 운동에 `name_en` 필드 추가 (예: `"name_en": "Barbell Bench Press"`).
- 기존 `nameEn` 필드명을 `name_en` 으로 통일.

#### `src/i18n/ko.json` / `en.json`
- `equipment` 섹션 추가: 바벨→Barbell, 덤벨→Dumbbell 등 13개 기구명 번역.
- `subCategories` 섹션 추가: 상부→Upper, 이두근→Biceps 등 18개 서브카테고리 번역.

#### `src/utils/exerciseUtils.js` — 공유 헬퍼 추가
- `BODY_PART_I18N`: 부위 한국어 키 → i18n 키 매핑 (공유 상수).
- `getLocalizedName(ex, lang)`: exercise 객체에서 언어별 이름 반환.
- `getLocalizedNameByKo(koName, lang)`: DB에 저장된 한국어 이름으로 데이터셋 조회 후 번역.
- `getExerciseGif`: 내부 `nameEn` → `name_en` 참조 수정.

#### 컴포넌트 업데이트
- `ExerciseSelector.jsx`: 로컬 `BODY_PART_I18N` 제거 → 공유 상수 임포트. 운동명(`getExerciseName`), 기구명(`getEquipmentLabel`), 부위명 모두 i18n 처리.
- `WorkoutPlanScreen.jsx`: 루틴 목록의 운동명·부위명 다국어 처리.
- `DayDetailView.jsx`: DB에서 불러온 운동명·부위명 다국어 처리.
- `AnalysisScreen.jsx`: 도넛 차트 레이블·범례 번역, `i18n` 미참조 버그 수정, `training_analysis` 에 `lang` 파라미터 및 영문 요일명(`dayNames`) 추가.
- `RoutineList.jsx`: 중복 `getExerciseGif` / `GifModal` / `GifRenderer` 제거 → 공유 유틸 임포트. `item.nameEn` → `item.name_en`.
- `ChatMessage.jsx`: `nameEn` → `name_en` (구버전 AI 응답 폴백 `item.nameEn` 유지).

#### 에지 함수 업데이트
- `supabase/functions/ai-coach/index.ts`: `ex.nameEn` → `ex.name_en` 수정 후 재배포.

---

## 🛑 지금 멈춘 지점

### [미커밋] 이번 세션 전체 변경 사항이 커밋되지 않음
- 18개 파일이 수정된 상태로 스테이징도 안 됨.
- 커밋 전 전체 흐름을 한 번 앱에서 직접 테스트하는 것 권장.

### [미검증] 다국어 처리 엔드투엔드 테스트
- 앱을 영어로 전환했을 때 실제 화면에서 운동명/부위명/기구명이 영어로 표시되는지 브라우저 검증 미완.
- 특히 `WorkoutPlanScreen` 과 `DayDetailView` 는 localStorage/DB 데이터 기반이므로 실제 데이터가 있어야 확인 가능.

### [미처리] `AnalysisScreen`의 `training_analysis` `lang` 미전달 (기존 버그)
- `training_analysis` 호출 시 `lang: i18n.language` 를 추가했으나, 에지 함수 내 `training_analysis` 핸들러는 `langInstruction` 은 이미 상단에서 처리하므로 별도 로직 불필요. 이미 동작 중.

---

## ⚠️ 현재 알려진 문제

### 1. `AiRecommendationScreen` 운동명 표시 언어 혼용 가능성
- AI 추천 루틴 카드(`exercise.name`)는 에지 함수가 `lang=en` 일 때 영문명을 반환하므로 별도 처리 불필요.
- 단, **채팅(`type=chat`)** 으로 받은 루틴은 AI가 한국어로 반환할 수 있음. `ChatMessage.jsx` → `RoutineList.jsx` 경로에서 `item.name` 이 한국어 이름으로 저장되므로 영어 모드에서도 한국어 운동명이 표시될 수 있음.

### 2. DB 저장 데이터는 항상 한국어
- `workout_logs.exercise` 컬럼에 저장된 운동명은 한국어 원본.
- `getLocalizedNameByKo` 함수로 표시 시 번역하지만, 데이터셋에 없는 커스텀 운동명은 번역 불가 (원본 한국어 표시).

### 3. `--no-verify-jwt` 보안 함의
- `onboarding`, `chat`, `muscle_analysis`, `training_analysis` 타입은 함수 코드 내 유저 검증이 없음.
- 함수 URL을 아는 누구든 Authorization 헤더 없이도 호출 가능 (실제로는 유효한 auth 헤더 필요하지만 JWT 서명 검증 없음).
- 해결책: 모든 타입에 유저 검증 추가 또는 Supabase 프로젝트를 legacy JWT(HS256)로 되돌리기.

---

## 🚀 다음에 해야 할 작업 (우선순위)

### P1 — 변경 사항 커밋 및 배포
```bash
git add -A
git commit -m "feat: 운동 데이터 전면 다국어 처리 및 에지 함수 개선"
git push origin main
```
Cloudflare Pages가 자동 배포. 배포 후 앱에서 언어 전환 테스트 필수.

### P2 — Google Analytics 설치
- `index.html` 에 `gtag.js` 스니펫 추가 또는 `react-ga4` 패키지 도입.
- 트래킹 이벤트: 로그인(`login`), 운동 추가(`add_exercise`), AI 추천 요청(`ai_recommendation`).
- 측정 ID는 Google Analytics 4 콘솔에서 발급.

### P3 — 커스텀 도메인 연결
- Cloudflare Pages 대시보드 → 도메인 설정.
- DNS A/CNAME 레코드 설정 후 HTTPS 자동 적용 확인.

---

## 🗂 주요 파일 및 역할

- `supabase/functions/ai-coach/index.ts` — AI 코치 에지 함수. `lang` 파라미터로 답변 언어 분기, `name_en` 으로 영문 운동명 AI에 전달.
- `src/data/exercises.json` — 운동 데이터셋 161개. `name` (한국어), `name_en` (영어), `bodyPart`, `equipment`, `gif_url` 포함.
- `src/utils/exerciseUtils.js` — 공유 유틸. `getLocalizedName`, `getLocalizedNameByKo`, `BODY_PART_I18N`, `getExerciseGif`.
- `src/i18n/ko.json` / `src/i18n/en.json` — 번역 파일. `bodyParts`, `equipment`, `subCategories`, `exercise`, `workout`, `analysis`, `aiCoach` 등 전 섹션 포함.
- `src/components/Exercise/ExerciseSelector.jsx` — 운동 선택 UI. 부위/기구/운동명 전부 i18n 처리됨.
- `src/components/WorkoutPlan/WorkoutPlanScreen.jsx` — 루틴 구성 화면. localStorage 기반 운동 목록.
- `src/components/Calendar/DayDetailView.jsx` — 날짜별 운동 기록 조회. DB 기반 운동명 번역.
- `src/components/Common/AnalysisScreen.jsx` — 분석 탭. 도넛 차트 레이블·범례 번역, `i18n` 정상 참조.
- `src/api/supabase.js` — Supabase 클라이언트. `sessionStorage` 보안 설정.
- `src/components/AiCoach/useAiCoach.js` — AI 코치 상태 관리. `lang: i18n.language` 파라미터 전달.

---

## ⚠️ 수정 시 주의사항

- **`name_en` 필드명 고정**: `nameEn` 는 구버전 폴백으로만 `ChatMessage.jsx` 에 남아 있음. 새 코드는 반드시 `name_en` 사용.
- **React Hooks**: 컴포넌트 내 조건문/조기 return 아래 Hook 선언 금지 (Rules of Hooks 에러 재발 방지).
- **반응형**: `isMobile` 변수 대신 Tailwind `md:`, `lg:` 클래스 사용.
- **탭 ID**: `달력`, `루틴구성`, `AI코치` 는 라우팅 키값. 절대 번역하거나 변경하지 말 것.
- **에지 함수 재배포**: `supabase/functions/ai-coach/index.ts` 수정 시 반드시 `npx supabase functions deploy ai-coach --no-verify-jwt` 실행.
- **`getLocalizedNameByKo` 사용처**: DB/localStorage 에서 꺼낸 한국어 이름을 번역할 때 사용. exercise 객체가 있으면 `getLocalizedName(ex, lang)` 사용이 더 효율적.

---

## ✅ 검증 방법

### 1. 다국어 운동명 테스트
- 앱 언어를 영어로 전환 → 루틴구성 탭 진입 → 부위/기구/운동명이 영어로 표시되는지 확인.
- 달력에서 기록 있는 날짜 클릭 → 운동명이 영어로 표시되는지 확인.
- 분석 탭 → 도넛 차트 레이블/범례가 영어로 표시되는지 확인.

### 2. AI 답변 언어 동기화 테스트
- 앱 언어를 영어로 변경 → AI 코치 탭에서 루틴 추천 요청 → 영어 답변 확인.
- 분석 탭 → AI 훈련 분석 요청 → 영어 인사이트 확인.

### 3. 세션 만료 테스트
- 로그인 후 브라우저 탭 완전히 닫기 → 재진입 시 로그인 화면 확인.

### 4. 빌드 오류 없음 확인
```bash
npm run build
```
경고(chunk size)는 무시. error 없으면 정상.
