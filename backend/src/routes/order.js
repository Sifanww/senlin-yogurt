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
    now.getSeconds().toString().padStart(2, '0') +
    now.getMilliseconds().toString().padStart(3, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return timestamp + random;
}


// 生成取餐码：当天日期 + 顺序号 001-999
function generatePickupNumber() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');

  const latest = db.prepare(
    "SELECT pickup_number FROM orders WHERE pickup_number LIKE ? ORDER BY pickup_number DESC LIMIT 1"
  ).get(dateStr + '%');

  let seq = 1;
  if (latest && latest.pickup_number) {
    const lastSeq = parseInt(latest.pickup_number.slice(-3), 10);
    seq = lastSeq + 1;
    if (seq > 999) seq = 999;
  }

  return dateStr + seq.toString().padStart(3, '0');
}

// 获取订单列表（需要登录，只返回当前用户的订单）
router.get('/', auth, (req, res) => {
  const { status } = req.query;

  const isAdmin = req.user?.role === 'admin'

  let sql, params = []

  if (isAdmin) {
    sql = `SELECT o.*, u.nickname as user_nickname 
           FROM orders o 
           LEFT JOIN users u ON o.user_id = u.id 
           WHERE 1=1`
  } else {
    sql = 'SELECT * FROM orders o WHERE o.user_id = ?'
    params.push(req.user.id)
  }

  if (status !== undefined) {
    sql += ' AND o.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY o.id DESC'

  const orders = db.prepare(sql).all(...params)

  // 为每个订单附带商品明细
  const stmtItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
  for (const order of orders) {
    order.items = stmtItems.all(order.id)
  }

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

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
    if (!product) {
      return res.status(400).json({ error: `商品ID ${item.product_id} 不存在` });
    }

    // 优先使用前端传入的单价（含 SKU / 属性加价），否则回退到商品基础价格
    let unitPrice = product.price;
    if (item.price != null) {
      unitPrice = item.price;
    } else if (item.sku_id) {
      // 如果传了 sku_id 但没传 price，从数据库查 SKU 价格
      const sku = db.prepare('SELECT price FROM product_skus WHERE id = ? AND product_id = ?').get(item.sku_id, item.product_id);
      if (sku) unitPrice = sku.price;
    }
    totalAmount += unitPrice * item.quantity;
  }

  const insertOrder = db.transaction(() => {
    const orderResult = db.prepare(
      'INSERT INTO orders (order_no, user_id, total_amount, remark) VALUES (?, ?, ?, ?)'
    ).run(orderNo, userId, totalAmount, remark);
    
    const orderId = orderResult.lastInsertRowid;
    
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      // 使用与上面总价计算一致的单价逻辑
      let unitPrice = product.price;
      if (item.price != null) {
        unitPrice = item.price;
      } else if (item.sku_id) {
        const sku = db.prepare('SELECT price FROM product_skus WHERE id = ? AND product_id = ?').get(item.sku_id, item.product_id);
        if (sku) unitPrice = sku.price;
      }
      db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, price, quantity, modifiers) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(orderId, item.product_id, product.name, unitPrice, item.quantity, item.modifiers || '');
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

  const order = db.prepare('SELECT id, user_id, status, pickup_number FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    return res.status(404).json({ error: '订单不存在' })
  }

  const isAdmin = req.user?.role === 'admin'
  if (!isAdmin) {
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权限' })
    }
    const cancelCodes = new Set([4, 5])
    if (!cancelCodes.has(Number(status))) {
      return res.status(403).json({ error: '无权限' })
    }
  }

  // 当状态变为"待取餐"(2)且尚未分配取餐码时，自动生成取餐码
  if (Number(status) === 2 && !order.pickup_number) {
    const pickupNumber = generatePickupNumber();
    db.prepare('UPDATE orders SET status = ?, pickup_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, pickupNumber, req.params.id);
    return res.json({ message: '更新成功', pickup_number: pickupNumber });
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
