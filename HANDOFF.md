# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-21
> 브랜치: `main` — **코드 변경 완료, 미커밋 상태**
> 최신 커밋: `5065df7` Docs: Update HANDOFF.md for current session

---

## 📌 현재 프로젝트 상태

**MyGym** — 운동 기록 및 AI 코칭을 제공하는 개인 헬스 트래킹 웹 앱.  
배포 URL: `https://mygym-365.web.app`  
스택: React + Vite + Tailwind CSS + Supabase + Firebase Hosting

| 영역 | 상태 | 비고 |
|------|------|------|
| 반응형 레이아웃 | **완성 (미배포)** | 전 화면 isMobile 기반 반응형 완료 |
| PC 사이드 네비게이션 | **완성** | lg 이상에서 좌측 고정 SideNav 표시 |
| 모바일 하단 탭바 | **완성** | lg 미만에서 BottomNav 표시 |
| 운동 데이터셋 | **대개편 완료** | 전체 운동 ID 재매핑(0001~) 및 이름 정제 |
| CalendarScreen | **반응형 완성** | useWindowSize 적용, 모달 그리드 반응형 |
| 운동 선택 화면 | **반응형 완성** | 버튼 터치 크기, 검색창 폰트 조정 완료 |
| 루틴 구성 화면 | **반응형 완성** | 컨테이너 패딩, 운동명 폰트 반응형 |
| 운동 숨기기 기능 | **코드 완성 / DB 미적용** | Supabase 컬럼 추가 SQL 미실행 상태 |
| 운동 이름 편집기 | **완성** | `/admin/exercise-editor` 접속 가능 |
| 프로필 수정 | **안정** | 400 에러 해결됨, 컬럼 유실 없음 |
| AI 코치 | **안정** | 숨긴 운동 제외 필터링 적용됨 |

---

## ✅ 이번 세션에서 완료한 작업 (최신순)

### 1. 운동 데이터셋(exercises.json) 대개편

- **ID 재매핑**: 기존의 불규칙한 ID를 4자리 순차 번호(`0001`, `0002` 등)로 전면 재매핑
- **이름 정제**: `transform_exercises_final.cjs` 스크립트를 통해 한글 명칭 최적화 (불필요한 영어/기호 제거)
- **부위/장비 정리**: 비주류 장비(보수볼 등) 및 실전성 낮은 운동 대거 필터링
- **매칭 유지**: `gif_url` 경로에 기존 ID를 보존하여 이미지 매칭 무결성 유지

### 2. PC 전용 사이드 네비게이션 (SideNav) 구현

- `src/components/SideNav.jsx` 신규 생성
- `lg` 브레이크포인트 이상에서 좌측 고정(`w-56`) 레이아웃 적용
- 활성 탭 하이라이트 및 아이콘 시스템 적용

### 3. ScreenSizeIndicator 제거 (개발 전용 도구)

- `src/main.jsx`에서 import 및 `<ScreenSizeIndicator />` 컴포넌트 완전 제거
- 화면 우하단에 표시되던 `375px | 📱 모바일` 디버그 UI 제거됨

### 4. 전체 화면 반응형 완성 (4~5단계)

**패턴**: `useWindowSize` 훅의 `isMobile` (< 768px 기준) 를 각 컴포넌트에 props로 전달하여 조건부 클래스 적용.

#### `src/components/Calendar/CalendarScreen.jsx`
- `useWindowSize` import 및 `isMobile` 훅 사용
- 외부 컨테이너: 모바일 `p-4` / PC `p-8 max-w-5xl mx-auto`
- `UserProfileModal` 기본 정보/인바디 그리드 반응형 (`grid-cols-1` ↔ `grid-cols-2`)
- `isMobile` prop을 `MonthlyCalendar`, `DayDetailView`, `UserProfileModal` 모두에 전달

