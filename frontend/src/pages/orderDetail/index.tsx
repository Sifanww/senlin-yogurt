import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
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
  updated_at: string
  items: OrderItem[]
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

  const seconds = value?.seconds ?? value?._seconds
  const nanoseconds = value?.nanoseconds ?? value?._nanoseconds
  if (typeof seconds === 'number') {
    const ms = seconds * 1000 + (typeof nanoseconds === 'number' ? Math.floor(nanoseconds / 1e6) : 0)
    return formatDateTime(new Date(ms))
  }
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

export default function OrderDetail() {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [router.params.orderId])

  const loadOrder = async () => {
    const orderId = router.params.orderId
    if (!orderId) return

    try {
      setLoading(true)
      const res = await orderApi.getById(Number(orderId))
      setOrder(res.data as Order)
    } catch (error) {
      console.error('获取订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    Taro.switchTab({ url: '/pages/orders/index' })
  }

  if (loading) {
    return (
      <View className='order-detail-page'>
        <View className='nav-bar'>
          <View className='nav-back' onClick={goBack}>
            <Text className='back-icon'>‹</Text>
          </View>
          <Text className='nav-title'>订单详情</Text>
          <View className='nav-placeholder'></View>
        </View>
        <View className='empty'><Text>加载中...</Text></View>
      </View>
    )
  }

  if (!order) {
    return (
      <View className='order-detail-page'>
        <View className='nav-bar'>
          <View className='nav-back' onClick={goBack}>
            <Text className='back-icon'>‹</Text>
          </View>
          <Text className='nav-title'>订单详情</Text>
          <View className='nav-placeholder'></View>
        </View>
        <View className='empty'><Text>订单不存在</Text></View>
      </View>
    )
  }

  return (
    <View className='order-detail-page'>
      <View className='nav-bar'>
        <View className='nav-back' onClick={goBack}>
          <Text className='back-icon'>‹</Text>
        </View>
        <Text className='nav-title'>订单详情</Text>
        <View className='nav-placeholder'></View>
      </View>

      <ScrollView className='detail-content' scrollY>
        <View className='status-card'>
          <View className='status-icon'>✓</View>
          <Text className='status-text'>{statusMap[order.status] || '未知状态'}</Text>
          <Text className='status-tip'>请凭订单号到店取餐</Text>
        </View>

        <View className='section'>
          <View className='section-title'>
            <Text className='title-icon'>📍</Text>
            <Text className='title-text'>取餐信息</Text>
          </View>
          <View className='info-card'>
            <View className='info-row'>
              <Text className='info-label'>取餐门店</Text>
              <Text className='info-value'>森林酸奶·玉溪店</Text>
            </View>
            <View className='info-row'>
              <Text className='info-label'>订单号</Text>
              <Text className='info-value'>{order.order_no}</Text>
            </View>
          </View>
        </View>

        <View className='section'>
          <View className='section-title'>
            <Text className='title-icon'>🛒</Text>
            <Text className='title-text'>商品信息</Text>
          </View>
          <View className='goods-card'>
            {(order.items || []).map(item => (
              <View key={item.id} className='goods-item'>
                <View className='goods-info'>
                  <Text className='goods-name'>{item.product_name}</Text>
                  <View className='goods-bottom'>
                    <Text className='goods-price'>¥{item.price}</Text>
                    <Text className='goods-qty'>x{item.quantity}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className='section'>
          <View className='section-title'>
            <Text className='title-icon'>📋</Text>
            <Text className='title-text'>订单信息</Text>
          </View>
          <View className='info-card'>
            <View className='info-row'>
              <Text className='info-label'>下单时间</Text>
              <Text className='info-value'>{formatDateTime(order.created_at)}</Text>
            </View>
            {order.remark && (
              <View className='info-row'>
                <Text className='info-label'>备注</Text>
                <Text className='info-value'>{order.remark}</Text>
              </View>
            )}
          </View>
        </View>

        <View className='section'>
          <View className='section-title'>
            <Text className='title-icon'>💰</Text>
            <Text className='title-text'>价格明细</Text>
          </View>
          <View className='price-card'>
            <View className='price-row total'>
              <Text className='price-label'>实付金额</Text>
              <Text className='price-value'>¥{order.total_amount}</Text>
            </View>
          </View>
        </View>

        <View className='bottom-placeholder'></View>
      </ScrollView>

      <View className='bottom-bar'>
        <View className='btn-secondary' onClick={goBack}>返回订单列表</View>
        <View className='btn-primary'>再来一单</View>
      </View>
    </View>
  )
}
