# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-20
> 브랜치: `main` — **미커밋 변경사항 3개 파일 존재** (커밋·푸시 필요)
> 최신 커밋: `c78cc12` Fix: 특정 부위 선택 시 AI 분석 실패 문제 수정

---

## 📌 현재 프로젝트 상태

**MyGym** — Supabase + React + Cloudflare Pages 기반 개인 헬스 트래킹 앱.

| 영역 | 상태 |
|------|------|
| 인증 (Supabase Auth) | 안정 |
| 라우팅 / 탭 구조 | 안정 |
| AI 코치 Edge Function | ⚠️ **미커밋 + 미배포** — 이번 세션 수정 반영 필요 |
| AI 코치 프론트엔드 | ⚠️ **미커밋** — 이번 세션 수정 반영 필요 |
| AnalysisScreen | 안정 (커밋됨) |
| Cloudflare 배포 | push 시 자동 재배포 |

---

## ✅ 이번 세션에서 완료한 작업 (최신순)

### 1. Edge Function TDZ 버그 수정 (`index.ts`)
- 원인: `recommendation` 블록 안에 `const body`가 두 번 선언되어 TDZ(Temporal Dead Zone) 에러 발생
  - 76번째 줄: `const body = await req.json()`
  - 159번째 줄: `const body = 키/몸무게 문자열` (내부에서 섀도잉)
- 수정: 내부 변수명 `body` → `physique`로 변경, 프롬프트 참조도 동일하게 수정
- 이전 에러: `"ReferenceError: Cannot access 'body' before initialization"`

### 2. AI 추천 — 최근 7일 운동 기록 반영 (`useAiCoach.js`, `index.ts`)
- `callRecommendation()`에서 Supabase `workout_logs` 직접 조회 (최근 7일, `exercise, part, created_at`)
- 날짜별 그룹화 → `{ date, parts: [], exercises: [] }` 배열 생성 후 `recentWorkouts`로 Edge Function 전달
- Edge Function: 프론트 전달값으로 14일 DB 쿼리 대체, 날짜별 이력 텍스트 생성
- 오늘 날짜와 매칭하여 `todayParts` 추출 → 프롬프트에 `⚠️ 오늘 이미 운동한 부위: 가슴, 팔 → 반드시 제외` 명시
- 응답 규칙에 "오늘 부위 제외", "오래된 부위 우선" 지침 추가

### 3. AI 추천 — 개인정보 완전 반영 (`index.ts`)
- 기존에 미사용이던 `age`, `gender`, `height`, `weight`, `skeletal_muscle_mass`, `body_fat_mass`, `body_fat_percentage`, `bmr`, `visceral_fat_level` 모두 시스템 프롬프트에 조건부 추가
- 나이별 강도 지침 자동 추가 (20~30대/40대/50대 이상)
- 인바디 기반 지침: 체지방률 25% 이상 → 유산소 증가, 골격근량 낮음 → 근력 강조
- 분할 전략 자동 결정: beginner → 2분할 / 중급·고급+주4회 이상 → 3~4분할 / 중급·고급+주3회 이하 → 2~3분할

### 4. AI 추천 — 응답 포맷 개선 (`index.ts`, `AiRecommendationScreen.jsx`)
- JSON 응답 포맷: `{ intro, recommendations, tip }` 구조로 확장
  - `intro`: 최근 운동 이력 기반 오늘 루틴 방향 설명 (운동 카드 위)
  - `tip`: 주요 부위 부상 예방 팁 + "오늘도 화이팅!" (운동 카드 아래)
- 프론트엔드 `parseResponseJSON`: `intro`, `tip` 추출 추가

### 5. AI 코치 UI 개선 (`AiRecommendationScreen.jsx`)
- 전체 추천 결과를 보라색 박스 하나로 통합 (`bg-purple-600/10 border border-purple-500/30`)
- 운동 카드 레이아웃 변경: `[운동명] ··· [부위 | 최고기록] [+버튼]` 한 줄로 압축
- `tip` 텍스트 스타일을 `intro`와 동일하게 통일 (`text-sm text-slate-200 font-medium`)
- 하드모드 옵션 패널 상단에 안내 문구 추가: "데이터가 2주 이상 쌓여야 정확한 하드모드 추천이 가능합니다."

### 6. 하드모드 옵션 채팅창 한글화 (`AiRecommendationScreen.jsx`, `useAiCoach.js`)
- `sendHardModeRequest`에서 선택한 옵션의 `label` 찾아 세 번째 인자로 전달
- `callRecommendation(mode, hardModeType, hardModeLabel)` — label 우선 사용
- 결과: "🔥 하드모드 루틴 추천 (고중량 저반복)" (기존: 영어 value 그대로 표시)

