export default defineAppConfig({
  pages: [
    // 顾客页面
    'pages/index/index',
    'pages/order/index',
    'pages/orders/index',
    'pages/me/index',
    'pages/checkout/index',
    'pages/orderDetail/index',
    'pages/login/index',
    'pages/address/index',
    'pages/productDetail/index',
    // 管理员页面
    'pages/admin/index/index',
    'pages/admin/products/index',
    'pages/admin/orders/index',
    'pages/admin/categories/index',
    'pages/admin/settings/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '森邻酸奶',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#7bc96f',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/order/index',
        text: '点单',
        iconPath: 'assets/icons/order.png',
        selectedIconPath: 'assets/icons/order-active.png'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单',
        iconPath: 'assets/icons/order.png',
        selectedIconPath: 'assets/icons/order-active.png'
      },
      {
        pagePath: 'pages/me/index',
        text: '我的',
        iconPath: 'assets/icons/me.png',
        selectedIconPath: 'assets/icons/me-active.png'
      }
    ]
  }
})
