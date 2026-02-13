import { View, Text, Input, Textarea, Picker, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { productApi, categoryApi } from '../../../services'
import CloudImage from '../../../components/CloudImage'
import './index.scss'

// ---------- 类型定义 ----------

interface ModifierOption {
  id: string
  name: string
  price: number
  sold_out?: boolean
}

interface ModifierRules {
  min: number
  max: number
}

interface ModifierGroup {
  id: string
  title: string
  desc?: string
  ctrl_type: 'tags' | 'list' | 'stepper'
  rules: ModifierRules
  options: ModifierOption[]
}

interface Sku {
  id: string
  name: string
  price: number
  stock?: number
  sold_out?: boolean
}

type SkuMode = 'single' | 'multi'

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
  sku_mode?: SkuMode
  skus?: Sku[]
  modifier_groups?: ModifierGroup[]
}

interface Category {
  id: number
  name: string
}

interface FormState {
  name: string
  category_id: number
  price: string
  stock: string
  image: string
  description: string
  status: number
  sku_mode: SkuMode
  skus: Sku[]
  modifier_groups: ModifierGroup[]
}

// ---------- 工具函数 ----------
let _counter = 0
function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${++_counter}`
}

const emptyForm: FormState = {
  name: '', category_id: 0, price: '', stock: '', image: '', description: '', status: 1,
  sku_mode: 'single', skus: [], modifier_groups: [],
}

const CTRL_TYPES = ['tags', 'list', 'stepper'] as const
const CTRL_TYPE_LABELS = { tags: '标签', list: '列表', stepper: '步进器' }

// ---------- 主组件 ----------
export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>({ ...emptyForm })
  // 控制展开哪个属性组编辑面板
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([productApi.getList(), categoryApi.getList()])
      setProducts(prodRes.data || prodRes)
      setCategories(catRes.data || catRes)
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { fetchData() })

  const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || ''

  // ---------- CRUD ----------

  const handleAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setExpandedGroup(null)
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
      status: item.status,
      sku_mode: item.sku_mode || 'single',
      skus: item.skus || [],
      modifier_groups: item.modifier_groups || [],
    })
    setExpandedGroup(null)
    setModalVisible(true)
  }

  const handleDelete = (id: number) => {
    Taro.showModal({
      title: '确认删除', content: '确定要删除这个商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await productApi.delete(id)
            Taro.showToast({ title: '删除成功', icon: 'success' })
            fetchData()
          } catch { Taro.showToast({ title: '删除失败', icon: 'none' }) }
        }
      }
    })
  }

  const handleToggleStatus = async (item: Product) => {
    try {
      await productApi.update(item.id, { status: item.status === 1 ? 0 : 1 })
      Taro.showToast({ title: item.status === 1 ? '已下架' : '已上架', icon: 'success' })
      fetchData()
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.category_id || !form.price) {
      Taro.showToast({ title: '请填写必填项', icon: 'none' }); return
    }
    const data: any = {
      name: form.name,
      category_id: form.category_id,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      image: form.image,
      description: form.description,
      status: form.status,
      sku_mode: form.sku_mode,
      skus: form.sku_mode === 'multi' ? form.skus : [],
      modifier_groups: form.modifier_groups,
    }
    try {
      if (editingId) {
        await productApi.update(editingId, data)
        Taro.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await productApi.create(data)
        Taro.showToast({ title: '创建成功', icon: 'success' })
      }
      setModalVisible(false)
      fetchData()
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1 })
      const tempFilePath = res.tempFilePaths[0]
      Taro.showLoading({ title: '上传中...' })
      const cloudPath = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const uploadRes = await Taro.cloud.uploadFile({ cloudPath, filePath: tempFilePath })
      Taro.hideLoading()
      if (uploadRes.fileID) {
        setForm(f => ({ ...f, image: uploadRes.fileID }))
        Taro.showToast({ title: '上传成功', icon: 'success' })
      }
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  // ---------- SKU 操作 ----------
  const addSku = () => setForm(f => ({ ...f, skus: [...f.skus, { id: uid('sku'), name: '', price: 0 }] }))
  const removeSku = (idx: number) => setForm(f => ({ ...f, skus: f.skus.filter((_, i) => i !== idx) }))
  const updateSku = (idx: number, field: keyof Sku, val: any) => {
    setForm(f => {
      const skus = [...f.skus]
      skus[idx] = { ...skus[idx], [field]: val }
      return { ...f, skus }
    })
  }

  // ---------- 属性组操作 ----------
  const addGroup = () => {
    const id = uid('grp')
    setForm(f => ({
      ...f,
      modifier_groups: [...f.modifier_groups, {
        id, title: '', desc: '', ctrl_type: 'tags' as const,
        rules: { min: 1, max: 1 }, options: [],
      }]
    }))
    setExpandedGroup(id)
  }
  const removeGroup = (idx: number) => setForm(f => ({
    ...f, modifier_groups: f.modifier_groups.filter((_, i) => i !== idx)
  }))
  const updateGroup = (idx: number, partial: Partial<ModifierGroup>) => {
    setForm(f => {
      const groups = [...f.modifier_groups]
      groups[idx] = { ...groups[idx], ...partial }
      return { ...f, modifier_groups: groups }
    })
  }

  // ---------- 属性选项操作 ----------
  const addOption = (gIdx: number) => {
    setForm(f => {
      const groups = [...f.modifier_groups]
      groups[gIdx] = { ...groups[gIdx], options: [...groups[gIdx].options, { id: uid('opt'), name: '', price: 0 }] }
      return { ...f, modifier_groups: groups }
    })
  }
  const removeOption = (gIdx: number, oIdx: number) => {
    setForm(f => {
      const groups = [...f.modifier_groups]
      groups[gIdx] = { ...groups[gIdx], options: groups[gIdx].options.filter((_, i) => i !== oIdx) }
      return { ...f, modifier_groups: groups }
    })
  }
  const updateOption = (gIdx: number, oIdx: number, field: keyof ModifierOption, val: any) => {
    setForm(f => {
      const groups = [...f.modifier_groups]
      const options = [...groups[gIdx].options]
      options[oIdx] = { ...options[oIdx], [field]: val }
      groups[gIdx] = { ...groups[gIdx], options }
      return { ...f, modifier_groups: groups }
    })
  }

  // ---------- 渲染 ----------
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
              <CloudImage className='product-image' src={item.image || ''} mode='aspectFill' />
              <View className='product-info'>
                <View className='name'>
                  {item.name}
                  <Text className={`status-tag ${item.status === 1 ? 'on' : 'off'}`}>
                    {item.status === 1 ? '上架' : '下架'}
                  </Text>
                  {item.sku_mode === 'multi' && <Text className='status-tag mode-tag'>多规格</Text>}
                  {(item.modifier_groups?.length || 0) > 0 && <Text className='status-tag custom-tag'>可定制</Text>}
                </View>
                <View className='category'>{item.category_name || getCategoryName(item.category_id)}</View>
                <View>
                  <Text className='price'>¥{item.price.toFixed(2)}{item.sku_mode === 'multi' ? '起' : ''}</Text>
                  <Text className='stock'>库存: {item.stock || 0}</Text>
                </View>
              </View>
              <View className='actions'>
                <Text className='action-btn edit' onClick={() => handleEdit(item)}>编辑</Text>
                <Text className='action-btn toggle' onClick={() => handleToggleStatus(item)}>{item.status === 1 ? '下架' : '上架'}</Text>
                <Text className='action-btn delete' onClick={() => handleDelete(item.id)}>删除</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ========== 编辑弹窗 ========== */}
      {modalVisible && (
        <View className='modal-mask' onClick={() => setModalVisible(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='modal-header'>
              <Text className='modal-title'>{editingId ? '编辑商品' : '新增商品'}</Text>
              <Text className='close-btn' onClick={() => setModalVisible(false)}>×</Text>
            </View>
            <ScrollView className='modal-body' scrollY>
              {/* 基本信息 */}
              <View className='form-item'>
                <Text className='label'><Text className='required'>*</Text> 商品名称</Text>
                <Input className='input' value={form.name} onInput={e => setForm(f => ({ ...f, name: e.detail.value }))} placeholder='请输入商品名称' />
              </View>
              <View className='form-item'>
                <Text className='label'><Text className='required'>*</Text> 分类</Text>
                <Picker mode='selector' range={categories} rangeKey='name' onChange={e => setForm(f => ({ ...f, category_id: categories[e.detail.value].id }))}>
                  <View className='picker'>
                    <Text className={`picker-text ${!form.category_id ? 'placeholder' : ''}`}>
                      {form.category_id ? getCategoryName(form.category_id) : '请选择分类'}
                    </Text>
                    <Text className='arrow'>▼</Text>
                  </View>
                </Picker>
              </View>
              <View className='form-item'>
                <Text className='label'><Text className='required'>*</Text> 基础价格</Text>
                <Input className='input' type='digit' value={form.price} onInput={e => setForm(f => ({ ...f, price: e.detail.value }))} placeholder='请输入价格' />
                {form.sku_mode === 'multi' && <Text className='form-hint'>多规格模式下此价格作为起步展示价</Text>}
              </View>
              <View className='form-item'>
                <Text className='label'>库存</Text>
                <Input className='input' type='number' value={form.stock} onInput={e => setForm(f => ({ ...f, stock: e.detail.value }))} placeholder='请输入库存' />
              </View>
              <View className='form-item'>
                <Text className='label'>商品图片</Text>
                {form.image ? (
                  <CloudImage className='preview-image' src={form.image} mode='aspectFill' onClick={handleChooseImage} />
                ) : (
                  <View className='image-upload' onClick={handleChooseImage}>
                    <Text className='upload-icon'>+</Text>
                    <Text className='upload-text'>上传图片</Text>
                  </View>
                )}
              </View>
              <View className='form-item'>
                <Text className='label'>描述</Text>
                <Textarea className='textarea' value={form.description} onInput={e => setForm(f => ({ ...f, description: e.detail.value }))} placeholder='请输入商品描述' />
              </View>

              {/* ===== 商品模式 ===== */}
              <View className='section-divider'>
                <Text className='section-divider__text'>商品模式</Text>
              </View>
              <View className='form-item'>
                <View className='mode-switch'>
                  <View className={`mode-btn ${form.sku_mode === 'single' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, sku_mode: 'single' }))}>
                    <Text className='mode-btn__text'>单规格（定制）</Text>
                  </View>
                  <View className={`mode-btn ${form.sku_mode === 'multi' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, sku_mode: 'multi' }))}>
                    <Text className='mode-btn__text'>多规格</Text>
                  </View>
                </View>
              </View>

              {/* ===== 多规格 SKU 列表 ===== */}
              {form.sku_mode === 'multi' && (
                <>
                  <View className='section-divider'>
                    <Text className='section-divider__text'>规格列表（SKU）</Text>
                  </View>
                  {form.skus.map((sku, idx) => (
                    <View key={sku.id} className='inline-card'>
                      <View className='inline-card__row'>
                        <Input className='inline-card__input' placeholder='规格名（如6寸）' value={sku.name} onInput={e => updateSku(idx, 'name', e.detail.value)} />
                        <Input className='inline-card__input short' type='digit' placeholder='价格' value={String(sku.price || '')} onInput={e => updateSku(idx, 'price', parseFloat(e.detail.value) || 0)} />
                        <Text className='inline-card__del' onClick={() => removeSku(idx)}>✕</Text>
                      </View>
                    </View>
                  ))}
                  <View className='add-row' onClick={addSku}>
                    <Text className='add-row__text'>+ 添加规格</Text>
                  </View>
                </>
              )}

              {/* ===== 属性组 ===== */}
              <View className='section-divider'>
                <Text className='section-divider__text'>属性组（定制选项）</Text>
              </View>
              {form.modifier_groups.map((group, gIdx) => (
                <View key={group.id} className='group-card'>
                  <View className='group-card__header' onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}>
                    <Text className='group-card__title'>{group.title || `属性组 ${gIdx + 1}`}</Text>
                    <View className='group-card__actions'>
                      <Text className='group-card__count'>{group.options.length}个选项</Text>
                      <Text className='group-card__del' onClick={(e) => { e.stopPropagation(); removeGroup(gIdx) }}>删除</Text>
                      <Text className='group-card__arrow'>{expandedGroup === group.id ? '▲' : '▼'}</Text>
                    </View>
                  </View>

                  {expandedGroup === group.id && (
                    <View className='group-card__body'>
                      <View className='inline-card__row'>
                        <Input className='inline-card__input' placeholder='标题（如选择水果）' value={group.title} onInput={e => updateGroup(gIdx, { title: e.detail.value })} />
                      </View>
                      <View className='inline-card__row'>
                        <Input className='inline-card__input' placeholder='描述（如请任选3款）' value={group.desc || ''} onInput={e => updateGroup(gIdx, { desc: e.detail.value })} />
                      </View>
                      <View className='inline-card__row'>
                        <Picker mode='selector' range={CTRL_TYPES as unknown as string[]} onChange={e => updateGroup(gIdx, { ctrl_type: CTRL_TYPES[e.detail.value] })}>
                          <View className='picker compact'>
                            <Text className='picker-text'>控件: {CTRL_TYPE_LABELS[group.ctrl_type]}</Text>
                            <Text className='arrow'>▼</Text>
                          </View>
                        </Picker>
                      </View>
                      <View className='inline-card__row'>
                        <View className='rule-input'>
                          <Text className='rule-input__label'>最少选</Text>
                          <Input className='rule-input__field' type='number' value={String(group.rules.min)} onInput={e => updateGroup(gIdx, { rules: { ...group.rules, min: parseInt(e.detail.value) || 0 } })} />
                        </View>
                        <View className='rule-input'>
                          <Text className='rule-input__label'>最多选</Text>
                          <Input className='rule-input__field' type='number' value={String(group.rules.max)} onInput={e => updateGroup(gIdx, { rules: { ...group.rules, max: parseInt(e.detail.value) || 1 } })} />
                        </View>
                      </View>

                      {/* 选项列表 */}
                      <View className='options-header'>
                        <Text className='options-header__text'>选项列表</Text>
                      </View>
                      {group.options.map((opt, oIdx) => (
                        <View key={opt.id} className='inline-card__row option-row'>
                          <Input className='inline-card__input' placeholder='选项名' value={opt.name} onInput={e => updateOption(gIdx, oIdx, 'name', e.detail.value)} />
                          <Input className='inline-card__input short' type='digit' placeholder='加价' value={String(opt.price || '')} onInput={e => updateOption(gIdx, oIdx, 'price', parseFloat(e.detail.value) || 0)} />
                          <Text className='inline-card__del' onClick={() => removeOption(gIdx, oIdx)}>✕</Text>
                        </View>
                      ))}
                      <View className='add-row small' onClick={() => addOption(gIdx)}>
                        <Text className='add-row__text'>+ 添加选项</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
              <View className='add-row' onClick={addGroup}>
                <Text className='add-row__text'>+ 添加属性组</Text>
              </View>

              {/* 底部留白 */}
              <View style={{ height: '40px' }} />
            </ScrollView>
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
