# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-20
> 브랜치: `main` — 모든 변경사항 커밋 & 푸시 완료 (클린 상태)
> 최신 커밋: `aa381e6` Feat: 분석 탭 AI 종합 훈련 분석 기능 추가

---

## 📌 현재 프로젝트 상태

**MyGym** — Supabase + React + Cloudflare Pages 기반 개인 헬스 트래킹 앱.

| 영역 | 상태 |
|------|------|
| 인증 (Supabase Auth) | ✅ 안정 |
| 라우팅 / 탭 구조 | ✅ 안정 |
| AI 코치 Edge Function | ✅ 배포 필요 (`--no-verify-jwt`) — 코드 변경됨 |
| AI 코치 프론트엔드 | ✅ 완료 (커밋됨) |
| AnalysisScreen | ✅ 도넛 차트 + AI 분석 구현 완료 (커밋됨) |
| Cloudflare 배포 | ✅ push 시 자동 재배포 |

---

## ✅ 이번 세션에서 완료한 작업 (최신순)

### 1. AnalysisScreen — AI 종합 훈련 분석 섹션 추가 (`aa381e6`)
- 전체 탭 볼륨 차트 아래에 "AI 훈련 분석" 섹션 추가
- `requestAIAnalysis()`: 최근 30일 `logs`에서 부위별·요일별 통계 계산 후 Edge Function 호출
- 결과 UI: 요약 카드 + 훈련강도/부위균형/일관성 3칸 그리드 + 개선 제안 목록(✓ 리스트)
- "다시 분석" 버튼으로 재요청 가능
- Edge Function에 `training_analysis` 타입 핸들러 신규 추가

### 2. AnalysisScreen — 디버깅 로그 추가 (`596e98a`)
- `useEffect`에 `logs`, `selectedMuscleGroup` 변경 시 콘솔 출력
- `VolumeDistributionSection`의 `useMemo`에 각 log 처리 + 최종 `volMap` 출력
- ⚠️ **운영 전 이 로그 제거 필요** (성능 영향 있음)

### 3. `react-is` 패키지 추가 (`84d7a9d`)
- `recharts` v3의 peer dependency 문제 해소용
- `package.json` `dependencies`에 `"react-is": "^18.3.1"` 추가

### 4. AnalysisScreen 전면 리팩토링 (`ec98d89`)
- **1RM 추세 섹션 완전 삭제** (`OneRMCard`, `oneRMData`, `filtered1RMs`, `showAll1RMs` 모두 제거)
- **부위별 볼륨 분포** → 바 차트에서 **도넛 차트(PieChart)** 로 교체 (전체 탭)
- **서브카테고리 분포** → 도넛 차트로 교체 (특정 부위 탭)
- 볼륨 단위: 톤 → kg (`toLocaleString()` 형식, 예: `4,700kg`)
- `MUSCLE_COLORS`, `SUB_CAT_COLORS` 상수 정의
- `DonutLegend` 공통 범례 컴포넌트 추가

### 5. AI 응답 한글화 (`ec98d89`)
- Edge Function의 `recommendation`, `muscle_analysis`, `chat`, `onboarding` 타입 모두 한글 전용 시스템 프롬프트로 교체
- `chat` 타입: 프론트에서 넘어오는 `systemMessage` 무시하고 서버 측 한글 프롬프트 사용

### 6. AI 코치 하드모드 옵션 한글화 (`ec98d89`)
- `AiRecommendationScreen.jsx`에 `HARD_MODE_OPTIONS` 상수 배열 추가
- `{ label: '저중량 고반복', value: 'low_weight_high_reps', description: '...' }` 구조
- 버튼에 한글 레이블 + 설명 텍스트 표시, 백엔드로는 영어 `value` 전송

---

## ⛔ 지금 멈춘 지점

**모든 코드 변경은 커밋·푸시 완료.** `git status` 클린.

단, **Edge Function은 마지막으로 재배포하지 않은 상태**.
`training_analysis` 타입과 한글화 프롬프트 변경이 반영되려면 아래 명령이 필요:

