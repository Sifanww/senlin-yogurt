import { View, Text, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { userApi } from '../../services'
import './index.scss'

// 是否使用云开发模式（微信一键登录）
const USE_CLOUD = true

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // 微信一键登录
  const handleWxLogin = async () => {
    setLoading(true)
    try {
      await (userApi as any).wxLogin()
      
      Taro.showToast({ title: '登录成功', icon: 'success' })
      
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 手机号密码登录
  const handleSubmit = async () => {
    if (!phone || !password) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    if (!/^1\d{10}$/.test(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    if (password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = isLogin 
        ? await userApi.login({ phone, password })
        : await userApi.register({ phone, password })
      
      // 保存用户信息和token
      Taro.setStorageSync('token', res.token)
      Taro.setStorageSync('userInfo', res.user)
      
      Taro.showToast({ title: isLogin ? '登录成功' : '注册成功', icon: 'success' })
      
      setTimeout(() => {
        // 根据角色跳转到不同页面
        if (res.user?.role === 'admin') {
          Taro.reLaunch({ url: '/pages/admin/index/index' })
        } else {
          Taro.navigateBack()
        }
      }, 1500)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 云开发模式：显示微信一键登录
  if (USE_CLOUD) {
    return (
      <View className='login'>
        <View className='logo'>
          <Text className='logo-icon'>🧋</Text>
          <Text className='logo-text'>森邻酸奶</Text>
        </View>

        <View className='form'>
          <Button 
            className={`submit-btn wx-btn ${loading ? 'disabled' : ''}`}
            onClick={handleWxLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '微信一键登录'}
          </Button>
          
          <View className='wx-tip'>
            <Text className='tip-text'>使用微信账号快速登录</Text>
          </View>
        </View>

        <View className='agreement'>
          <Text className='agreement-text'>
            登录即表示同意 <Text className='link'>用户协议</Text> 和 <Text className='link'>隐私政策</Text>
          </Text>
        </View>
      </View>
    )
  }

  // 本地开发模式：手机号密码登录
  return (
    <View className='login'>
      <View className='logo'>
        <Text className='logo-icon'>☕</Text>
        <Text className='logo-text'>欢迎来到咖啡小店</Text>
      </View>

      <View className='form'>
        <View className='form-item'>
          <Text className='label'>手机号</Text>
          <Input
            className='input'
            type='number'
            placeholder='请输入手机号'
            maxlength={11}
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Text className='label'>密码</Text>
          <Input
            className='input'
            type='text'
            password
            placeholder='请输入密码'
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button 
          className={`submit-btn ${loading ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
        </Button>

        <View className='switch-mode' onClick={() => setIsLogin(!isLogin)}>
          <Text className='switch-text'>
            {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
          </Text>
        </View>
      </View>

      <View className='agreement'>
        <Text className='agreement-text'>
          登录即表示同意 <Text className='link'>用户协议</Text> 和 <Text className='link'>隐私政策</Text>
        </Text>
      </View>
    </View>
  )
}
