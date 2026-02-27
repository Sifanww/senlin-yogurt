import Taro from '@tarojs/taro'
import { getImageUrl as getHttpImageUrl } from './request'

// 云开发环境 ID（在微信开发者工具云开发控制台获取）
// 请替换为你自己的环境 ID
const CLOUD_ENV = 'cloud1-7gzyxt14bc720a11'

// 初始化云开发
let cloudInitialized = false

let _resolveCloudReady: () => void
export const cloudReady = new Promise<void>(resolve => { _resolveCloudReady = resolve })

export function initCloud() {
  if (cloudInitialized) return

  if (Taro.cloud) {
    Taro.cloud.init({
      env: CLOUD_ENV,
      traceUser: true
    })
    cloudInitialized = true
    _resolveCloudReady()
    console.log('☁️ 云开发初始化成功')
  } else {
    console.error('❌ 当前环境不支持云开发')
  }
}

// 获取数据库实例
export function getDb() {
  if (!Taro.cloud) {
    throw new Error('云开发不可用')
  }
  return Taro.cloud.database()
}

// 通用查询方法
export async function queryCollection<T = any>(
  collection: string,
  options?: {
    where?: Record<string, any>
    orderBy?: { field: string; order: 'asc' | 'desc' }
    limit?: number
    skip?: number
  }
): Promise<T[]> {
  const db = getDb()
  let query = db.collection(collection)

  if (options?.where) {
    query = query.where(options.where)
  }
  if (options?.orderBy) {
    query = query.orderBy(options.orderBy.field, options.orderBy.order)
  }
  if (options?.skip) {
    query = query.skip(options.skip)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const res = await query.get()
  return res.data as T[]
}

// 根据 ID 查询单条记录
export async function getById<T = any>(collection: string, id: number): Promise<T | null> {
  const db = getDb()
  const res = await db.collection(collection).where({ id }).limit(1).get()
  return res.data[0] as T || null
}

// 添加记录
export async function addRecord(collection: string, data: any): Promise<string> {
  const db = getDb()
  const res = await db.collection(collection).add({ data }) as any
  return res._id as string
}

// 更新记录
export async function updateRecord(
  collection: string,
  id: number,
  data: Record<string, any>
): Promise<void> {
  const db = getDb() as any
  const res = await db.collection(collection).where({ id }).update({ data })
  console.log(`更新 ${collection} id=${id} 结果:`, res)
  if (res.stats?.updated === 0) {
    console.warn(`警告: 没有记录被更新，请检查数据库权限设置`)
  }
}

// 删除记录
export async function deleteRecord(collection: string, id: number): Promise<void> {
  const db = getDb() as any
  await db.collection(collection).where({ id }).remove()
}

// 获取云存储文件的临时链接
export async function getTempFileURL(fileID: string): Promise<string> {
  if (!Taro.cloud) return fileID
  
  const res = await Taro.cloud.getTempFileURL({
    fileList: [fileID]
  })
  return res.fileList[0]?.tempFileURL || fileID
}

// 获取图片完整 URL（兼容云存储和普通 URL）
export function getImageUrl(path: string): string {
  if (!path) return ''
  // 如果是云存储 fileID 或完整 URL，直接返回
  if (path.startsWith('cloud://') || path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // 兼容后端返回的相对路径（如 /uploads/xxx.jpg）
  return getHttpImageUrl(path)
}

export default {
  initCloud,
  getDb,
  queryCollection,
  getById,
  addRecord,
  updateRecord,
  deleteRecord,
  getTempFileURL,
  getImageUrl
}
