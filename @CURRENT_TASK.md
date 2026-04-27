# 🚀 CURRENT_TASK.md

## 📌 현재 프로젝트 상태 (Beta Launch Phase)

- **인프라**: Supabase DB 이관 완료, send-feedback Edge Function 배포 완료 (RLS 우회 문제 해결 포함).
- **사업화 Phase 1**: 도메인(my-gyms.com) + Cloudflare 연결 완료, 베타 공지 모달, 건의/문의 시스템, 개인정보처리방침 링크 전체 완료. 실 베타 서비스 런칭 준비 완료 상태.
- **분석 탭**: 부위별 볼륨 도넛 차트, 서브카테고리 도넛 차트, PR 카드 시스템 1차 구현 완료.
- **AI 엔진**: ai-coach Edge Function 다국어(KO/EN) 대응 및 결정론적 추천 로직 안정화 완료.

---

## ✅ 최근 완료 작업

- [x] **Phase 1 — 런칭 준비 전체 완료**
  - 도메인 구입: my-gyms.com (Cloudflare) 및 Workers & Pages 연결
  - 건의하기/문의하기 플로팅 버튼 + FeedbackModal 구현
  - send-feedback Supabase Edge Function 구현 및 배포 (Resend 이메일 + feedback DB 저장 + Authorization 헤더 RLS 처리)
  - 로그인 시 베타 공지 모달(BetaNoticeModal) 구현 (sessionStorage 기반 1회 표시)
  - 개인정보처리방침 Notion 페이지 작성 및 회원가입 화면 + 앱 하단 푸터 링크 연결
- [x] 분석 탭 1차 구현: 부위별/서브카테고리 볼륨 도넛 차트 (Recharts PieChart), PR 카드 시스템
- [x] DB 스키마 확장: sub_category, equipment, goals (JSONB), available_time 컬럼
- [x] useAiCoach 훅 리팩토링: selectedMode, lang 파라미터 연동
- [x] 디자인 시스템: break-keep, success-pulse 등 한글 가독성 및 시각 피드백 최적화
- [x] dist 빌드 산출물 git 추적 제거 (.gitignore 처리)

---

## 🌐 연동된 외부 서비스 목록

- **Cloudflare**
  - 용도: 도메인 구입(my-gyms.com) 및 프로덕션 배포
  - 연동: Workers & Pages에 프로젝트 연결
- **Resend (resend.com)**
  - 용도: 건의하기/문의하기 이메일 수신 (수신 주소: wanne.info@gmail.com)
  - 연동: send-feedback Edge Function에서 API 직접 호출
  - API Key 위치: Supabase Edge Function 환경 변수 → `RESEND_API_KEY`
- **Supabase Edge Functions**
  - `send-feedback`: 이메일 전송 서버 역할 (Resend 호출 + feedback 테이블 저장), `npx supabase functions deploy send-feedback --use-api`로 배포
  - `ai-coach`: AI 코치 루틴 추천 및 자유 대화
  - AI Key 위치: Supabase Edge Function 환경 변수 → `OPENAI_API_KEY`
- **Supabase DB**
  - feedback 테이블: id, user_id, type, title, content, created_at
  - exercises / workout_logs / user_profiles (기존 스키마 유지)
- **Notion (notion.so)**
  - 용도: 개인정보처리방침 페이지 호스팅
  - URL: https://shell-locust-532.notion.site/MyGym-2ea3913a10d080a69587f5da233e965f
  - 연결 위치: LoginScreen.jsx (회원가입 섹션), MainLayout.jsx (앱 하단 푸터)

---

## 🔜 차기 작업 우선순위 (Next Steps)

1. **[인프라] Edge Function 프로덕션 보안 검증**
   - OPENAI_API_KEY 환경 변수 최종 검증
   - RLS 정책 실제 동작 여부 전수 테스트 (workout_logs, user_profiles, feedback)

2. **[사업화] Google Analytics 연동**
   - 사용자 행동 분석을 위한 GA4 트래킹 코드 삽입

3. **[개발] PWA 최적화**
   - 오프라인 모드 기초 데이터 접근성 (Service Worker 점검)
   - 홈 화면 추가(A2HS) 유도 UI 및 매니페스트 설정 확인

4. **[사업화] 랜딩 페이지 제작** *(베타 유저 확보 후)*

5. **[사업화] SNS 채널 개설 및 콘텐츠 마케팅**

6. **[사업화] 프리미엄 플랜 설계 및 결제 시스템 연동**
