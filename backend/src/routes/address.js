const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取用户地址列表
router.get('/', (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ error: '缺少用户ID' });
  }
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(userId);
  res.json({ data: addresses });
});

// 获取单个地址
router.get('/:id', (req, res) => {
  const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id);
  if (!address) {
    return res.status(404).json({ error: '地址不存在' });
  }
  res.json({ data: address });
});

// 创建地址
router.post('/', (req, res) => {
  const { user_id, name, phone, address, is_default = 0 } = req.body;
  if (!user_id || !name || !phone || !address) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  // 如果设为默认，先取消其他默认地址
  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user_id);
  }
  
  const result = db.prepare(
    'INSERT INTO addresses (user_id, name, phone, address, is_default) VALUES (?, ?, ?, ?, ?)'
  ).run(user_id, name, phone, address, is_default);
  
  res.json({ data: { id: result.lastInsertRowid } });
});

// 更新地址
router.put('/:id', (req, res) => {
  const { name, phone, address, is_default, user_id } = req.body;
  const updates = [];
  const values = [];
  
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
  if (address !== undefined) { updates.push('address = ?'); values.push(address); }
  if (is_default !== undefined) {
    // 如果设为默认，先取消其他默认地址
    if (is_default && user_id) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user_id);
    }
    updates.push('is_default = ?');
    values.push(is_default);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  
  db.prepare(`UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: '更新成功' });
});

// 删除地址
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
