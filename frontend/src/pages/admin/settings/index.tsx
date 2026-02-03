import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { settingsApi } from '../../../services'
import './index.scss'

export default function AdminSettings() {
  const [qrcode, setQrcode] = useState('')

  useEffect(() => {
    fetchQrcode()
  }, [])

  const fetchQrcode = async () => {
    try {
      const res = await settingsApi.getPayQrCode()
      const data = res.data || res
      if (data?.qrcode) {
        setQrcode(data.qrcode)
      }
    } catch (e) {
      console.error('获取收款码失败', e)
    }
  }

  const handleUploadQrcode = () => {
    Taro.chooseImage({
      count: 1,
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        
        Taro.showLoading({ title: '上传中...' })
        try {
          const uploadRes = await settingsApi.uploadPayQrCode(tempFilePath)
          const url = uploadRes.data?.url
          if (url) {
            setQrcode(url)
            Taro.showToast({ title: '上传成功', icon: 'success' })
          }
        } catch (err) {
          console.error('上传失败', err)
          Taro.showToast({ title: '上传失败', icon: 'none' })
        } finally {
          Taro.hideLoading()
        }
      }
    })
  }

  return (
    <View className='admin-settings'>
      <View className='header'>
        <Text className='title'>系统设置</Text>
      </View>

      <View className='settings-section'>
        <Text className='section-title'>基本设置</Text>
        <View className='setting-item'>
          <View className='item-left'>
            <Text className='item-label'>店铺名称</Text>
            <Text className='item-desc'>显示在小程序顶部</Text>
          </View>
          <View className='item-right'>
            <Text className='item-value'>森邻酸奶</Text>
            <Text className='arrow'>›</Text>
          </View>
        </View>
        <View className='setting-item'>
          <View className='item-left'>
            <Text className='item-label'>营业状态</Text>
            <Text className='item-desc'>关闭后用户无法下单</Text>
          </View>
          <View className='item-right'>
            <Text className='item-value'>营业中</Text>
            <Text className='arrow'>›</Text>
          </View>
        </View>
      </View>

      <View className='qrcode-section'>
        <Text className='section-title'>收款二维码</Text>
        {qrcode ? (
          <Image className='qrcode-image' src={qrcode} mode='aspectFit' onClick={handleUploadQrcode} />
        ) : (
          <View className='qrcode-image' onClick={handleUploadQrcode}>
            <Text style={{ lineHeight: '300px', color: '#999' }}>点击上传</Text>
          </View>
        )}
        <View className='upload-btn' onClick={handleUploadQrcode}>
          {qrcode ? '更换二维码' : '上传二维码'}
        </View>
        <Text className='tip'>用户下单后会显示此二维码进行付款</Text>
      </View>

      <View className='version'>
        版本 1.0.0
      </View>
    </View>
  )
}
