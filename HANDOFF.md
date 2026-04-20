# 📝 HANDOFF.md

> 마지막 업데이트: 2026-04-20
> 브랜치: `main` — **모든 변경사항 커밋, 푸시 및 배포(Firebase) 완료**
> 최신 커밋: `50a9771` Fix: Refine user profile update payload and update exercise translations

---

## 📌 현재 프로젝트 상태

**MyGym** — 운동 기록 및 AI 코칭을 제공하는 개인 헬스 트래킹 웹 앱.

| 영역 | 상태 | 비고 |
|------|------|------|
| 데이터셋 | **안정 (번역 개선 중)** | 800+개 운동, 한글화 및 용어 통일(카프, 스퀴즈 등) 진행됨 |
| 운동 선택 UI | **안정 (기능 강화)** | 단계별 선택, 검색, GIF 미리보기, 직접 입력 추가 |
| AI 코치 | **안정** | 최근 7일 기록 및 신체 정보 반영 로직 적용됨 |
| 프로필 수정 | **안정 (최종 수정)** | Supabase 400 에러 해결 및 데이터 타입 보정 완료 |

---

## ✅ 이번 세션에서 완료한 작업 (최신순)

### 1. 개인정보 수정 시 Supabase 400 에러 해결 및 UI 개선
- **수정 사항**: 
    - `user_profiles` 테이블에 존재하는 컬럼(`goal`, `weekly_frequency`, `height`, `weight`, `age`, `gender`)만 업데이트하도록 페이로드 정제.
    - `experience_level`, `equipment_access`, `limitations` 등 기존 데이터가 유실되지 않도록 `userData`에서 병합.
    - `parseInt` 및 `parseFloat`를 통해 숫자형 데이터 타입 강제 적용.
    - 저장 버튼 텍스트를 "수정"으로 변경하여 직관성 확보.
- **결과**: 인바디 관련 컬럼 부재로 인한 400 Bad Request 에러 해결됨.

### 2. 운동 데이터셋 명칭 한글화 및 최적화 (`exercises.json`)
- **수정 사항**: 
    - 주요 운동 용어 한글화: "종아리 레이즈" -> "카프 레이즈", "풀 오버" -> "풀오버", "스퀴즈", "와이퍼" 등.
    - 불필요한 영문 표기 및 중복 단어 정리.
- **주의**: 일부 하이브리드 명칭(예: `BUTTER플라이`, `FLUTTER 킥S`)이 존재할 수 있으나, 가독성은 크게 개선됨.

### 3. Firebase 호스팅 배포 완료
- `npm run deploy:firebase`를 통해 최신 빌드본을 `https://mygym-365.web.app`에 배포 완료.

---

## 🛑 지금 멈춘 지점 & 현재 문제 (에러)

### [P1] 운동 데이터셋 일부 오번역/파편화
- 자동 변환 스크립트의 영향으로 일부 명칭이 `BUTTER플라이`, `CONTRA광배근ERAL`과 같이 혼용되어 있음. 수동 검수 또는 정규식을 통한 재정리 필요.

### [P3] 인바디 정보 저장 방식 미결정
- 현재 UI에는 인바디 입력란이 있으나 DB 컬럼 부재로 인해 저장을 주석 처리함. 추후 `user_profiles` 테이블에 컬럼을 추가하거나 JSONB 타입으로 통합 저장하는 전략 필요.

---

## 🚀 다음에 해야 할 작업 (우선순위)

### 1. [P1] 운동 기록 저장 및 연동 최종 검증
- `ExerciseSelector`에서 선택한 운동이 `workout_logs` 테이블에 정확한 ID와 명칭으로 저장되는지 확인.
- '직접 입력'한 운동의 경우 ID 생성 및 저장 프로세스 점검.

### 2. [P2] 운동 데이터셋 명칭 전수 검토 및 정제
- `exercises.json` 내의 혼용된 명칭(`BUTTER플라이` 등)을 자연스러운 한글명으로 최종 수정.

### 3. [P2] 루틴 프리셋(Routine Preset) 기능
- 사용자가 자주 사용하는 운동 조합을 루틴으로 저장하고, 한 번에 불러올 수 있는 기능 개발.

---

## 🛠 관련 파일 및 역할
- `src/components/Calendar/CalendarScreen.jsx`: 프로필 수정 로직 및 개인정보 관리.
- `src/data/exercises.json`: 전체 운동 데이터베이스 (800+ 항목).
- `src/components/Exercise/ExerciseSelector.jsx`: 운동 선택 및 검색 인터페이스.
- `src/components/AiCoach/useAiCoach.js`: AI 추천 로직 및 데이터 처리.

---

## ⚠️ 수정 시 주의사항 및 검증 방법
- **데이터 타입**: Supabase 업데이트 시 `height`, `weight`, `age` 등은 반드시 숫자형(Number)으로 변환하여 전송해야 함.
- **데이터 보존**: `update` 시 기존 컬럼(`experience_level` 등)을 누락하면 기본값으로 덮어씌워질 수 있으므로 반드시 기존 값을 포함하여 전송할 것.
- **검증**: `CalendarScreen`에서 프로필 수정 후 `alert`가 뜨는지 확인하고, Supabase Dashboard에서 `user_profiles` 테이블의 값이 실제로 변경되었는지 확인할 것.
