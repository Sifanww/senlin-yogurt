import Taro from '@tarojs/taro'

const BASE_URL = process.env.TARO_ENV === 'h5' ? '' : 'http://localhost:3000'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data } = options
  
  // 获取token
  const token = Taro.getStorageSync('token')
  
  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.data
    }
    
    // 401 未授权，清除登录状态
    if (res.statusCode === 401) {
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')
    }
    
    throw new Error(res.data?.error || '请求失败')
  } catch (error: any) {
    if (!error.message?.includes('请求失败')) {
      Taro.showToast({ title: '网络错误', icon: 'none' })
    }
    throw error
  }
}

export default request
