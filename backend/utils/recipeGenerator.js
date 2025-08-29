const openai = require('../config/openai');

// 샘플 레시피 데이터 (실제로는 데이터베이스에서 가져올 예정)
const sampleRecipes = [
  {
    id: 1,
    title: '김치볶음밥',
    category: '한식',
    difficulty: '쉬움',
    cooking_time: 15,
    ingredients: ['김치', '밥', '계란', '대파', '참기름'],
    nutrition: {
      calories: 350,
      protein: 12,
      carbs: 45,
      fat: 15,
      fiber: 3,
      sodium: 800
    }
  },
  {
    id: 2,
    title: '계란말이',
    category: '한식',
    difficulty: '쉬움',
    cooking_time: 10,
    ingredients: ['계란', '대파', '당근', '소금'],
    nutrition: {
      calories: 180,
      protein: 15,
      carbs: 2,
      fat: 12,
      fiber: 1,
      sodium: 400
    }
  },
  {
    id: 3,
    title: '된장찌개',
    category: '한식',
    difficulty: '쉬움',
    cooking_time: 20,
    ingredients: ['된장', '두부', '애호박', '양파', '대파'],
    nutrition: {
      calories: 250,
      protein: 18,
      carbs: 15,
      fat: 8,
      fiber: 5,
      sodium: 600
    }
  },
  {
    id: 4,
    title: '스파게티 카르보나라',
    category: '양식',
    difficulty: '보통',
    cooking_time: 25,
    ingredients: ['스파게티', '계란', '파마산치즈', '베이컨', '후추'],
    nutrition: {
      calories: 450,
      protein: 20,
      carbs: 55,
      fat: 18,
      fiber: 2,
      sodium: 500
    }
  },
  {
    id: 5,
    title: '샐러드',
    category: '양식',
    difficulty: '쉬움',
    cooking_time: 10,
    ingredients: ['상추', '토마토', '오이', '올리브오일', '레몬즙'],
    nutrition: {
      calories: 120,
      protein: 3,
      carbs: 8,
      fat: 10,
      fiber: 4,
      sodium: 200
    }
  }
];

// 주간 레시피 생성 함수
async function generateWeeklyRecipes({ allergies = [], preferences = [], availableIngredients = [] }) {
  try {
    // 알레르기 및 선호도에 따른 레시피 필터링
    const filteredRecipes = filterRecipesByPreferences(sampleRecipes, allergies, preferences);
    
    // 보유 재료를 활용할 수 있는 레시피 우선 선택
    const prioritizedRecipes = prioritizeRecipesByIngredients(filteredRecipes, availableIngredients);
    
    // 주간 식단 생성
    const weeklyMealPlan = generateWeeklyMealPlan(prioritizedRecipes);
    
    // OpenAI를 사용한 개인화된 추천 (선택사항)
    if (process.env.OPENAI_API_KEY) {
      const personalizedPlan = await generatePersonalizedRecommendations(weeklyMealPlan, preferences);
      return personalizedPlan;
    }
    
    return weeklyMealPlan;
  } catch (error) {
    console.error('Recipe generation error:', error);
    // 에러 발생시 기본 레시피 반환
    return generateWeeklyMealPlan(sampleRecipes);
  }
}

// 선호도에 따른 레시피 필터링
function filterRecipesByPreferences(recipes, allergies, preferences) {
  return recipes.filter(recipe => {
    // 알레르기 체크
    const hasAllergy = allergies.some(allergy => 
      recipe.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(allergy.toLowerCase())
      )
    );
    
    if (hasAllergy) return false;
    
    // 선호도 체크 (선호도가 있으면 해당 카테고리 우선)
    if (preferences.length > 0) {
      return preferences.some(pref => 
        recipe.category.toLowerCase().includes(pref.toLowerCase()) ||
        recipe.title.toLowerCase().includes(pref.toLowerCase())
      );
    }
    
    return true;
  });
}

