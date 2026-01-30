const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'shop.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ 数据库文件不存在，请先运行 npm run db:init');
  process.exit(1);
}

const db = new Database(dbPath);

try {
  // 检查 orders 表是否已有 user_id 列
  const columns = db.prepare("PRAGMA table_info(orders)").all();
  const hasUserId = columns.some(col => col.name === 'user_id');

  if (hasUserId) {
    console.log('✅ orders 表已存在 user_id 字段，无需迁移');
  } else {
    console.log('🔄 开始迁移：为 orders 表添加 user_id 字段...');
    
    // 添加 user_id 列（允许为空，因为旧订单没有用户ID）
    db.exec('ALTER TABLE orders ADD COLUMN user_id INTEGER');
    
    console.log('✅ 迁移完成：orders 表已添加 user_id 字段');
    console.log('⚠️  注意：旧订单的 user_id 为空，可能需要手动处理或删除');
  }
} catch (error) {
  console.error('❌ 迁移失败:', error.message);
} finally {
  db.close();
}
