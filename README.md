# 1인 가구 맞춤 주간 레시피 추천 서비스

## 개요
20-30대 직장인 1인 가구를 대상으로, 매주 월요일 아침 모바일 웹에서 한 주간 식단(아침·점심·저녁)을 자동으로 제안하고, OpenAI 기반 챗봇으로 추가 질문·대체 재료 상담을 제공하는 초개인화 레시피 추천 서비스입니다.

## 주요 기능
- 🍽️ 주 1회 맞춤 레시피 자동 추천 (7일 × 3끼)
- 🤖 AI 챗봇 (OpenAI GPT-4o) - 대체 재료, 조리 팁, 칼로리 문의
- 📦 재료 관리 - 보유 재료 리스트 입력/체크
- 📊 주간 영양 리포트 - 총 칼로리·탄단지·비타민 그래프

## 기술 스택
- **Frontend**: React + Vite, TailwindCSS, PWA
- **Backend**: Node.js(Express) + PostgreSQL (Supabase)
- **AI**: OpenAI GPT-4o API
- **Auth**: Supabase Auth (email/social)

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd kernel_ai_15_vibe_coding_prj01
```

### 2. 환경 변수 설정

#### 백엔드 환경 변수
```bash
cd backend
cp env.example .env
```

`.env` 파일을 편집하여 다음 값들을 설정하세요:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

#### 프론트엔드 환경 변수
```bash
cd frontend
cp env.example .env
```

`.env` 파일을 편집하여 다음 값들을 설정하세요:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성하세요.
2. `docs/database-schema.sql` 파일의 내용을 Supabase SQL Editor에서 실행하세요.
3. 프로젝트 설정에서 API 키들을 복사하여 환경 변수에 설정하세요.

### 4. OpenAI API 키 설정

1. [OpenAI](https://platform.openai.com)에서 API 키를 발급받으세요.
2. 환경 변수 `OPENAI_API_KEY`에 설정하세요.

### 5. 백엔드 설치 및 실행
```bash
cd backend
npm install
npm run dev
```

백엔드 서버가 `http://localhost:3001`에서 실행됩니다.

### 6. 프론트엔드 설치 및 실행
```bash
cd frontend
npm install
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

## 프로젝트 구조
```
├── backend/                 # Node.js + Express 백엔드
│   ├── config/             # 설정 파일들
│   ├── controllers/        # 컨트롤러
│   ├── middleware/         # 미들웨어
│   ├── routes/            # API 라우트
│   ├── utils/             # 유틸리티 함수
│   └── server.js          # 메인 서버 파일
├── frontend/              # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── contexts/      # React Context
│   │   ├── hooks/         # Custom Hooks
│   │   ├── pages/         # 페이지 컴포넌트
│   │   └── utils/         # 유틸리티 함수
│   └── package.json
├── docs/                  # 문서
│   ├── api-documentation.md
│   └── database-schema.sql
└── README.md
```

## API 문서

API 문서는 `docs/api-documentation.md`에서 확인할 수 있습니다.

### 주요 엔드포인트
- `GET /api/health` - 서버 상태 확인
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/recipes/weekly-recommendation` - 주간 레시피 추천
- `POST /api/chatbot/chat` - AI 챗봇 대화
- `GET /api/ingredients` - 재료 목록 조회

## 데이터베이스 스키마

데이터베이스 스키마는 `docs/database-schema.sql`에서 확인할 수 있습니다.

### 주요 테이블
- `user_profiles` - 사용자 프로필 정보
- `recipes` - 레시피 정보
- `weekly_meal_plans` - 주간 식단 계획
- `user_ingredients` - 사용자 재료 관리
- `chat_history` - 챗봇 대화 기록

## 개발 가이드

### 백엔드 개발
```bash
cd backend
npm run dev  # 개발 모드 실행
npm start    # 프로덕션 모드 실행
```

### 프론트엔드 개발
```bash
cd frontend
npm run dev  # 개발 모드 실행
npm run build  # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

### 코드 스타일
- 백엔드: ESLint + Prettier
- 프론트엔드: ESLint + Prettier

## 배포

### 백엔드 배포 (예: Heroku)
```bash
cd backend
git add .
git commit -m "Deploy backend"
git push heroku main
```

### 프론트엔드 배포 (예: Vercel)
```bash
cd frontend
npm run build
# Vercel CLI 또는 GitHub 연동으로 배포
```

## 개발 일정
- Week 1-2: 디자인/정보구조, 데이터모델 설계 ✅
- Week 3-4: 추천 엔진 Rule 기반 1차 구현, 프론트 MVP ✅
- Week 5: GPT 챗봇 통합 ✅
- Week 6: 클로즈드 베타, 개선 후 Public Launch

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 연락처

프로젝트 링크: [https://github.com/your-username/kernel_ai_15_vibe_coding_prj01](https://github.com/your-username/kernel_ai_15_vibe_coding_prj01)
