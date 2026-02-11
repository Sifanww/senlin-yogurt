import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Select, message, Descriptions } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi } from '../../services/api'
import { Order, ORDER_STATUS } from '../../types'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<number | undefined>()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await orderApi.list(statusFilter !== undefined ? { status: statusFilter } : undefined)
      setOrders(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [statusFilter])

  const handleViewDetail = async (id: number) => {
    const res = await orderApi.get(id)
    setCurrentOrder(res.data.data)
    setDetailOpen(true)
  }

  const handleUpdateStatus = async (id: number, status: number) => {
    await orderApi.updateStatus(id, status)
    message.success('状态更新成功')
    fetchData()
    if (currentOrder?.id === id) {
      setCurrentOrder({ ...currentOrder, status })
    }
  }

  const columns = [
    { title: '订单号', dataIndex: 'order_no', width: 180 },
    { title: '下单人', dataIndex: 'user_nickname', width: 100, render: (v: string) => v || '未知用户' },
    { title: '金额', dataIndex: 'total_amount', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', render: (v: number) => <Tag color={ORDER_STATUS[v as keyof typeof ORDER_STATUS]?.color}>{ORDER_STATUS[v as keyof typeof ORDER_STATUS]?.text}</Tag> },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    { title: '下单时间', dataIndex: 'created_at', width: 180, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '操作', width: 200,
      render: (_: any, record: Order) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          <Select
            size="small"
            value={record.status}
            style={{ width: 90 }}
            onChange={(v) => handleUpdateStatus(record.id, v)}
            options={Object.entries(ORDER_STATUS).map(([k, v]) => ({ label: v.text, value: Number(k) }))}
          />
        </Space>
      )
    }
  ]

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>状态筛选：</span>
          <Select
            allowClear
            placeholder="全部"
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(ORDER_STATUS).map(([k, v]) => ({ label: v.text, value: Number(k) }))}
          />
        </Space>
      </div>
      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} />
      <Modal title="订单详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {currentOrder && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="下单人">{currentOrder.user_nickname || '未知用户'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={ORDER_STATUS[currentOrder.status as keyof typeof ORDER_STATUS]?.color}>
                  {ORDER_STATUS[currentOrder.status as keyof typeof ORDER_STATUS]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总金额">¥{currentOrder.total_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="取餐码">{currentOrder.pickup_number ? currentOrder.pickup_number.slice(-3) : '-'}</Descriptions.Item>
              <Descriptions.Item label="下单时间">{dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{currentOrder.remark || '-'}</Descriptions.Item>
            </Descriptions>
            <h4 style={{ margin: '16px 0 8px' }}>商品明细</h4>
            <Table
              size="small"
              pagination={false}
              dataSource={currentOrder.items}
              rowKey="id"
              columns={[
                { title: '商品', dataIndex: 'product_name' },
                { title: '单价', dataIndex: 'price', render: (v: number) => `¥${v.toFixed(2)}` },
                { title: '数量', dataIndex: 'quantity' },
                { title: '小计', render: (_, r) => `¥${(r.price * r.quantity).toFixed(2)}` }
              ]}
            />
          </>
        )}
      </Modal>
    </>
  )
}
