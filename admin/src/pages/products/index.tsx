import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Image, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { productApi, categoryApi } from '../../services/api'
import { Product, Category, PRODUCT_STATUS } from '../../types'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([productApi.list(), categoryApi.list()])
      setProducts(prodRes.data.data)
      setCategories(catRes.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (values: any) => {
    try {
      const imageUrl = fileList[0]?.response?.data?.url || fileList[0]?.url || values.image
      const data = { ...values, image: imageUrl }
      
      if (editingId) {
        await productApi.update(editingId, data)
        message.success('更新成功')
      } else {
        await productApi.create(data)
        message.success('创建成功')
      }
      setModalOpen(false)
      form.resetFields()
      setFileList([])
      setEditingId(null)
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleEdit = (record: Product) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    if (record.image) {
      setFileList([{ uid: '-1', name: 'image', status: 'done', url: record.image }])
    } else {
      setFileList([])
    }
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await productApi.delete(id)
      message.success('删除成功')
      fetchData()
    } catch (err: any) {
      message.error(err.response?.data?.error || '删除失败')
    }
  }

  const handleToggleStatus = async (record: Product) => {
    await productApi.update(record.id, { status: record.status === 1 ? 0 : 1 })
    message.success(record.status === 1 ? '已下架' : '已上架')
    fetchData()
  }

  const uploadProps: UploadProps = {
    action: '/api/upload',
    listType: 'picture-card',
    fileList,
    maxCount: 1,
    accept: 'image/*',
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件')
        return Upload.LIST_IGNORE
      }
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error('图片大小不能超过5MB')
        return Upload.LIST_IGNORE
      }
      return true
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '图片', dataIndex: 'image', width: 80, render: (v: string) => v ? <Image src={v} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '-' },
    { title: '名称', dataIndex: 'name' },
    { title: '分类', dataIndex: 'category_name' },
    { title: '价格', dataIndex: 'price', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '库存', dataIndex: 'stock' },
    { title: '状态', dataIndex: 'status', render: (v: number) => <Tag color={PRODUCT_STATUS[v as keyof typeof PRODUCT_STATUS]?.color}>{PRODUCT_STATUS[v as keyof typeof PRODUCT_STATUS]?.text}</Tag> },
    {
      title: '操作', width: 200,
      render: (_: any, record: Product) => (
        <Space>
          <Button size="small" onClick={() => handleToggleStatus(record)}>{record.status === 1 ? '下架' : '上架'}</Button>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setFileList([]); setModalOpen(true) }}>新增商品</Button>
      </div>
      <Table columns={columns} dataSource={products} rowKey="id" loading={loading} />
      <Modal title={editingId ? '编辑商品' : '新增商品'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category_id" label="分类" rules={[{ required: true }]}>
            <Select options={categories.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="stock" label="库存"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="图片">
            <Upload {...uploadProps}>
              {fileList.length < 1 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>上传图片</div></div>}
            </Upload>
          </Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select options={[{ label: '上架', value: 1 }, { label: '下架', value: 0 }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
