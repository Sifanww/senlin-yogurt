import { View, Text, Swiper, SwiperItem, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { userApi } from '../../services'
import './index.scss'

// 轮播图数据
const bannerList = [
  {
    id: 1,
    title: '车厘子与草莓',
    subtitle: 'CHERRY AND STRAWBERRY',
    slogan: ['红了 熟了', '是时候了'],
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    bgColor: '#6B3A3A'
  },
  {
    id: 2,
    title: '芒果季',
    subtitle: 'MANGO SEASON',
    slogan: ['阳光的味道', '夏日必备'],
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80',
    bgColor: '#D4A84B'
  },
  {
    id: 3,
    title: '抹茶物语',
    subtitle: 'MATCHA STORY',
    slogan: ['来自京都', '茶香四溢'],
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=800&q=80',
    bgColor: '#5B7355'
  }
]

interface UserInfo {
  id: number
  nickname: string
  role?: string
}

export default function Index() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    // 从缓存读取用户信息
    const userInfo = Taro.getStorageSync('userInfo')
    if (userInfo) {
      setUser(userInfo)
      // 后台刷新用户信息（获取最新的 role）
      userApi.getProfile().then(res => {
        const newUser = res.data || res
        if (newUser) {
          Taro.setStorageSync('userInfo', newUser)
          setUser(newUser)
        }
      }).catch(() => {})
    } else {
      setUser(null)
    }
  })

  // 微信一键登录
  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await (userApi as any).wxLogin()
      setUser(res.user)
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 跳转到点单页面
  const goToOrder = (type: 'pickup' | 'delivery') => {
    Taro.setStorageSync('orderType', type)
    Taro.switchTab({ url: '/pages/order/index' })
  }

  return (
    <View className='index'>
      {/* 顶部用户区域 */}
      <View className='user-bar'>
        {!user && (
          <View className='login-area' onClick={handleLogin}>
            <Text className='login-text'>{loading ? '登录中...' : '点击登录'}</Text>
          </View>
        )}
      </View>

      {/* 轮播图区域 */}
      <Swiper
        className='banner-swiper'
        indicatorDots
        indicatorColor='rgba(255, 255, 255, 0.4)'
        indicatorActiveColor='#ffffff'
        autoplay
        interval={4000}
        duration={500}
        circular
      >
        {bannerList.map((item) => (
          <SwiperItem key={item.id}>
            <View className='banner-item' style={{ backgroundColor: item.bgColor }}>
              <View className='banner-content'>
                <View className='slogan'>
                  {item.slogan.map((text, idx) => {
                    return <Text key={idx} className='slogan-text'>{text}</Text>
                  })}
                </View>
                <View className='title-wrapper'>
                  <Text className='title'>{item.title}</Text>
                  <Text className='subtitle'>{item.subtitle}</Text>
                </View>
              </View>
              <Image className='banner-image' src={item.image} mode='aspectFill' />
            </View>
          </SwiperItem>
        ))}
      </Swiper>

      {/* 底部按钮区域 */}
      <View className='action-buttons'>
        <View className='action-btn' onClick={() => goToOrder('pickup')}>
          <Text className='btn-title'>自提</Text>
          <Text className='btn-desc'>提前下单 门店自提</Text>
        </View>
        <View className='divider'></View>
        <View className='action-btn' onClick={() => goToOrder('delivery')}>
          <Text className='btn-title'>外送</Text>
          <Text className='btn-desc'>在家等候 安心配送</Text>
        </View>
      </View>
    </View>
  )
}
