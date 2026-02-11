const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../../data/shop.db');
const db = new Database(dbPath);

// 添加取餐码字段
try {
  db.exec(`ALTER TABLE orders ADD COLUMN pickup_number TEXT`);
  console.log('✅ 已添加 pickup_number 字段');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('⚠️ pickup_number 字段已存在，跳过');
  } else {
    throw e;
  }
}

db.close();
