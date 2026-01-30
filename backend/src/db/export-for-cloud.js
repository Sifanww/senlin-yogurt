const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'shop.db');
const exportDir = path.join(__dirname, '../../export');

if (!fs.existsSync(dbPath)) {
  console.log('❌ 数据库文件不存在');
  process.exit(1);
}

// 创建导出目录
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const db = new Database(dbPath);

// 导出分类数据
const categories = db.prepare('SELECT * FROM categories').all();
const categoriesExport = categories.map(item => ({
  _id: `category_${item.id}`,
  id: item.id,
  name: item.name,
  sort_order: item.sort_order,
  created_at: item.created_at,
  updated_at: item.updated_at
}));
fs.writeFileSync(
  path.join(exportDir, 'categories.json'),
  categoriesExport.map(item => JSON.stringify(item)).join('\n')
);
console.log(`✅ 导出 ${categories.length} 条分类数据`);

// 导出商品数据
const products = db.prepare('SELECT * FROM products').all();
const productsExport = products.map(item => ({
  _id: `product_${item.id}`,
  id: item.id,
  category_id: item.category_id,
  name: item.name,
  description: item.description,
  price: item.price,
  image: item.image,
  stock: item.stock,
  status: item.status,
  created_at: item.created_at,
  updated_at: item.updated_at
}));
fs.writeFileSync(
  path.join(exportDir, 'products.json'),
  productsExport.map(item => JSON.stringify(item)).join('\n')
);
console.log(`✅ 导出 ${products.length} 条商品数据`);

// 导出用户数据
const users = db.prepare('SELECT id, phone, nickname, avatar, points, role, created_at, updated_at FROM users').all();
const usersExport = users.map(item => ({
  _id: `user_${item.id}`,
  id: item.id,
  phone: item.phone,
  nickname: item.nickname,
  avatar: item.avatar,
  points: item.points || 0,
  role: item.role || 'customer',
  created_at: item.created_at,
  updated_at: item.updated_at
}));
fs.writeFileSync(
  path.join(exportDir, 'users.json'),
  usersExport.map(item => JSON.stringify(item)).join('\n')
);
console.log(`✅ 导出 ${users.length} 条用户数据`);

// 导出订单数据
const orders = db.prepare('SELECT * FROM orders').all();
const ordersExport = orders.map(item => ({
  _id: `order_${item.id}`,
  id: item.id,
  order_no: item.order_no,
  user_id: item.user_id,
  total_amount: item.total_amount,
  status: item.status,
  remark: item.remark,
  created_at: item.created_at,
  updated_at: item.updated_at
}));
fs.writeFileSync(
  path.join(exportDir, 'orders.json'),
  ordersExport.map(item => JSON.stringify(item)).join('\n')
);
console.log(`✅ 导出 ${orders.length} 条订单数据`);

// 导出订单明细数据
const orderItems = db.prepare('SELECT * FROM order_items').all();
const orderItemsExport = orderItems.map(item => ({
  _id: `order_item_${item.id}`,
  id: item.id,
  order_id: item.order_id,
  product_id: item.product_id,
  product_name: item.product_name,
  price: item.price,
  quantity: item.quantity
}));
fs.writeFileSync(
  path.join(exportDir, 'order_items.json'),
  orderItemsExport.map(item => JSON.stringify(item)).join('\n')
);
console.log(`✅ 导出 ${orderItems.length} 条订单明细数据`);

// 导出地址数据
const addresses = db.prepare('SELECT * FROM addresses').all();
const addressesExport = addresses.map(item => ({
  _id: `address_${item.id}`,
  id: item.id,
  user_id: item.user_id,
  name: item.name,
  phone: item.phone,
  address: item.address,
  is_default: item.is_default,
  created_at: item.created_at,
  updated_at: item.updated_at
}));
fs.writeFileSync(
  path.join(exportDir, 'addresses.json'),
  addressesExport.map(item => JSON.stringify(item)).join('\n')
);
console.log(`✅ 导出 ${addresses.length} 条地址数据`);

db.close();

console.log('\n📁 数据已导出到 backend/export/ 目录');
console.log('请在云开发控制台导入这些 JSON 文件');
