import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

const tabList = [
  {
    pagePath: '/pages/index/index',
    text: '首页',
    icon: '⌂',
    iconActive: '⌂'
  },
  {
    pagePath: '/pages/orders/index',
    text: '订单',
    icon: '☰',
    iconActive: '☰'
  },
  {
    pagePath: '/pages/me/index',
    text: '我的',
    icon: '○',
    iconActive: '●'
  }
]

interface Props {
  current?: number
}

export default function CustomTabBar({ current = 0 }: Props) {
  const [selected, setSelected] = useState(current)

  useEffect(() => {
    setSelected(current)
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
          <Text className='tab-icon'>{selected === index ? item.iconActive : item.icon}</Text>
          <Text className='tab-text'>{item.text}</Text>
        </View>
      ))}
    </View>
  )
}
