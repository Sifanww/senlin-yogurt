const db = require('./index');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 先添加 role 字段（如果不存在）
try {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'`);
  console.log('✅ 添加 role 字段成功');
} catch (e) {
  // 字段已存在，忽略错误
  console.log('ℹ️ role 字段已存在');
}

// 清除已有测试用户
db.prepare(`DELETE FROM users WHERE phone IN ('13800000001', '13800000002')`).run();

// 插入测试用户
const insertUser = db.prepare(`
  INSERT INTO users (phone, password, nickname, points, role) 
  VALUES (?, ?, ?, ?, ?)
`);

// 客户账号
insertUser.run(
  '13800000001',
  hashPassword('123456'),
  '测试客户',
  100,
  'customer'
);

// 管理员账号
insertUser.run(
  '13800000002',
  hashPassword('admin123'),
  '管理员',
  0,
  'admin'
);

console.log('✅ 用户数据初始化完成');
console.log('');
console.log('测试账号：');
console.log('客户 - 手机号: 13800000001, 密码: 123456');
console.log('管理员 - 手机号: 13800000002, 密码: admin123');
