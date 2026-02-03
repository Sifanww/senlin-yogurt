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

  const isAdmin = req.user?.role === 'admin'

  let sql, params = []

  if (isAdmin) {
    // 管理员查询时关联用户信息
    sql = `SELECT o.*, u.nickname as user_nickname 
           FROM orders o 
           LEFT JOIN users u ON o.user_id = u.id 
           WHERE 1=1`
  } else {
    sql = 'SELECT * FROM orders WHERE user_id = ?'
    params.push(req.user.id)
  }

  if (status !== undefined) {
    sql += ' AND status = ?'
    params.push(status)
  }

  sql += ' ORDER BY o.id DESC'

  const orders = db.prepare(sql).all(...params)
  res.json({ data: orders })
});

// 获取订单详情（需要登录，只能查看自己的订单）
router.get('/:id', auth, (req, res) => {

  const isAdmin = req.user?.role === 'admin'
  const orderId = req.params.id

  const order = isAdmin
    ? db.prepare(`SELECT o.*, u.nickname as user_nickname 
                  FROM orders o 
                  LEFT JOIN users u ON o.user_id = u.id 
                  WHERE o.id = ?`).get(orderId)
    : db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.user.id)

  if (!order) {
    return res.status(404).json({ error: '订单不存在' })
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)
  res.json({ data: { ...order, items } })
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
router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  if (status === undefined) {
    return res.status(400).json({ error: '状态不能为空' });
  }

  const order = db.prepare('SELECT id, user_id, status FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    return res.status(404).json({ error: '订单不存在' })
  }

  const isAdmin = req.user?.role === 'admin'
  if (!isAdmin) {
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权限' })
    }
    // 普通用户仅允许取消订单（兼容 4/5 两种“已取消”状态编码）
    const cancelCodes = new Set([4, 5])
    if (!cancelCodes.has(Number(status))) {
      return res.status(403).json({ error: '无权限' })
    }
  }

  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id)
  res.json({ message: '更新成功' })
});

// 删除订单
router.delete('/:id', auth, (req, res) => {
  const order = db.prepare('SELECT id, user_id, status FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    return res.status(404).json({ error: '订单不存在' })
  }

  const isAdmin = req.user?.role === 'admin'
  if (!isAdmin) {
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权限' })
    }
    const cancelCodes = new Set([4, 5])
    if (!cancelCodes.has(Number(order.status))) {
      return res.status(403).json({ error: '仅可删除已取消订单' })
    }
  }

  db.transaction(() => {
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id)
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id)
  })()
  res.json({ message: '删除成功' })
});

module.exports = router;
