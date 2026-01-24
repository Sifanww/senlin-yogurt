import { View, Text, Image, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss'

interface UserInfo {
  id: number
  phone: string
  nickname: string
  avatar?: string
  points: number
}

export default function Me() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const checkLoginStatus = () => {
    const token = Taro.getStorageSync('token')
    const userInfo = Taro.getStorageSync('userInfo')
    
    if (token && userInfo) {
      setUser(userInfo)
      setIsLoggedIn(true)
    } else {
      setUser(null)
      setIsLoggedIn(false)
    }
  }

  useEffect(() => {
    checkLoginStatus()
  }, [])

  // 每次页面显示时检查登录状态
  useDidShow(() => {
    checkLoginStatus()
  })

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('userInfo')
          setUser(null)
          setIsLoggedIn(false)
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }

  const handleMenuClick = (type: string) => {
    if (!isLoggedIn) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    switch (type) {
      case 'exchange':
        Taro.showToast({ title: '积分兑换', icon: 'none' })
        break
      case 'address':
        Taro.showToast({ title: '外卖地址', icon: 'none' })
        break
      default:
        break
    }
  }

  return (
    <View className='me'>
      {/* 顶部背景 */}
      <View className='header-bg'>
        <Image
          className='bg-image'
          src='https://img.yzcdn.cn/vant/cat.jpeg'
          mode='aspectFill'
        />
      </View>

      {/* 会员卡片 */}
      <View className='member-card'>
        {isLoggedIn && user ? (
          <>
            <View className='card-header'>
              <View className='user-info'>
                <View className='avatar-wrapper'>
                  {user.avatar ? (
                    <Image className='avatar' src={user.avatar} mode='aspectFill' />
                  ) : (
                    <View className='avatar-placeholder'>
                      <Text>{user.nickname?.charAt(0) || '用'}</Text>
                    </View>
                  )}
                </View>
                <View className='name-row'>
                  <Text className='user-name'>Hi, {user.nickname}</Text>
                  <Text className='user-phone'>{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</Text>
                </View>
              </View>
            </View>

            <View className='card-stats'>
              <View className='stat-item'>
                <Text className='stat-value'>{user.points || 0}</Text>
                <Text className='stat-label'>积分</Text>
              </View>
              <View className='stat-item'>
                <Text className='stat-value'>-</Text>
                <Text className='stat-label'>优惠券</Text>
              </View>
            </View>
          </>
        ) : (
          <View className='login-prompt'>
            <View className='avatar-placeholder large'>
              <Text>👤</Text>
            </View>
            <Text className='prompt-text'>登录后享受更多会员权益</Text>
            <Button className='login-btn' onClick={handleLogin}>
              立即登录
            </Button>
          </View>
        )}
      </View>

      {/* 会员中心 */}
      <View className='member-center'>
        <Text className='section-title'>会员中心</Text>
        <View className='menu-grid'>
          <View className='menu-item' onClick={() => handleMenuClick('exchange')}>
            <View className='icon-wrapper'>
              <Text className='icon-placeholder'>🎁</Text>
            </View>
            <Text className='menu-text'>积分兑换</Text>
          </View>
          <View className='menu-item' onClick={() => handleMenuClick('address')}>
            <View className='icon-wrapper'>
              <Text className='icon-placeholder'>📍</Text>
            </View>
            <Text className='menu-text'>外卖地址</Text>
          </View>
        </View>
      </View>

      {/* 退出登录按钮 */}
      {isLoggedIn && (
        <View className='logout-section'>
          <Button className='logout-btn' onClick={handleLogout}>
            退出登录
          </Button>
        </View>
      )}
    </View>
  )
}
