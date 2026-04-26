# 🛠️ PROJECT_RULES.md

## 🏗️ 핵심 기술 스택
- **Framework**: React 18.2 (Vite 기반)
- **Styling**: Tailwind CSS 4.2.2 (v4 엔진 적용)
  - `tailwind.config.js` 없이 `@tailwindcss/vite` 플러그인과 `src/style.css`(@theme)로 구동.
- **Database/Backend**: Supabase (PostgreSQL 15 기반)
- **Visualization**: Recharts 3.8.1 (분석 탭 개발 중)
- **Notifications**: Sonner 2.0.7 (토스트 메시지 시스템)
- **Internationalization**: i18next / react-i18next (ko/en 지원)

## 🎨 UI/UX 디자인 패턴
- **Theme**: Slate-950 기반의 다크 테마를 기본으로 하며, 하드모드 시 Rose-900/500 테마 적용.
- **Layout**: `AiRecommendationScreen`에서 구현된 '가로형 슬림 레이아웃'을 통해 모바일 가독성 극대화.
- **Component Style**:
  - `break-keep` 클래스를 적용하여 한국어 운동 명칭 가독성 확보.
  - `Chip` 형태의 부위 표시(Blue/Rose), 네온 효과의 애니메이션(`success-pulse`).
  - 장바구니(Cart) 시스템을 통한 배치 추가(Batch Add) UX.
  - 운동 목록에서 `sub_category`를 통한 세부 부위(상부/하부/두께 등) 필터링 UI 제공.
- **Responsive**: 768px/1024px/1440px 브레이크포인트 기반의 `app-container` 최적화.

## 💻 코딩 컨벤션 및 상태 관리
- **Data Mapping**: API(`exerciseApi.js`) 레이어에서 DB의 `snake_case` 컬럼을 앱의 `camelCase`로 변환하여 사용.
  - 예: `body_part` -> `bodyPart`, `sub_target_ko` -> `subTarget_ko` 등.
- **Caching**: `exerciseUtils.js`를 통한 전역 운동 데이터 캐싱으로 불필요한 API 호출 방지.
- **AI Communication**: 
  - `supabase.functions.invoke`를 이용한 Edge Function(`ai-coach`) 호출.
  - 응답 데이터는 마이그레이션 방어 코드가 포함된 `parseResponseJSON`을 통해 정제.
- **State**: `useAiCoach` 훅을 통해 AI 대화 상태, PR 데이터, 프로필 정보를 통합 관리.
