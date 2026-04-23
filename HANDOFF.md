# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-23
> 브랜치: `main` — **AI 코치 Edge Function 응답 파이프라인 완전 재정비**

---

## 📌 1. 현재 상태 요약

이번 세션에서는 AI 코치 백엔드(`supabase/functions/ai-coach/index.ts`)와 프론트엔드(`useAiCoach.js`, i18n)에 걸쳐 발생하던 여러 버그를 단계적으로 진단하고 수정했습니다.

**핵심 성과:**
- 응답 구조 불일치로 추천 카드가 렌더링되지 않던 문제 해결
- OpenAI null content 에러 방어 로직 추가
- chat 타입에서 AI가 JSON으로만 응답하던 근본 원인(i18n 잘못된 규칙) 수정
- 디버깅용 console.log 전면 추가 (Supabase 대시보드에서 확인 가능)

---

## ✅ 2. 이번 세션에서 완료한 작업

### 작업 A: 응답 구조 통일 (`index.ts`)
- **문제**: 비-chat 타입(`recommendation`, `muscle_analysis`, `training_analysis`)이 OpenAI JSON 문자열을 raw body로 반환 → `supabase.functions.invoke`가 파싱하면 `data.reply`, `data.content` 키가 없음
- **수정**: 모든 응답을 `{ reply, content, parsedData }` 봉투로 통일

| 타입 | 반환 구조 |
|------|-----------|
| `chat` | `{ reply: string, content: string }` |
| `recommendation` / `muscle_analysis` / `training_analysis` / `onboarding` | `{ reply: string, content: string, parsedData: object }` |

### 작업 B: OpenAI 응답 null 방어 (`index.ts`)
- `openaiData.choices` 배열 존재 여부 체크
- `choices[0]?.message?.content ?? null` 로 안전 추출
- `content === null`이면 `finish_reason` 포함한 구체적 에러 throw

### 작업 C: exercises 빈 배열 fallback (`index.ts`)
- `Array.isArray(exercises)` 만으로는 빈 배열 `[]` 통과 → `exercises.length > 0` 조건 추가
- 빈 배열일 때 "운동 종목 데이터 없음. 일반적인 운동 종목으로 구성할 것." 텍스트로 fallback

### 작업 D: systemPrompt 유효성 검사 + excludeText 분리 (`index.ts`)
- `recommendation` 블록에서 `systemPrompt` 생성 후 빈 문자열 체크 → 실패 시 throw
- `recentlyTrainedParts.join(', ')` 로직을 `excludeText` 변수로 분리하여 명시적 처리

### 작업 E: JSON 파싱 강화 (`index.ts`)
- 비-chat 응답에서 마크다운 코드블록(` ```json `) 제거 후 `JSON.parse` 시도
- 파싱 실패 시 `console.error` + "AI response is not valid JSON" 에러 throw
- `recommendation` 타입에서 `parsedRoutine.routines` 배열 존재 여부 추가 검증

### 작업 F: 디버깅 로그 추가 (`index.ts`)
- `recommendation` 진입 시: exercises count, recentWorkouts, selectedMode, userProfile, lang
- messages 생성 후: systemPrompt length, user message 내용
- AI 응답 수신 후: raw content, cleaned content, parsed result, routines count

### 작업 G: callRecommendation 응답 처리 개선 (`useAiCoach.js`)
- 응답 로그 추가: `response.reply`, `response.content`, `response.parsedData`
- `reply = response?.reply ?? response?.content ?? null` 폴백 로직
- `reply`가 null이면 명시적 에러 throw (기존에는 undefined가 조용히 표시됨)

### 작업 H: chat JSON 응답 근본 원인 수정 (`ko.json` / `en.json`)
- **문제**: `aiCoach.prompt.rules` i18n 키에 "순수한 JSON 형식으로만 응답하십시오"가 있어서 chat 모드에서도 AI가 JSON으로 응답
- **수정**: 대화체 응답 규칙으로 교체 ("자연스러운 대화체로 답변, JSON 형식 금지")
- `index.ts`의 `useJsonMode` 플래그는 이미 올바르게 분기되어 있었음 (chat → false)

---

## 📍 3. 지금 멈춘 지점 및 현재 상태

- **상태**: 모든 수정 완료. Edge Function 재배포 후 실제 테스트 필요.
- **디버그 로그**: 현재 `console.log`가 다수 남아있음. 안정화 확인 후 제거 권장.
- **미확인**: chat 응답 정상화 여부 (i18n 수정 후 테스트 미완료).

---

## 🚀 4. 다음에 해야 할 작업 (우선순위 1~3)

1. **Edge Function 재배포 및 전체 플로우 테스트**
   - `supabase functions deploy ai-coach`
   - chat / recommendation / muscle_analysis / training_analysis 각각 테스트
   - Supabase 대시보드 → Functions → Logs에서 debug 로그 확인

2. **디버그 console.log 제거**: 안정화 확인 후 `index.ts`의 `console.log` 전면 제거 (민감 데이터 노출 방지)

3. **Google Analytics(GA4) 설치**: `index.html`에 트래킹 스니펫 추가

---

## 📂 5. 관련 파일 및 역할

| 파일 | 역할 |
|------|------|
| `supabase/functions/ai-coach/index.ts` | AI 코치 Edge Function. 타입별 프롬프트 생성 + OpenAI 호출 + 응답 구조화 |
| `src/components/AiCoach/useAiCoach.js` | 프론트 API 통신부. `callRecommendation` / `callOpenAI` / `insertRoutineToDb` |
| `src/components/AiCoach/AiRecommendationScreen.jsx` | 추천 UI. `parseResponseJSON`으로 `msg.text`(JSON 문자열) 파싱 후 루틴 카드 렌더링 |
| `src/components/Common/AnalysisScreen.jsx` | 분석 UI. `JSON.parse(data.content)`로 AI 분석 결과 렌더링 |
| `src/i18n/ko.json` / `en.json` | `aiCoach.prompt.rules` — chat용 대화체 규칙으로 수정됨 |

---

## ⚠️ 6. 수정 시 주의사항

- **응답 봉투 구조 유지**: 모든 non-chat 응답은 `{ reply, content, parsedData }` 형태여야 함
  - `reply` / `content`: 동일한 JSON 문자열 (프론트 두 곳에서 각각 참조)
  - `parsedData`: 이미 파싱된 객체 (향후 프론트에서 직접 활용 가능)
- **chat은 JSON 모드 금지**: `useJsonMode = false` 유지, i18n `rules`에 JSON 지시 금지
- **`recentWorkouts` 구조**: `{ date, parts[], exercises[] }` 유지 필수
- **`exercises` 빈 배열**: `exercises.length > 0` 체크로 fallback 처리됨

---

## 🧪 7. 검증 방법

1. **recommendation**: 추천 버튼 클릭 → 루틴 카드가 렌더링되는지 확인
   - 브라우저 콘솔: `response.reply`가 JSON 문자열인지 확인
   - Supabase 로그: `Routines count: N` 출력 확인

2. **chat**: 채팅 입력 → 자연스러운 한국어/영어 텍스트로 응답하는지 확인 (JSON 객체 아님)

3. **muscle_analysis / training_analysis**: 분석 버튼 클릭 → `data.content`를 `JSON.parse`해서 카드 렌더링 확인

4. **에러 핸들링**: 잘못된 요청 시 `{ error: "..." }` + 500 상태 코드 반환 확인
