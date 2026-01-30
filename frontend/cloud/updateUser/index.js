// 云函数入口 - 更新用户信息
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  if (!openid) {
    return { error: '未登录' }
  }

  const { nickname, avatar } = event
  const updateData = { updated_at: db.serverDate() }
  
  if (nickname) updateData.nickname = nickname
  if (avatar) updateData.avatar = avatar

  await db.collection('users').where({ _openid: openid }).update({ data: updateData })

  // 返回更新后的用户信息
  const userRes = await db.collection('users').where({ _openid: openid }).limit(1).get()
  const user = userRes.data[0]
  
  if (user) {
    const { _openid, ...userInfo } = user
    return { user: userInfo }
  }

  return { error: '用户不存在' }
}
