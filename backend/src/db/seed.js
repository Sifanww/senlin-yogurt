const db = require('./index');

// 清空现有数据
db.exec('DELETE FROM order_items');
db.exec('DELETE FROM orders');
db.exec('DELETE FROM products');
db.exec('DELETE FROM categories');

// 插入分类
const categories = [
  { name: '新品', sort_order: 1 },
  { name: '酸奶碗', sort_order: 2 },
  { name: '酸奶夹', sort_order: 3 },
  { name: '小吃', sort_order: 4 }
];

const insertCategory = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
categories.forEach(c => insertCategory.run(c.name, c.sort_order));

// 获取分类ID
const getCategoryId = (name) => db.prepare('SELECT id FROM categories WHERE name = ?').get(name).id;

// 插入商品
const products = [
  {
    category: '新品',
    name: '黄油柿饼',
    description: '富平柿饼 / 新西兰黄油 / 核桃仁',
    price: 18,
    image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80',
    stock: 100
  },
  {
    category: '酸奶碗',
    name: '森林莓果酸奶碗',
    description: '草莓 / 蓝莓 / 无花果 / 青提 / 燕麦脆 / 椰子脆珠',
    price: 32,
    image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80',
    stock: 50
  },
  {
    category: '酸奶碗',
    name: '青提猕猴桃酸奶碗',
    description: '猕猴桃 / 阳光玫瑰青提 / 椰子脆珠 / 桂花 / 燕麦脆',
    price: 30,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
    stock: 50
  },
  {
    category: '酸奶碗',
    name: '芒果酸奶碗',
    description: '新鲜芒果 / 椰子片 / 奇亚籽 / 燕麦脆',
    price: 28,
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
    stock: 50
  },
  {
    category: '酸奶夹',
    name: '紫米酸奶夹',
    description: '紫米 / 酸奶慕斯 / 椰蓉 / 坚果碎',
    price: 22,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80',
    stock: 80
  },
  {
    category: '酸奶夹',
    name: '缤纷水果酸奶夹',
    description: '草莓 / 青提 / 橙子 / 猕猴桃 / 酸奶慕斯',
    price: 26,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
    stock: 80
  },
  {
    category: '酸奶夹',
    name: '草莓酸奶夹',
    description: '新鲜草莓 / 酸奶慕斯 / 椰蓉',
    price: 24,
    image: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=400&q=80',
    stock: 80
  },
  {
    category: '小吃',
    name: '燕麦脆',
    description: '低脂燕麦 / 坚果 / 蜂蜜烘焙',
    price: 8,
    image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&q=80',
    stock: 200
  }
];

const insertProduct = db.prepare(
  'INSERT INTO products (category_id, name, description, price, image, stock) VALUES (?, ?, ?, ?, ?, ?)'
);

products.forEach(p => {
  insertProduct.run(getCategoryId(p.category), p.name, p.description, p.price, p.image, p.stock);
});

console.log('✅ 测试数据插入完成');
console.log(`   - ${categories.length} 个分类`);
console.log(`   - ${products.length} 个商品`);
