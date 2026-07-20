# 🤖 @AI_MODELS.md — MyGym AI 모델 구성 및 통합 현황

> Master 에이전트 지시사항: MyGym에는 이제 **2개의 AI 모델**이 연동되어 있다.
> 모든 AI 관련 기능 개발/변경 시 이 문서를 기준으로 두 모델의 역할 분리를 유지하라.
> UI/UX 변경 시에도 아래 "라우팅 규칙"과 "모델별 특성/제약"을 위반하지 않아야 한다.

## 1. 두 AI 모델 개요

| 구분 | ① 교육모델 (my-gym-coach) | ② Gemini API |
|---|---|---|
| 정체 | Qwen2.5-3B를 자체 운동 코칭 데이터 97건으로 LoRA 파인튜닝한 전용 모델 | gemini-2.5-flash |
| 실행 위치 | 소유자 자택 서브PC(리눅스)의 Ollama, Cloudflare Tunnel로 공개 | Google 클라우드 |
| 접근 주소 | `https://ai.my-gyms.com` (Ollama API 호환, 고정 주소) | generativelanguage.googleapis.com |
| 담당 역할 | **운동기록 기반 코치 대화** (중량/횟수 결정, 오늘의 부위·루틴 조언, 기록 추세 분석) | 정형 JSON 생성 전부 (루틴 추천 JSON, muscle_analysis, training_analysis), 영어 대화, 폴백 |
| 응답 속도 | 20~60초 (CPU 추론) — UI에 로딩 상태 필수 | 1~3초 |
| 출력 형태 | **자연어 텍스트만** | JSON 스키마 준수 가능 |

## 2. 현재 라우팅 규칙 (supabase/functions/ai-coach/index.ts — 배포 완료)

- `type === "chat"` && 한국어(`lang==='ko'`) && userPrompt 존재 → **교육모델 우선 호출** (`callLocalCoach()`)
  - 서브PC 미응답/타임아웃(90초)/비정상 응답 → **Gemini로 자동 폴백** (앱은 끊김 없음)
  - 응답 JSON에 `source: "local-coach"` 필드가 있으면 교육모델 응답임 (폴백 시 필드 없음)
- `type === "recommendation"`(today_routine, hard_mode_* 등 JSON 루틴 생성) → Gemini 유지
- `type === "muscle_analysis"`, `"training_analysis"` → Gemini 유지
- 영어(`lang==='en'`) 대화 → Gemini (교육모델은 한국어 전용)
- 환경변수: `LOCAL_COACH_URL`(기본 https://ai.my-gyms.com), `LOCAL_COACH_MODEL`(기본 my-gym-coach)

## 3. 교육모델 호출 규약 (변경 금지 사항)

Ollama Chat API 형식으로 호출하며, **프롬프트는 반드시 학습 형식과 동일해야 품질이 보장된다**:

```
POST https://ai.my-gyms.com/api/chat
{ "model": "my-gym-coach", "stream": false,
  "messages": [{ "role": "user", "content": "[시스템 정보]\n...\n\n[질문]\n..." }] }
```

**학습된 [시스템 정보] 표준 형식** (이 형식에 가까울수록 답변 품질↑):
```
[시스템 정보]
- 점진적 과부하 상태: {운동명} {중량}kg × {세트}세트 × {rep}rep → {달성/미달 요약}
- 주간 볼륨: 가슴 n세트 / 등 n세트 / 하체 n세트 / 어깨 n세트 / 팔 n세트 / 복근 n세트
- 컨디션: 수면 n시간, 피로도 (낮음/보통/높음), 특이사항 없음

[질문]
{사용자 질문}
```

## 4. 모델별 제약 (개발 시 반드시 준수)

**교육모델(my-gym-coach)에게 시키면 안 되는 것:**
- JSON/정형 출력 생성 (스키마 준수 불가 — 반드시 Gemini 사용)
- 식단·영양 조언, 통증·부상 상담 (학습에서 의도적으로 배제됨)
- 영어 응답
- 운동 DB의 정확한 운동명 매칭이 필요한 작업 (환각 위험)

**UI/UX 개발 시 고려사항:**
- 교육모델 응답 대기 20~60초 → 로딩 인디케이터/스트리밍 UX 필요
- 서브PC 오프라인 가능성 상존 → 폴백은 이미 서버에서 자동 처리되므로 프론트는 추가 처리 불필요. 단, `source` 필드로 "내 전용 코치" 배지 등 구분 표시 가능
- 교육모델 품질은 [시스템 정보]가 학습 형식과 일치할수록 좋음 → 프론트/백엔드에서 컨텍스트 생성 시 3번 형식을 따를 것

## 5. 관련 인프라 (참고, 코드 외부)

- Cloudflare Tunnel `mygym-ai-coach`: 서브PC(cloudflared 서비스, 부팅 시 자동 시작) → `ai.my-gyms.com` → `localhost:11434`(Ollama). HTTP Host Header를 `localhost:11434`로 오버라이드 설정함(Ollama의 Host 검증 우회, 삭제 시 403 발생)
- 기존 도메인 `my-gyms.com`, `www.my-gyms.com`(프론트 배포)은 영향 없음
- 학습 자산: `ai_training/mygym_coach_dataset.jsonl`(97건), `colab_train.py`(Colab 학습 스크립트), `data_generation_prompt.md`(데이터 증산용 프롬프트). 재학습 절차: Colab T4 + Unsloth → GGUF(q4_k_m) → 서브PC `ollama create my-gym-coach -f Modelfile`

## 6. 개선 로드맵 (우선순위)

1. **[시스템 정보] 생성 정합화**: ai-coach의 chat 분기에서 교육모델에 넘기는 시스템 정보를 3번 표준 형식(세트 수 기반 주간 볼륨, 점진적 과부하 상태)으로 재구성 — 품질 개선 효과 큼
2. **데이터 확장 재학습**: 97건 → 300~1,000건 (data_generation_prompt.md 활용)
3. 코치 탭 프론트엔드 구현 시 `source` 구분 UI, 장시간 응답 UX 반영
