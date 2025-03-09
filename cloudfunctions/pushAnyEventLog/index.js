// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  if (event.type === "Trivia" || event.type === "Scav") {
    let checkQuestionStatus = await cloud.database().collection("piDayActivityLog").where({
      userId: wxContext.OPENID,
      questionId: event.questionId
    }).get();
  
    if (checkQuestionStatus.data.length !== 0) {
      return {
        status: "error",
        reason: "User already logged for this activity"
      };
    } else {
      await cloud.database().collection("piDayActivityLog").add({
        data: {
          userId: wxContext.OPENID,
          type: event.type,
          questionId: event.questionId,
          status: event.status,
        }
      });
    }
  }

  return {
    status: "error",
    reason: "Invalid action type"
  };
}