const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// 简单的密码加密
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 生成简单token
function generateToken(userId) {
  return crypto.randomBytes(32).toString('hex') + '_' + userId;
}

// 用户注册
router.post('/register', (req, res) => {
  try {
    const { phone, password, nickname } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }
    
    // 检查手机号是否已注册
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) {
      return res.status(400).json({ error: '该手机号已注册' });
    }
    
    const hashedPassword = hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)'
    ).run(phone, hashedPassword, nickname || `用户${phone.slice(-4)}`);
    
    const user = db.prepare('SELECT id, phone, nickname, avatar, points FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user.id);
    
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 用户登录
router.post('/login', (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }
    
    const hashedPassword = hashPassword(password);
    const user = db.prepare(
      'SELECT id, phone, nickname, avatar, points FROM users WHERE phone = ? AND password = ?'
    ).get(phone, hashedPassword);
    
    if (!user) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }
    
    const token = generateToken(user.id);
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户信息
router.get('/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const userId = token.split('_').pop();
    const user = db.prepare('SELECT id, phone, nickname, avatar, points FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户信息
router.put('/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const userId = token.split('_').pop();
    const { nickname, avatar } = req.body;
    
    db.prepare('UPDATE users SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(nickname, avatar, userId);
    
    const user = db.prepare('SELECT id, phone, nickname, avatar, points FROM users WHERE id = ?').get(userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
