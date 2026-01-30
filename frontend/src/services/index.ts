// API 服务切换
// 使用云开发时，导入 cloudApi
// 使用本地后端时，导入 api

// ========== 云开发模式 ==========
export * from './cloudApi'
export { getImageUrl } from './cloud'

// ========== 本地开发模式（默认）==========
// export * from './api'
// export { getImageUrl } from './request'

// 使用说明：
// 1. 本地开发调试时，使用默认的 api（HTTP 请求）
// 2. 上线使用云开发时，注释掉 api，取消 cloudApi 的注释
