import { useState, useMemo, useCallback } from 'react'
import type {
  Product,
  ModifierGroup,
  PriceBreakdown,
} from '../types/product'

/**
 * 属性组选中状态：groupId -> 已选 optionId 列表
 */
type ModifierMap = Record<string, string[]>

export interface UseProductSelectionReturn {
  /** 当前选中的 SKU ID（multi 模式） */
  selectedSkuId: string | undefined
  /** 各属性组的选中状态 */
  selectedModifiers: ModifierMap
  /** 购买数量 */
  quantity: number
  /** 切换 SKU */
  toggleSku: (skuId: string) => void
  /** 切换属性选项，返回 false 表示操作被阻断（如售罄） */
  toggleModifier: (groupId: string, optionId: string) => boolean
  /** 设置购买数量 */
  setQuantity: (n: number) => void
  /** 价格明细 */
  priceBreakdown: PriceBreakdown
  /** 所有属性组是否都满足 min 要求 */
  isValid: boolean
  /** 各属性组的校验状态：groupId -> 是否满足 min */
  groupValidation: Record<string, boolean>
}

/**
 * 商品选规 Hook
 *
 * 处理 SKU 切换、属性组选择、价格计算、有效性校验。
 * 纯逻辑，不涉及任何 UI。
 */
export function useProductSelection(product: Product): UseProductSelectionReturn {
  const groups = product.modifier_groups ?? []

  // ---------- 初始化 ----------

  const defaultSkuId = product.sku_mode === 'multi'
    ? product.skus?.find(s => !s.sold_out)?.id
    : undefined

  const [selectedSkuId, setSelectedSkuId] = useState<string | undefined>(defaultSkuId)
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierMap>(() => {
    // 初始化每个属性组为空选择
    const init: ModifierMap = {}
    for (const g of groups) {
      init[g.id] = []
    }
    return init
  })
  const [quantity, setQuantity] = useState(1)

  // ---------- 交互：切换 SKU ----------

  const toggleSku = useCallback((skuId: string) => {
    const sku = product.skus?.find(s => s.id === skuId)
    if (!sku || sku.sold_out) return
    setSelectedSkuId(prev => prev === skuId ? prev : skuId)
  }, [product.skus])

  // ---------- 交互：切换属性选项 ----------

  const toggleModifier = useCallback((groupId: string, optionId: string): boolean => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return false

    // 售罄检查
    const option = group.options.find(o => o.id === optionId)
    if (!option || option.sold_out) return false

    const { min, max } = group.rules

    setSelectedModifiers(prev => {
      const current = prev[groupId] ?? []
      const isSelected = current.includes(optionId)

      let next: string[]

      if (isSelected) {
        // 取消选择
        next = current.filter(id => id !== optionId)
      } else if (max === 1) {
        // 单选：直接替换
        next = [optionId]
      } else if (current.length < max) {
        // 多选未满：追加
        next = [...current, optionId]
      } else {
        // 多选已满：替换最早选的（FIFO）
        next = [...current.slice(1), optionId]
      }

      return { ...prev, [groupId]: next }
    })

    return true
  }, [groups])

  // ---------- 价格计算 ----------

  const priceBreakdown = useMemo<PriceBreakdown>(() => {
    // 基础价格
    let base = product.base_price
    if (product.sku_mode === 'multi' && selectedSkuId) {
      const sku = product.skus?.find(s => s.id === selectedSkuId)
      if (sku) base = sku.price
    }

    // 属性加价
    let modifiersTotal = 0
    for (const group of groups) {
      const selected = selectedModifiers[group.id] ?? []
      for (const optId of selected) {
        const opt = group.options.find(o => o.id === optId)
        if (opt) modifiersTotal += opt.price
      }
    }

    const unitTotal = base + modifiersTotal
    return {
      base,
      modifiers_total: modifiersTotal,
      unit_total: unitTotal,
      total: unitTotal * quantity,
    }
  }, [product, selectedSkuId, selectedModifiers, quantity, groups])

  // ---------- 有效性校验 ----------

  const groupValidation = useMemo<Record<string, boolean>>(() => {
    const result: Record<string, boolean> = {}
    for (const group of groups) {
      const count = (selectedModifiers[group.id] ?? []).length
      result[group.id] = count >= group.rules.min
    }
    return result
  }, [groups, selectedModifiers])

  const isValid = useMemo(() => {
    // multi 模式必须选中一个 SKU
    if (product.sku_mode === 'multi' && !selectedSkuId) return false
    // 所有属性组都满足 min
    return Object.values(groupValidation).every(Boolean)
  }, [product.sku_mode, selectedSkuId, groupValidation])

  return {
    selectedSkuId,
    selectedModifiers,
    quantity,
    toggleSku,
    toggleModifier,
    setQuantity,
    priceBreakdown,
    isValid,
    groupValidation,
  }
}