```bash
npx supabase functions deploy ai-coach --no-verify-jwt
```

---

## 🐛 현재 알려진 문제 / 확인 필요 사항

### [P1] ⚠️ Edge Function 미배포
`training_analysis` 타입과 AI 한글화 프롬프트가 로컬 코드에는 반영됐으나,
Supabase에 실제 배포되지 않아 현재 운영 중인 함수는 구버전 상태일 수 있음.
→ **즉시 재배포 필요**: `npx supabase functions deploy ai-coach --no-verify-jwt`

### [P2] ⚠️ 디버그 로그 미제거
`AnalysisScreen.jsx`에 운동 기록 전체를 콘솔에 출력하는 로그가 남아있음.
사용자 데이터가 콘솔에 노출되고, 기록이 많을수록 성능 저하 발생.

제거 대상 (2곳):
```javascript
// 1. AnalysisScreen 컴포넌트 내 useEffect (line ~520)
useEffect(() => {
  console.log('=== AnalysisScreen Debug ===')  // ← 삭제
  console.log('logs:', logs)                    // ← 삭제
  console.log('logs length:', logs?.length)     // ← 삭제
  console.log('selectedMuscleGroup:', selectedMuscleGroup) // ← 삭제
}, [logs, selectedMuscleGroup]);                // ← 의존성만 남기거나 useEffect 전체 삭제

// 2. VolumeDistributionSection의 useMemo (line ~280)
console.log('Calculating muscleGroupVolumes...')  // ← 삭제
console.log('Processing log:', log)               // ← 삭제 (forEach 내부)
console.log('Final volumes:', volMap)             // ← 삭제
```

### [P3] workout_logs 스키마 확인 필요
`AnalysisScreen`이 쿼리하는 컬럼: `id, exercise, part, sets_data, created_at`
실제 DB 컬럼명이 다르면 볼륨 계산과 도넛 차트가 빈 데이터로 표시됨.
→ Supabase 대시보드 Table Editor에서 `workout_logs` 컬럼 확인 권장.

### [P4] `recharts` Cell deprecated 경고
`recharts` v3에서 `<Cell>` 컴포넌트가 deprecated 처리됨.
현재 동작에는 문제없으나, 타입스크립트 IDE에서 경고 표시.
→ recharts v3 공식 문서의 대체 방법 확인 후 향후 교체 가능.

---

## 🚀 다음에 해야 할 작업 (우선순위)

### P1 — Edge Function 재배포 (즉시)
```bash
npx supabase functions deploy ai-coach --no-verify-jwt
```
배포 후 Supabase Dashboard → Functions → ai-coach → Logs에서
`[AUTH] Function started` 로그 확인.

### P2 — 디버그 로그 제거 후 재배포
`src/components/Common/AnalysisScreen.jsx`에서 console.log 3곳 제거:
- `useEffect` 디버그 블록 전체 삭제 (line ~516-525)
- `VolumeDistributionSection` useMemo 내 3개 console.log 삭제 (line ~280-288)

제거 후:
```bash
git add src/components/Common/AnalysisScreen.jsx
git commit -m "Chore: 디버그 로그 제거"
git push
```

### P3 — AI 분석 기능 end-to-end 검증
1. 배포된 앱에서 로그인 후 분석 탭 진입
2. "전체" 탭 선택 → 볼륨 도넛 차트 렌더링 확인
3. "분석 요청" 버튼 클릭 → 로딩 스피너 → 결과 카드 표시 확인
4. 결과가 한글로만 표시되는지 확인
5. 특정 부위 탭(예: 가슴) 선택 → 서브카테고리 도넛 차트 확인
6. "AI 훈련 분석" 버튼 → 분석 결과 확인

---

## 📂 관련 파일 및 역할

