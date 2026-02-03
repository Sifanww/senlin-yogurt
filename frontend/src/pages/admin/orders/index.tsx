import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { orderApi } from '../../../services'
import './index.scss'

interface OrderItem {
  id: number
  product_name: string
  price: number
  quantity: number
}

interface Order {
  id: number
  order_no: string
  total_amount: number
  status: number
  remark?: string
  created_at: string
  items?: OrderItem[]
}

const ORDER_STATUS: Record<number, { text: string; color: string }> = {
  0: { text: '待付款', color: 'pending' },
  1: { text: '待制作', color: 'processing' },
  2: { text: '制作中', color: 'processing' },
  3: { text: '已完成', color: 'completed' },
  4: { text: '已取消', color: 'cancelled' }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [pickerVisible, setPickerVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await orderApi.getList(statusFilter !== undefined ? { status: statusFilter } : undefined)
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
      Taro.showModal({
        title: '订单详情',
        content: `订单号: ${detail.order_no}\n金额: ¥${detail.total_amount.toFixed(2)}\n状态: ${ORDER_STATUS[detail.status]?.text}\n备注: ${detail.remark || '无'}\n\n商品:\n${(detail.items || []).map((i: OrderItem) => `${i.product_name} x${i.quantity} ¥${(i.price * i.quantity).toFixed(2)}`).join('\n')}`,
        showCancel: false
      })
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
    </View>
  )
}
