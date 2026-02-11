/**
 * 迁移脚本：为 order_items 表添加 modifiers 字段
 * 用于存储用户下单时选择的商品配置（如规格、属性等）
 *
 * 运行: node src/db/migrate-order-item-modifiers.js
 */
const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../../data/shop.db')
const db = new Database(dbPath)

function columnExists(table, column) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all()
  return info.some(col => col.name === column)
}

try {
  db.transaction(() => {
    if (!columnExists('order_items', 'modifiers')) {
      db.exec(`ALTER TABLE order_items ADD COLUMN modifiers TEXT DEFAULT ''`)
      console.log('✅ 已添加 order_items.modifiers 列')
    } else {
      console.log('⏭️  modifiers 列已存在，跳过')
    }
  })()
  console.log('✅ 迁移完成')
} catch (err) {
  console.error('❌ 迁移失败:', err.message)
} finally {
  db.close()
}
