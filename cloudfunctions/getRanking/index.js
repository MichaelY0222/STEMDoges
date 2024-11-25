// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  return cloud.database().collection('userInfo').orderBy('gamesPoints', 'desc').limit(100).get()
  // return {
  //   str: "hehe",
  //   users:users,
  //   user:user
  // }
}