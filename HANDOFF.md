# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-20
> 브랜치: `main` — **모든 변경사항 커밋 및 푸시 완료**
> 최신 커밋: `5b852bc` Feat: AI 코치 개인정보·운동이력 반영 및 UI 개선

---

## 📌 현재 프로젝트 상태

**MyGym** — Supabase + React + Cloudflare Pages 기반 개인 헬스 트래킹 앱.

| 영역 | 상태 |
|------|------|
| 인증 (Supabase Auth) | 안정 |
| 라우팅 / 탭 구조 | 안정 |
| AI 코치 Edge Function | ⚠️ **배포 필요** — 이번 세션 수정 반영 대기 중 |
| AI 코치 프론트엔드 | 안정 (커밋됨) |
| AnalysisScreen | 안정 (커밋됨) |
| Cloudflare 배포 | push 시 자동 재배포 |

---

## ✅ 이번 세션에서 완료한 작업 (최신순)

### 0. 커밋 및 푸시 완료 (`5b852bc`)
- `src/components/AiCoach/AiRecommendationScreen.jsx`
- `src/components/AiCoach/useAiCoach.js`
- `supabase/functions/ai-coach/index.ts`
- 위 파일들의 모든 개선사항이 로컬 및 원격 저장소에 반영됨.

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

## 🐛 현재 알려진 문제 / 확인 필요 사항

### [P1] ⚠️ Edge Function 미배포 (즉시 처리 필요)

**Edge Function 재배포:**
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

### P1 — Edge Function 재배포 (즉시)
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
