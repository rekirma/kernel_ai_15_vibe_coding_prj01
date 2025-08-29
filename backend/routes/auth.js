const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, allergies = [], preferences = [] } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Supabase Auth로 사용자 생성
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          allergies,
          preferences
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 사용자 프로필 정보 저장
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: data.user.id,
          name,
          allergies,
          preferences,
          created_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 로그아웃
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// 현재 사용자 정보 조회
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: profile.name,
        allergies: profile.allergies,
        preferences: profile.preferences
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// 프로필 업데이트
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, allergies, preferences } = req.body;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        name,
        allergies,
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;
