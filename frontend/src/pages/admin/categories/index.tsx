import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { categoryApi } from '../../../services'
import './index.scss'

interface Category {
  id: number
  name: string
  sort_order: number
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', sort_order: '0' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await categoryApi.getList()
      setCategories(res.data || res)
    } catch {
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
    setForm({ name: '', sort_order: '0' })
    setModalVisible(true)
  }

  const handleEdit = (item: Category) => {
    setEditingId(item.id)
    setForm({ name: item.name, sort_order: String(item.sort_order || 0) })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除分类会影响关联的商品，确定删除吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await categoryApi.delete(id)
            Taro.showToast({ title: '删除成功', icon: 'success' })
            fetchData()
          } catch {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!form.name) {
      Taro.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }

    const data = {
      name: form.name,
      sort_order: parseInt(form.sort_order) || 0
    }

    try {
      if (editingId) {
        await categoryApi.update(editingId, data)
        Taro.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await categoryApi.create(data)
        Taro.showToast({ title: '创建成功', icon: 'success' })
      }
      setModalVisible(false)
      fetchData()
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  return (
    <View className='admin-categories'>
      <View className='header'>
        <Text className='title'>分类管理</Text>
        <Text className='add-btn' onClick={handleAdd}>+ 新增</Text>
      </View>

      {loading ? (
        <View className='empty'>加载中...</View>
      ) : categories.length === 0 ? (
        <View className='empty'>暂无分类</View>
      ) : (
        <View className='category-list'>
          {categories.map(item => (
            <View key={item.id} className='category-item'>
              <View className='category-info'>
                <View className='name'>{item.name}</View>
                <View className='sort'>排序: {item.sort_order || 0}</View>
              </View>
              <View className='actions'>
                <Text className='action-btn edit' onClick={() => handleEdit(item)}>编辑</Text>
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
              <Text className='modal-title'>{editingId ? '编辑分类' : '新增分类'}</Text>
              <Text className='close-btn' onClick={() => setModalVisible(false)}>×</Text>
            </View>
            <View className='modal-body'>
              <View className='form-item'>
                <Text className='label'><Text className='required'>*</Text> 分类名称</Text>
                <Input className='input' value={form.name} onInput={(e) => setForm({ ...form, name: e.detail.value })} placeholder='请输入分类名称' />
              </View>
              <View className='form-item'>
                <Text className='label'>排序</Text>
                <Input className='input' type='number' value={form.sort_order} onInput={(e) => setForm({ ...form, sort_order: e.detail.value })} placeholder='数字越小越靠前' />
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
