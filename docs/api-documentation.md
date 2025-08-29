# 1인 가구 맞춤 주간 레시피 추천 서비스 API 문서

## 기본 정보
- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`
- **인증**: Bearer Token (JWT)

## 인증 (Authentication)

### 회원가입
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "allergies": ["새우", "견과류"],
  "preferences": ["한식", "매운음식"]
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

### 로그인
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

### 프로필 조회
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "allergies": ["새우", "견과류"],
    "preferences": ["한식", "매운음식"]
  }
}
```

### 프로필 업데이트
```http
PUT /auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "홍길동",
  "allergies": ["새우", "견과류", "우유"],
  "preferences": ["한식", "매운음식", "채식"]
}
```

## 레시피 (Recipes)

### 주간 레시피 추천 생성
```http
POST /recipes/weekly-recommendation
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "availableIngredients": ["김치", "밥", "계란"],
  "preferences": {
    "cuisine": "한식",
    "spiceLevel": "매운"
  }
}
```

**Response:**
```json
{
  "message": "Weekly recipes generated successfully",
  "recipes": [
    {
      "day": "월요일",
      "meals": {
        "아침": {
          "id": 1,
          "title": "김치볶음밥",
          "category": "한식",
          "difficulty": "쉬움",
          "cooking_time": 15,
          "confirmed": false,
          "alternatives": [...]
        }
      }
    }
  ]
}
```

### 주간 식단 조회
```http
GET /recipes/weekly-plan
Authorization: Bearer <token>
```

### 레시피 상세 조회
```http
GET /recipes/{recipeId}
```

### 레시피 검색
```http
GET /recipes/search?query=김치&category=한식&difficulty=쉬움&maxTime=20
```

### 좋아하는 레시피 추가
```http
POST /recipes/favorite
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "recipeId": "uuid"
}
```

### 좋아하는 레시피 조회
```http
GET /recipes/favorites
Authorization: Bearer <token>
```

## 챗봇 (Chatbot)

### 챗봇 대화
```http
POST /chatbot/chat
```

**Request Body:**
```json
{
  "message": "김치볶음밥 대체 재료 추천해줘",
  "conversationId": "optional_conversation_id"
}
```

**Response:**
```json
{
  "response": "김치 대신 청경채나 배추를 사용할 수 있습니다...",
  "conversationId": "conversation_id"
}
```

### 대화 기록 조회
```http
GET /chatbot/history?conversationId=optional_id
Authorization: Bearer <token>
```

### 레시피 관련 질문
```http
POST /chatbot/recipe-question
```

**Request Body:**
```json
{
  "question": "이 레시피의 칼로리는 얼마인가요?",
  "recipeId": "optional_recipe_id"
}
```

## 재료 관리 (Ingredients)

### 재료 목록 조회
```http
GET /ingredients
Authorization: Bearer <token>
```

### 재료 추가
```http
POST /ingredients
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "김치",
  "quantity": 1,
  "unit": "팩",
  "category": "반찬",
  "expiry_date": "2024-01-15"
}
```

### 재료 수정
```http
PUT /ingredients/{id}
Authorization: Bearer <token>
```

### 재료 삭제
```http
DELETE /ingredients/{id}
Authorization: Bearer <token>
```

### 재료 사용 처리
```http
POST /ingredients/{id}/use
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "usedQuantity": 0.5
}
```

### 만료 예정 재료 조회
```http
GET /ingredients/expiring?days=7
Authorization: Bearer <token>
```

### 재료 통계
```http
GET /ingredients/stats
Authorization: Bearer <token>
```

## 식단 계획 (Meal Plans)

### 식단 계획 목록 조회
```http
GET /mealplans
Authorization: Bearer <token>
```

### 특정 주 식단 계획 조회
```http
GET /mealplans/{weekStartDate}
Authorization: Bearer <token>
```

### 식단 계획 업데이트
```http
PUT /mealplans/{weekStartDate}
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "recipes": [...],
  "notes": "이번 주는 간단한 요리 위주로"
}
```

### 레시피 확정/취소
```http
POST /mealplans/{weekStartDate}/confirm
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "day": "월요일",
  "mealType": "아침",
  "recipeId": "uuid",
  "confirmed": true
}
```

### 영양 리포트 생성
```http
GET /mealplans/{weekStartDate}/nutrition
Authorization: Bearer <token>
```

**Response:**
```json
{
  "nutritionReport": {
    "total": {
      "calories": 8400,
      "protein": 280,
      "carbs": 1050,
      "fat": 350
    },
    "daily": {
      "월요일": {
        "calories": 1200,
        "protein": 40,
        "carbs": 150,
        "fat": 50
      }
    },
    "average": {
      "calories": 1200,
      "protein": 40,
      "carbs": 150,
      "fat": 50
    }
  }
}
```

### 식단 계획 공유
```http
POST /mealplans/{weekStartDate}/share
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "shareWith": "친구 이메일"
}
```

### 공유된 식단 계획 조회
```http
GET /mealplans/shared/{shareToken}
```

## 헬스 체크

### 서버 상태 확인
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Recipe Recommendation API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 에러 응답

모든 API는 에러 발생 시 다음과 같은 형식으로 응답합니다:

```json
{
  "error": "Error message",
  "message": "Detailed error description (development only)"
}
```

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 오류

## 인증 헤더

인증이 필요한 API는 다음 헤더를 포함해야 합니다:

```
Authorization: Bearer <jwt_token>
```

JWT 토큰은 로그인 시 받은 토큰을 사용합니다.
