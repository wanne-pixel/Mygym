# 🏋️‍♂️ MyGym - Intelligent Workout Manager

MyGym은 사용자의 운동 목표와 신체 정보를 바탕으로 맞춤형 루틴을 설계하고 기록하는 스마트 운동 관리 웹 애플리케이션입니다.

## 🚀 Refactoring Achievement
기존의 비대했던 `main.jsx` (2,200+ 라인)를 기능별로 완벽하게 분리하여 유지보수성과 확장성을 극대화했습니다. 
'God File' 구조에서 **Clean Architecture** 지향적인 구조로 탈바꿈했습니다.

## 📁 New Project Structure
```text
src/
├── api/              # Supabase, OpenAI, 외부 API 통신 로직
├── components/       # 기능별 독립 컴포넌트
│   ├── Auth/         # 로그인 및 회원가입 화면
│   ├── AiCoach/      # AI 추천 로직 및 코칭 UI
│   ├── Calendar/     # 달력 시각화 및 운동 기록 상세
│   ├── Exercise/     # 운동 검색 및 필터링 셀렉터
│   ├── WorkoutPlan/  # 루틴 구성 및 세트 설정 화면
│   └── Common/       # GIF 모달, 버튼 등 공통 UI 요소
├── constants/        # 운동 부위, 기구 매핑 등 전역 상수
├── data/             # 운동 데이터셋 (exercises.json)
└── utils/            # GIF 매칭 등 공용 헬퍼 함수
```

## 🛠 Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Supabase
- **AI:** OpenAI (GPT-4o-mini)
- **Icons:** Lucide React

## ⚙️ Installation & Running
1. 저장소 클론: `git clone https://github.com/wanne-pixel/Mygym.git`
2. 의존성 설치: `npm install`
3. 환경 변수 설정: `.env.example` 파일을 복사하여 `.env` 파일을 만들고 API 키 입력
4. 로컬 실행: `npm run dev`
5. 배포: `npm run build && firebase deploy`

## 🔒 Security
- `.env` 파일을 통한 API 키 관리 및 GitHub 노출 차단 완료
- 환경 변수 기반의 안전한 데이터 통신 구현