| 파일 | 역할 |
|------|------|
| `src/components/Common/AnalysisScreen.jsx` | 분석 탭 전체. 도넛 차트, PR 카드, AI 종합 분석 |
| `supabase/functions/ai-coach/index.ts` | Deno Edge Function. 5개 타입 처리: `recommendation`, `muscle_analysis`, `training_analysis`, `chat`, `onboarding` |
| `src/components/AiCoach/useAiCoach.js` | AI 코치 훅. Edge Function 호출, 메시지 상태 관리 |
| `src/components/AiCoach/AiRecommendationScreen.jsx` | AI 코치 UI. 추천 카드, 하드모드 옵션(한글), 루틴 추가 버튼 |
| `src/data/exercises.json` | 운동 마스터 데이터 (204개). Edge Function에 payload로 전송 |
| `src/api/supabase.js` | Supabase 클라이언트 초기화 |
| `src/api/workoutApi.js` | workout_logs CRUD. 실제 DB 컬럼명 참조용 |
| `src/main.jsx` | 라우팅, 인증 가드, 세션 관리 |
| `src/components/Auth/LoginScreen.jsx` | 로그인/회원가입 |
| `supabase/migrations/` | DB 마이그레이션 SQL (미적용 상태 가능) |

---

## 🛠 수정 시 주의사항

### Edge Function (`supabase/functions/ai-coach/index.ts`)
- 수정 후 반드시 재배포:
  ```bash
  npx supabase functions deploy ai-coach --no-verify-jwt
  ```
- `CORS_HEADERS` 객체와 `OPTIONS` 처리 블록을 항상 동시에 유지
- Deno 전용 API(`Deno.env.get`) 앞에 `// @ts-ignore` 주석 필요
- `createClient`는 `https://esm.sh/@supabase/supabase-js@2`에서 import
- `chat` 타입은 body의 `systemMessage`를 **무시함** — 서버 측 한글 프롬프트 사용

### AnalysisScreen 데이터 구조
- DB에서 가져오는 `logs` 구조: `{ id, exercise(운동명), part(부위), sets_data(JSON), created_at }`
- `sets_data` 파싱: `typeof setsData === 'string'` 분기 처리 (DB 저장 방식 혼용 가능)
- `normalizePart(log.part)` → `'가슴' | '등' | '어깨' | '하체' | '팔' | '코어' | '기타'` 반환
- AI 분석 요청 시 `created_at` 기준 30일 필터링 (DB의 날짜 컬럼명 확인 필요)

### exercises.json
- `id`: 문자열 (`"0025"` 형식) — 숫자 아님
- `bodyPart` 필드 사용 (DB의 `part`와 다름)

### Cloudflare 배포
- `package-lock.json`을 커밋하면 Cloudflare `npm ci` 실패 가능성 있음
- **절대 커밋하지 말 것**: `package-lock.json` (`.gitignore`에 없음 — 주의)

---

## 🔍 검증 방법

### 볼륨 도넛 차트
```
1. 분석 탭 → 전체 탭
2. 도넛 차트가 표시되면 성공
3. 비어있으면 콘솔에서 "Final volumes: {}" 확인
   → workout_logs의 part 컬럼값이 normalizePart()와 매핑되지 않는 것
```

### AI 훈련 분석
```
1. 분석 탭 → 전체 탭 → "분석 요청" 버튼 클릭
2. 로딩 스피너 표시 → 결과 카드 표시
3. 결과가 한글인지 확인
4. 실패 시 콘솔에서 "AI 분석 실패:" 에러 메시지 확인
5. Supabase Dashboard → Functions → ai-coach → Logs에서
   "[AUTH] User authenticated" 로그 확인
```

### 하드모드 한글 옵션
```
1. AI 코치 탭 → 하드모드 버튼
2. "저중량 고반복", "고중량 저반복", "점진적 과부하", "드롭 세트" 표시 확인
3. 각 옵션 아래 설명 텍스트(작은 글씨) 표시 확인
```

---

## 🔑 환경변수 / 시크릿

| 위치 | 키 | 용도 |
|------|-----|------|
| `.env` (로컬) | `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `.env` (로컬) | `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| Supabase Secrets | `OPENAI_API_KEY` | Edge Function에서 사용 |
| Supabase Secrets | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Edge Function 자동 주입 |

> ⚠️ `.env` 파일은 Git에 커밋되지 않도록 주의 (`.gitignore` 확인 필수).
