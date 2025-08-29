const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { generateWeeklyRecipes } = require('../utils/recipeGenerator');

const router = express.Router();

// 주간 레시피 추천 생성
router.post('/weekly-recommendation', authenticateToken, async (req, res) => {
  try {
    const { availableIngredients = [], preferences = {} } = req.body;

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (profileError) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // 주간 레시피 생성
    const weeklyRecipes = await generateWeeklyRecipes({
      allergies: profile.allergies || [],
      preferences: { ...profile.preferences, ...preferences },
      availableIngredients
    });

    // 생성된 레시피를 데이터베이스에 저장
    const { error: saveError } = await supabase
      .from('weekly_meal_plans')
      .insert([
        {
          user_id: req.user.id,
          week_start_date: new Date().toISOString(),
          recipes: weeklyRecipes,
          created_at: new Date().toISOString()
        }
      ]);

    if (saveError) {
      console.error('Save error:', saveError);
    }

    res.json({
      message: 'Weekly recipes generated successfully',
      recipes: weeklyRecipes
    });
  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({ error: 'Failed to generate recipes' });
  }
});

// 사용자의 주간 레시피 조회
router.get('/weekly-plan', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('weekly_meal_plans')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return res.status(404).json({ error: 'No meal plan found' });
    }

    res.json({
      mealPlan: data
    });
  } catch (error) {
    console.error('Fetch meal plan error:', error);
    res.status(500).json({ error: 'Failed to fetch meal plan' });
  }
});

// 레시피 상세 정보 조회
router.get('/:recipeId', optionalAuth, async (req, res) => {
  try {
    const { recipeId } = req.params;

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({
      recipe: data
    });
  } catch (error) {
    console.error('Fetch recipe error:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// 레시피 검색
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { query, category, difficulty, maxTime } = req.query;
    let supabaseQuery = supabase.from('recipes').select('*');

    if (query) {
      supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
    }

    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    if (difficulty) {
      supabaseQuery = supabaseQuery.eq('difficulty', difficulty);
    }

    if (maxTime) {
      supabaseQuery = supabaseQuery.lte('cooking_time', parseInt(maxTime));
    }

    const { data, error } = await supabaseQuery.limit(20);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      recipes: data
    });
  } catch (error) {
    console.error('Search recipes error:', error);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
});

// 사용자가 좋아하는 레시피 저장
router.post('/favorite', authenticateToken, async (req, res) => {
  try {
    const { recipeId } = req.body;

    const { error } = await supabase
      .from('user_favorites')
      .insert([
        {
          user_id: req.user.id,
          recipe_id: recipeId,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Recipe added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// 사용자의 좋아하는 레시피 조회
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        *,
        recipes (*)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      favorites: data.map(fav => fav.recipes)
    });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

module.exports = router;
