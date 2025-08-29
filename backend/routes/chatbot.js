const express = require('express');
const openai = require('../config/openai');
const { supabase } = require('../config/supabase');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 챗봇 대화
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let userProfile = null;
    if (req.user) {
      // 사용자 프로필 정보 가져오기
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      userProfile = profile;
    }

    // 대화 컨텍스트 구성
    const systemPrompt = `당신은 1인 가구를 위한 레시피 추천 챗봇입니다. 
    
사용자의 질문에 대해 친근하고 도움이 되는 답변을 제공해주세요.

주요 기능:
1. 레시피 추천 및 대체 재료 제안
2. 조리 팁 및 요리 방법 안내
3. 영양 정보 및 칼로리 계산
4. 식단 계획 조언

사용자 정보:
${userProfile ? `
- 알레르기: ${userProfile.allergies.join(', ') || '없음'}
- 선호 음식: ${userProfile.preferences.join(', ') || '없음'}
` : '로그인하지 않은 사용자'}

답변은 한국어로 제공하고, 실용적이고 구체적인 조언을 해주세요.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const botResponse = completion.choices[0].message.content;

    // 대화 기록 저장 (로그인한 사용자의 경우)
    if (req.user) {
      await supabase
        .from('chat_history')
        .insert([
          {
            user_id: req.user.id,
            conversation_id: conversationId || Date.now().toString(),
            user_message: message,
            bot_response: botResponse,
            created_at: new Date().toISOString()
          }
        ]);
    }

    res.json({
      response: botResponse,
      conversationId: conversationId || Date.now().toString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// 대화 기록 조회
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.query;

    let query = supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      history: data
    });
  } catch (error) {
    console.error('Fetch chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// 대화 기록 삭제
router.delete('/history/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', req.user.id)
      .eq('conversation_id', conversationId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    console.error('Delete chat history error:', error);
    res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

// 레시피 관련 질문에 대한 특화된 답변
router.post('/recipe-question', optionalAuth, async (req, res) => {
  try {
    const { question, recipeId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let recipeInfo = '';
    if (recipeId) {
      // 레시피 정보 가져오기
      const { data: recipe } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();
      
      if (recipe) {
        recipeInfo = `
레시피 정보:
- 제목: ${recipe.title}
- 재료: ${recipe.ingredients.join(', ')}
- 조리시간: ${recipe.cooking_time}분
- 난이도: ${recipe.difficulty}
- 카테고리: ${recipe.category}
`;
      }
    }

    const systemPrompt = `당신은 레시피 전문가입니다. 
    
사용자의 레시피 관련 질문에 대해 정확하고 실용적인 답변을 제공해주세요.

${recipeInfo}

답변은 한국어로 제공하고, 구체적이고 실용적인 조언을 해주세요.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    res.json({
      response,
      recipeId
    });
  } catch (error) {
    console.error('Recipe question error:', error);
    res.status(500).json({ error: 'Failed to process recipe question' });
  }
});

module.exports = router;