### 7. AnalysisScreen 특정 부위 AI 분석 버그 수정 (`c78cc12` — 커밋됨)
- 원인: `subCategoryData` 필드명 불일치 (`name`/`value` → Edge Function은 `category`/`volume` 기대)
- `undefined.toLocaleString()` TypeError → Edge Function 500 에러 → UI에 "AI 분석 실패" 표시
- 수정: `runAnalysis`에서 전달 전 필드명 변환 map 추가

### 8. AnalysisScreen 디버그 로그 제거 (`16b9dd2` — 커밋됨)
- `useEffect` 블록 `console.log` 4개 제거
- `VolumeDistributionSection` useMemo `console.log` 3개 제거

---

## ⛔ 지금 멈춘 지점

**이번 세션의 변경사항 3개 파일이 커밋·푸시되지 않은 상태.**

미커밋 파일:
- `src/components/AiCoach/AiRecommendationScreen.jsx`
- `src/components/AiCoach/useAiCoach.js`
- `supabase/functions/ai-coach/index.ts`

또한 **Edge Function은 미배포 상태** — 이번 세션의 모든 AI 관련 개선사항이 운영에 미반영.

---

## 🐛 현재 알려진 문제 / 확인 필요 사항

### [P1] ⚠️ 미커밋 + Edge Function 미배포 (즉시 처리 필요)

**① 커밋·푸시:**
```bash
git add src/components/AiCoach/AiRecommendationScreen.jsx
git add src/components/AiCoach/useAiCoach.js
git add supabase/functions/ai-coach/index.ts
git commit -m "Feat: AI 코치 개인정보·운동이력 반영 및 UI 개선"
git push
```

**② Edge Function 재배포:**
```bash
npx supabase functions deploy ai-coach --no-verify-jwt
```

배포 후 Supabase Dashboard → Functions → ai-coach → Logs에서 `[AUTH] Function started` 로그 확인.

### [P2] AnalysisScreen `workout_logs` 스키마 미검증
- AnalysisScreen이 쿼리하는 컬럼: `id, exercise, part, sets_data, created_at`
- 실제 DB 컬럼명이 다르면 도넛 차트가 빈 데이터로 표시됨
- Supabase 대시보드 Table Editor에서 `workout_logs` 컬럼명 확인 권장

### [P3] `recharts` `<Cell>` deprecated 경고
- `recharts` v3에서 `<Cell>` deprecated. 현재 동작 문제없으나 IDE 경고 표시
- 향후 recharts v3 공식 문서 대체 방법으로 교체 가능

---

## 🚀 다음에 해야 할 작업 (우선순위)

### P1 — 커밋·푸시 + Edge Function 재배포 (즉시)
위 [P1] 섹션 명령어 참조.

### P2 — AI 코치 추천 end-to-end 검증
재배포 후 다음 시나리오 테스트:
1. 오늘 이미 운동한 상태에서 "오늘의 루틴 추천" 클릭
   → `intro`에 "오늘 이미 가슴·팔 하셨네요" 언급 + 해당 부위 운동 카드 없음 확인
2. 고급자(experience_level=advanced) + 주 4회 이상 프로필
   → 추천 운동이 3~4분할 한 부위로만 구성되는지 확인 (전신 운동 미포함)
3. 하드모드 "고중량 저반복" 선택
   → 채팅창에 "🔥 하드모드 루틴 추천 (고중량 저반복)" 한글로 표시 확인
4. 운동 카드에 `intro`(보라색 박스 안 상단 텍스트), `tip`(하단 텍스트) 표시 확인

### P3 — AnalysisScreen end-to-end 검증
1. 분석 탭 → 전체 탭 → 도넛 차트 렌더링 확인
2. "분석 요청" → 결과가 한글인지 확인
3. 특정 부위(예: 가슴) 탭 → 서브카테고리 도넛 차트 → "AI 훈련 분석 요청" 클릭 → 결과 표시 확인

---

## 📂 관련 파일 및 역할

- `src/components/AiCoach/useAiCoach.js`
  → AI 코치 훅. `callRecommendation()`에서 최근 7일 운동 기록 조회 후 Edge Function 전달.
  → `callRecommendation(mode, hardModeType, hardModeLabel)` — 세 번째 인자 추가됨

- `src/components/AiCoach/AiRecommendationScreen.jsx`
  → AI 코치 UI. 추천 결과를 보라색 박스 하나로 통합.
  → `parseResponseJSON`: `intro`, `tip` 추출 포함
  → `sendHardModeRequest`: `HARD_MODE_OPTIONS`에서 label 찾아 전달

