import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Button, Layout as AntLayout, Menu, Space, Typography } from 'antd'
import { ShopOutlined, OrderedListOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons'

import { clearAuth, getUser } from '../utils/auth'

const { Sider, Content, Header } = AntLayout

const menuItems = [
  { key: '/products', icon: <ShopOutlined />, label: '商品管理' },
  { key: '/categories', icon: <AppstoreOutlined />, label: '分类管理' },
  { key: '/orders', icon: <OrderedListOutlined />, label: '订单管理' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' }
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
          {collapsed ? '森邻' : '森邻酸奶'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>管理后台</h2>
          <Space size={12}>
            <Typography.Text type="secondary">{user?.phone ? `当前：${user.phone}` : ''}</Typography.Text>
            <Button onClick={handleLogout}>退出登录</Button>
          </Space>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