// 보유 재료에 따른 레시피 우선순위 설정
function prioritizeRecipesByIngredients(recipes, availableIngredients) {
  return recipes.map(recipe => {
    const matchingIngredients = recipe.ingredients.filter(ingredient =>
      availableIngredients.some(available => 
        available.toLowerCase().includes(ingredient.toLowerCase()) ||
        ingredient.toLowerCase().includes(available.toLowerCase())
      )
    );
    
    const matchRatio = matchingIngredients.length / recipe.ingredients.length;
    
    return {
      ...recipe,
      matchRatio,
      matchingIngredients
    };
  }).sort((a, b) => b.matchRatio - a.matchRatio);
}

// 주간 식단 생성
function generateWeeklyMealPlan(recipes) {
  const days = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
  const mealTypes = ['아침', '점심', '저녁'];
  
  const weeklyPlan = [];
  let recipeIndex = 0;
  
  days.forEach(day => {
    const dayPlan = {
      day,
      meals: {}
    };
    
    mealTypes.forEach(mealType => {
      if (recipeIndex < recipes.length) {
        dayPlan.meals[mealType] = {
          ...recipes[recipeIndex],
          confirmed: false,
          alternatives: generateAlternatives(recipes, recipeIndex)
        };
        recipeIndex++;
      } else {
        // 레시피가 부족하면 처음부터 다시 시작
        recipeIndex = 0;
        dayPlan.meals[mealType] = {
          ...recipes[recipeIndex],
          confirmed: false,
          alternatives: generateAlternatives(recipes, recipeIndex)
        };
        recipeIndex++;
      }
    });
    
    weeklyPlan.push(dayPlan);
  });
  
  return weeklyPlan;
}

// 대체 레시피 생성
function generateAlternatives(recipes, currentIndex) {
  const alternatives = [];
  const usedIndices = new Set([currentIndex]);
  
  for (let i = 0; i < 2 && alternatives.length < 2; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * recipes.length);
    } while (usedIndices.has(randomIndex));
    
    alternatives.push(recipes[randomIndex]);
    usedIndices.add(randomIndex);
  }
  
  return alternatives;
}

// OpenAI를 사용한 개인화된 추천
async function generatePersonalizedRecommendations(weeklyPlan, preferences) {
  try {
    const prompt = `
다음 주간 식단 계획을 사용자의 선호도에 맞게 개인화해주세요.

사용자 선호도: ${preferences.join(', ')}

현재 주간 계획:
${JSON.stringify(weeklyPlan, null, 2)}

다음 형식으로 응답해주세요:
1. 각 요일별로 추천하는 레시피 변경사항
2. 개인화된 조리 팁
3. 영양 균형 개선 제안

JSON 형식으로 응답해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 영양사이자 요리 전문가입니다.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    
    // JSON 파싱 시도
    try {
      const personalizedData = JSON.parse(response);
      return {
        ...weeklyPlan,
        personalization: personalizedData
      };
    } catch (parseError) {
      // JSON 파싱 실패시 원본 반환
      return weeklyPlan;
    }
  } catch (error) {
    console.error('Personalization error:', error);
    return weeklyPlan;
  }
}

// 레시피 검색 함수
function searchRecipes(query, filters = {}) {
  let results = sampleRecipes;
  
  // 제목 검색
  if (query) {
    results = results.filter(recipe =>
      recipe.title.toLowerCase().includes(query.toLowerCase()) ||
      recipe.ingredients.some(ingredient =>
        ingredient.toLowerCase().includes(query.toLowerCase())
      )
    );
  }
  
  // 카테고리 필터
  if (filters.category) {
    results = results.filter(recipe =>
      recipe.category === filters.category
    );
  }
  
  // 난이도 필터
  if (filters.difficulty) {
    results = results.filter(recipe =>
      recipe.difficulty === filters.difficulty
    );
  }
  
  // 조리시간 필터
  if (filters.maxTime) {
    results = results.filter(recipe =>
      recipe.cooking_time <= filters.maxTime
    );
  }
  
  return results;
}

module.exports = {
  generateWeeklyRecipes,
  searchRecipes,
  sampleRecipes
};
