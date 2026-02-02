import Taro from '@tarojs/taro'
import { getDb, queryCollection, getById, updateRecord } from './cloud'

// ============ 分类相关 ============
export const categoryApi = {
  getList: async () => {
    const data = await queryCollection('categories', {
      orderBy: { field: 'sort_order', order: 'asc' }
    })
    return { data }
  },

  getById: async (id: number) => {
    const data = await getById('categories', id)
    return { data }
  }
}

// ============ 商品相关 ============
export const productApi = {
  getList: async (params?: { category_id?: number; status?: number }) => {
    const where: Record<string, any> = {}
    if (params?.category_id) where.category_id = params.category_id
    if (params?.status !== undefined) where.status = params.status

    const data = await queryCollection('products', {
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { field: 'id', order: 'desc' }
    })
    return { data }
  },

  getById: async (id: number) => {
    const data = await getById('products', id)
    return { data }
  }
}

// ============ 订单相关 ============
export const orderApi = {
  getList: async (params?: { status?: number }) => {
    // 获取当前用户 openid
    const { result } = await Taro.cloud.callFunction({ name: 'getOpenId' }) as any
    const openid = result?.openid
    
    if (!openid) {
      throw new Error('请先登录')
    }

    const where: Record<string, any> = { _openid: openid }
    if (params?.status !== undefined) where.status = params.status

    const data = await queryCollection('orders', {
      where,
      orderBy: { field: 'id', order: 'desc' }
    })
    return { data }
  },

  getById: async (id: number) => {
    const db = getDb()
    
    // 获取订单
    const orderRes = await db.collection('orders').where({ id }).limit(1).get()
    const order = orderRes.data[0]
    
    if (!order) return { data: null }

    // 获取订单明细
    const itemsRes = await db.collection('order_items').where({ order_id: id }).get()
    
    return {
      data: {
        ...order,
        items: itemsRes.data
      }
    }
  },

  create: async (data: { items: { product_id: number; quantity: number }[]; remark?: string }) => {
    const db = getDb()
    
    // 生成订单号
    const now = new Date()
    const orderNo = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0') +
      Math.floor(Math.random() * 10000).toString().padStart(4, '0')

    // 计算总金额并获取商品信息
    let totalAmount = 0
    const orderItems: any[] = []

    for (const item of data.items) {
      const productRes = await db.collection('products').where({ id: item.product_id }).limit(1).get()
      const product = productRes.data[0]
      
      if (!product) {
        throw new Error(`商品 ${item.product_id} 不存在`)
      }

      totalAmount += product.price * item.quantity
      orderItems.push({
        product_id: item.product_id,
        product_name: product.name,
        price: product.price,
        quantity: item.quantity
      })
    }

    // 获取最大订单 ID
    const maxOrderRes = await db.collection('orders')
      .orderBy('id', 'desc')
      .limit(1)
      .get()
    const newOrderId = (maxOrderRes.data[0]?.id || 0) + 1

    // 创建订单
    const orderData = {
      id: newOrderId,
      order_no: orderNo,
      total_amount: totalAmount,
      status: 0,
      remark: data.remark || '',
      created_at: db.serverDate(),
      updated_at: db.serverDate()
    }

    await db.collection('orders').add({ data: orderData })

    // 获取最大订单明细 ID
    const maxItemRes = await db.collection('order_items')
      .orderBy('id', 'desc')
      .limit(1)
      .get()
    let itemId = (maxItemRes.data[0]?.id || 0)

    // 创建订单明细
    for (const item of orderItems) {
      itemId++
      await db.collection('order_items').add({
        data: {
          id: itemId,
          order_id: newOrderId,
          ...item
        }
      })
    }

    return {
      data: {
        id: newOrderId,
        order_no: orderNo,
        total_amount: totalAmount
      }
    }
  },

  updateStatus: async (id: number, status: number) => {
    await updateRecord('orders', id, {
      status,
      updated_at: getDb().serverDate()
    })
    return { message: '更新成功' }
  }
}

