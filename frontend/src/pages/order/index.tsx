import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect, useRef, useCallback } from 'react'
import Taro, { useDidShow, useReady } from '@tarojs/taro'
import { categoryApi, productApi } from '../../services'
import { getImageUrl } from '../../services'
import './index.scss'

interface Category {
  id: number
  name: string
  sort_order: number
}

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

export default function Order() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scrollTop, setScrollTop] = useState(0)
  const isClickScroll = useRef(false)
  const sectionTops = useRef<{ id: number; top: number }[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [catRes, prodRes] = await Promise.all([
        categoryApi.getList(),
        productApi.getList({ status: 1 })
      ])
      setCategories(catRes.data || [])
      setProducts(prodRes.data || [])
      if (catRes.data?.length > 0) {
        setActiveCategory(catRes.data[0].id)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 计算各分类区块位置
  const calcSectionTops = useCallback(() => {
    if (categories.length === 0) return
    
    const query = Taro.createSelectorQuery()
    categories.forEach(cat => {
      query.select(`#cat-${cat.id}`).boundingClientRect()
    })
    query.select('.product-list').boundingClientRect()
    query.exec((res) => {
      if (!res) return
      const containerRect = res[res.length - 1]
      const containerTop = containerRect?.top || 0
      const tops: { id: number; top: number }[] = []
      
      categories.forEach((cat, idx) => {
        const rect = res[idx]
        if (rect) {
          tops.push({ id: cat.id, top: rect.top - containerTop })
        }
      })
      sectionTops.current = tops
    })
  }, [categories])

  useReady(() => {
    setTimeout(calcSectionTops, 300)
  })

  useEffect(() => {
    if (!loading && categories.length > 0) {
      setTimeout(calcSectionTops, 300)
    }
  }, [loading, categories, calcSectionTops])

  useDidShow(() => {
    const type = Taro.getStorageSync('orderType') as 'pickup' | 'delivery'
    if (type) setOrderType(type)
    
    // 检查订单是否已提交成功，如果是则清空购物车
    const orderSubmitted = Taro.getStorageSync('orderSubmitted')
    if (orderSubmitted) {
      setCart([])
      setShowCart(false)
      Taro.removeStorageSync('orderSubmitted')
      Taro.removeStorageSync('orderCart')
    } else {
      // 从 Storage 加载购物车（从详情页返回时）
      const savedCart = Taro.getStorageSync('orderCart') || []
      setCart(savedCart)
    }
  })

  // 按分类分组商品
  const getGroupedProducts = () => {
    return categories.map(cat => ({
      category: cat,
      products: products.filter(p => p.category_id === cat.id)
    })).filter(g => g.products.length > 0)
  }

  // 点击分类滚动到对应位置
  const handleCategoryClick = (catId: number) => {
    const target = sectionTops.current.find(s => s.id === catId)
    if (!target) return
    
    isClickScroll.current = true
    setActiveCategory(catId)
    setScrollTop(target.top)
    setTimeout(() => {
      isClickScroll.current = false
    }, 600)
  }

  // 监听滚动，更新左侧分类高亮
  const handleScroll = (e: any) => {
    if (isClickScroll.current) return
    const scrollTop = e.detail.scrollTop
    const tops = sectionTops.current
    if (tops.length === 0) return

    for (let i = tops.length - 1; i >= 0; i--) {
      if (scrollTop >= tops[i].top - 20) {
        if (activeCategory !== tops[i].id) {
          setActiveCategory(tops[i].id)
        }
        break
      }
    }
  }

  // 跳转到商品详情页
  const goProductDetail = (product: Product) => {
    Taro.navigateTo({ url: `/pages/productDetail/index?id=${product.id}` })
  }

  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)
  const getCartTotal = () => cart.reduce((sum, item) => sum + item.totalPrice, 0)

  const updateCartItemQuantity = (cartId: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta
          if (newQty <= 0) return item
          const unitPrice = item.totalPrice / item.quantity
          return { ...item, quantity: newQty, totalPrice: unitPrice * newQty }
        }
        return item
      })
      Taro.setStorageSync('orderCart', newCart)
      return newCart
    })
  }

  const removeCartItem = (cartId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.cartId !== cartId)
      Taro.setStorageSync('orderCart', newCart)
      return newCart
    })
  }

  const clearCart = () => {
    setCart([])
    setShowCart(false)
    Taro.removeStorageSync('orderCart')
  }

  const goCheckout = () => {
    if (cart.length === 0) return
    Taro.setStorageSync('checkoutCart', JSON.stringify(cart))
    Taro.navigateTo({ url: `/pages/checkout/index?orderType=${orderType}` })
  }

  if (loading) {
    return (
      <View className='order-page'>
        <View className='loading'>加载中...</View>
      </View>
    )
  }

  const groupedProducts = getGroupedProducts()

  return (
    <View className='order-page'>
      {/* 顶部订单类型切换 */}
      <View className='order-type-bar'>
        <View className='order-type-switch'>
          <View
            className={`type-btn ${orderType === 'pickup' ? 'active' : ''}`}
            onClick={() => setOrderType('pickup')}
          >
            自提
          </View>
          <View
            className={`type-btn ${orderType === 'delivery' ? 'active' : ''}`}
            onClick={() => setOrderType('delivery')}
          >
            外卖
          </View>
        </View>
      </View>

      {/* 主体内容区 */}
      <View className='main-content'>
        {/* 左侧分类导航 */}
        <ScrollView 
          className='category-nav' 
          scrollY
          scrollIntoView={`nav-${activeCategory}`}
          scrollWithAnimation
        >
          {categories.map((cat) => (
            <View
              key={cat.id}
              id={`nav-${cat.id}`}
              className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <Text className='category-name'>{cat.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 右侧商品列表 - 所有分类 */}
        <ScrollView 
          className='product-list' 
          scrollY
          scrollTop={scrollTop}
          scrollWithAnimation
          onScroll={handleScroll}
        >
          {groupedProducts.map(({ category, products: catProducts }) => (
            <View 
              key={category.id} 
              id={`cat-${category.id}`}
              className='category-section'
            >
              <View className='section-header'>
                <Text className='section-title'>{category.name}</Text>
                <Text className='section-count'>{catProducts.length}款</Text>
              </View>

              {catProducts.map((product) => (
                <View key={product.id} className='product-item'>
                  <Image className='product-image' src={getImageUrl(product.image)} mode='aspectFill' />
                  <View className='product-info'>
                    <Text className='product-name'>{product.name}</Text>
                    <Text className='product-desc'>{product.description}</Text>
                    <View className='product-bottom'>
                      <Text className='product-price'>
                        <Text className='price-symbol'>¥</Text>
                        {product.price}
                      </Text>
                      <View className='select-btn' onClick={() => goProductDetail(product)}>
                        选规格
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {/* 底部占位，让最后一个分类能滚动到顶部 */}
          <View className='bottom-placeholder'></View>
        </ScrollView>
      </View>

      {/* 底部购物车栏 */}
      {cart.length > 0 && (
        <View className='cart-bar'>
          <View className='cart-info' onClick={() => setShowCart(true)}>
            <View className='cart-icon-wrap'>
              <Text className='cart-icon'>🛒</Text>
              <Text className='cart-badge'>{getCartCount()}</Text>
            </View>
            <View className='cart-price'>
              <Text className='price-label'>合计</Text>
              <Text className='price-amount'>
                <Text className='price-symbol'>¥</Text>
                {getCartTotal()}
              </Text>
            </View>
          </View>
          <View className='checkout-btn' onClick={goCheckout}>去结算</View>
        </View>
      )}

      {/* 购物车详情弹窗 */}
      {showCart && (
        <View className='cart-modal'>
          <View className='cart-mask' onClick={() => setShowCart(false)}></View>
          <View className='cart-content'>
            <View className='cart-header'>
              <Text className='cart-title'>已选商品</Text>
              <View className='clear-btn' onClick={clearCart}>
                <Text className='clear-icon'>🗑</Text>
                <Text className='clear-text'>清空</Text>
              </View>
            </View>
            <ScrollView className='cart-list' scrollY>
              {cart.map(item => (
                <View key={item.cartId} className='cart-item'>
                  <Image className='cart-item-image' src={getImageUrl(item.product.image)} mode='aspectFill' />
                  <View className='cart-item-info'>
                    <Text className='cart-item-name'>{item.product.name}</Text>
                    <View className='cart-item-bottom'>
                      <Text className='cart-item-price'>
                        <Text className='price-symbol'>¥</Text>
                        {item.totalPrice}
                      </Text>
                      <View className='cart-item-qty'>
                        <View
                          className='qty-btn'
                          onClick={() => {
                            if (item.quantity <= 1) removeCartItem(item.cartId)
                            else updateCartItemQuantity(item.cartId, -1)
                          }}
                        >
                          {item.quantity <= 1 ? '🗑' : '−'}
                        </View>
                        <Text className='qty-num'>{item.quantity}</Text>
                        <View className='qty-btn' onClick={() => updateCartItemQuantity(item.cartId, 1)}>+</View>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}
