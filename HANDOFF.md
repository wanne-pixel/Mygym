# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-22
> 브랜치: `main` — **i18n 다국어 지원 (한/영) 완료**
> 최신 커밋: `cd27b9a` feat: 이메일 회원가입 OTP 인증 및 비밀번호 검증 추가

---

## 📌 현재 프로젝트 상태

**MyGym** — 운동 기록 및 AI 코칭을 제공하는 개인 헬스 트래킹 웹 앱.  
배포 환경: GitHub Pages (`gh-pages`) 기반 / Firebase Hosting 제거 완료 (Cloudflare 전환 준비 중)  
스택: React + Vite + Tailwind CSS (v4) + Supabase + i18next

| 영역 | 상태 | 비고 |
|------|------|------|
| 인증 시스템 | **완성 (확장)** | Google OAuth + 이메일/OTP 가입 + 비번 검증 완료 |
| 온보딩 프로세스 | **고도화 완료** | 목표 다중 선택, 운동 가능 시간 추가, 스킵 로직 개선 |
| 반응형 레이아웃 | **완성** | PC(SideNav) ↔ 모바일(BottomNav) 전환 완벽 지원 |
| 운동 데이터셋 | **개편 완료** | 4자리 ID(0001~) 체계 및 한글 이름 정제 완료 |
| 다국어(i18n) | **완성** | `i18n.js` 설정 + 전 컴포넌트 `t()` 적용 + 언어 전환 버튼 추가 |
| 운동 숨기기 기능 | **지연 중** | Supabase 컬럼 추가 SQL 미실행 및 UI 미구현 |

---

## ✅ 완료한 작업 (최신순)

### 1. 인증 시스템 보안 및 확장 (`LoginScreen.jsx`)
- **이메일 OTP 인증**: `supabase.auth.signUp` 후 OTP 번호 검증(`verifyOtp`) 프로세스 도입.
- **비밀번호 유효성 검사**: 최소 8자, 영문/숫자 혼합 실시간 체크 및 가이드 UI 적용.
- **로그인 Flow 개선**: 세션 유지 및 로그인 페이지 자동 리다이렉트 로직 강화.

### 2. 온보딩 사용자 경험 고도화 (`Onboarding.jsx`)
- **목표 설정 확장**: `goals` 필드 도입 (최대 2개 다중 선택 가능).
- **운동 시간 추가**: 주중 운동 가능 시간(`available_time`) 스텝 신설.
- **자동 스킵 로직**: 프로필 데이터 유무를 판단하여 기존 유저는 온보딩 생략 (`main.jsx`).

### 3. 인프라 정리 및 데이터 정비
- **Firebase 제거**: `firebase.json` 및 관련 설정 제거, `gh-pages` 배포로 임시 일원화.
- **Tailwind v4 적용**: 최신 Tailwind CSS 버전 및 PostCSS 환경 설정.
- **i18n 준비**: `src/i18n/` 하위 번역 파일 생성 및 의존성 추가.

---

## 🛑 지금 멈춘 지점 (Current Issues)

### ~~[P0] 다국어(i18n) 연동 미완료~~ **완료**
- `src/i18n/i18n.js` 설정 파일 생성, `main.jsx` import 추가
- 전체 컴포넌트(LoginScreen, Onboarding, SideNav, BottomNav, CalendarScreen, DayDetailView, WorkoutPlanScreen, ExerciseSelector, AnalysisScreen, AiRecommendationScreen) `t()` 적용 완료
- 언어 전환 버튼: PC(우측 상단 로그아웃 옆), 모바일(캘린더 헤더)

### [P1] Supabase 마이그레이션 및 숨기기 기능
- `user_profiles` 테이블에 `hidden_exercises` 컬럼이 없어 실제 저장 시 에러가 날 수 있습니다.
- `ExerciseSelector.jsx`에 운동 숨기기 버튼(눈 아이콘) 및 필터링 로직이 아직 없습니다.

---

## 🚀 다음에 해야 할 작업 (우선순위)

1. **[P0] i18n 초기화 및 UI 적용**:
   - `src/i18n/i18n.js` 설정 파일 생성.
   - `main.jsx`에서 `import './i18n/i18n'`.
   - `LoginScreen`, `Onboarding` 등 주요 UI 텍스트를 `t()` 함수로 교체.

2. **[P1] 운동 숨기기 기능 구현**:
   - Supabase SQL 실행: `ALTER TABLE user_profiles ADD COLUMN hidden_exercises JSONB DEFAULT '[]'::jsonb;`
   - `ExerciseSelector` 내부에 숨기기 토글 로직 및 필터 적용.

3. **[P2] Cloudflare Pages 배포 설정**:
   - `wrangler.toml` 또는 Cloudflare Pages 빌드 설정 확인 및 배포 자동화.

---

## 🗂 주요 파일 및 역할

- `src/main.jsx`: 앱 진입점, 인증 세션 관리 및 온보딩 체크.
- `src/components/Auth/LoginScreen.jsx`: 이메일/OTP/Google 로그인 및 가입 처리.
- `src/components/Onboarding.jsx`: 다단계 사용자 맞춤 설정 인터페이스.
- `src/i18n/`: 다국어 번역 JSON 파일 저장소.
- `src/data/exercises.json`: 4자리 ID 기반 전체 운동 데이터셋 (Source of Truth).

---

## ⚠️ 수정 시 주의사항

- **i18n 적용 시**: 단순 텍스트 교체 외에 `Onboarding`의 옵션 값(예: 'strength') 등이 번역 키와 일치하는지 확인하십시오.
- **Supabase 스키마**: `user_profiles` 업데이트 시 `upsert` 로직이 있으므로, 기존 필드가 유실되지 않도록 전체 객체를 잘 전달해야 합니다 (현재 `Onboarding.jsx` 참조).
- **Tailwind v4**: `@tailwindcss/postcss`를 사용 중이므로 구형 `tailwind.config.js` 방식과 혼용 시 빌드 에러가 발생할 수 있습니다.

---

## ✅ 검증 방법

### 1. 회원가입/인증 테스트
- 가짜 이메일 또는 테스트 계정으로 가입 시 OTP 입력 화면이 정상적으로 뜨는지 확인.
- 비밀번호 조건 미충족 시 가입 버튼 비활성화 여부 확인.

### 2. 온보딩 스킵 테스트
- 프로필 정보가 있는 계정으로 로그인 시 곧바로 `/app`으로 이동하는지 확인.
- 프로필 정보가 없는 경우 `/onboarding`으로 강제 이동되는지 확인.

### 3. 다국어 테스트 (구현 후)
- 브라우저 언어 설정 또는 언어 전환 버튼(추가 필요)에 따라 `ko` ↔ `en` 정상 전환 확인.
