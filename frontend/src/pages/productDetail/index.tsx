import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { productApi } from '../../services'
import CloudImage from '../../components/CloudImage'
import { useProductSelection } from '../../hooks/useProductSelection'
import SkuSelector from '../../components/SkuSelector'
import ModifierGroup from '../../components/ModifierGroup'
import ActionFooter from '../../components/ActionFooter'
import type { Product } from '../../types/product'
import './index.scss'

export default function ProductDetail() {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = router.params.id
    if (!id) {
      Taro.showToast({ title: '商品不存在', icon: 'none' })
      setTimeout(() => Taro.switchTab({ url: '/pages/order/index' }), 1500)
      return
    }
    loadProduct(Number(id))
  }, [])

  const loadProduct = async (id: number) => {
    try {
      setLoading(true)
      const res = await productApi.getById(id)
      const data = res.data
      if (!data) {
        Taro.showToast({ title: '商品不存在', icon: 'none' })
        setTimeout(() => Taro.switchTab({ url: '/pages/order/index' }), 1500)
        return
      }
      // 将后端数据映射为前端 Product 类型
      const mapped: Product = {
        id: String(data.id),
        name: data.name,
        description: data.description || '',
        image: data.image || '',
        sku_mode: data.sku_mode || 'single',
        base_price: data.base_price ?? data.price ?? 0,
        skus: data.skus || [],
        modifier_groups: data.modifier_groups || [],
      }
      setProduct(mapped)
    } catch (error) {
      console.error('加载商品失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
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

  return <ProductDetailContent product={product} />
}

/** 商品详情内容（product 确定非空后渲染，保证 hook 调用稳定） */
function ProductDetailContent({ product }: { product: Product }) {
  const {
    selectedSkuId,
    selectedModifiers,
    quantity,
    toggleSku,
    toggleModifier,
    setQuantity,
    priceBreakdown,
    isValid,
    groupValidation,
  } = useProductSelection(product)

  const handleAddToCart = () => {
    // 构建购物车项，price 使用实际选中 SKU 的单价（含属性加价）
    const cartItem = {
      cartId: `${product.id}_custom_${Date.now()}`,
      product: {
        id: Number(product.id),
        name: product.name,
        description: buildDescription(product, selectedSkuId, selectedModifiers),
        price: priceBreakdown.unit_total,
        image: product.image || '',
        sku_id: selectedSkuId || undefined,
      },
      quantity,
      totalPrice: priceBreakdown.total,
    }

    // 追加到购物车
    const savedCart = Taro.getStorageSync('orderCart') || []
    savedCart.push(cartItem)
    Taro.setStorageSync('orderCart', savedCart)

    Taro.showToast({ title: '已加入购物车', icon: 'success' })
    setTimeout(() => Taro.switchTab({ url: '/pages/order/index' }), 1000)
  }

  return (
    <View className='product-detail-page'>
      {/* 商品图片 */}
      {product.image && (
        <CloudImage className='product-hero-image' src={product.image} mode='aspectFill' />
      )}

      {/* 商品基本信息 */}
      <View className='product-info'>
        <Text className='product-name'>{product.name}</Text>
        <Text className='product-desc'>{product.description}</Text>
        <View className='product-price'>
          <Text className='price-symbol'>¥</Text>
          <Text className='price-value'>
            {product.sku_mode === 'multi' ? `${product.base_price}起` : product.base_price}
          </Text>
        </View>
      </View>

      {/* SKU 选择器（仅 multi 模式） */}
      {product.sku_mode === 'multi' && product.skus && (
        <SkuSelector
          skus={product.skus}
          selectedId={selectedSkuId}
          onSelect={toggleSku}
        />
      )}

      {/* 属性组 */}
      {(product.modifier_groups ?? []).map(group => (
        <ModifierGroup
          key={group.id}
          group={group}
          selectedIds={selectedModifiers[group.id] ?? []}
          valid={groupValidation[group.id]}
          onToggle={toggleModifier}
        />
      ))}

      {/* 数量选择 */}
      <View className='quantity-section'>
        <Text className='section-title'>数量</Text>
        <View className='quantity-selector'>
          <View
            className={`qty-btn ${quantity <= 1 ? 'disabled' : ''}`}
            onClick={() => quantity > 1 && setQuantity(quantity - 1)}
          >
            <Text className='qty-icon'>−</Text>
          </View>
          <Text className='qty-num'>{quantity}</Text>
          <View className='qty-btn' onClick={() => setQuantity(quantity + 1)}>
            <Text className='qty-icon'>+</Text>
          </View>
        </View>
      </View>

      {/* 底部操作栏 */}
      <ActionFooter
        price={priceBreakdown}
        isValid={isValid}
        onAddToCart={handleAddToCart}
      />
    </View>
  )
}

/** 根据用户选择生成描述文本 */
function buildDescription(
  product: Product,
  selectedSkuId: string | undefined,
  selectedModifiers: Record<string, string[]>
): string {
  const parts: string[] = []

  // SKU 名称
  if (product.sku_mode === 'multi' && selectedSkuId) {
    const sku = product.skus?.find(s => s.id === selectedSkuId)
    if (sku) parts.push(sku.name)
  }

  // 属性选项名称
  for (const group of product.modifier_groups ?? []) {
    const ids = selectedModifiers[group.id] ?? []
    const names = ids
      .map(id => group.options.find(o => o.id === id)?.name)
      .filter(Boolean)
    if (names.length > 0) parts.push(names.join('、'))
  }

  return parts.length > 0 ? parts.join(' / ') : '默认配置'
}
