# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-22
> 브랜치: `main` — **모든 주요 기능 커밋 완료**
> 최신 커밋: `f550a09` fix: package-lock.json 버전 동기화 오류 수정

---

## 📌 현재 프로젝트 상태

**MyGym** — 운동 기록 및 AI 코칭을 제공하는 개인 헬스 트래킹 웹 앱.  
배포 URL: `https://mygym-365.web.app`  
스택: React + Vite + Tailwind CSS + Supabase + Firebase Hosting

| 영역 | 상태 | 비고 |
|------|------|------|
| 반응형 레이아웃 | **완성** | 전 화면 `isMobile` 기반 반응형 적용 완료 |
| PC 사이드 네비게이션 | **완성** | `lg` 이상에서 좌측 고정 `SideNav` 표시 |
| 모바일 하단 탭바 | **완성** | `lg` 미만에서 `BottomNav` 표시 |
| 운동 데이터셋 | **개편 완료** | 전체 운동 ID 재매핑(0001~) 및 이름 정제 완료 |
| CalendarScreen | **반응형 완성** | `useWindowSize` 적용, 모달 그리드 반응형 완료 |
| 운동 선택 화면 | **반응형 완성** | 버튼 터치 크기, 검색창 폰트 조정 완료 |
| 루틴 구성 화면 | **반응형 완성** | 컨테이너 패딩, 운동명 폰트 반응형 완료 |
| 운동 숨기기 기능 | **코드 완성 / DB 미적용** | Supabase 컬럼 추가 SQL 미실행 상태 |
| 빌드 상태 | **정상** | `npm run build` 성공 확인 (dist/ 최신화) |

---

## ✅ 완료한 작업 (최신순)

### 1. 반응형 레이아웃 및 PC 사이드바 도입
- **PC 레이아웃**: `SideNav.jsx`를 통해 큰 화면(`lg`)에서 좌측 고정 네비게이션 구현. `main.jsx`에서 `lg:ml-56` 오프셋 적용.
- **모바일 레이아웃**: `BottomNav.jsx`에 `lg:hidden`을 적용하여 화면 크기에 따라 네비게이션 자동 전환.
- **isMobile 전파**: `useWindowSize` 훅을 사용하여 `CalendarScreen` 등 주요 화면에 반응형 props 전달 및 UI 최적화.

### 2. 운동 데이터셋(exercises.json) 대개편
- **ID 체계 변경**: 기존 불규칙한 ID를 `0001`~`0559` 형태의 4자리 순차 번호로 재매핑.
- **이름 정제**: `transform_exercises_final.cjs`를 통해 불필요한 영어명 제거 및 한글 명칭 가독성 개선.
- **GIF 매칭**: `gif_url`에 기존 파일명을 유지하여 이미지 링크 깨짐 방지.

### 3. 개발 도구 정리 및 버그 수정
- **ScreenSizeIndicator 제거**: 화면 우하단 디버깅 UI 제거하여 프로덕션 환경 최적화.
- **의존성 동기화**: `package-lock.json` 버전 불일치 문제 해결 및 `npm install` 안정화.

---

## 🛑 지금 멈춘 지점

### [P0] Supabase 마이그레이션 미실행
운동 숨기기 기능 코드는 준비되었으나, Supabase `user_profiles` 테이블에 `hidden_exercises` 컬럼이 없어 실제 저장이 실패합니다.

**실행해야 할 SQL** (Supabase Dashboard → SQL Editor):
```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS hidden_exercises JSONB NOT NULL DEFAULT '[]'::jsonb;
```
파일 위치: `supabase/migrations/add_hidden_exercises.sql`

### [P1] Firebase 최종 배포
로컬 빌드는 성공했으나, 최신 변경사항(`main` 브랜치)이 Firebase Hosting에 아직 배포되지 않았을 수 있습니다.

---

## 🚀 다음에 해야 할 작업 (우선순위)

1. **[P0] Supabase SQL 실행**: 위 섹션의 SQL을 실행하여 운동 숨기기 기능을 활성화합니다.
2. **[P1] Firebase 배포**: `npm run build` 후 `firebase deploy --only hosting`을 실행합니다.
3. **[P2] 실기기 최종 검증**: 실제 모바일 기기 및 태블릿에서 레이아웃 깨짐이나 터치 간섭이 없는지 전수 점검합니다.

---

## 🗂 주요 파일 및 역할

- `src/main.jsx`: 전체 앱의 레이아웃 구조 정의 (SideNav/BottomNav 전환 로직).
- `src/components/SideNav.jsx` & `BottomNav.jsx`: PC/모바일 전용 네비게이션.
- `src/components/Calendar/CalendarScreen.jsx`: 반응형 달력 및 프로필 관리 메인.
- `src/data/exercises.json`: 개편된 4자리 ID 기반 운동 데이터셋.
- `src/hooks/useWindowSize.js`: 브레이크포인트 판단용 커스텀 훅.

---

## ⚠️ 수정 시 주의사항

- **레이아웃 오프셋**: `SideNav` 너비를 조정할 경우, `main.jsx`의 `main` 태그에 적용된 `lg:ml-56` 클래스도 동일하게 수정해야 합니다.
- **데이터 병합**: `ExerciseNameEditor` 사용 시 특정 부위(예: 가슴) 데이터만 다운로드될 수 있으므로, 전체 `exercises.json`에 병합할 때 다른 데이터를 덮어쓰지 않도록 주의하십시오.
- **Supabase 업데이트**: `user_profiles` 업데이트 시 기존 필드(`experience_level`, `equipment_access` 등)가 누락되면 값이 유실될 수 있으므로 항상 전체 객체를 전송하십시오.

---

## ✅ 검증 방법

### 1. 반응형 테스트
- 브라우저를 768px(`md`) 및 1024px(`lg`) 사이로 조절하며 `BottomNav` ↔ `SideNav` 전환 확인.
- 달력 화면(`375px`)에서 셀 내부 텍스트가 겹치지 않는지 확인.

### 2. 운동 숨기기 테스트 (DB 작업 후)
- 운동 선택 화면에서 눈 아이콘 클릭 후 새로고침 시에도 해당 운동이 제외되는지 확인.
- 달력의 "숨긴 운동" 버튼을 통해 복구가 정상적으로 작동하는지 확인.