// ============ 用户相关 ============
export const userApi = {
  // 微信一键登录（云开发推荐方式）
  wxLogin: async () => {
    // 调用云函数获取用户信息
    const { result } = await Taro.cloud.callFunction({ name: 'login' }) as any
    
    if (result?.user) {
      Taro.setStorageSync('userInfo', result.user)
      Taro.setStorageSync('token', 'cloud_' + result.user.id) // 兼容原有逻辑
      return { user: result.user, token: 'cloud_' + result.user.id }
    }
    
    throw new Error('登录失败')
  },

  // 兼容手机号密码登录（云开发模式下改为微信登录）
  login: async (_data: { phone: string; password: string }) => {
    // 云开发模式下，直接使用微信登录
    return userApi.wxLogin()
  },

  // 兼容注册（云开发模式下自动注册）
  register: async (_data: { phone: string; password: string; nickname?: string }) => {
    // 云开发模式下，登录时会自动创建用户
    return userApi.wxLogin()
  },

  getProfile: async () => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (userInfo) {
      return { data: userInfo }
    }
    // 尝试重新登录获取
    try {
      const res = await userApi.wxLogin()
      return { data: res.user }
    } catch (e) {
      throw new Error('未登录')
    }
  },

  updateProfile: async (data: { nickname?: string; avatar?: string }) => {
    const { result } = await Taro.cloud.callFunction({
      name: 'updateUser',
      data
    }) as any
    
    if (result?.user) {
      Taro.setStorageSync('userInfo', result.user)
      return { data: result.user }
    }
    
    throw new Error('更新失败')
  }
}

// ============ 地址相关 ============
export const addressApi = {
  getList: async () => {
    const { result } = await Taro.cloud.callFunction({ name: 'getOpenId' }) as any
    const openid = result?.openid
    
    if (!openid) throw new Error('请先登录')

    const data = await queryCollection('addresses', {
      where: { _openid: openid },
      orderBy: { field: 'is_default', order: 'desc' }
    })
    return { data }
  },

  create: async (data: { name: string; phone: string; address: string; is_default?: number }) => {
    const db = getDb()
    
    // 获取最大地址 ID
    const maxRes = await db.collection('addresses')
      .orderBy('id', 'desc')
      .limit(1)
      .get()
    const newId = (maxRes.data[0]?.id || 0) + 1

    // 如果设为默认，先取消其他默认地址
    if (data.is_default) {
      const { result } = await Taro.cloud.callFunction({ name: 'getOpenId' }) as any
      await (db.collection('addresses') as any)
        .where({ _openid: result?.openid })
        .update({ data: { is_default: 0 } })
    }

    await db.collection('addresses').add({
      data: {
        id: newId,
        ...data,
        is_default: data.is_default || 0,
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      }
    })

    return { data: { id: newId } }
  },

  update: async (id: number, data: { name?: string; phone?: string; address?: string; is_default?: number }) => {
    const db = getDb()

    // 如果设为默认，先取消其他默认地址
    if (data.is_default) {
      const { result } = await Taro.cloud.callFunction({ name: 'getOpenId' }) as any
      await (db.collection('addresses') as any)
        .where({ _openid: result?.openid })
        .update({ data: { is_default: 0 } })
    }

    await updateRecord('addresses', id, {
      ...data,
      updated_at: db.serverDate()
    })

    return { message: '更新成功' }
  },

  delete: async (id: number) => {
    const db = getDb() as any
    await db.collection('addresses').where({ id }).remove()
    return { message: '删除成功' }
  }
}

// ============ 系统设置相关 ============
// 收款码存储在本地后端，需要通过 HTTP 请求获取
export const settingsApi = {
  getPayQrCode: async () => {
    // 从本地后端获取收款码配置
    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000'}/api/settings/pay-qrcode`,
        method: 'GET'
      })
      return res.data
    } catch (err) {
      console.error('获取收款码失败:', err)
      return { data: { url: '' } }
    }
  }
}
