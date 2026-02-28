import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro'
import { orderApi } from '../../services'
import { Order, OrderStatus, OrderStatusText } from '../../types/order'
import { safeNavigateBack } from '../../utils/navigate'
import './index.scss'

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

export default function OrderDetail() {
  const router = useRouter()
  const [statusBarHeight, setStatusBarHeight] = useState(0)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  // 配置分享
  useShareAppMessage(() => {
    if (!order) {
      return { title: '森邻酸奶订单', path: '/pages/index/index' }
    }
    const itemNames = order.items?.map(i => i.product_name).join('、') || ''
    return {
      title: `【待处理订单】${itemNames} ¥${order.total_amount}`,
      path: `/pages/orderDetail/index?orderId=${order.id}`
    }
  })

  useEffect(() => {
    const sysInfo = Taro.getSystemInfoSync()
    setStatusBarHeight(sysInfo.statusBarHeight || 0)
  }, [])

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
    } catch (error: any) {
      console.error('获取订单失败:', error)
      const msg = error.message || '获取订单失败'
      if (msg.includes('无权') || msg.includes('登录')) {
        Taro.showToast({ title: msg, icon: 'none' })
        setTimeout(() => {
          safeNavigateBack()
        }, 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    Taro.switchTab({ url: '/pages/orders/index' })
  }

  // 再来一单
  const handleReorder = () => {
    if (!order || !order.items || order.items.length === 0) {
      Taro.showToast({ title: '订单商品为空', icon: 'none' })
      return
    }

    // 将订单商品转换为购物车格式
    const cartItems = order.items.map((item, index) => ({
      cartId: `reorder_${order.id}_${item.product_id}_${index}`,
      product: {
        id: item.product_id,
        name: item.product_name,
        price: item.price,
        image: '' // 订单中没有图片信息
      },
      quantity: item.quantity,
      totalPrice: item.price * item.quantity
    }))

    // 存储到 checkoutCart
    Taro.setStorageSync('checkoutCart', JSON.stringify(cartItems))
    
    // 跳转到确认订单页面
    Taro.navigateTo({ url: '/pages/checkout/index?orderType=pickup' })
  }

  // 取消订单
  const handleCancelOrder = async () => {
    if (!order) return
    
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      confirmText: '确定取消',
      confirmColor: '#ff6b6b',
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderApi.updateStatus(order.id, OrderStatus.CANCELLED)
            Taro.showToast({ title: '订单已取消', icon: 'success' })
            loadOrder() // 刷新订单状态
          } catch (error: any) {
            console.error('取消订单失败:', error)
            Taro.showToast({ title: error.message || '取消失败', icon: 'none' })
          }
        }
      }
    })
  }

  if (loading) {
    return (
      <View className='order-detail-page'>
        <View className='nav-bar' style={{ paddingTop: `${statusBarHeight}px` }}>
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
        <View className='nav-bar' style={{ paddingTop: `${statusBarHeight}px` }}>
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
      <View className='nav-bar' style={{ paddingTop: `${statusBarHeight}px` }}>
        <View className='nav-back' onClick={goBack}>
          <Text className='back-icon'>‹</Text>
        </View>
        <Text className='nav-title'>订单详情</Text>
        <View className='nav-placeholder'></View>
      </View>

      <ScrollView className='detail-content' scrollY>
        <View className='status-card'>
          {!order.pickup_number && <View className='status-icon'>···</View>}
          <Text className='status-text'>{OrderStatusText[order.status] || '未知状态'}</Text>
          {order.pickup_number && (
            <View className='pickup-number-wrap'>
              <Text className='pickup-label'>取餐码</Text>
              <Text className='pickup-number'>{order.pickup_number.slice(-3)}</Text>
            </View>
          )}
        </View>

        <View className='section'>
          <View className='section-title'>
            <Text className='title-icon'>📍</Text>
            <Text className='title-text'>取餐信息</Text>
          </View>
          <View className='info-card'>
            <View className='info-row'>
              <Text className='info-label'>取餐门店</Text>
              <Text className='info-value'>森邻酸奶·玉溪店</Text>
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
                  {item.modifiers && item.modifiers !== '默认配置' && (
                    <Text className='goods-spec'>{item.modifiers}</Text>
                  )}
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
        {order.status === OrderStatus.PENDING_PAYMENT ? (
          <>
            <View className='btn-cancel' onClick={handleCancelOrder}>取消订单</View>
            <Button className='btn-primary btn-share' openType='share'>立即付款</Button>
          </>
        ) : (
          <>
            <View className='btn-secondary' onClick={goBack}>返回订单列表</View>
            <View className='btn-primary' onClick={handleReorder}>再来一单</View>
          </>
        )}
      </View>
    </View>
  )
}
