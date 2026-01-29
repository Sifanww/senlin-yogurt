import { View, Text, Input, Textarea, Button, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { addressApi } from '../../services/api'
import './index.scss'

interface Address {
  id: number
  user_id: number
  name: string
  phone: string
  address: string
  is_default: number
}

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showParse, setShowParse] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [parseText, setParseText] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', address: '', is_default: 0 })
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (userInfo?.id) {
      setUserId(userInfo.id)
      loadAddresses(userInfo.id)
    }
  }, [])

  const loadAddresses = async (uid: number) => {
    try {
      const res = await addressApi.getList(uid)
      setAddresses(res.data || [])
    } catch (e) {
      console.error('加载地址失败', e)
    }
  }

  // 智能解析地址
  const parseAddress = () => {
    if (!parseText.trim()) {
      Taro.showToast({ title: '请输入地址信息', icon: 'none' })
      return
    }

    const text = parseText.replace(/\s+/g, ' ').trim()
    
    // 提取手机号
    const phoneMatch = text.match(/1[3-9]\d{9}/)
    const phone = phoneMatch ? phoneMatch[0] : ''
    
    // 提取姓名（通常在手机号前面，2-4个汉字）
    let name = ''
    if (phoneMatch) {
      const beforePhone = text.substring(0, text.indexOf(phoneMatch[0]))
      const nameMatch = beforePhone.match(/[\u4e00-\u9fa5]{2,4}(?=[^\u4e00-\u9fa5]*$)/)
      if (nameMatch) {
        name = nameMatch[0]
      }
    }
    
    // 提取地址（去掉姓名和手机号后的部分）
    let address = text
    if (name) address = address.replace(name, '')
    if (phone) address = address.replace(phone, '')
    address = address.replace(/[,，\s]+/g, ' ').trim()
    
    // 如果没解析出姓名，尝试从开头提取
    if (!name) {
      const startNameMatch = text.match(/^[\u4e00-\u9fa5]{2,4}/)
      if (startNameMatch) {
        name = startNameMatch[0]
        address = address.replace(name, '').trim()
      }
    }

    setForm({ ...form, name, phone, address })
    setShowParse(false)
    setShowForm(true)
    setParseText('')
  }

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (!userId) return

    try {
      if (editingId) {
        await addressApi.update(editingId, { ...form, user_id: userId })
        Taro.showToast({ title: '修改成功', icon: 'success' })
      } else {
        await addressApi.create({ ...form, user_id: userId })
        Taro.showToast({ title: '添加成功', icon: 'success' })
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ name: '', phone: '', address: '', is_default: 0 })
      loadAddresses(userId)
    } catch (e) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleEdit = (addr: Address) => {
    setForm({ name: addr.name, phone: addr.phone, address: addr.address, is_default: addr.is_default })
    setEditingId(addr.id)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    Taro.showModal({
      title: '提示',
      content: '确定删除该地址吗？',
      success: async (res) => {
        if (res.confirm && userId) {
          await addressApi.delete(id)
          Taro.showToast({ title: '删除成功', icon: 'success' })
          loadAddresses(userId)
        }
      }
    })
  }

  const handleSetDefault = async (addr: Address) => {
    if (!userId || addr.is_default) return
    await addressApi.update(addr.id, { is_default: 1, user_id: userId })
    Taro.showToast({ title: '设置成功', icon: 'success' })
    loadAddresses(userId)
  }

  return (
    <View className='address-page'>
      {/* 地址列表 */}
      <ScrollView className='address-list' scrollY>
        {addresses.length === 0 ? (
          <View className='empty'>
            <Text className='empty-text'>暂无收货地址</Text>
          </View>
        ) : (
          addresses.map(addr => (
            <View key={addr.id} className='address-item'>
              <View className='addr-main' onClick={() => handleSetDefault(addr)}>
                <View className='addr-info'>
                  <View className='addr-header'>
                    <Text className='addr-name'>{addr.name}</Text>
                    <Text className='addr-phone'>{addr.phone}</Text>
                    {addr.is_default === 1 && <Text className='default-tag'>默认</Text>}
                  </View>
                  <Text className='addr-detail'>{addr.address}</Text>
                </View>
              </View>
              <View className='addr-actions'>
                <Text className='action-btn' onClick={() => handleEdit(addr)}>编辑</Text>
                <Text className='action-btn delete' onClick={() => handleDelete(addr.id)}>删除</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 底部按钮 */}
      <View className='bottom-bar'>
        <Button className='add-btn parse' onClick={() => setShowParse(true)}>智能识别</Button>
        <Button className='add-btn' onClick={() => { setEditingId(null); setForm({ name: '', phone: '', address: '', is_default: 0 }); setShowForm(true) }}>新增地址</Button>
      </View>

      {/* 智能识别弹窗 */}
      {showParse && (
        <View className='modal'>
          <View className='modal-mask' onClick={() => setShowParse(false)}></View>
          <View className='modal-content'>
            <View className='modal-header'>
              <Text className='modal-title'>智能识别地址</Text>
              <Text className='modal-close' onClick={() => setShowParse(false)}>×</Text>
            </View>
            <View className='modal-body'>
              <Text className='parse-tip'>粘贴包含姓名、电话、地址的文本，系统将自动识别</Text>
              <Textarea
                className='parse-input'
                placeholder='例如：张三 13800138000 北京市朝阳区xxx街道xxx号'
                value={parseText}
                onInput={(e) => setParseText(e.detail.value)}
                maxlength={200}
              />
            </View>
            <View className='modal-footer'>
              <Button className='modal-btn' onClick={parseAddress}>识别</Button>
            </View>
          </View>
        </View>
      )}

      {/* 编辑/新增表单弹窗 */}
      {showForm && (
        <View className='modal'>
          <View className='modal-mask' onClick={() => setShowForm(false)}></View>
          <View className='modal-content'>
            <View className='modal-header'>
              <Text className='modal-title'>{editingId ? '编辑地址' : '新增地址'}</Text>
              <Text className='modal-close' onClick={() => setShowForm(false)}>×</Text>
            </View>
            <View className='modal-body'>
              <View className='form-item'>
                <Text className='form-label'>姓名</Text>
                <Input className='form-input' placeholder='收货人姓名' value={form.name} onInput={(e) => setForm({ ...form, name: e.detail.value })} />
              </View>
              <View className='form-item'>
                <Text className='form-label'>电话</Text>
                <Input className='form-input' placeholder='手机号码' type='number' maxlength={11} value={form.phone} onInput={(e) => setForm({ ...form, phone: e.detail.value })} />
              </View>
              <View className='form-item'>
                <Text className='form-label'>地址</Text>
                <Textarea className='form-textarea' placeholder='详细地址' value={form.address} onInput={(e) => setForm({ ...form, address: e.detail.value })} />
              </View>
              <View className='form-item row'>
                <Text className='form-label'>设为默认</Text>
                <View className={`switch ${form.is_default ? 'on' : ''}`} onClick={() => setForm({ ...form, is_default: form.is_default ? 0 : 1 })}>
                  <View className='switch-handle'></View>
                </View>
              </View>
            </View>
            <View className='modal-footer'>
              <Button className='modal-btn' onClick={handleSubmit}>保存</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
