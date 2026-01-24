const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取所有分类
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  res.json({ data: categories });
});

// 获取单个分类
router.get('/:id', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) {
    return res.status(404).json({ error: '分类不存在' });
  }
  res.json({ data: category });
});

// 创建分类
router.post('/', (req, res) => {
  const { name, sort_order = 0 } = req.body;
  if (!name) {
    return res.status(400).json({ error: '分类名称不能为空' });
  }
  const result = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(name, sort_order);
  res.json({ data: { id: result.lastInsertRowid, name, sort_order } });
});

// 更新分类
router.put('/:id', (req, res) => {
  const { name, sort_order } = req.body;
  const updates = [];
  const values = [];
  
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  
  db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: '更新成功' });
});

// 删除分类
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