- `supabase/functions/ai-coach/index.ts`
  → Deno Edge Function. 5개 타입: `recommendation`, `muscle_analysis`, `training_analysis`, `chat`, `onboarding`
  → `recommendation` 타입: `recentWorkouts` body 파라미터 추가, 개인정보 전체 반영, 분할 전략 자동 결정

- `src/components/Common/AnalysisScreen.jsx`
  → 분석 탭. 도넛 차트, PR 카드, AI 종합 분석. 디버그 로그 제거 완료.

- `src/components/Onboarding.jsx`
  → 첫 로그인 8단계 플로우. `user_profiles` upsert.

- `src/components/Calendar/CalendarScreen.jsx`
  → 달력 탭. 우측 상단 "개인정보" 버튼 → 프로필 수정 모달 (인바디 포함).

- `src/api/workoutApi.js`
  → workout_logs CRUD. 실제 DB 컬럼명 참조용.

- `src/data/exercises.json`
  → 운동 마스터 데이터 (204개). `id`는 문자열(`"0025"`), `bodyPart` 필드 사용.

- `supabase/migrations/`
  → DB 마이그레이션 SQL (미적용 상태 가능).

---

## 🛠 수정 시 주의사항

### Edge Function (`supabase/functions/ai-coach/index.ts`)
- 수정 후 반드시 `npx supabase functions deploy ai-coach --no-verify-jwt` 재배포
- `CORS_HEADERS` 객체와 `OPTIONS` 처리 블록 항상 함께 유지
- `Deno.env.get` 앞에 `// @ts-ignore` 주석 필요
- `createClient`는 `https://esm.sh/@supabase/supabase-js@2`에서 import
- `chat` 타입은 body의 `systemMessage`를 무시 — 서버 측 한글 프롬프트 사용
- **`recommendation` 블록 내 변수명 주의**: 신체 정보 문자열 변수는 `physique` (과거 `body`로 선언 → TDZ 에러 발생 이력)

### `recommendation` 타입 body 구조
프론트엔드 → Edge Function 전달 필드:
```javascript
{
  type: 'recommendation',
  exercises: EXERCISE_DATASET,   // 204개 운동 마스터
  profile,                        // user_profiles 전체
  mode,                           // 'balanced' | 'hard'
  hardModeType,                   // 'high_weight_low_reps' 등 영어 value
  recentWorkouts,                 // [{ date, parts: [], exercises: [] }, ...]
}
```

### AnalysisScreen 데이터 구조
- `logs` 구조: `{ id, exercise(운동명), part(부위), sets_data(JSON), created_at }`
- `sets_data` 파싱: `typeof setsData === 'string'` 분기 처리 필요
- `normalizePart(log.part)` → `'가슴' | '등' | '어깨' | '하체' | '팔' | '코어' | '기타'`
- `runAnalysis`에서 Edge Function에 보내는 breakdown 필드명: `category`, `volume` (recharts용 `name`/`value`와 다름 — 변환 map 필수)

### exercises.json
- `id` 필드는 숫자가 아닌 문자열 (`"0025"`)
- `bodyPart` 필드 사용 (DB의 `part` 컬럼명과 다름)

### Cloudflare 배포
- `package-lock.json` 커밋 금지 (`.gitignore`에 없음 — 실수 주의)
- `git push` 시 Cloudflare 자동 재배포

### 환경변수
- `.env` (로컬): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Supabase Secrets: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

---

## 🔍 검증 방법

### AI 코치 추천 (최근 운동 반영)
```
1. 오늘 이미 가슴 운동을 한 상태에서 "오늘의 루틴 추천" 클릭
2. intro 텍스트에 "오늘 가슴 하셨네요" 류 언급 확인
3. 추천 카드에 가슴 운동이 없는지 확인
4. Supabase Logs에서 인증 성공 + 오류 없음 확인
```

### AI 코치 추천 (분할 전략)
```
1. 프로필: 고급자(advanced) + 주 5회
2. 추천 결과가 1~2개 부위로만 집중되는지 확인 (전신 운동 없어야 함)
3. intro에 분할 전략 언급 확인
```

### AnalysisScreen 특정 부위 AI 분석
```
1. 분석 탭 → 가슴 탭 선택
2. 서브카테고리 도넛 차트 표시 확인
3. "AI 훈련 분석 요청" 클릭 → 로딩 → 결과 카드 표시
4. 실패 시 콘솔에서 "AI 분석 실패:" 에러 확인
   → breakdown 필드 변환 문제이므로 runAnalysis의 map() 로직 재확인
```

### 하드모드 한글 옵션
```
1. AI 코치 탭 → 하드모드 버튼
2. "고중량 저반복" 클릭
3. 채팅창에 "🔥 하드모드 루틴 추천 (고중량 저반복)" 표시 확인 (영어 아님)
```
