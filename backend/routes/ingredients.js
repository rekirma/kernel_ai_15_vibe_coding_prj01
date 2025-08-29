const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 사용자의 보유 재료 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_ingredients')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      ingredients: data
    });
  } catch (error) {
    console.error('Fetch ingredients error:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

// 재료 추가
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, quantity, unit, expiry_date, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }

    const { data, error } = await supabase
      .from('user_ingredients')
      .insert([
        {
          user_id: req.user.id,
          name,
          quantity: quantity || 1,
          unit: unit || '개',
          expiry_date,
          category: category || '기타',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Ingredient added successfully',
      ingredient: data
    });
  } catch (error) {
    console.error('Add ingredient error:', error);
    res.status(500).json({ error: 'Failed to add ingredient' });
  }
});

// 재료 수정
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, unit, expiry_date, category } = req.body;

    const { data, error } = await supabase
      .from('user_ingredients')
      .update({
        name,
        quantity,
        unit,
        expiry_date,
        category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Ingredient updated successfully',
      ingredient: data
    });
  } catch (error) {
    console.error('Update ingredient error:', error);
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// 재료 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('user_ingredients')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

// 재료 사용 처리 (수량 감소)
router.post('/:id/use', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usedQuantity = 1 } = req.body;

    // 현재 재료 정보 조회
    const { data: currentIngredient, error: fetchError } = await supabase
      .from('user_ingredients')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    const newQuantity = Math.max(0, currentIngredient.quantity - usedQuantity);

    if (newQuantity === 0) {
      // 수량이 0이면 삭제
      const { error: deleteError } = await supabase
        .from('user_ingredients')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user.id);

      if (deleteError) {
        return res.status(400).json({ error: deleteError.message });
      }

      res.json({ message: 'Ingredient used up and removed' });
    } else {
      // 수량 업데이트
      const { data, error: updateError } = await supabase
        .from('user_ingredients')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      res.json({
        message: 'Ingredient quantity updated',
        ingredient: data
      });
    }
  } catch (error) {
    console.error('Use ingredient error:', error);
    res.status(500).json({ error: 'Failed to use ingredient' });
  }
});

// 만료 예정 재료 조회
router.get('/expiring', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const { data, error } = await supabase
      .from('user_ingredients')
      .select('*')
      .eq('user_id', req.user.id)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', expiryDate.toISOString())
      .order('expiry_date', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      expiringIngredients: data
    });
  } catch (error) {
    console.error('Fetch expiring ingredients error:', error);
    res.status(500).json({ error: 'Failed to fetch expiring ingredients' });
  }
});

// 재료 카테고리별 통계
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_ingredients')
      .select('category, quantity')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 카테고리별 수량 집계
    const stats = data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = 0;
      }
      acc[item.category] += item.quantity;
      return acc;
    }, {});

    res.json({
      categoryStats: stats
    });
  } catch (error) {
    console.error('Fetch ingredient stats error:', error);
    res.status(500).json({ error: 'Failed to fetch ingredient stats' });
  }
});

module.exports = router;
