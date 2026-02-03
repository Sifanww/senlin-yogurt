// 云函数入口 - 管理员更新订单（绕过数据库权限限制）
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  if (!openid) {
    return { success: false, error: '未登录' }
  }

  // 验证是否为管理员
  const userRes = await db.collection('users').where({ _openid: openid }).limit(1).get()
  const user = userRes.data[0]
  
  if (!user || user.role !== 'admin') {
    return { success: false, error: '无权限，仅管理员可操作' }
  }

  const { orderId, data } = event
  
  if (!orderId) {
    return { success: false, error: '缺少订单ID' }
  }

  try {
    // 使用云函数的管理员权限更新订单
    const updateData = {
      ...data,
      updated_at: db.serverDate()
    }
    
    const res = await db.collection('orders').where({ id: orderId }).update({
      data: updateData
    })
    
    if (res.stats.updated === 0) {
      return { success: false, error: '订单不存在' }
    }
    
    return { success: true, message: '更新成功' }
  } catch (err) {
    console.error('更新订单失败:', err)
    return { success: false, error: err.message || '更新失败' }
  }
}
