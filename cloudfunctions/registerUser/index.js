// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let determineNeedNewUser = await cloud.database().collection("userData").where({
    userId: wxContext.OPENID,
  }).get();
  if (determineNeedNewUser.data.length !== 0) {
    return {
      status: "error",
      reason: "User already registered"
    };
  } else {
    await cloud.database().collection("userData").add({
      data: {
        userId: wxContext.OPENID,
        name: event.name,
        grade: event.grade,
        class: event.class,
        gNumber: event.gNumber
      }
    });
  }
}