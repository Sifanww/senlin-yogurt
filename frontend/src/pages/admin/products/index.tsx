import { View, Text, Image, Input, Textarea, Picker } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { productApi, categoryApi, getImageUrl } from '../../../services'
import './index.scss'

interface Product {
  id: number
  name: string
  category_id: number
  category_name?: string
  price: number
  stock: number
  status: number
  image?: string
  description?: string
}

interface Category {
  id: number
  name: string
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '',
    category_id: 0,
    price: '',
    stock: '',
    image: '',
    description: '',
    status: 1
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        productApi.getList(),
        categoryApi.getList()
      ])
      setProducts(prodRes.data || prodRes)
      setCategories(catRes.data || catRes)
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    fetchData()
  })

  const handleAdd = () => {
    setEditingId(null)
    setForm({ name: '', category_id: 0, price: '', stock: '', image: '', description: '', status: 1 })
    setModalVisible(true)
  }

  const handleEdit = (item: Product) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      category_id: item.category_id,
      price: String(item.price),
      stock: String(item.stock || 0),
      image: item.image || '',
      description: item.description || '',
      status: item.status
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await productApi.delete(id)
            Taro.showToast({ title: '删除成功', icon: 'success' })
            fetchData()
          } catch {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleToggleStatus = async (item: Product) => {
    try {
      await productApi.update(item.id, { status: item.status === 1 ? 0 : 1 })
      Taro.showToast({ title: item.status === 1 ? '已下架' : '已上架', icon: 'success' })
      fetchData()
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.category_id || !form.price) {
      Taro.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }

    const data = {
      name: form.name,
      category_id: form.category_id,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      image: form.image,
      description: form.description,
      status: form.status
    }

    console.log('提交数据:', data) // 调试日志

    try {
      if (editingId) {
        await productApi.update(editingId, data)
        console.log('更新成功, id:', editingId) // 调试日志
        Taro.showToast({ title: '更新成功', icon: 'success' })
      } else {
        const res = await productApi.create(data)
        console.log('创建成功:', res) // 调试日志
        Taro.showToast({ title: '创建成功', icon: 'success' })
      }
      setModalVisible(false)
      fetchData()
    } catch (err) {
      console.error('操作失败:', err) // 调试日志
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1 })
      const tempFilePath = res.tempFilePaths[0]
      
      Taro.showLoading({ title: '上传中...' })
      
      // 使用云存储上传图片
      const cloudPath = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const uploadRes = await Taro.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      })
      
      Taro.hideLoading()
      
      if (uploadRes.fileID) {
        setForm({ ...form, image: uploadRes.fileID })
        Taro.showToast({ title: '上传成功', icon: 'success' })
      } else {
        Taro.showToast({ title: '上传失败', icon: 'none' })
      }
    } catch (err) {
      Taro.hideLoading()
      console.error('图片上传失败:', err)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  const getCategoryName = (id: number) => {
    return categories.find(c => c.id === id)?.name || ''
  }

  return (
    <View className='admin-products'>
      <View className='header'>
        <Text className='title'>商品管理</Text>
        <Text className='add-btn' onClick={handleAdd}>+ 新增</Text>
      </View>

      {loading ? (
        <View className='empty'>加载中...</View>
      ) : products.length === 0 ? (
        <View className='empty'>暂无商品</View>
      ) : (
        <View className='product-list'>
          {products.map(item => (
            <View key={item.id} className='product-item'>
              <Image className='product-image' src={getImageUrl(item.image || '')} mode='aspectFill' />
              <View className='product-info'>
                <View className='name'>
                  {item.name}
                  <Text className={`status-tag ${item.status === 1 ? 'on' : 'off'}`}>
                    {item.status === 1 ? '上架' : '下架'}
                  </Text>
                </View>
                <View className='category'>{item.category_name || getCategoryName(item.category_id)}</View>
                <View>
                  <Text className='price'>¥{item.price.toFixed(2)}</Text>
                  <Text className='stock'>库存: {item.stock || 0}</Text>
                </View>
              </View>
              <View className='actions'>
                <Text className='action-btn edit' onClick={() => handleEdit(item)}>编辑</Text>
                <Text className='action-btn toggle' onClick={() => handleToggleStatus(item)}>
                  {item.status === 1 ? '下架' : '上架'}
                </Text>
                <Text className='action-btn delete' onClick={() => handleDelete(item.id)}>删除</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {modalVisible && (
        <View className='modal-mask' onClick={() => setModalVisible(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='modal-header'>
              <Text className='modal-title'>{editingId ? '编辑商品' : '新增商品'}</Text>
              <Text className='close-btn' onClick={() => setModalVisible(false)}>×</Text>
            </View>
            <View className='modal-body'>
              <View className='form-item'>
                <Text className='label'><Text className='required'>*</Text> 商品名称</Text>
                <Input className='input' value={form.name} onInput={(e) => setForm({ ...form, name: e.detail.value })} placeholder='请输入商品名称' />
              </View>
              <View className='form-item'>
                <Text className='label'><Text className='required'>*</Text> 分类</Text>
                <Picker mode='selector' range={categories} rangeKey='name' onChange={(e) => setForm({ ...form, category_id: categories[e.detail.value].id })}>
                  <View className='picker'>
                    <Text className={`picker-text ${!form.category_id ? 'placeholder' : ''}`}>
                      {form.category_id ? getCategoryName(form.category_id) : '请选择分类'}
                    </Text>
                    <Text className='arrow'>▼</Text>
                  </View>
                </Picker>
              </View>
              <View className='form-item'>
                <Text className='label'><Text className='required'>*</Text> 价格</Text>
                <Input className='input' type='digit' value={form.price} onInput={(e) => setForm({ ...form, price: e.detail.value })} placeholder='请输入价格' />
              </View>
              <View className='form-item'>
                <Text className='label'>库存</Text>
                <Input className='input' type='number' value={form.stock} onInput={(e) => setForm({ ...form, stock: e.detail.value })} placeholder='请输入库存' />
              </View>
              <View className='form-item'>
                <Text className='label'>商品图片</Text>
                {form.image ? (
                  <Image className='preview-image' src={getImageUrl(form.image)} mode='aspectFill' onClick={handleChooseImage} />
                ) : (
                  <View className='image-upload' onClick={handleChooseImage}>
                    <Text className='upload-icon'>+</Text>
                    <Text className='upload-text'>上传图片</Text>
                  </View>
                )}
              </View>
              <View className='form-item'>
                <Text className='label'>描述</Text>
                <Textarea className='textarea' value={form.description} onInput={(e) => setForm({ ...form, description: e.detail.value })} placeholder='请输入商品描述' />
              </View>
            </View>
            <View className='modal-footer'>
              <View className='btn cancel' onClick={() => setModalVisible(false)}>取消</View>
              <View className='btn confirm' onClick={handleSubmit}>确定</View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
