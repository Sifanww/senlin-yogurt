import { View, Text, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { orderApi } from '../../../services'
import './index.scss'

interface OrderItem {
  id: number
  product_name: string
  price: number
  quantity: number
  modifiers?: string
}

interface Order {
  id: number
  order_no: string
  total_amount: number
  status: number
  remark?: string
  created_at: string
  items?: OrderItem[]
  user_nickname?: string
  order_type?: 'pickup' | 'delivery'
  address_name?: string
  address_phone?: string
  address_detail?: string
}

const ORDER_STATUS: Record<number, { text: string; color: string }> = {
  0: { text: '待付款', color: 'pending' },
  1: { text: '制作中', color: 'processing' },
  2: { text: '待取餐', color: 'ready' },
  3: { text: '已完成', color: 'completed' },
  4: { text: '已取消', color: 'cancelled' }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [pickerVisible, setPickerVisible] = useState(false)
  const [remarkVisible, setRemarkVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [editRemark, setEditRemark] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      // 管理后台使用 getAdminList 获取所有订单
      const res = await orderApi.getAdminList(statusFilter !== undefined ? { status: statusFilter } : undefined)
      setOrders(res.data || res)
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    fetchData()
  })

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const handleViewDetail = async (order: Order) => {
    try {
      const res = await orderApi.getById(order.id)
      const detail = (res.data || res) as Order | null
      if (!detail) {
        Taro.showToast({ title: '订单不存在', icon: 'none' })
        return
      }
      setDetailOrder(detail)
      setDetailVisible(true)
    } catch {
      Taro.showToast({ title: '获取详情失败', icon: 'none' })
    }
  }

  const handleChangeStatus = (order: Order) => {
    setCurrentOrder(order)
    setPickerVisible(true)
  }

  const handleSelectStatus = async (status: number) => {
    if (!currentOrder) return
    try {
      await orderApi.updateStatus(currentOrder.id, status)
      Taro.showToast({ title: '状态更新成功', icon: 'success' })
      setPickerVisible(false)
      fetchData()
    } catch {
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  const handleEditRemark = (order: Order) => {
    setCurrentOrder(order)
    setEditRemark(order.remark || '')
    setRemarkVisible(true)
  }

  const handleSaveRemark = async () => {
    if (!currentOrder) return
    try {
      await orderApi.updateRemark(currentOrder.id, editRemark)
      Taro.showToast({ title: '备注更新成功', icon: 'success' })
      setRemarkVisible(false)
      fetchData()
    } catch {
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  const formatTime = (time: string) => {
    const d = new Date(time)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <View className='admin-orders'>
      <View className='header'>
        <Text className='title'>订单管理</Text>
      </View>

      <View className='filter-bar'>
        <Text className={`filter-item ${statusFilter === undefined ? 'active' : ''}`} onClick={() => setStatusFilter(undefined)}>全部</Text>
        {Object.entries(ORDER_STATUS).map(([key, val]) => (
          <Text key={key} className={`filter-item ${statusFilter === Number(key) ? 'active' : ''}`} onClick={() => setStatusFilter(Number(key))}>{val.text}</Text>
        ))}
      </View>

      {loading ? (
        <View className='empty'>加载中...</View>
      ) : orders.length === 0 ? (
        <View className='empty'>暂无订单</View>
      ) : (
        <View className='order-list'>
          {orders.map(order => (
            <View key={order.id} className='order-item'>
              <View className='order-header'>
                <Text className='order-no'>{order.order_no}</Text>
                <Text className={`status-tag ${ORDER_STATUS[order.status]?.color}`}>{ORDER_STATUS[order.status]?.text}</Text>
              </View>
              <View className='order-info'>
                <View className='info-row'>
                  <Text className='label'>下单人</Text>
                  <Text className='value'>{order.user_nickname || '未知用户'}</Text>
                </View>
                <View className='info-row'>
                  <Text className='label'>取餐方式</Text>
                  <Text className='value'>{order.order_type === 'delivery' ? '外卖配送' : '到店自提'}</Text>
                </View>
                {order.order_type === 'delivery' && order.address_detail && (
                  <View className='info-row'>
                    <Text className='label'>配送地址</Text>
                    <Text className='value'>{order.address_name} {order.address_phone} {order.address_detail}</Text>
                  </View>
                )}
                <View className='info-row'>
                  <Text className='label'>下单时间</Text>
                  <Text className='value'>{formatTime(order.created_at)}</Text>
                </View>
                <View className='info-row'>
                  <Text className='label'>订单金额</Text>
                  <Text className='value price'>¥{order.total_amount.toFixed(2)}</Text>
                </View>
                {order.remark && (
                  <View className='info-row'>
                    <Text className='label'>备注</Text>
                    <Text className='value'>{order.remark}</Text>
                  </View>
                )}
              </View>
              <View className='order-actions'>
                <Text className='action-btn detail' onClick={() => handleViewDetail(order)}>详情</Text>
                <Text className='action-btn remark' onClick={() => handleEditRemark(order)}>改备注</Text>
                <Text className='action-btn status' onClick={() => handleChangeStatus(order)}>改状态</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {pickerVisible && (
        <>
          <View className='mask' onClick={() => setPickerVisible(false)} />
          <View className='status-picker'>
            <View className='picker-header'>
              <Text className='picker-title'>选择状态</Text>
              <Text className='close-btn' onClick={() => setPickerVisible(false)}>×</Text>
            </View>
            <View className='picker-options'>
              {Object.entries(ORDER_STATUS).map(([key, val]) => (
                <View key={key} className={`option-item ${currentOrder?.status === Number(key) ? 'active' : ''}`} onClick={() => handleSelectStatus(Number(key))}>{val.text}</View>
              ))}
            </View>
          </View>
        </>
      )}

      {remarkVisible && (
        <>
          <View className='mask' onClick={() => setRemarkVisible(false)} />
          <View className='remark-editor'>
            <View className='picker-header'>
              <Text className='picker-title'>修改备注</Text>
              <Text className='close-btn' onClick={() => setRemarkVisible(false)}>×</Text>
            </View>
            <View className='remark-input-wrap'>
              <Input
                className='remark-input'
                value={editRemark}
                onInput={(e) => setEditRemark(e.detail.value)}
                placeholder='请输入备注信息'
                maxlength={100}
              />
            </View>
            <View className='remark-actions'>
              <Text className='cancel-btn' onClick={() => setRemarkVisible(false)}>取消</Text>
              <Text className='confirm-btn' onClick={handleSaveRemark}>保存</Text>
            </View>
          </View>
        </>
      )}

      {detailVisible && detailOrder && (
        <>
          <View className='mask' onClick={() => setDetailVisible(false)} />
          <View className='detail-modal'>
            <View className='picker-header'>
              <Text className='picker-title'>订单详情</Text>
              <Text className='close-btn' onClick={() => setDetailVisible(false)}>×</Text>
            </View>
            <View className='detail-body'>
              <View className='detail-row'>
                <Text className='detail-label'>订单号</Text>
                <Text className='detail-value'>{detailOrder.order_no}</Text>
              </View>
              <View className='detail-row'>
                <Text className='detail-label'>下单人</Text>
                <Text className='detail-value'>{(detailOrder as any).user_nickname || '未知用户'}</Text>
              </View>
              <View className='detail-row'>
                <Text className='detail-label'>取餐方式</Text>
                <Text className='detail-value'>{detailOrder.order_type === 'delivery' ? '外卖配送' : '到店自提'}</Text>
              </View>
              {detailOrder.order_type === 'delivery' && detailOrder.address_detail && (
                <View className='detail-row'>
                  <Text className='detail-label'>配送地址</Text>
                  <Text className='detail-value'>{detailOrder.address_name} {detailOrder.address_phone} {detailOrder.address_detail}</Text>
                </View>
              )}
              <View className='detail-row'>
                <Text className='detail-label'>金额</Text>
                <Text className='detail-value price'>¥{detailOrder.total_amount.toFixed(2)}</Text>
              </View>
              <View className='detail-row'>
                <Text className='detail-label'>状态</Text>
                <Text className={`detail-value status-tag ${ORDER_STATUS[detailOrder.status]?.color}`}>{ORDER_STATUS[detailOrder.status]?.text}</Text>
              </View>
              <View className='detail-row'>
                <Text className='detail-label'>备注</Text>
                <Text className='detail-value'>{detailOrder.remark || '无'}</Text>
              </View>
              <View className='detail-divider' />
              <Text className='detail-section-title'>商品明细</Text>
              {(detailOrder.items || []).map((item, idx) => (
                <View key={idx} className='detail-goods-item'>
                  <View className='goods-main'>
                    <Text className='goods-name'>{item.product_name}</Text>
                    <Text className='goods-subtotal'>¥{(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                  {item.modifiers && item.modifiers !== '默认配置' && (
                    <Text className='goods-modifiers'>{item.modifiers}</Text>
                  )}
                  <View className='goods-meta'>
                    <Text className='goods-price'>¥{item.price.toFixed(2)}</Text>
                    <Text className='goods-qty'>x{item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  )
}
