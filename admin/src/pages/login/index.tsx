import { Button, Card, Form, Input, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../../services/api'
import { setToken, setUser } from '../../utils/auth'

const { Title, Text } = Typography

function getRedirect(search: string) {
  const params = new URLSearchParams(search)
  return params.get('redirect') || '/'
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = useMemo(() => getRedirect(location.search), [location.search])

  const onFinish = async (values: { phone: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authApi.login(values)
      const { token, user } = res.data ?? {}

      if (!token) {
        message.error('登录失败：未返回 token')
        return
      }

      setToken(token)
      if (user) setUser(user)

      message.success('登录成功')
      navigate(redirectTo, { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || '登录失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #f5f7ff 0%, #f3fff8 100%)'
      }}
    >
      <Card style={{ width: 420, borderRadius: 12 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          管理后台登录
        </Title>
        <Text type="secondary">使用手机号 + 密码登录</Text>

        <Form
          layout="vertical"
          style={{ marginTop: 20 }}
          onFinish={onFinish}
          initialValues={{ phone: '', password: '' }}
        >
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="请输入手机号" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}
