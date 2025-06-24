const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

router.post('/', async (req, res) => {
  try {
    const email = req.user.email;
    const { title, content, mood, weather, location, is_private } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const validMoods = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'excited', 'calm', 'anxious'];
    const finalMood = validMoods.includes(mood) ? mood : 'neutral';
    const finalIsPrivate = is_private !== false;

    const [userCheck] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userCheck.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }
    const userId = userCheck[0].id;

    const insertQuery = `
      INSERT INTO diaries (user_id, title, content, mood, weather, location, is_private) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertQuery, [
      userId,
      title.trim(),
      content.trim(),
      finalMood,
      weather?.trim() || null,
      location?.trim() || null,
      finalIsPrivate
    ]);

    const [newDiary] = await db.query('SELECT * FROM diaries WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Diary created successfully',
      diary: newDiary[0]
    });

  } catch (error) {
    console.error('Create diary error:', error);
    res.status(500).json({ error: 'Failed to create diary' });
  }
});

router.get('/', async (req, res) => {
  try {
    const email = req.user.email;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';
    const mood = req.query.mood || 'all';
    const offset = (page - 1) * limit;

    const [userCheck] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userCheck.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }
    const userId = userCheck[0].id;

    let query = `
      SELECT id, title, content, mood, weather, location, is_private, 
             created_at, updated_at,
             SUBSTRING(content, 1, 200) as excerpt
      FROM diaries 
      WHERE user_id = ?
    `;
    let queryParams = [userId];

    if (search) {
      query += ` AND (title LIKE ? OR content LIKE ?)`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    if (mood && mood !== 'all') {
      query += ` AND mood = ?`;
      queryParams.push(mood);
    }

    const allowedSortFields = ['created_at', 'updated_at', 'title'];
    const allowedSortOrders = ['ASC', 'DESC'];

    if (allowedSortFields.includes(sortBy) && allowedSortOrders.includes(sortOrder)) {
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    }

    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [diaries] = await db.query(query, queryParams);

    let countQuery = 'SELECT COUNT(*) as total FROM diaries WHERE user_id = ?';
    let countParams = [userId];

    if (search) {
      countQuery += ` AND (title LIKE ? OR content LIKE ?)`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern);
    }

    if (mood && mood !== 'all') {
      countQuery += ` AND mood = ?`;
      countParams.push(mood);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    const processedDiaries = diaries.map(diary => ({
      ...diary,
      excerpt: diary.excerpt + (diary.content && diary.content.length > 200 ? '...' : '')
    }));

    res.json({
      diaries: processedDiaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch diaries',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const diaryId = req.params.id;
    const email = req.user.email;

    const [userCheck] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userCheck.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }
    const userId = userCheck[0].id;

    const [diary] = await db.query(
      'SELECT * FROM diaries WHERE id = ? AND user_id = ?',
      [diaryId, userId]
    );

    if (diary.length === 0) {
      return res.status(404).json({ error: 'Diary not found' });
    }

    res.json(diary[0]);

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch diary',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const diaryId = req.params.id;
    const email = req.user.email;
    const { title, content, mood, weather, location, is_private } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const validMoods = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'excited', 'calm', 'anxious'];
    const finalMood = validMoods.includes(mood) ? mood : 'neutral';

    const [userCheck] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userCheck.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }
    const userId = userCheck[0].id;

    const [existingDiary] = await db.query(
      'SELECT id FROM diaries WHERE id = ? AND user_id = ?',
      [diaryId, userId]
    );

    if (existingDiary.length === 0) {
      return res.status(404).json({ error: 'Diary not found' });
    }

    const updateQuery = `
      UPDATE diaries 
      SET title = ?, content = ?, mood = ?, weather = ?, location = ?, is_private = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    await db.query(updateQuery, [
      title.trim(),
      content.trim(),
      finalMood,
      weather?.trim() || null,
      location?.trim() || null,
      is_private !== false,
      diaryId,
      userId
    ]);

    const [updatedDiary] = await db.query('SELECT * FROM diaries WHERE id = ?', [diaryId]);

    res.json({
      message: 'Diary updated successfully',
      diary: updatedDiary[0]
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update diary',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const diaryId = req.params.id;
    const email = req.user.email;

    const [userCheck] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userCheck.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }
    const userId = userCheck[0].id;

    const [existingDiary] = await db.query(
      'SELECT id FROM diaries WHERE id = ? AND user_id = ?',
      [diaryId, userId]
    );

    if (existingDiary.length === 0) {
      return res.status(404).json({ error: 'Diary not found' });
    }

    await db.query('DELETE FROM diaries WHERE id = ? AND user_id = ?', [diaryId, userId]);

    res.json({ message: 'Diary deleted successfully' });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete diary',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 统计
router.get('/stats/overview', async (req, res) => {
  try {
    const email = req.user.email;

    const [userCheck] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userCheck.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }
    const userId = userCheck[0].id;

    const [totalResult] = await db.query(
      'SELECT COUNT(*) as total FROM diaries WHERE user_id = ?',
      [userId]
    );

    const [monthResult] = await db.query(
      `SELECT COUNT(*) as monthTotal 
       FROM diaries 
       WHERE user_id = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`,
      [userId]
    );

    const [moodStats] = await db.query(
      `SELECT mood, COUNT(*) as count
       FROM diaries 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY mood
       ORDER BY count DESC`,
      [userId]
    );

    res.json({
      total: totalResult[0].total,
      monthTotal: monthResult[0].monthTotal,
      moodStats: moodStats
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
