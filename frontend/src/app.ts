import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { initCloud } from './services/cloud'

import './app.scss'

function getEnvVar(key: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && (process as any).env) {
      return (process as any).env[key]
    }
  } catch {
    // ignore
  }
  return undefined
}

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')

    // 开发环境：自动设置请求/图片资源 BASE_URL（供 request/getImageUrl 使用）
    const isMini = Taro.getEnv?.() !== Taro.ENV_TYPE.WEB
    const isDev = getEnvVar('NODE_ENV') === 'development'
    if (isDev && isMini) {
      try {
        const existing = Taro.getStorageSync('BASE_URL') as string
        if (!existing) {
          const systemInfo = Taro.getSystemInfoSync()
          const fromEnv = getEnvVar('TARO_APP_API_BASE_URL')

          // 微信开发者工具里可以直接用 localhost
          const defaultDevtoolsUrl = 'http://localhost:3000'

          // 真机调试时请改成你电脑的局域网 IP
          // 也可以通过启动命令注入环境变量 TARO_APP_API_BASE_URL
          const defaultDeviceUrl = 'http://10.5.248.199:3000'

          const nextBaseUrl =
            fromEnv ||
            (systemInfo.platform === 'devtools' ? defaultDevtoolsUrl : defaultDeviceUrl)

          Taro.setStorageSync('BASE_URL', nextBaseUrl)
          console.log('[dev] BASE_URL set to:', nextBaseUrl)

          if (systemInfo.platform !== 'devtools' && !fromEnv) {
            Taro.showToast({
              title: '真机调试请确认 BASE_URL 为局域网IP',
              icon: 'none',
              duration: 2500
            })
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // 初始化云开发
    initCloud()
  })

  // children 是将要会渲染的页面
  return children
}
  


export default App
