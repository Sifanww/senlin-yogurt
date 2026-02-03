export interface Category {
  id: number
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  category_id: number
  category_name?: string
  name: string
  description: string
  price: number
  image: string
  stock: number
  status: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  price: number
  quantity: number
}

export interface Order {
  id: number
  order_no: string
  total_amount: number
  status: number
  remark: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
  user_nickname?: string
}

// 订单状态
export const ORDER_STATUS = {
  0: { text: '待支付', color: 'orange' },
  1: { text: '制作中', color: 'cyan' },
  2: { text: '待取餐', color: 'blue' },
  3: { text: '已完成', color: 'green' },
  4: { text: '已取消', color: 'red' }
} as const

// 商品状态
export const PRODUCT_STATUS = {
  0: { text: '已下架', color: 'red' },
  1: { text: '上架中', color: 'green' }
} as const
