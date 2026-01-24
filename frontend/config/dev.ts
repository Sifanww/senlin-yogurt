import type { UserConfigExport } from "@tarojs/cli"

export default {
  mini: {},
  h5: {
    devServer: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  }
} satisfies UserConfigExport<'vite'>
