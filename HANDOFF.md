# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-24 (늦은 오후)
> 상태: **전체 시스템 고도화 및 데이터베이스 이관 완료 (Final Beta)**

---

## 📌 1. 현재 상태 요약

프로젝트의 모든 핵심 정적 데이터를 Supabase DB로 이관하였으며, AI 코치의 추천 알고리즘을 전문가 수준(보디빌딩 원칙 적용)으로 고도화했습니다. 프론트엔드는 Tailwind 4 기반의 슬림한 가로형 UI로 최적화되어 데이터 밀도와 가독성을 동시에 확보한 상태입니다.

---

## ✅ 2. 이번 세션 주요 완료 작업

### **A. 데이터 인프라 혁신 (Cloud-First)**
- **DB 마이그레이션**: `exercises.json` 데이터를 Supabase `exercises` 테이블로 100% 이관.
- **실시간 API 연동**: `src/api/exerciseApi.js`를 통해 모든 컴포넌트가 DB 데이터를 비동기로 로드하도록 전환.
- **전역 캐싱**: 유틸리티(`exerciseUtils.js`) 내 전역 캐시 시스템을 구축하여 API 호출 효율 극대화.

### **B. AI 코치 알고리즘 전문가급 고도화**
- **강력한 분할 원칙**: 중/고급자 유저에게 전신 루틴 추천을 엄격히 금지하고, 2/3/4분할 원칙을 강제 적용.
- **지능형 로테이션**: 최근 48시간 로그를 분석하여 휴식과 자극의 밸런스를 맞춘 '메인 타겟 부위' 자동 선정.
- **결정론적 응답**: `temperature: 0`, `seed: 42`를 적용하여 동일 조건에서 100% 일관된 추천 결과 보장.
- **종목 수 보장**: 추천 요청 시 최소 5개 ~ 7개의 풍성한 운동 리스트를 제공하도록 규칙 설정.

### **C. UI/UX 리팩토링 및 최적화**
- **가로형 슬림 레이아웃**: 일반 추천 루틴에 대해 얇은 바(Bar) 형태의 반응형 UI를 적용하여 스크롤 피로도 급감.
- **하드모드 전용 테마**: 레드 네온 효과와 상세 세트 테이블이 포함된 강렬한 전용 UI 분리 렌더링.
- **장바구니 시스템**: 추천 받은 운동을 임시 상태(Cart)에 담아 토글(Check)하고 한 번에 루틴에 추가하는 UX 완성.
- **한글 가독성**: `break-keep` 클래스를 적용하여 운동 명칭이 단어 중간에서 잘리지 않도록 최적화.

### **D. 백엔드 안정화 (Edge Function)**
- **통합 라우팅**: `recommendation`, `chat`, `analysis` 등 모든 요청 타입을 안정적으로 처리하도록 로직 통합.
- **JSON Mode 강제**: OpenAI JSON Mode를 활성화하고 파서 방어 코드를 추가하여 렌더링 깨짐 현상 해결.
- **인증 보강**: 401 Unauthorized 에러를 원천 차단하는 표준 인증 처리 로직 적용.

---

## 📍 3. 주요 설정 및 환경

- **Tailwind CSS 4**: `tailwind.config.js` 없이 `src/style.css`와 `vite.config.js` 플러그인만으로 구동.
- **Supabase DB**: `exercises` 테이블 (RLS 적용, public read 허용).
- **PostgreSQL**: 호환성을 위해 `config.toml` 내 버전을 `15`로 유지.

---

## 🚀 4. 다음에 해야 할 작업 (우선순위)

1. **레거시 파일 정리 (Cleanup)**
   - 더 이상 사용하지 않는 `src/data/exercises.json` 삭제.
   - 마이그레이션 스크립트 `migrate_exercises.js` 삭제.
   - 구버전 변환 도구(`transform_exercises_*.cjs`) 백업 후 정리.

2. **분석 탭 고도화**
   - 현재 복구된 분석 로직을 기반으로 Recharts를 활용한 더 시각적인 그래프 데이터 연동.

3. **배포 자동화 점검**
   - `supabase functions deploy ai-coach` 실행 시 환경 변수(`OPENAI_API_KEY` 등) 누락 여부 최종 점검.

---

## 📂 5. 주요 파일 가이드 (New)

| 파일/경로 | 역할 |
|------|------|
| `src/api/exerciseApi.js` | Supabase 운동 데이터 통합 관리 API |
| `src/hooks/useAiCoach.js` | AI 대화, 추천, 히스토리, PR 데이터 통합 훅 |
| `src/components/AiCoach/` | AI 추천 화면 및 카드 UI (가로형/하드모드 분리) |
| `supabase/functions/ai-coach/` | 보디빌딩 엔진이 탑재된 핵심 서버 로직 |

---

## ⚠️ 6. 유지보수 주의사항

- **프롬프트 수정 주의**: `supabase/functions/ai-coach/index.ts` 수정 시 `JSON SCHEMA` 예시를 변경하면 프론트엔드 렌더링이 깨질 수 있음.
- **데이터 일관성**: 새로운 운동 추가 시 Supabase `exercises` 테이블에 직접 추가하거나 마이그레이션 툴 활용 권장.
