import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

const tabList = [
  { pagePath: '/pages/index/index', text: '首页', icon: '⌂' },
  { pagePath: '/pages/orders/index', text: '订单', icon: '☰' },
  { pagePath: '/pages/me/index', text: '我的', icon: '○' }
]

export default function TabBar() {
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    const currentPath = Taro.getCurrentInstance().router?.path || ''
    const index = tabList.findIndex(item => currentPath.includes(item.pagePath.replace('/', '')))
    if (index !== -1) {
      setSelected(index)
    }
  }, [])

  const switchTab = (index: number, path: string) => {
    if (index === selected) return
    Taro.switchTab({ url: path })
  }

  return (
    <View className='tab-bar'>
      {tabList.map((item, index) => (
        <View
          key={item.pagePath}
          className={`tab-bar-item ${selected === index ? 'active' : ''}`}
          onClick={() => switchTab(index, item.pagePath)}
        >
          <Text className='tab-bar-icon'>{item.icon}</Text>
          <Text className='tab-bar-text'>{item.text}</Text>
        </View>
      ))}
    </View>
  )
}
