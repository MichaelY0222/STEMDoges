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
          timestamp: Date.now()
        }
      });
    }
  } else if (event.type === "newActivityCode") {
    await cloud.database().collection("piDayTemp").add({
      data: {
        issuerId: wxContext.OPENID,
        logId: event.logId,
        eventId: event.eventId,
        eventName: event.eventName,
        points: event.points,
        used: false,
        timestamp: Date.now()
      }
    });
  } else if (event.type === "delActivityCode") {
    await cloud.database().collection("piDayTemp").where({
      logId: event.logId
    }).remove()
  } else if (event.type === "useActivityCode") {
    await cloud.database().collection("piDayTemp").where({
      logId: event.logId
    }).update({
      data: {
        used: true
      }
    })
  } else if (event.type === "activity") {
    await cloud.database().collection("piDayActivityLog").add({
      data: {
        userId: wxContext.OPENID,
        type: event.type,
        issuerId: event.issuerId,
        logId: event.logId,
        eventId: event.eventId,
        eventName: event.eventName,
        points: event.points,
      }
    });
  }

  return {
    status: "error",
    reason: "Invalid action type"
  };
}