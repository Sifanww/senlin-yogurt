import { useState, useEffect } from 'react'
import { Image } from '@tarojs/components'
import Taro from '@tarojs/taro'

interface CloudImageProps {
  src: string
  className?: string
  mode?: 'aspectFill' | 'aspectFit' | 'widthFix' | 'scaleToFill' | 'heightFix'
  onClick?: () => void
}

// 全局缓存：避免同一个 fileID 重复请求
const urlCache = new Map<string, string>()

// 启动时从 Storage 恢复缓存
try {
  const stored = Taro.getStorageSync('cloudImageCache')
  if (stored) {
    const parsed = JSON.parse(stored) as Record<string, string>
    Object.entries(parsed).forEach(([k, v]) => urlCache.set(k, v))
  }
} catch {}

// 持久化缓存到 Storage（节流，避免频繁写入）
let persistTimer: any = null
function persistCache() {
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    try {
      const obj: Record<string, string> = {}
      urlCache.forEach((v, k) => { obj[k] = v })
      Taro.setStorageSync('cloudImageCache', JSON.stringify(obj))
    } catch {}
  }, 500)
}

// 批量请求队列：合并短时间内的多个请求
let pendingQueue: { fileID: string; resolve: (url: string) => void }[] = []
let flushTimer: any = null

function flushQueue() {
  if (pendingQueue.length === 0) return

  const batch = [...pendingQueue]
  pendingQueue = []
  flushTimer = null

  const fileList = [...new Set(batch.map(b => b.fileID))]

  // 直接调用客户端 API，省掉云函数中转的冷启动和网络开销
  Taro.cloud.getTempFileURL({
    fileList
  }).then((res: any) => {
    const resultList = res.fileList || []
    const urlMap = new Map<string, string>()
    resultList.forEach((item: any) => {
      if (item.tempFileURL) {
        urlMap.set(item.fileID, item.tempFileURL)
        urlCache.set(item.fileID, item.tempFileURL)
      }
    })
    persistCache()
    batch.forEach(b => b.resolve(urlMap.get(b.fileID) || b.fileID))
  }).catch(() => {
    batch.forEach(b => b.resolve(b.fileID))
  })
}

function requestTempURL(fileID: string): Promise<string> {
  if (urlCache.has(fileID)) return Promise.resolve(urlCache.get(fileID)!)

  return new Promise(resolve => {
    pendingQueue.push({ fileID, resolve })
    if (!flushTimer) {
      flushTimer = setTimeout(flushQueue, 50)
    }
  })
}

export default function CloudImage({ src, className, mode, onClick }: CloudImageProps) {
  const [realSrc, setRealSrc] = useState(src?.startsWith('cloud://') ? '' : src)

  useEffect(() => {
    if (!src || !src.startsWith('cloud://')) {
      setRealSrc(src || '')
      return
    }

    requestTempURL(src).then(setRealSrc)
  }, [src])

  if (!realSrc) return null

  return <Image className={className} src={realSrc} mode={mode} onClick={onClick} />
}
