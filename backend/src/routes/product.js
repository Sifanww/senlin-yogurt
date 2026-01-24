const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取商品列表
router.get('/', (req, res) => {
  const { category_id, status } = req.query;
  let sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
  const params = [];
  
  if (category_id) { sql += ' AND p.category_id = ?'; params.push(category_id); }
  if (status !== undefined) { sql += ' AND p.status = ?'; params.push(status); }
  
  sql += ' ORDER BY p.id DESC';
  const products = db.prepare(sql).all(...params);
  res.json({ data: products });
});

// 获取单个商品
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  res.json({ data: product });
});

// 创建商品
router.post('/', (req, res) => {
  const { category_id, name, description, price, image, stock = 0, status = 1 } = req.body;
  if (!category_id || !name || price === undefined) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const result = db.prepare(
    'INSERT INTO products (category_id, name, description, price, image, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(category_id, name, description, price, image, stock, status);
  res.json({ data: { id: result.lastInsertRowid } });
});

// 更新商品
router.put('/:id', (req, res) => {
  const { category_id, name, description, price, image, stock, status } = req.body;
  const updates = [];
  const values = [];
  
  if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id); }
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (price !== undefined) { updates.push('price = ?'); values.push(price); }
  if (image !== undefined) { updates.push('image = ?'); values.push(image); }
  if (stock !== undefined) { updates.push('stock = ?'); values.push(stock); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  
  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: '更新成功' });
});

// 删除商品
router.delete('/:id', (req, res) => {
  // 检查是否有订单关联
  const orderItem = db.prepare('SELECT id FROM order_items WHERE product_id = ? LIMIT 1').get(req.params.id);
  if (orderItem) {
    return res.status(400).json({ error: '该商品已有订单关联，无法删除' });
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
