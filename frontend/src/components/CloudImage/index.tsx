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

// 批量请求队列：合并短时间内的多个请求
let pendingQueue: { fileID: string; resolve: (url: string) => void }[] = []
let flushTimer: any = null

function flushQueue() {
  if (pendingQueue.length === 0) return

  const batch = [...pendingQueue]
  pendingQueue = []
  flushTimer = null

  const fileList = [...new Set(batch.map(b => b.fileID))]

  Taro.cloud.callFunction({
    name: 'getTempFileURL',
    data: { fileList }
  }).then((res: any) => {
    const resultList = res.result?.fileList || []
    const urlMap = new Map<string, string>()
    resultList.forEach((item: any) => {
      if (item.tempFileURL) {
        urlMap.set(item.fileID, item.tempFileURL)
        urlCache.set(item.fileID, item.tempFileURL)
      }
    })
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
