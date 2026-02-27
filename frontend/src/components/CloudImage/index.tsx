import { useState, useEffect } from 'react'
import { Image, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { cloudReady } from '../../services/cloud'

interface CloudImageProps {
  src: string
  className?: string
  mode?: 'aspectFill' | 'aspectFit' | 'widthFix' | 'scaleToFill' | 'heightFix'
  onClick?: () => void
}

interface CacheEntry {
  url: string
  ts: number
}

// 临时 URL 缓存有效期（1.5 小时，留余量避免签名过期 403）
const CACHE_TTL = 1.5 * 60 * 60 * 1000

const urlCache = new Map<string, CacheEntry>()

// 启动时从 Storage 恢复缓存（过滤掉过期条目）
try {
  const stored = Taro.getStorageSync('cloudImageCache')
  if (stored) {
    const parsed = JSON.parse(stored) as Record<string, CacheEntry>
    const now = Date.now()
    Object.entries(parsed).forEach(([k, v]) => {
      if (v && v.url && v.ts && now - v.ts < CACHE_TTL) {
        urlCache.set(k, v)
      }
    })
  }
} catch {}

let persistTimer: any = null
function persistCache() {
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    try {
      const obj: Record<string, CacheEntry> = {}
      urlCache.forEach((v, k) => { obj[k] = v })
      Taro.setStorageSync('cloudImageCache', JSON.stringify(obj))
    } catch {}
  }, 500)
}

let pendingQueue: { fileID: string; resolve: (url: string) => void }[] = []
let flushTimer: any = null

async function flushQueue() {
  if (pendingQueue.length === 0) return

  const batch = [...pendingQueue]
  pendingQueue = []
  flushTimer = null

  const fileList = [...new Set(batch.map(b => b.fileID))]

  try {
    // 等待云开发初始化完成
    await cloudReady

    console.log('[CloudImage] 请求临时URL, fileList:', fileList)
    // 通过云函数获取临时链接，绕过客户端存储权限限制
    const res: any = await Taro.cloud.callFunction({
      name: 'getTempFileURL',
      data: { fileList }
    })
    const resultList = (res.result as any)?.fileList || []
    console.log('[CloudImage] getTempFileURL 返回:', JSON.stringify(resultList.map((item: any) => ({
      fileID: item.fileID,
      tempFileURL: item.tempFileURL ? item.tempFileURL.substring(0, 60) + '...' : '',
      status: item.status,
      errMsg: item.errMsg
    }))))
    const urlMap = new Map<string, string>()
    const now = Date.now()
    resultList.forEach((item: any) => {
      if (item.tempFileURL) {
        urlMap.set(item.fileID, item.tempFileURL)
        urlCache.set(item.fileID, { url: item.tempFileURL, ts: now })
      } else {
        console.warn('[CloudImage] 未获取到临时URL:', item.fileID, 'status:', item.status, 'errMsg:', item.errMsg)
      }
    })
    persistCache()
    batch.forEach(b => b.resolve(urlMap.get(b.fileID) || b.fileID))
  } catch (err) {
    console.error('[CloudImage] getTempFileURL 调用失败:', err)
    batch.forEach(b => b.resolve(b.fileID))
  }
}

function requestTempURL(fileID: string): Promise<string> {
  const cached = urlCache.get(fileID)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return Promise.resolve(cached.url)
  }
  urlCache.delete(fileID)

  return new Promise(resolve => {
    pendingQueue.push({ fileID, resolve })
    if (!flushTimer) {
      flushTimer = setTimeout(flushQueue, 50)
    }
  })
}

// 清除指定 fileID 的缓存并重新请求临时 URL
function invalidateAndRefetch(fileID: string): Promise<string> {
  urlCache.delete(fileID)
  persistCache()
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

  const handleError = () => {
    // 图片加载失败（如 403），清除缓存并重新获取临时 URL
    if (src?.startsWith('cloud://')) {
      console.warn('[CloudImage] 加载失败，重新获取临时URL:', src)
      invalidateAndRefetch(src).then(setRealSrc)
    }
  }

  if (!realSrc) return <View className={className} />

  return <Image className={className} src={realSrc} mode={mode} onClick={onClick} onError={handleError} />
}
