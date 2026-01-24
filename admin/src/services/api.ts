import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 商品相关
export const productApi = {
  list: (params?: { category_id?: number; status?: number }) =>
    api.get('/products', { params }),
  get: (id: number) => api.get(`/products/${id}`),
  create: (data: {
    category_id: number
    name: string
    description?: string
    price: number
    image?: string
    stock?: number
    status?: number
  }) => api.post('/products', data),
  update: (id: number, data: Partial<{
    category_id: number
    name: string
    description: string
    price: number
    image: string
    stock: number
    status: number
  }>) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`)
}

// 分类相关
export const categoryApi = {
  list: () => api.get('/categories'),
  create: (data: { name: string; sort_order?: number }) =>
    api.post('/categories', data),
  update: (id: number, data: { name?: string; sort_order?: number }) =>
    api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`)
}

// 订单相关
export const orderApi = {
  list: (params?: { status?: number }) => api.get('/orders', { params }),
  get: (id: number) => api.get(`/orders/${id}`),
  updateStatus: (id: number, status: number) =>
    api.put(`/orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/orders/${id}`)
}

export default api