#### `src/components/Calendar/MonthlyCalendar.jsx` / `DayDetailView.jsx`
- `isMobile` prop 수신하여 폰트 크기, 여백, 셀 높이 조건부 렌더링 적용

#### `src/components/WorkoutPlan/WorkoutPlanScreen.jsx`
- 외부 컨테이너: 모바일 `p-4` / PC `p-8 max-w-6xl mx-auto`

#### `src/components/Exercise/ExerciseSelector.jsx`
- 검색바 및 선택 버튼 터치 영역 모바일 최적화

---

## 🛑 지금 멈춘 지점

### [P0] 미커밋 변경사항 — 커밋 및 배포 필요

현재 세션의 모든 변경사항이 로컬에만 있으며 커밋/배포되지 않은 상태.

변경된 파일:
```
M  src/main.jsx                                      (SideNav 적용, Indicator 제거)
M  src/components/Calendar/CalendarScreen.jsx        (반응형 적용)
M  src/components/Calendar/DayDetailView.jsx         (반응형 적용)
M  src/components/Calendar/MonthlyCalendar.jsx       (반응형 적용)
M  src/components/WorkoutPlan/WorkoutPlanScreen.jsx  (반응형 적용)
M  src/components/Exercise/ExerciseSelector.jsx      (반응형 적용)
M  src/data/exercises.json                          (데이터셋 대개편)
M  src/components/BottomNav.jsx                      (PC 레이아웃 지원)
M  src/constants/exerciseConstants.js               (상수 정리)
M  src/style.css                                    (반응형 스타일)
M  dist/index.html                                  (빌드 아티팩트)
```

### [P1] Supabase 마이그레이션 미실행 — 운동 숨기기 기능 작동 안 됨

운동 숨기기 기능 코드는 완성되어 있으나, DB 컬럼이 없어 실제 저장이 실패함.

**실행해야 할 SQL** (Supabase Dashboard → SQL Editor):
```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS hidden_exercises JSONB NOT NULL DEFAULT '[]'::jsonb;
```
파일 위치: `supabase/migrations/add_hidden_exercises.sql`

---

## 🚀 다음에 해야 할 작업 (우선순위)

### 1. [P0] 빌드 및 배포

```bash
# 1) 빌드
npm run build

# 2) 커밋
git add .
git commit -m "Feat: 전체 화면 반응형 완성, PC 사이드바 도입 및 운동 데이터셋 대개편"

# 3) Firebase 배포
firebase deploy --only hosting
```

### 2. [P1] Supabase 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 아래 SQL 실행 (위 섹션 참고).

### 3. [P2] 반응형 실기기 테스트 및 미세 조정

---

## 🗂 전체 파일 구조 및 역할

```
src/
├── main.jsx                          # 라우팅, MainAppLayout (SideNav + BottomNav + 화면 전환)
├── hooks/
│   └── useWindowSize.js              # isMobile/isTablet/isDesktop 반환 훅
├── components/
│   ├── SideNav.jsx                   # PC 전용 좌측 고정 내비게이션 (w-56, lg 이상)
│   ├── BottomNav.jsx                 # 모바일 전용 하단 탭바 (lg:hidden)
│   ├── Calendar/
│   │   ├── CalendarScreen.jsx        # 달력 메인. isMobile 훅 사용
│   │   ├── MonthlyCalendar.jsx       # 월별 달력 그리드
│   │   └── DayDetailView.jsx         # 날짜별 운동 기록 상세
│   ├── Exercise/
│   │   └── ExerciseSelector.jsx      # 운동 선택 UI (부위→기구→운동)
│   ├── WorkoutPlan/
│   │   └── WorkoutPlanScreen.jsx     # 루틴 구성 화면
│   ├── AiCoach/
│   │   └── useAiCoach.js             # AI 추천 로직
│   └── Admin/
│       └── ExerciseNameEditor.jsx    # 운동 이름 일괄 편집 도구
├── data/
│   └── exercises.json                # 개편된 운동 데이터셋 (ID 0001~, 한글 정제)
└── constants/
    └── exerciseConstants.js          # 전역 상수
```

