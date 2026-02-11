import { useState, useEffect } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select,
  message, Popconfirm, Image, Upload, Radio, Card, Divider, Row, Col
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, MinusCircleOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { productApi, categoryApi } from '../../services/api'
import { Product, Category, PRODUCT_STATUS } from '../../types'
import type { SkuMode, Sku, ModifierGroup, ModifierOption } from '../../types'

// ---------- 生成唯一 ID ----------
let _counter = 0
function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${++_counter}`
}

// ---------- SKU 编辑子组件 ----------
function SkuEditor({ value = [], onChange }: { value?: Sku[]; onChange?: (v: Sku[]) => void }) {
  const update = (idx: number, field: keyof Sku, val: any) => {
    const next = [...value]
    next[idx] = { ...next[idx], [field]: val }
    onChange?.(next)
  }
  const add = () => onChange?.([...value, { id: uid('sku'), name: '', price: 0 }])
  const remove = (idx: number) => onChange?.(value.filter((_, i) => i !== idx))

  return (
    <div>
      {value.map((sku, idx) => (
        <Row key={sku.id} gutter={8} style={{ marginBottom: 8 }} align="middle">
          <Col span={8}>
            <Input placeholder="规格名称（如6寸）" value={sku.name} onChange={e => update(idx, 'name', e.target.value)} />
          </Col>
          <Col span={6}>
            <InputNumber placeholder="价格" min={0} precision={2} value={sku.price} onChange={v => update(idx, 'price', v ?? 0)} style={{ width: '100%' }} />
          </Col>
          <Col span={6}>
            <InputNumber placeholder="库存（可选）" min={0} value={sku.stock} onChange={v => update(idx, 'stock', v ?? undefined)} style={{ width: '100%' }} />
          </Col>
          <Col span={4}>
            <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(idx)} />
          </Col>
        </Row>
      ))}
      <Button type="dashed" onClick={add} block icon={<PlusOutlined />}>添加规格</Button>
    </div>
  )
}

// ---------- 属性选项编辑 ----------
function OptionEditor({ value = [], onChange }: { value?: ModifierOption[]; onChange?: (v: ModifierOption[]) => void }) {
  const update = (idx: number, field: keyof ModifierOption, val: any) => {
    const next = [...value]
    next[idx] = { ...next[idx], [field]: val }
    onChange?.(next)
  }
  const add = () => onChange?.([...value, { id: uid('opt'), name: '', price: 0 }])
  const remove = (idx: number) => onChange?.(value.filter((_, i) => i !== idx))

  return (
    <div>
      {value.map((opt, idx) => (
        <Row key={opt.id} gutter={8} style={{ marginBottom: 8 }} align="middle">
          <Col span={10}>
            <Input placeholder="选项名称" value={opt.name} onChange={e => update(idx, 'name', e.target.value)} />
          </Col>
          <Col span={10}>
            <InputNumber placeholder="加价（0=不加价）" min={0} precision={2} value={opt.price} onChange={v => update(idx, 'price', v ?? 0)} style={{ width: '100%' }} />
          </Col>
          <Col span={4}>
            <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(idx)} />
          </Col>
        </Row>
      ))}
      <Button type="dashed" onClick={add} block icon={<PlusOutlined />} size="small">添加选项</Button>
    </div>
  )
}

// ---------- 属性组编辑子组件 ----------
function ModifierGroupEditor({ value = [], onChange }: { value?: ModifierGroup[]; onChange?: (v: ModifierGroup[]) => void }) {
  const updateGroup = (idx: number, partial: Partial<ModifierGroup>) => {
    const next = [...value]
    next[idx] = { ...next[idx], ...partial }
    onChange?.(next)
  }
  const add = () => {
    onChange?.([...value, {
      id: uid('grp'),
      title: '',
      desc: '',
      ctrl_type: 'tags',
      rules: { min: 1, max: 1 },
      options: [],
    }])
  }
  const remove = (idx: number) => onChange?.(value.filter((_, i) => i !== idx))

  return (
    <div>
      {value.map((group, idx) => (
        <Card
          key={group.id}
          size="small"
          title={`属性组 ${idx + 1}`}
          style={{ marginBottom: 12 }}
          extra={<Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(idx)} />}
        >
          <Row gutter={12} style={{ marginBottom: 8 }}>
            <Col span={8}>
              <Input placeholder="标题（如选择水果）" value={group.title} onChange={e => updateGroup(idx, { title: e.target.value })} />
            </Col>
            <Col span={8}>
              <Input placeholder="描述（如请任选3款）" value={group.desc} onChange={e => updateGroup(idx, { desc: e.target.value })} />
            </Col>
            <Col span={8}>
              <Select value={group.ctrl_type} onChange={v => updateGroup(idx, { ctrl_type: v })} style={{ width: '100%' }}
                options={[
                  { label: '标签 (tags)', value: 'tags' },
                  { label: '列表 (list)', value: 'list' },
                  { label: '步进器 (stepper)', value: 'stepper' },
                ]}
              />
            </Col>
          </Row>
          <Row gutter={12} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <InputNumber addonBefore="最少选" min={0} value={group.rules.min}
                onChange={v => updateGroup(idx, { rules: { ...group.rules, min: v ?? 0 } })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={12}>
              <InputNumber addonBefore="最多选" min={1} value={group.rules.max}
                onChange={v => updateGroup(idx, { rules: { ...group.rules, max: v ?? 1 } })}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0' }} plain>选项列表</Divider>
          <OptionEditor value={group.options} onChange={opts => updateGroup(idx, { options: opts })} />
        </Card>
      ))}
      <Button type="dashed" onClick={add} block icon={<PlusOutlined />}>添加属性组</Button>
    </div>
  )
}

// ---------- 主页面 ----------
export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [skuMode, setSkuMode] = useState<SkuMode>('single')
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
      const data = {
        ...values,
        image: imageUrl,
        skus: values.skus || [],
        modifier_groups: values.modifier_groups || [],
      }

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
      setSkuMode('single')
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleEdit = (record: Product) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      skus: record.skus || [],
      modifier_groups: record.modifier_groups || [],
    })
    setSkuMode(record.sku_mode || 'single')
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
      if (!isImage) { message.error('只能上传图片文件'); return Upload.LIST_IGNORE }
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) { message.error('图片大小不能超过5MB'); return Upload.LIST_IGNORE }
      return true
    }
  }

  const skuModeLabel = (mode?: string) => {
    if (mode === 'multi') return <Tag color="blue">多规格</Tag>
    return <Tag>单规格</Tag>
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '图片', dataIndex: 'image', width: 80, render: (v: string) => v ? <Image src={v} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '-' },
    { title: '名称', dataIndex: 'name' },
    { title: '分类', dataIndex: 'category_name' },
    { title: '价格', dataIndex: 'price', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '模式', dataIndex: 'sku_mode', width: 90, render: skuModeLabel },
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

  const openCreate = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ sku_mode: 'single', skus: [], modifier_groups: [] })
    setSkuMode('single')
    setFileList([])
    setModalOpen(true)
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增商品</Button>
      </div>
      <Table columns={columns} dataSource={products} rowKey="id" loading={loading} />
      <Modal
        title={editingId ? '编辑商品' : '新增商品'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category_id" label="分类" rules={[{ required: true }]}>
            <Select options={categories.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="price" label="基础价格" rules={[{ required: true }]} extra={skuMode === 'multi' ? '多规格模式下此价格作为起步展示价' : undefined}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="stock" label="库存"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="图片">
            <Upload {...uploadProps}>
              {fileList.length < 1 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>上传图片</div></div>}
            </Upload>
          </Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select options={[{ label: '上架', value: 1 }, { label: '下架', value: 0 }]} />
          </Form.Item>

          <Divider />

          <Form.Item name="sku_mode" label="商品模式" initialValue="single">
            <Radio.Group onChange={e => setSkuMode(e.target.value)}>
              <Radio.Button value="single">单规格（定制模式）</Radio.Button>
              <Radio.Button value="multi">多规格</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {skuMode === 'multi' && (
            <Form.Item name="skus" label="规格列表（SKU）">
              <SkuEditor />
            </Form.Item>
          )}

          <Form.Item name="modifier_groups" label="属性组（定制选项）">
            <ModifierGroupEditor />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
