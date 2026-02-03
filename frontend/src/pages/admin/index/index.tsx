import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { orderApi, productApi, categoryApi } from '../../../services'
import './index.scss'

interface Stats {
  orders: number
  products: number
  categories: number
  todayOrders: number
}

export default function AdminHome() {
  const [stats, setStats] = useState<Stats>({ orders: 0, products: 0, categories: 0, todayOrders: 0 })
  const userInfo = Taro.getStorageSync('userInfo')

  const fetchStats = async () => {
    try {
      const [ordersRes, productsRes, categoriesRes] = await Promise.all([
        orderApi.getList(),
        productApi.getList(),
        categoryApi.getList()
      ])
      
      const orders = ordersRes.data || ordersRes || []
      const products = productsRes.data || productsRes || []
      const categories = categoriesRes.data || categoriesRes || []
      
      // 计算今日订单
      const today = new Date().toDateString()
      const todayOrders = orders.filter((o: any) => new Date(o.created_at).toDateString() === today).length

      setStats({
        orders: orders.length,
        products: products.length,
        categories: categories.length,
        todayOrders
      })
    } catch (e) {
      console.error('获取统计失败', e)
    }
  }

  useDidShow(() => {
    // 检查权限
    const user = Taro.getStorageSync('userInfo')
    if (!user || user.role !== 'admin') {
      Taro.showToast({ title: '无权限访问', icon: 'none' })
      Taro.switchTab({ url: '/pages/index/index' })
      return
    }
    fetchStats()
  })

  const menuItems = [
    { icon: '📦', name: '商品管理', desc: '管理商品信息', path: '/pages/admin/products/index' },
    { icon: '📋', name: '订单管理', desc: '处理客户订单', path: '/pages/admin/orders/index' },
    { icon: '🏷️', name: '分类管理', desc: '管理商品分类', path: '/pages/admin/categories/index' },
    { icon: '⚙️', name: '系统设置', desc: '配置系统参数', path: '/pages/admin/settings/index' }
  ]

  const handleNavigate = (path: string) => {
    Taro.navigateTo({ url: path })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('userInfo')
          Taro.reLaunch({ url: '/pages/index/index' })
        }
      }
    })
  }

  return (
    <View className='admin-home'>
      <View className='header'>
        <Text className='welcome'>欢迎回来</Text>
        <Text className='title'>{userInfo?.nickname || '管理员'}</Text>
      </View>

      <View className='menu-grid'>
        {menuItems.map((item, index) => (
          <View key={index} className='menu-item' onClick={() => handleNavigate(item.path)}>
            <Text className='icon'>{item.icon}</Text>
            <Text className='name'>{item.name}</Text>
            <Text className='desc'>{item.desc}</Text>
          </View>
        ))}
      </View>

      <View className='stats'>
        <Text className='stats-title'>数据概览</Text>
        <View className='stats-grid'>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.todayOrders}</Text>
            <Text className='stat-label'>今日订单</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.orders}</Text>
            <Text className='stat-label'>总订单</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.products}</Text>
            <Text className='stat-label'>商品数</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.categories}</Text>
            <Text className='stat-label'>分类数</Text>
          </View>
        </View>
      </View>

      <View className='logout-btn' onClick={handleLogout}>
        退出登录
      </View>
    </View>
  )
}
