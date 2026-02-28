import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { orderApi } from '../../services'
import { OrderStatus, OrderStatusText } from '../../types/order'
import { safeNavigateBack } from '../../utils/navigate'
import './index.scss'

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  price: number
  quantity: number
  modifiers?: string
}

interface Order {
  id: number
  order_no: string
  pickup_number?: string
  total_amount: number
  status: number
  remark: string
  created_at: any
  items?: OrderItem[]
}

function formatDateTime(value: any): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') {
    const ms = value > 1e12 ? value : value * 1000
    return formatDateTime(new Date(ms))
  }
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0')
    const y = value.getFullYear()
    const m = pad(value.getMonth() + 1)
    const d = pad(value.getDate())
    const hh = pad(value.getHours())
    const mm = pad(value.getMinutes())
    return `${y}-${m}-${d} ${hh}:${mm}`
  }

  // 兼容云开发时间戳对象（不同平台字段可能不同）
  const seconds = value?.seconds ?? value?._seconds
  const nanoseconds = value?.nanoseconds ?? value?._nanoseconds
  if (typeof seconds === 'number') {
    const ms = seconds * 1000 + (typeof nanoseconds === 'number' ? Math.floor(nanoseconds / 1e6) : 0)
    return formatDateTime(new Date(ms))
  }

  // 最后兜底：避免直接渲染对象导致 React 报错
  return String(value)
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const isFirstMount = useRef(true)

  useDidShow(() => {
    checkLoginAndLoad()
  })

  // 监听 activeTab 变化，重新加载订单
  useEffect(() => {
    // 首次挂载时由 useDidShow 触发，跳过
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    const token = Taro.getStorageSync('token')
    if (token) {
      loadOrders(activeTab)
    }
  }, [activeTab])

  const checkLoginAndLoad = () => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后查看订单',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          } else {
            safeNavigateBack()
          }
        }
      })
      setLoading(false)
      return
    }
    loadOrders(activeTab)
  }

  const loadOrders = async (tab: number | 'all') => {
    try {
      setLoading(true)
      const params = tab === 'all' ? {} : { status: tab }
      const res = await orderApi.getList(params)
      setOrders(res.data || [])
    } catch (error: any) {
      console.error('获取订单列表失败:', error)
      if (error.message?.includes('请先登录') || error.message?.includes('401')) {
        Taro.removeStorageSync('token')
        Taro.removeStorageSync('userInfo')
        Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        setTimeout(() => {
          Taro.navigateTo({ url: '/pages/login/index' })
        }, 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: number | 'all') => {
    if (tab === activeTab) return
    setActiveTab(tab)
  }

  const viewOrderDetail = (orderId: number) => {
    Taro.navigateTo({
      url: `/pages/orderDetail/index?orderId=${orderId}`
    })
  }

  return (
    <View className='orders-page'>
      <View className='tabs'>
        <View
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          全部
        </View>
        <View
          className={`tab ${activeTab === OrderStatus.READY ? 'active' : ''}`}
          onClick={() => handleTabChange(OrderStatus.READY)}
        >
          待取餐
        </View>
        <View
          className={`tab ${activeTab === OrderStatus.COMPLETED ? 'active' : ''}`}
          onClick={() => handleTabChange(OrderStatus.COMPLETED)}
        >
          已完成
        </View>
      </View>

      <ScrollView className='order-list' scrollY>
        {loading ? (
          <View className='empty'>
            <Text className='empty-text'>加载中...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>📋</Text>
            <Text className='empty-text'>暂无订单</Text>
            <View className='empty-btn' onClick={() => Taro.switchTab({ url: '/pages/order/index' })}>
              去点单
            </View>
          </View>
        ) : (
          orders.map((order, idx) => {
            const totalQty = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
            return (
              <View key={order.id ?? `${order.order_no}-${idx}`} className='order-card' onClick={() => viewOrderDetail(order.id)}>
                {/* 第一行：店铺名 + 状态 */}
                <View className='card-row card-header'>
                  <Text className='store-name'>森邻酸奶</Text>
                  <Text className='order-status'>{OrderStatusText[order.status] || '未知'} ›</Text>
                </View>

                {/* 第二行：时间 */}
                <Text className='card-time'>{formatDateTime(order.created_at)}</Text>

                {/* 第三行：商品明细 + 价格/数量 */}
                <View className='card-row card-body'>
                  <View className='card-items'>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <Text key={idx} className='card-item-name'>
                          {item.product_name} x{item.quantity}
                        </Text>
                      ))
                    ) : (
                      <Text className='card-item-name'>订单号: {order.order_no}</Text>
                    )}
                  </View>
                  <View className='card-summary'>
                    <Text className='card-price'>¥{order.total_amount}</Text>
                    <Text className='card-qty'>共{totalQty}件</Text>
                  </View>
                </View>

                {/* 第四行：取餐码 */}
                {order.pickup_number && (
                  <View className='card-bottom'>
                    <Text className='card-pickup'>取餐码: {order.pickup_number.slice(-3)}</Text>
                  </View>
                )}
              </View>
            )
          })
        )}

        <View className='bottom-placeholder'></View>
      </ScrollView>
    </View>
  )
}
