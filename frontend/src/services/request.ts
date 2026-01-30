import Taro from '@tarojs/taro'

function getEnvVar(key: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && (process as any).env) {
      return (process as any).env[key]
    }
  } catch {
    // ignore
  }
  return undefined
}

// 请求/资源基础地址
// - H5 走同域（''）
// - 小程序开发者工具默认可用 localhost
// - 真机调试请在 storage 中写入 BASE_URL（如 http://你的局域网IP:3000）
const isH5 = Taro.getEnv?.() === Taro.ENV_TYPE.WEB
const DEFAULT_BASE_URL = isH5 ? '' : 'http://localhost:3000'
const BASE_URL =
  (Taro.getStorageSync('BASE_URL') as string) ||
  getEnvVar('TARO_APP_API_BASE_URL') ||
  DEFAULT_BASE_URL

// 获取完整的图片URL
export function getImageUrl(path: string): string {
  if (!path) return ''
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // 否则拼接BASE_URL
  return `${BASE_URL}${path}`
}

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
