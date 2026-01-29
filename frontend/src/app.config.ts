export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/order/index',
    'pages/orders/index',
    'pages/me/index',
    'pages/checkout/index',
    'pages/orderDetail/index',
    'pages/login/index',
    'pages/address/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '森林酸奶',
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
        text: '首页'
      },
      {
        pagePath: 'pages/order/index',
        text: '点单'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单'
      },
      {
        pagePath: 'pages/me/index',
        text: '我的'
      }
    ]
  }
})
