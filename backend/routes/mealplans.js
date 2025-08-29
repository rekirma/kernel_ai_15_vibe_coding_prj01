const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 주간 식단 계획 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('weekly_meal_plans')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      mealPlans: data
    });
  } catch (error) {
    console.error('Fetch meal plans error:', error);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

// 특정 주의 식단 계획 조회
router.get('/:weekStartDate', authenticateToken, async (req, res) => {
  try {
    const { weekStartDate } = req.params;

    const { data, error } = await supabase
      .from('weekly_meal_plans')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('week_start_date', weekStartDate)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    res.json({
      mealPlan: data
    });
  } catch (error) {
    console.error('Fetch meal plan error:', error);
    res.status(500).json({ error: 'Failed to fetch meal plan' });
  }
});

// 식단 계획 업데이트
router.put('/:weekStartDate', authenticateToken, async (req, res) => {
  try {
    const { weekStartDate } = req.params;
    const { recipes, notes } = req.body;

    const { data, error } = await supabase
      .from('weekly_meal_plans')
      .update({
        recipes,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .eq('week_start_date', weekStartDate)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Meal plan updated successfully',
      mealPlan: data
    });
  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({ error: 'Failed to update meal plan' });
  }
});

// 특정 날짜의 레시피 확정/취소
router.post('/:weekStartDate/confirm', authenticateToken, async (req, res) => {
  try {
    const { weekStartDate } = req.params;
    const { day, mealType, recipeId, confirmed } = req.body;

    // 현재 식단 계획 조회
    const { data: currentPlan, error: fetchError } = await supabase
      .from('weekly_meal_plans')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('week_start_date', weekStartDate)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    // 레시피 확정 상태 업데이트
    const updatedRecipes = currentPlan.recipes.map(recipe => {
      if (recipe.day === day && recipe.mealType === mealType && recipe.id === recipeId) {
        return { ...recipe, confirmed };
      }
      return recipe;
    });

    const { data, error } = await supabase
      .from('weekly_meal_plans')
      .update({
        recipes: updatedRecipes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .eq('week_start_date', weekStartDate)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Recipe confirmation updated',
      mealPlan: data
    });
  } catch (error) {
    console.error('Confirm recipe error:', error);
    res.status(500).json({ error: 'Failed to confirm recipe' });
  }
});

// 주간 영양 리포트 생성
router.get('/:weekStartDate/nutrition', authenticateToken, async (req, res) => {
  try {
    const { weekStartDate } = req.params;

    const { data: mealPlan, error } = await supabase
      .from('weekly_meal_plans')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('week_start_date', weekStartDate)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    // 영양 정보 계산
    const nutritionReport = calculateNutritionReport(mealPlan.recipes);

    res.json({
      nutritionReport,
      weekStartDate
    });
  } catch (error) {
    console.error('Generate nutrition report error:', error);
    res.status(500).json({ error: 'Failed to generate nutrition report' });
  }
});

// 식단 계획 공유
router.post('/:weekStartDate/share', authenticateToken, async (req, res) => {
  try {
    const { weekStartDate } = req.params;
    const { shareWith } = req.body;

    // 공유 링크 생성
    const shareToken = generateShareToken();
    const shareUrl = `${process.env.FRONTEND_URL}/meal-plan/${shareToken}`;

    // 공유 정보 저장
    const { error } = await supabase
      .from('shared_meal_plans')
      .insert([
        {
          share_token: shareToken,
          user_id: req.user.id,
          week_start_date: weekStartDate,
          shared_with: shareWith,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Meal plan shared successfully',
      shareUrl
    });
  } catch (error) {
    console.error('Share meal plan error:', error);
    res.status(500).json({ error: 'Failed to share meal plan' });
  }
});

// 공유된 식단 계획 조회
router.get('/shared/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;

    const { data: sharedPlan, error } = await supabase
      .from('shared_meal_plans')
      .select(`
        *,
        weekly_meal_plans (*)
      `)
      .eq('share_token', shareToken)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Shared meal plan not found' });
    }

    res.json({
      sharedMealPlan: sharedPlan
    });
  } catch (error) {
    console.error('Fetch shared meal plan error:', error);
    res.status(500).json({ error: 'Failed to fetch shared meal plan' });
  }
});

// 영양 정보 계산 함수
function calculateNutritionReport(recipes) {
  const totalNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0
  };

  const dailyNutrition = {};

  recipes.forEach(recipe => {
    if (recipe.nutrition) {
      // 총 영양소 계산
      totalNutrition.calories += recipe.nutrition.calories || 0;
      totalNutrition.protein += recipe.nutrition.protein || 0;
      totalNutrition.carbs += recipe.nutrition.carbs || 0;
      totalNutrition.fat += recipe.nutrition.fat || 0;
      totalNutrition.fiber += recipe.nutrition.fiber || 0;
      totalNutrition.sodium += recipe.nutrition.sodium || 0;

      // 일별 영양소 계산
      if (!dailyNutrition[recipe.day]) {
        dailyNutrition[recipe.day] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sodium: 0
        };
      }

      dailyNutrition[recipe.day].calories += recipe.nutrition.calories || 0;
      dailyNutrition[recipe.day].protein += recipe.nutrition.protein || 0;
      dailyNutrition[recipe.day].carbs += recipe.nutrition.carbs || 0;
      dailyNutrition[recipe.day].fat += recipe.nutrition.fat || 0;
      dailyNutrition[recipe.day].fiber += recipe.nutrition.fiber || 0;
      dailyNutrition[recipe.day].sodium += recipe.nutrition.sodium || 0;
    }
  });

  return {
    total: totalNutrition,
    daily: dailyNutrition,
    average: {
      calories: Math.round(totalNutrition.calories / 7),
      protein: Math.round(totalNutrition.protein / 7 * 10) / 10,
      carbs: Math.round(totalNutrition.carbs / 7 * 10) / 10,
      fat: Math.round(totalNutrition.fat / 7 * 10) / 10,
      fiber: Math.round(totalNutrition.fiber / 7 * 10) / 10,
      sodium: Math.round(totalNutrition.sodium / 7)
    }
  };
}

// 공유 토큰 생성 함수
function generateShareToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

module.exports = router;
