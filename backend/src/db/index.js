const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/shop.db');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

module.exports = db;
