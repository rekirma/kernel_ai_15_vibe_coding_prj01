-- 1인 가구 맞춤 주간 레시피 추천 서비스 데이터베이스 스키마

-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    allergies TEXT[] DEFAULT '{}',
    preferences TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 레시피 테이블
CREATE TABLE recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('쉬움', '보통', '어려움')),
    cooking_time INTEGER NOT NULL,
    servings INTEGER DEFAULT 1,
    ingredients TEXT[] NOT NULL,
    instructions TEXT[] NOT NULL,
    nutrition JSONB,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 주간 식단 계획 테이블
CREATE TABLE weekly_meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    recipes JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 재료 테이블
CREATE TABLE user_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(20) DEFAULT '개',
    category VARCHAR(50) DEFAULT '기타',
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 좋아하는 레시피 테이블
CREATE TABLE user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- 챗봇 대화 기록 테이블
CREATE TABLE chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id VARCHAR(100) NOT NULL,
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 공유된 식단 계획 테이블
CREATE TABLE shared_meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    share_token VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    shared_with VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_weekly_meal_plans_user_id ON weekly_meal_plans(user_id);
CREATE INDEX idx_weekly_meal_plans_week_start ON weekly_meal_plans(week_start_date);
CREATE INDEX idx_user_ingredients_user_id ON user_ingredients(user_id);
CREATE INDEX idx_user_ingredients_expiry ON user_ingredients(expiry_date);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_conversation ON chat_history(conversation_id);
CREATE INDEX idx_shared_meal_plans_token ON shared_meal_plans(share_token);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_meal_plans ENABLE ROW LEVEL SECURITY;

-- 사용자 프로필 정책
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 주간 식단 계획 정책
CREATE POLICY "Users can view own meal plans" ON weekly_meal_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" ON weekly_meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" ON weekly_meal_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자 재료 정책
CREATE POLICY "Users can view own ingredients" ON user_ingredients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingredients" ON user_ingredients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingredients" ON user_ingredients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ingredients" ON user_ingredients
    FOR DELETE USING (auth.uid() = user_id);

-- 사용자 좋아하는 레시피 정책
CREATE POLICY "Users can view own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 챗봇 대화 기록 정책
CREATE POLICY "Users can view own chat history" ON chat_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history" ON chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history" ON chat_history
    FOR DELETE USING (auth.uid() = user_id);

-- 공유된 식단 계획 정책 (읽기 전용)
CREATE POLICY "Anyone can view shared meal plans" ON shared_meal_plans
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own shared meal plans" ON shared_meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 샘플 레시피 데이터 삽입
INSERT INTO recipes (title, description, category, difficulty, cooking_time, servings, ingredients, instructions, nutrition) VALUES
('김치볶음밥', '매콤한 김치와 밥을 볶아 만드는 간단한 한끼', '한식', '쉬움', 15, 1, 
 ARRAY['김치 100g', '밥 1공기', '계란 1개', '대파 1/2대', '참기름 1작은술', '소금 약간'],
 ARRAY['김치를 잘게 썰어주세요', '팬에 기름을 두르고 김치를 볶아주세요', '밥을 넣고 함께 볶아주세요', '계란을 올려 완성해주세요'],
 '{"calories": 350, "protein": 12, "carbs": 45, "fat": 15, "fiber": 3, "sodium": 800}'),

('계란말이', '부드러운 계란말이로 간단한 반찬', '한식', '쉬움', 10, 1,
 ARRAY['계란 2개', '대파 1/2대', '당근 1/4개', '소금 약간', '식용유 1작은술'],
 ARRAY['계란을 깨서 소금과 함께 풀어주세요', '대파와 당근을 잘게 썰어 넣어주세요', '팬에 기름을 두르고 계란물을 부어주세요', '반쯤 익으면 말아주세요'],
 '{"calories": 180, "protein": 15, "carbs": 2, "fat": 12, "fiber": 1, "sodium": 400}'),

('된장찌개', '건강한 된장찌개로 든든한 한끼', '한식', '쉬움', 20, 1,
 ARRAY['된장 2큰술', '두부 1/2모', '애호박 1/2개', '양파 1/4개', '대파 1/2대', '물 2컵'],
 ARRAY['물을 끓여주세요', '된장을 풀어주세요', '채소들을 넣고 끓여주세요', '두부를 넣고 마무리해주세요'],
 '{"calories": 250, "protein": 18, "carbs": 15, "fat": 8, "fiber": 5, "sodium": 600}'),

('스파게티 카르보나라', '크림소스의 스파게티 카르보나라', '양식', '보통', 25, 1,
 ARRAY['스파게티 100g', '계란 1개', '파마산치즈 2큰술', '베이컨 2줄', '후추 약간', '소금 약간'],
 ARRAY['스파게티를 삶아주세요', '베이컨을 볶아주세요', '계란과 치즈를 섞어주세요', '면과 소스를 섞어 완성해주세요'],
 '{"calories": 450, "protein": 20, "carbs": 55, "fat": 18, "fiber": 2, "sodium": 500}'),

('샐러드', '신선한 채소로 만드는 건강한 샐러드', '양식', '쉬움', 10, 1,
 ARRAY['상추 2잎', '토마토 1개', '오이 1/2개', '올리브오일 1큰술', '레몬즙 1작은술', '소금 약간'],
 ARRAY['채소들을 깨끗이 씻어주세요', '먹기 좋은 크기로 썰어주세요', '올리브오일과 레몬즙을 섞어 드레싱을 만들어주세요', '채소에 드레싱을 뿌려 완성해주세요'],
 '{"calories": 120, "protein": 3, "carbs": 8, "fat": 10, "fiber": 4, "sodium": 200}');
