const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

// 生成订单号
function generateOrderNo() {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp + random;
}

// 获取订单列表（需要登录，只返回当前用户的订单）
router.get('/', auth, (req, res) => {
  const { status } = req.query;
  const userId = req.user.id;
  
  let sql = 'SELECT * FROM orders WHERE user_id = ?';
  const params = [userId];
  
  if (status !== undefined) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY id DESC';
  
  const orders = db.prepare(sql).all(...params);
  res.json({ data: orders });
});

// 获取订单详情（需要登录，只能查看自己的订单）
router.get('/:id', auth, (req, res) => {
  const userId = req.user.id;
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  res.json({ data: { ...order, items } });
});

// 创建订单（需要登录）
router.post('/', auth, (req, res) => {
  const { items, remark } = req.body;
  const userId = req.user.id;
  
  if (!items || !items.length) {
    return res.status(400).json({ error: '订单商品不能为空' });
  }

  const orderNo = generateOrderNo();
  let totalAmount = 0;

  // 计算总金额
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
    if (!product) {
      return res.status(400).json({ error: `商品ID ${item.product_id} 不存在` });
    }
    totalAmount += product.price * item.quantity;
  }

  // 事务处理
  const insertOrder = db.transaction(() => {
    const orderResult = db.prepare(
      'INSERT INTO orders (order_no, user_id, total_amount, remark) VALUES (?, ?, ?, ?)'
    ).run(orderNo, userId, totalAmount, remark);
    
    const orderId = orderResult.lastInsertRowid;
    
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)'
      ).run(orderId, item.product_id, product.name, product.price, item.quantity);
    }
    
    return { id: orderId, order_no: orderNo, total_amount: totalAmount };
  });

  const result = insertOrder();
  res.json({ data: result });
});

// 更新订单状态
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  if (status === undefined) {
    return res.status(400).json({ error: '状态不能为空' });
  }
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ message: '更新成功' });
});

// 删除订单
router.delete('/:id', (req, res) => {
  db.transaction(() => {
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  })();
  res.json({ message: '删除成功' });
});

module.exports = router;
