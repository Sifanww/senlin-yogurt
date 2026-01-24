import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { orderApi } from '../../services/api'
import './index.scss'

interface CartItem {
  cartId: string
  product: {
    id: number
    name: string
    description?: string
    price: number
    image: string
  }
  quantity: number
  totalPrice: number
}

export default function Checkout() {
  const router = useRouter()
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [remark, setRemark] = useState('')

  useEffect(() => {
    // 从路由参数获取数据
    const type = router.params.orderType as 'pickup' | 'delivery'
    if (type) {
      setOrderType(type)
    }

    // 从缓存获取购物车数据
    const cartData = Taro.getStorageSync('checkoutCart')
    if (cartData) {
      setCartItems(JSON.parse(cartData))
    }
  }, [])

  // 获取商品描述
  const getProductDesc = (item: CartItem) => {
    return item.product.description || '默认配置'
  }

  // 计算总金额
  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  // 计算总数量
  const getTotalCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  // 生成订单号
  const generateOrderNo = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${year}${month}${day}${Date.now().toString().slice(-6)}${random}`
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }

  // 提交订单
  const submitOrder = async () => {
    if (cartItems.length === 0) {
      Taro.showToast({ title: '购物车为空', icon: 'none' })
      return
    }

    Taro.showLoading({ title: '提交订单中...' })

    try {
      // 构建订单数据
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        remark: remark || undefined
      }

      // 调用后端接口创建订单
      const res = await orderApi.create(orderData)
      
      Taro.hideLoading()

      // 清除购物车缓存
      Taro.removeStorageSync('checkoutCart')

      Taro.showToast({
        title: '下单成功',
        icon: 'success',
        duration: 1500
      })

      // 跳转到订单详情页
      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/orderDetail/index?orderId=${res.data.id}`
        })
      }, 1500)
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '下单失败，请重试', icon: 'none' })
    }
  }

  // 返回修改
  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className='checkout-page'>
      {/* 顶部导航 */}
      <View className='nav-bar'>
        <View className='nav-back' onClick={goBack}>
          <Text className='back-icon'>‹</Text>
        </View>
        <Text className='nav-title'>确认订单</Text>
        <View className='nav-placeholder'></View>
      </View>

      <ScrollView className='checkout-content' scrollY>
        {/* 取餐方式 */}
        <View className='section'>
          <View className='section-title'>
            <Text className='title-icon'>📍</Text>
            <Text className='title-text'>取餐方式</Text>
          </View>
          <View className='order-type-card'>
            <View className='type-options'>
              <View
                className={`type-option ${orderType === 'pickup' ? 'active' : ''}`}
                onClick={() => setOrderType('pickup')}
              >
                <Text className='option-icon'>🏪</Text>
                <Text className='option-text'>到店自提</Text>
              </View>
              <View
                className={`type-option ${orderType === 'delivery' ? 'active' : ''}`}
                onClick={() => setOrderType('delivery')}
              >
                <Text className='option-icon'>🛵</Text>
                <Text className='option-text'>外卖配送</Text>
              </View>
            </View>
            {orderType === 'pickup' ? (
              <View className='type-detail'>
                <Text className='detail-label'>取餐门店</Text>
                <View className='detail-value'>
                  <Text className='store-name'>森林酸奶·曲靖嘉城店</Text>
                  <Text className='store-arrow'>›</Text>
                </View>
              </View>
            ) : (
              <View className='type-detail'>
                <Text className='detail-label'>配送地址</Text>
                <View className='detail-value'>
                  <Text className='address-text'>请选择配送地址</Text>
                  <Text className='store-arrow'>›</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 商品明细 */}
        <View className='section'>
          <View className='section-title'>
            <Text className='title-icon'>🛒</Text>
            <Text className='title-text'>商品明细</Text>
            <Text className='title-count'>共{getTotalCount()}件</Text>
          </View>
          <View className='goods-card'>
            {cartItems.map(item => (
              <View key={item.cartId} className='goods-item'>
                <Image className='goods-image' src={item.product.image} mode='aspectFill' />
                <View className='goods-info'>
                  <Text className='goods-name'>{item.product.name}</Text>
                  <Text className='goods-spec'>{getProductDesc(item)}</Text>
                  <View className='goods-bottom'>
                    <Text className='goods-price'>
                      <Text className='price-symbol'>¥</Text>
                      {item.totalPrice}
                    </Text>
                    <Text className='goods-qty'>x{item.quantity}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className='section'>
          <View className='section-title'>
            <Text className='title-icon'>📝</Text>
            <Text className='title-text'>备注</Text>
          </View>
          <View className='remark-card'>
            <Textarea
              className='remark-input'
              placeholder='如有特殊要求，请在此备注'
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              maxlength={100}
            />
          </View>
        </View>

        {/* 价格明细 */}
        <View className='section'>
          <View className='section-title'>
            <Text className='title-icon'>💰</Text>
            <Text className='title-text'>价格明细</Text>
          </View>
          <View className='price-card'>
            <View className='price-row'>
              <Text className='price-label'>商品金额</Text>
              <Text className='price-value'>¥{getTotalPrice()}</Text>
            </View>
            {orderType === 'delivery' && (
              <View className='price-row'>
                <Text className='price-label'>配送费</Text>
                <Text className='price-value'>¥5</Text>
              </View>
            )}
            <View className='price-row'>
              <Text className='price-label'>优惠</Text>
              <Text className='price-value discount'>-¥0</Text>
            </View>
          </View>
        </View>

        {/* 底部占位 */}
        <View className='bottom-placeholder'></View>
      </ScrollView>

      {/* 底部结算栏 */}
      <View className='checkout-bar'>
        <View className='total-info'>
          <Text className='total-label'>待支付</Text>
          <Text className='total-price'>
            <Text className='price-symbol'>¥</Text>
            {getTotalPrice() + (orderType === 'delivery' ? 5 : 0)}
          </Text>
        </View>
        <View className='pay-btn' onClick={submitOrder}>
          立即支付
        </View>
      </View>
    </View>
  )
}
