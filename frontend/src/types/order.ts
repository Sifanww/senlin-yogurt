// 订单状态枚举
export enum OrderStatus {
  PENDING_PAYMENT = 0,  // 待支付
  PREPARING = 1,        // 制作中
  READY = 2,            // 待取餐
  COMPLETED = 3,        // 已完成
  CANCELLED = 4         // 已取消
}

// 订单状态文本
export const OrderStatusText = {
  [OrderStatus.PENDING_PAYMENT]: '待支付',
  [OrderStatus.PREPARING]: '制作中',
  [OrderStatus.READY]: '待取餐',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消'
} as const

// 订单商品项
export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  price: number
  quantity: number
  modifiers?: string
}

// 订单
export interface Order {
  id: number
  order_no: string
  pickup_number?: string
  total_amount: number
  status: OrderStatus
  remark: string
  created_at: any
  updated_at?: string
  items?: OrderItem[]
}
