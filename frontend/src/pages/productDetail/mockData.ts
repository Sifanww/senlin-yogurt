import type { Product } from '../../types/product'

/**
 * A店场景：定制模式 (single SKU)
 * DIY 水果蛋糕，基础价格固定，选 3 种水果定制
 */
export const mockProductA: Product = {
  id: '101',
  name: 'DIY水果蛋糕',
  description: '新鲜水果现做，甜蜜每一口',
  image: '',
  sku_mode: 'single',
  base_price: 100,
  modifier_groups: [
    {
      id: 'g_fruit',
      title: '选择水果',
      desc: '请任选3款',
      ctrl_type: 'tags',
      rules: { min: 3, max: 3 },
      options: [
        { id: 'm1', name: '草莓', price: 0 },
        { id: 'm2', name: '芒果', price: 0 },
        { id: 'm3', name: '蓝莓', price: 0 },
        { id: 'm4', name: '黑钻凤梨', price: 10 },
        { id: 'm5', name: '车厘子', price: 15 },
      ],
    },
    {
      id: 'g_deco',
      title: '蛋糕装饰',
      desc: '选1种装饰风格',
      ctrl_type: 'tags',
      rules: { min: 1, max: 1 },
      options: [
        { id: 'd1', name: '简约风', price: 0 },
        { id: 'd2', name: 'ins风', price: 20 },
        { id: 'd3', name: '生日主题', price: 15 },
      ],
    },
  ],
}

/**
 * B店场景：多规格模式 (multi SKU)
 * 芝士蛋糕，不同尺寸不同价格，可加配料
 */
export const mockProductB: Product = {
  id: '202',
  name: '经典芝士蛋糕',
  description: '浓郁芝士，入口即化',
  image: '',
  sku_mode: 'multi',
  base_price: 88,
  skus: [
    { id: 'sku_6', name: '6寸', price: 88 },
    { id: 'sku_8', name: '8寸', price: 128 },
    { id: 'sku_10', name: '10寸', price: 168 },
    { id: 'sku_12', name: '12寸', price: 218, sold_out: true },
  ],
  modifier_groups: [
    {
      id: 'g_topping',
      title: '加料',
      desc: '最多选2种',
      ctrl_type: 'tags',
      rules: { min: 0, max: 2 },
      options: [
        { id: 't1', name: '奥利奥碎', price: 5 },
        { id: 't2', name: '焦糖酱', price: 5 },
        { id: 't3', name: '抹茶粉', price: 8 },
        { id: 't4', name: '草莓酱', price: 6 },
      ],
    },
  ],
}
