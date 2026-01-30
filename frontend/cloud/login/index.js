// 云函数入口 - 用户登录
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  if (!openid) {
    return { error: '获取 openid 失败' }
  }

  // 查找或创建用户
  const usersRes = await db.collection('users').where({ _openid: openid }).limit(1).get()
  
  let user = usersRes.data[0]

  if (!user) {
    // 获取最大用户 ID
    const maxRes = await db.collection('users').orderBy('id', 'desc').limit(1).get()
    const newId = (maxRes.data[0]?.id || 0) + 1

    // 创建新用户
    const newUser = {
      id: newId,
      _openid: openid,
      nickname: `用户${newId}`,
      avatar: '',
      phone: '',
      points: 0,
      role: 'customer',
      created_at: db.serverDate(),
      updated_at: db.serverDate()
    }

    await db.collection('users').add({ data: newUser })
    user = { ...newUser, _openid: undefined }
  }

  // 返回用户信息（不返回 openid）
  const { _openid, ...userInfo } = user
  return { user: userInfo }
}
