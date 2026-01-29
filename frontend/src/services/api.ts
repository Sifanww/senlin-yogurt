import request from './request'

// 分类相关
export const categoryApi = {
  getList: () => request({ url: '/api/categories' }),
  getById: (id: number) => request({ url: `/api/categories/${id}` }),
  create: (data: { name: string; sort_order?: number }) => 
    request({ url: '/api/categories', method: 'POST', data }),
  update: (id: number, data: { name?: string; sort_order?: number }) => 
    request({ url: `/api/categories/${id}`, method: 'PUT', data }),
  delete: (id: number) => request({ url: `/api/categories/${id}`, method: 'DELETE' })
}

// 商品相关
export const productApi = {
  getList: (params?: { category_id?: number; status?: number }) => 
    request({ url: '/api/products', data: params }),
  getById: (id: number) => request({ url: `/api/products/${id}` }),
  create: (data: { category_id: number; name: string; price: number; description?: string; image?: string; stock?: number }) => 
    request({ url: '/api/products', method: 'POST', data }),
  update: (id: number, data: any) => request({ url: `/api/products/${id}`, method: 'PUT', data }),
  delete: (id: number) => request({ url: `/api/products/${id}`, method: 'DELETE' })
}

// 订单相关
export const orderApi = {
  getList: (params?: { status?: number }) => request({ url: '/api/orders', data: params }),
  getById: (id: number) => request({ url: `/api/orders/${id}` }),
  create: (data: { items: { product_id: number; quantity: number }[]; remark?: string }) => 
    request({ url: '/api/orders', method: 'POST', data }),
  updateStatus: (id: number, status: number) => 
    request({ url: `/api/orders/${id}/status`, method: 'PUT', data: { status } }),
  delete: (id: number) => request({ url: `/api/orders/${id}`, method: 'DELETE' })
}

// 用户相关
export const userApi = {
  login: (data: { phone: string; password: string }) => 
    request({ url: '/api/user/login', method: 'POST', data }),
  register: (data: { phone: string; password: string; nickname?: string }) => 
    request({ url: '/api/user/register', method: 'POST', data }),
  getProfile: () => request({ url: '/api/user/profile' }),
  updateProfile: (data: { nickname?: string; avatar?: string }) => 
    request({ url: '/api/user/profile', method: 'PUT', data })
}

// 地址相关
export const addressApi = {
  getList: (userId: number) => request({ url: '/api/addresses', data: { user_id: userId } }),
  getById: (id: number) => request({ url: `/api/addresses/${id}` }),
  create: (data: { user_id: number; name: string; phone: string; address: string; is_default?: number }) => 
    request({ url: '/api/addresses', method: 'POST', data }),
  update: (id: number, data: { name?: string; phone?: string; address?: string; is_default?: number; user_id?: number }) => 
    request({ url: `/api/addresses/${id}`, method: 'PUT', data }),
  delete: (id: number) => request({ url: `/api/addresses/${id}`, method: 'DELETE' })
}
