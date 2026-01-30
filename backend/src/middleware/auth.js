const db = require('../db');

// 认证中间件 - 验证用户登录
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }
  
  // 从token中提取用户ID
  const userId = token.split('_').pop();
  
  if (!userId) {
    return res.status(401).json({ error: '无效的登录凭证' });
  }
  
  // 验证用户是否存在
  const user = db.prepare('SELECT id, phone, nickname, avatar, points, role FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  
  // 将用户信息附加到请求对象
  req.user = user;
  next();
}

// 可选认证中间件 - 不强制要求登录，但如果有token则验证
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    const userId = token.split('_').pop();
    if (userId) {
      const user = db.prepare('SELECT id, phone, nickname, avatar, points, role FROM users WHERE id = ?').get(userId);
      if (user) {
        req.user = user;
      }
    }
  }
  
  next();
}

module.exports = { auth, optionalAuth };
