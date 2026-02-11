/**
 * 商品详情页类型定义
 *
 * 支持两种模式：
 * - single (定制模式/A店): 基础价格固定，通过 modifier_groups 定制选项
 * - multi  (多规格模式/B店): 不同 SKU 对应不同基础价格
 */

// ============ SKU 模式 ============

/** SKU 模式：single=单规格(定制模式), multi=多规格 */
export type SkuMode = 'single' | 'multi'

// ============ 属性组控件类型 ============

/** 属性组 UI 渲染类型 */
export type CtrlType = 'tags' | 'list' | 'stepper'

// ============ 属性选项 ============

/** 属性组中的单个选项 */
export interface ModifierOption {
  /** 选项 ID */
  id: string
  /** 选项名称 */
  name: string
  /** 加价金额，0 表示不加价 */
  price: number
  /** 选项图片（可选） */
  image?: string
  /** 是否售罄 */
  sold_out?: boolean
}

// ============ 属性组选择规则 ============

/** 属性组选择数量规则 */
export interface ModifierRules {
  /** 最少选择数量 */
  min: number
  /** 最多选择数量 */
  max: number
}

// ============ 属性组 ============

/** 属性组（如"选择水果"、"选择尺寸"） */
export interface ModifierGroup {
  /** 属性组 ID */
  id: string
  /** 属性组标题 */
  title: string
  /** 属性组描述（如"请任选3款"） */
  desc?: string
  /** UI 渲染类型 */
  ctrl_type: CtrlType
  /** 选择规则 */
  rules: ModifierRules
  /** 选项列表 */
  options: ModifierOption[]
}

// ============ SKU ============

/** 多规格模式下的 SKU 定义 */
export interface Sku {
  /** SKU ID */
  id: string
  /** 规格名称（如"6寸"、"8寸"） */
  name: string
  /** 该规格的基础价格 */
  price: number
  /** 原价（用于划线价展示） */
  original_price?: number
  /** SKU 图片（可选） */
  image?: string
  /** 库存，undefined 表示不限 */
  stock?: number
  /** 是否售罄 */
  sold_out?: boolean
}

// ============ 商品 ============

/** 商品信息 */
export interface Product {
  /** 商品 ID */
  id: string
  /** 商品名称 */
  name: string
  /** 商品描述 */
  description?: string
  /** 商品主图 */
  image?: string
  /** 商品图片列表 */
  images?: string[]
  /** SKU 模式 */
  sku_mode: SkuMode
  /**
   * 基础价格
   * - single 模式: 即为商品价格
   * - multi 模式: 展示用起步价（实际价格由选中的 SKU 决定）
   */
  base_price: number
  /** 原价（用于划线价展示） */
  original_price?: number
  /** 分类 ID */
  category_id?: number
  /** 是否上架 */
  on_sale?: boolean
  /** 多规格列表（仅 multi 模式） */
  skus?: Sku[]
  /** 属性组列表（两种模式都可能有） */
  modifier_groups?: ModifierGroup[]
}

// ============ 用户选择状态 ============

/** 用户在属性组中的选择 */
export interface ModifierSelection {
  /** 属性组 ID */
  group_id: string
  /** 已选选项 ID 列表 */
  selected_option_ids: string[]
}

/** 用户在商品详情页的完整选择状态 */
export interface ProductSelection {
  /** 商品 ID */
  product_id: string
  /** 选中的 SKU ID（multi 模式） */
  selected_sku_id?: string
  /** 各属性组的选择 */
  modifier_selections: ModifierSelection[]
  /** 购买数量 */
  quantity: number
}

// ============ 价格计算结果 ============

/** 计算后的价格明细 */
export interface PriceBreakdown {
  /** 基础价格（single 模式为 base_price，multi 模式为选中 SKU 的 price） */
  base: number
  /** 属性加价合计 */
  modifiers_total: number
  /** 单件总价 = base + modifiers_total */
  unit_total: number
  /** 最终价格 = unit_total * quantity */
  total: number
}
