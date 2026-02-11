// 云函数入口 - 管理员更新订单（绕过数据库权限限制）
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 生成取餐号：当天日期 + 顺序号 001-999
async function generatePickupNumber() {
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0')

  // 查询当天已分配的最大取餐号
  const res = await db.collection('orders')
    .where({
      pickup_number: db.RegExp({ regexp: '^' + dateStr, options: '' })
    })
    .orderBy('pickup_number', 'desc')
    .limit(1)
    .get()

  let seq = 1
  if (res.data.length > 0 && res.data[0].pickup_number) {
    const lastSeq = parseInt(res.data[0].pickup_number.slice(-3), 10)
    seq = lastSeq + 1
    if (seq > 999) seq = 999
  }

  return dateStr + seq.toString().padStart(3, '0')
}

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
    const updateData = {
      ...data,
      updated_at: db.serverDate()
    }

    // 当状态变为"待取餐"(2)时，自动生成取餐号
    if (data.status === 2) {
      // 先查询当前订单是否已有取餐号
      const orderRes = await db.collection('orders').where({ id: orderId }).limit(1).get()
      const order = orderRes.data[0]
      if (order && !order.pickup_number) {
        updateData.pickup_number = await generatePickupNumber()
      }
    }
    
    const res = await db.collection('orders').where({ id: orderId }).update({
      data: updateData
    })
    
    if (res.stats.updated === 0) {
      return { success: false, error: '订单不存在' }
    }
    
    return { success: true, message: '更新成功', pickup_number: updateData.pickup_number || null }
  } catch (err) {
    console.error('更新订单失败:', err)
    return { success: false, error: err.message || '更新失败' }
  }
}
