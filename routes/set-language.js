//语言排版有问题 没弄完还

const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

const supportedLanguages = ['en', 'zh', 'fr', 'es', 'de', 'ja', 'ko', 'ru'];

router.patch('/', verifyToken, async (req, res) => {
  try {
    const email = req.user?.email;
    const { language } = req.body;

    if (!email) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    if (!language || !supportedLanguages.includes(language)) {
      return res.status(400).json({ error: 'Unsupported or missing language' });
    }

    const [result] = await db.query(
      'UPDATE users SET language = ? WHERE email = ?',
      [language, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found or deleted' });
    }

    res.json({ message: 'Language updated successfully', language });
  } catch (err) {
    console.error('Error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