---

## ⚠️ 수정 시 주의사항

### 반응형 패턴
- `isMobile` 판단 기준: `window.innerWidth < 768` (Tailwind `md` 브레이크포인트와 동일)
- CalendarScreen에서 `isMobile`을 훅으로 선언하고 자식 컴포넌트에 prop으로 전달하는 패턴
- ExerciseSelector는 자체적으로 `useWindowSize()`를 호출 (WorkoutPlanScreen이 훅을 따로 보유)
- SideNav/BottomNav 전환은 Tailwind `lg:hidden` / `hidden lg:block` CSS 클래스로만 처리 (JS 없음)

### PC 레이아웃
- `main.jsx`의 `<main className="lg:ml-56">`: SideNav가 `w-56` 고정이므로 반드시 동일 너비로 오프셋
- SideNav 너비를 바꿀 경우 `main`의 `lg:ml-*`도 함께 변경해야 함
- `CalendarScreen`과 `WorkoutPlanScreen`의 `max-w-*`는 SideNav 오프셋 이후의 콘텐츠 영역 기준

### hidden_exercises 관련
- 값은 운동 **ID 배열** (`["0024", "0025"]`) — 이름이 아님
- WorkoutPlanScreen과 CalendarScreen이 독립적으로 Supabase에서 로드 (실시간 동기화 없음)
- 복구(CalendarScreen) 후 WorkoutPlanScreen을 다시 열어야 반영됨

### user_profiles UPDATE 시
- `update` 페이로드에 `experience_level`, `equipment_access`, `limitations` 반드시 포함
- 누락 시 기존값 유실. `CalendarScreen.jsx` `handleSave` 함수 참고
- `height`, `weight`, `age`는 숫자형으로 변환 후 전송

### ExerciseNameEditor
- `/admin/exercise-editor`는 인증 없이 접근 가능 — 프로덕션 공개 전 보호 필요 여부 검토
- 다운로드 JSON은 가슴 운동만 포함 — `exercises.json` 병합 시 다른 bodyPart 덮어쓰지 않도록 주의

---

## ✅ 검증 방법

### 반응형 레이아웃

**모바일 (375px)**:
1. 브라우저 DevTools → 375px 너비로 전환
2. 달력 화면: 달력 셀 높이 `h-16`, 텍스트 `text-sm` 확인
3. 루틴 구성: 2열 그리드 → 단일 컬럼, 패딩 `p-4` 확인
4. 운동 선택: 부위/기구 버튼 `py-4` (넉넉한 터치 영역) 확인
5. 하단 BottomNav 표시, 좌측 SideNav 없음 확인

**PC (1280px+)**:
1. 좌측 SideNav(`w-56`) 표시, 하단 BottomNav 없음 확인
2. 콘텐츠 영역이 `ml-56`으로 오른쪽에 위치 확인
3. CalendarScreen: `max-w-5xl mx-auto`, 패딩 `p-8` 확인
4. 개인정보 모달: 2열 그리드 입력 필드 확인

### 운동 숨기기 (마이그레이션 실행 후)
1. `/app?tab=루틴구성` → 가슴 > 바벨 진입
2. 임의 운동의 눈 아이콘 클릭 → confirm 확인
3. 해당 운동 목록에서 즉시 사라지는지 확인
4. 새로고침 후에도 안 보이는지 확인
5. Supabase Dashboard → `user_profiles.hidden_exercises` 컬럼에 ID 추가 확인
6. `/app?tab=달력` → "숨긴 운동" 버튼 → 목록 표시 확인
7. "복구" 클릭 → 운동 목록에 다시 나타나는지 확인

### 빌드 오류 없음 확인
```bash
npm run build
# 에러 없이 dist/ 생성 확인
```
