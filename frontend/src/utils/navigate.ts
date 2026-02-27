import Taro from '@tarojs/taro'

/** 安全返回：如果当前已是第一个页面，则跳转到首页 */
export function safeNavigateBack() {
  const pages = Taro.getCurrentPages()
  if (pages.length > 1) {
    Taro.navigateBack()
  } else {
    Taro.switchTab({ url: '/pages/index/index' })
  }
}
