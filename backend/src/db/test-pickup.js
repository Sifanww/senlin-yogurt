const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../../data/shop.db'));

// 手动给订单3设置为"待取餐"并分配取餐号
db.prepare("UPDATE orders SET status = 2, pickup_number = '20260211001' WHERE id = 3").run();

const row = db.prepare('SELECT id, status, pickup_number FROM orders WHERE id = 3').get();
console.log('Updated order:', JSON.stringify(row));

db.close();
