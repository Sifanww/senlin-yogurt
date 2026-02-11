/**
 * 迁移脚本：为 products 表添加 sku_mode 和 modifier_groups 字段
 *
 * sku_mode: 'single' | 'multi'
 * modifier_groups: JSON 字符串，存储属性组配置
 * skus: JSON 字符串，存储多规格 SKU 列表
 *
 * 运行: node src/db/migrate-product-modifiers.js
 */
const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../../data/shop.db')
const db = new Database(dbPath)

// 检查列是否已存在
function columnExists(table, column) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all()
  return info.some(col => col.name === column)
}

try {
  db.transaction(() => {
    if (!columnExists('products', 'sku_mode')) {
      db.exec(`ALTER TABLE products ADD COLUMN sku_mode TEXT DEFAULT 'single'`)
      console.log('✅ 已添加 sku_mode 列')
    } else {
      console.log('⏭️  sku_mode 列已存在，跳过')
    }

    if (!columnExists('products', 'skus')) {
      db.exec(`ALTER TABLE products ADD COLUMN skus TEXT DEFAULT '[]'`)
      console.log('✅ 已添加 skus 列')
    } else {
      console.log('⏭️  skus 列已存在，跳过')
    }

    if (!columnExists('products', 'modifier_groups')) {
      db.exec(`ALTER TABLE products ADD COLUMN modifier_groups TEXT DEFAULT '[]'`)
      console.log('✅ 已添加 modifier_groups 列')
    } else {
      console.log('⏭️  modifier_groups 列已存在，跳过')
    }
  })()

  console.log('✅ 迁移完成')
} catch (err) {
  console.error('❌ 迁移失败:', err.message)
} finally {
  db.close()
}
