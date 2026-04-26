# 🚀 CURRENT_TASK.md

## 📌 현재 프로젝트 상태 (Production Ready Phase)
- **데이터 인프라**: Supabase DB 이관 완료 및 `sub_category` 등 확장 스키마 적용 완료.
- **AI 엔진**: `ai-coach` Edge Function의 다국어(KO/EN) 대응 및 결정론적 추천 로직 안정화.
- **UI 완성도**: 가로형 슬림 레이아웃, 하드모드 UI, `sonner` 기반 알림 시스템 통합 완료.

## ✅ 최근 완료 작업
- [x] DB 스키마 확장: `sub_category`, `equipment`, `goals` (JSONB), `available_time` 추가.
- [x] `useAiCoach` 훅 리팩토링: `selectedMode` 및 `lang` 파라미터 연동 강화.
- [x] 디자인 시스템 고도화: `break-keep`, `success-pulse` 등 한글 가독성 및 시각적 피드백 최적화.
- [x] 프로젝트 문서화 업데이트 (@CURRENT_TASK, @DB_SCHEMA, @PROJECT_RULES).

## 🔜 차기 작업 우선순위 (Next Steps)
1. **분석(Analytics) 탭 구현**
   - `Recharts 3.8.1`을 활용한 주간/월간 볼륨 변화 그래프 구현.
   - 부위별 운동 비중 도넛 차트 및 최고 중량(PR) 갱신 이력 시각화.
2. **운동 목록 필터링 고도화**
   - `sub_category` (상부/하부 등) 기반의 세부 필터 UI 적용.
   - 장바구니(Cart) 시스템과 연동된 부위별 운동 밸런스 체크 기능.
3. **Edge Function 배포 및 보안**
   - `OPENAI_API_KEY` 환경 변수 최종 검증 및 프로덕션 환경 배포.
   - RLS 정책의 실제 동작 여부 전수 테스트.
4. **PWA 최적화**
   - 오프라인 모드에서의 기초 데이터 접근성 확보 (Service Worker 점검).
   - 홈 화면 추가(A2HS) 유도 UI 및 매니페스트 설정 확인.
