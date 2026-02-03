import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

// 顾客 TabBar 配置
const customerTabs = [
  { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
  { pagePath: '/pages/order/index', text: '点单', icon: '🛒' },
  { pagePath: '/pages/orders/index', text: '订单', icon: '📋' },
  { pagePath: '/pages/me/index', text: '我的', icon: '👤' }
]

// 管理员 TabBar 配置
const adminTabs = [
  { pagePath: '/pages/admin/index/index', text: '管理', icon: '⚙️' },
  { pagePath: '/pages/order/index', text: '点单', icon: '🛒' },
  { pagePath: '/pages/orders/index', text: '订单', icon: '📋' },
  { pagePath: '/pages/me/index', text: '我的', icon: '👤' }
]

interface Props {
  current?: number
}

export default function CustomTabBar({ current = 0 }: Props) {
  const [selected, setSelected] = useState(current)
  const [tabList, setTabList] = useState(customerTabs)

  useEffect(() => {
    setSelected(current)
    // 根据用户角色设置 TabBar
    const userInfo = Taro.getStorageSync('userInfo')
    if (userInfo?.role === 'admin') {
      setTabList(adminTabs)
    } else {
      setTabList(customerTabs)
    }
  }, [current])

  const switchTab = (index: number, path: string) => {
    if (index === selected) return
    setSelected(index)
    Taro.switchTab({ url: path })
  }

  return (
    <View className='custom-tab-bar'>
      {tabList.map((item, index) => (
        <View
          key={item.pagePath}
          className={`tab-item ${selected === index ? 'active' : ''}`}
          onClick={() => switchTab(index, item.pagePath)}
        >
          <Text className='tab-icon'>{item.icon}</Text>
          <Text className='tab-text'>{item.text}</Text>
        </View>
      ))}
    </View>
  )
}
