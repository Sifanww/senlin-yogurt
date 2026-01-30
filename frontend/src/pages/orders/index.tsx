import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { orderApi } from '../../services'
import './index.scss'

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  price: number
  quantity: number
}

interface Order {
  id: number
  order_no: string
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

const statusMap: Record<number, string> = {
  0: '待支付',
  1: '已支付',
  2: '制作中',
  3: '待取餐',
  4: '已完成',
  5: '已取消'
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    checkLoginAndLoad()
  })

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
            Taro.navigateBack()
          }
        }
      })
      setLoading(false)
      return
    }
    loadOrders()
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = activeTab === 'all' ? {} : { status: activeTab }
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
    setActiveTab(tab)
    // 切换 tab 后重新加载
    setTimeout(loadOrders, 0)
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
          className={`tab ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => handleTabChange(1)}
        >
          待取餐
        </View>
        <View
          className={`tab ${activeTab === 4 ? 'active' : ''}`}
          onClick={() => handleTabChange(4)}
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
          orders.map(order => (
            <View key={order.id} className='order-card' onClick={() => viewOrderDetail(order.id)}>
              <View className='order-header'>
                <View className='store-info'>
                  <Text className='store-name'>森林酸奶</Text>
                </View>
                <Text className='order-status'>{statusMap[order.status] || '未知'}</Text>
              </View>

              <View className='order-goods'>
                <View className='goods-item'>
                  <View className='goods-info'>
                    <Text className='goods-name'>订单号: {order.order_no}</Text>
                    <Text className='goods-spec'>金额: ¥{order.total_amount}</Text>
                  </View>
                </View>
              </View>

              <View className='order-footer'>
                <Text className='order-time'>{formatDateTime(order.created_at)}</Text>
                <View className='order-total'>
                  <Text className='total-label'>实付</Text>
                  <Text className='total-price'>¥{order.total_amount}</Text>
                </View>
              </View>

              <View className='order-actions'>
                <View className='action-btn primary'>查看详情</View>
              </View>
            </View>
          ))
        )}

        <View className='bottom-placeholder'></View>
      </ScrollView>
    </View>
  )
}
