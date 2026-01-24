import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { categoryApi } from '../../services/api'
import { Category } from '../../types'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await categoryApi.list()
      setCategories(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await categoryApi.update(editingId, values)
        message.success('更新成功')
      } else {
        await categoryApi.create(values)
        message.success('创建成功')
      }
      setModalOpen(false)
      form.resetFields()
      setEditingId(null)
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleEdit = (record: Category) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await categoryApi.delete(id)
      message.success('删除成功')
      fetchData()
    } catch {
      message.error('删除失败，可能存在关联商品')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '名称', dataIndex: 'name' },
    { title: '排序', dataIndex: 'sort_order', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', width: 180 },
    {
      title: '操作', width: 150,
      render: (_: any, record: Category) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true) }}>新增分类</Button>
      </div>
      <Table columns={columns} dataSource={categories} rowKey="id" loading={loading} />
      <Modal title={editingId ? '编辑分类' : '新增分类'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </>
  )
}
