import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { productApi, getImageUrl } from '../../services'
import './index.scss'

interface Product {
  id: number
  category_id: number
  name: string
  description: string
  price: number
  image: string
  stock: number
  category_name: string
}

interface CartItem {
  cartId: string
  product: Product
  quantity: number
  totalPrice: number
}

export default function ProductDetail() {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const productId = router.params.id
    if (productId) {
      loadProduct(Number(productId))
    }
  }, [])

  const loadProduct = async (id: number) => {
    try {
      setLoading(true)
      const res = await productApi.getById(id)
      setProduct(res.data)
    } catch (error) {
      console.error('加载商品失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    if (!product) return 0
    return product.price * quantity
  }

  const addToCart = () => {
    if (!product) return

    const cartItem: CartItem = {
      cartId: `${product.id}-${Date.now()}`,
      product: product,
      quantity,
      totalPrice: calculateTotal()
    }

    // 获取现有购物车
    const existingCart = Taro.getStorageSync('orderCart') || []
    const newCart = [...existingCart, cartItem]
    Taro.setStorageSync('orderCart', newCart)

    Taro.showToast({ title: '已加入购物车', icon: 'success' })

    setTimeout(() => {
      Taro.navigateBack()
    }, 1000)
  }

  if (loading) {
    return (
      <View className='product-detail-page'>
        <View className='loading'>加载中...</View>
      </View>
    )
  }

  if (!product) {
    return (
      <View className='product-detail-page'>
        <View className='loading'>商品不存在</View>
      </View>
    )
  }

  return (
    <View className='product-detail-page'>
      {/* 商品图片 */}
      <View className='product-image-wrap'>
        <Image className='product-image' src={getImageUrl(product.image)} mode='aspectFill' />
      </View>

      {/* 商品信息 */}
      <View className='product-info'>
        <Text className='product-name'>{product.name}</Text>
        <Text className='product-desc'>{product.description}</Text>
        <View className='product-price'>
          <Text className='price-symbol'>¥</Text>
          <Text className='price-value'>{product.price}</Text>
        </View>
      </View>

      {/* 数量选择 */}
      <View className='quantity-section'>
        <Text className='section-title'>数量</Text>
        <View className='quantity-selector'>
          <View
            className={`qty-btn ${quantity <= 1 ? 'disabled' : ''}`}
            onClick={() => quantity > 1 && setQuantity(q => q - 1)}
          >
            <Text className='qty-icon'>−</Text>
          </View>
          <Text className='qty-num'>{quantity}</Text>
          <View className='qty-btn' onClick={() => setQuantity(q => q + 1)}>
            <Text className='qty-icon'>+</Text>
          </View>
        </View>
      </View>

      {/* 底部操作栏 */}
      <View className='bottom-bar'>
        <View className='total-info'>
          <Text className='total-label'>合计</Text>
          <View className='total-price'>
            <Text className='price-symbol'>¥</Text>
            <Text className='price-value'>{calculateTotal()}</Text>
          </View>
        </View>
        <View className='add-cart-btn' onClick={addToCart}>
          加入购物车
        </View>
      </View>
    </View>
  )
}
