import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { orderApi, addressApi } from '../../services'
import { getImageUrl } from '../../services'
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

interface Address {
  id: number
  user_id: number
  name: string
  phone: string
  address: string
  is_default: number
}

export default function Checkout() {
  const router = useRouter()
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [remark, setRemark] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    // 检查登录状态
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再下单',
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
      return
    }

    const type = router.params.orderType as 'pickup' | 'delivery'
    if (type) setOrderType(type)

    const cartData = Taro.getStorageSync('checkoutCart')
    if (cartData) setCartItems(JSON.parse(cartData))

    const userInfo = Taro.getStorageSync('userInfo')
    if (userInfo?.id) {
      setUserId(userInfo.id)
      loadAddresses(userInfo.id)
    }
  }, [])

  // 页面显示时刷新地址（从地址管理页返回时）
  useDidShow(() => {
    if (userId) {
      loadAddresses(userId)
    }
  })

  const loadAddresses = async (uid: number) => {
    try {
      const res = await addressApi.getList()
      const list = res.data || []
      setAddresses(list)
      // 自动选择默认地址
      const defaultAddr = list.find((a: Address) => a.is_default === 1)
      if (defaultAddr) {
        setSelectedAddress(defaultAddr)
      } else if (list.length > 0) {
        setSelectedAddress(list[0])
      }
    } catch (e) {
      console.error('加载地址失败', e)
    }
  }

  const getProductDesc = (item: CartItem) => item.product.description || '默认配置'
  const getTotalPrice = () => cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const getTotalCount = () => cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const submitOrder = async () => {
    // 再次检查登录状态
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再下单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }

    if (cartItems.length === 0) {
      Taro.showToast({ title: '购物车为空', icon: 'none' })
      return
    }

    // 外卖必须选择地址
    if (orderType === 'delivery' && !selectedAddress) {
      Taro.showToast({ title: '请选择配送地址', icon: 'none' })
      return
    }

    Taro.showLoading({ title: '提交订单中...' })

    try {
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        remark: remark || undefined
      }

      const res = await orderApi.create(orderData)
      Taro.hideLoading()
      Taro.removeStorageSync('checkoutCart')

      Taro.showToast({ title: '下单成功', icon: 'success', duration: 1500 })

      setTimeout(() => {
        Taro.redirectTo({ url: `/pages/orderDetail/index?orderId=${res.data.id}` })
      }, 1500)
    } catch (error: any) {
      Taro.hideLoading()
      if (error.message?.includes('请先登录') || error.message?.includes('401')) {
        Taro.removeStorageSync('token')
        Taro.removeStorageSync('userInfo')
        Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        setTimeout(() => {
          Taro.navigateTo({ url: '/pages/login/index' })
        }, 1500)
      } else {
        Taro.showToast({ title: '下单失败，请重试', icon: 'none' })
      }
    }
  }

  const goBack = () => Taro.navigateBack()

  const handleAddressClick = () => {
    if (addresses.length === 0) {
      // 没有地址，跳转到地址管理页添加
      Taro.navigateTo({ url: '/pages/address/index' })
    } else {
      setShowAddressPicker(true)
    }
  }

  const selectAddress = (addr: Address) => {
    setSelectedAddress(addr)
    setShowAddressPicker(false)
  }

  const goAddAddress = () => {
    setShowAddressPicker(false)
    Taro.navigateTo({ url: '/pages/address/index' })
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
                  <Text className='store-name'>森林酸奶·玉溪店</Text>
                  <Text className='store-arrow'>›</Text>
                </View>
              </View>
            ) : (
              <View className='type-detail' onClick={handleAddressClick}>
                <Text className='detail-label'>配送地址</Text>
                <View className='detail-value'>
                  {selectedAddress ? (
                    <View className='address-info'>
                      <View className='address-top'>
                        <Text className='address-name'>{selectedAddress.name}</Text>
                        <Text className='address-phone'>{selectedAddress.phone}</Text>
                      </View>
                      <Text className='address-detail'>{selectedAddress.address}</Text>
                    </View>
                  ) : (
                    <Text className='address-text placeholder'>请选择配送地址</Text>
                  )}
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
                <Image className='goods-image' src={getImageUrl(item.product.image)} mode='aspectFill' />
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

      {/* 地址选择弹窗 */}
      {showAddressPicker && (
        <View className='address-picker'>
          <View className='picker-mask' onClick={() => setShowAddressPicker(false)}></View>
          <View className='picker-content'>
            <View className='picker-header'>
              <Text className='picker-title'>选择配送地址</Text>
              <Text className='picker-close' onClick={() => setShowAddressPicker(false)}>×</Text>
            </View>
            <ScrollView className='picker-list' scrollY>
              {addresses.map(addr => (
                <View
                  key={addr.id}
                  className={`picker-item ${selectedAddress?.id === addr.id ? 'selected' : ''}`}
                  onClick={() => selectAddress(addr)}
                >
                  <View className='picker-item-info'>
                    <View className='picker-item-top'>
                      <Text className='picker-item-name'>{addr.name}</Text>
                      <Text className='picker-item-phone'>{addr.phone}</Text>
                      {addr.is_default === 1 && <Text className='default-tag'>默认</Text>}
                    </View>
                    <Text className='picker-item-address'>{addr.address}</Text>
                  </View>
                  {selectedAddress?.id === addr.id && <Text className='check-icon'>✓</Text>}
                </View>
              ))}
            </ScrollView>
            <View className='picker-footer'>
              <View className='add-address-btn' onClick={goAddAddress}>
                <Text className='add-icon'>+</Text>
                <Text className='add-text'>新增地址</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
