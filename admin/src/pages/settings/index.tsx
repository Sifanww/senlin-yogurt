import { useState, useEffect } from 'react'
import { Card, Upload, message, Spin, Image } from 'antd'
import { UploadOutlined, QrcodeOutlined, PictureOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { settingsApi } from '../../services/api'
import { getToken } from '../../utils/auth'

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [payQrCode, setPayQrCode] = useState<string>('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [meBgImage, setMeBgImage] = useState<string>('')
  const [bgFileList, setBgFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const [qrRes, bgRes] = await Promise.all([
        settingsApi.getPayQrCode(),
        settingsApi.getMeBgImage()
      ])

      const qrUrl = qrRes.data?.data?.url || ''
      setPayQrCode(qrUrl)
      if (qrUrl) {
        setFileList([{
          uid: '-1',
          name: '收款码',
          status: 'done',
          url: qrUrl.startsWith('http') ? qrUrl : `${window.location.origin}${qrUrl}`
        }])
      }

      const bgUrl = bgRes.data?.data?.url || ''
      setMeBgImage(bgUrl)
      if (bgUrl) {
        setBgFileList([{
          uid: '-1',
          name: '背景图',
          status: 'done',
          url: bgUrl.startsWith('http') ? bgUrl : `${window.location.origin}${bgUrl}`
        }])
      }
    } catch (err) {
      console.error('加载设置失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    const formData = new FormData()
    formData.append('file', file as Blob)

    try {
      const token = getToken()
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await res.json()
      if (data.data?.url) {
        onSuccess?.(data)
        const url = data.data.url
        setPayQrCode(url)
        // 保存到设置
        await settingsApi.updatePayQrCode(url)
        message.success('收款码上传成功')
      } else {
        throw new Error('上传失败')
      }
    } catch (err) {
      onError?.(err as Error)
      message.error('上传失败')
    }
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  const handleRemove = async () => {
    setSaving(true)
    try {
      await settingsApi.updatePayQrCode('')
      setPayQrCode('')
      setFileList([])
      message.success('收款码已移除')
    } catch (err) {
      message.error('操作失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>

      <Card
        title={
          <span>
            <PictureOutlined style={{ marginRight: 8 }} />
            「我的」页面背景图
          </span>
        }
        style={{ maxWidth: 600, marginBottom: 24 }}
      >
        <p style={{ color: '#666', marginBottom: 16 }}>
          上传图片作为小程序「我的」页面顶部背景
        </p>

        <Upload
          listType="picture-card"
          fileList={bgFileList}
          customRequest={async (options) => {
            const { file, onSuccess, onError } = options
            const formData = new FormData()
            formData.append('file', file as Blob)

            try {
              const token = getToken()
              const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
              })
              const data = await res.json()
              if (data.data?.url) {
                onSuccess?.(data)
                const url = data.data.url
                setMeBgImage(url)
                await settingsApi.updateMeBgImage(url)
                message.success('背景图上传成功')
              } else {
                throw new Error('上传失败')
              }
            } catch (err) {
              onError?.(err as Error)
              message.error('上传失败')
            }
          }}
          onChange={({ fileList: newFileList }) => setBgFileList(newFileList)}
          onRemove={async () => {
            setSaving(true)
            try {
              await settingsApi.updateMeBgImage('')
              setMeBgImage('')
              setBgFileList([])
              message.success('背景图已移除')
            } catch (err) {
              message.error('操作失败')
            } finally {
              setSaving(false)
            }
          }}
          disabled={saving}
          maxCount={1}
          accept="image/*"
        >
          {bgFileList.length === 0 && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>上传背景图</div>
            </div>
          )}
        </Upload>

        {meBgImage && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>预览效果：</p>
            <div style={{
              background: '#f5f5f5',
              padding: 20,
              borderRadius: 8,
              display: 'inline-block'
            }}>
              <Image
                src={meBgImage.startsWith('http') ? meBgImage : `${window.location.origin}${meBgImage}`}
                width={300}
                alt="背景图预览"
              />
            </div>
          </div>
        )}
      </Card>
      
      <Card 
        title={
          <span>
            <QrcodeOutlined style={{ marginRight: 8 }} />
            收款码设置
          </span>
        }
        style={{ maxWidth: 600 }}
      >
        <p style={{ color: '#666', marginBottom: 16 }}>
          上传微信收款码，用户在小程序中提交订单后可扫码支付
        </p>

        <Upload
          listType="picture-card"
          fileList={fileList}
          customRequest={handleUpload}
          onChange={handleChange}
          onRemove={handleRemove}
          disabled={saving}
          maxCount={1}
          accept="image/*"
        >
          {fileList.length === 0 && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>上传收款码</div>
            </div>
          )}
        </Upload>

        {payQrCode && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>预览效果：</p>
            <div style={{ 
              background: '#f5f5f5', 
              padding: 20, 
              borderRadius: 8,
              display: 'inline-block'
            }}>
              <Image
                src={payQrCode.startsWith('http') ? payQrCode : `${window.location.origin}${payQrCode}`}
                width={200}
                alt="收款码预览"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
