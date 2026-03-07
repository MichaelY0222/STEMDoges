// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  if (event.type === "Trivia" || event.type === "Scav") {
    let checkQuestionStatus = await cloud.database().collection("piDay2026ActivityLog").where({
      userId: wxContext.OPENID,
      questionId: event.questionId
    }).get();
  
    if (checkQuestionStatus.data.length !== 0) {
      return {
        status: "error",
        reason: "User already logged for this activity",
        userId: wxContext.OPENID
      };
    } else {
      await cloud.database().collection("piDay2026ActivityLog").add({
        data: {
          userId: wxContext.OPENID,
          type: event.type,
          questionId: event.questionId,
          status: event.status,
          timestamp: Date.now()
        }
      });
      return {
        status: "success",
        reason: "Activity log added",
        userId: wxContext.OPENID
      };
    }
  } else if (event.type === "newActivityCode") {
    await cloud.database().collection("piDay2026Temp").add({
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
    return {
      status: "success",
      reason: "Activity code generated",
      userId: wxContext.OPENID
    };
  } else if (event.type === "delActivityCode") {
    await cloud.database().collection("piDay2026Temp").where({
      logId: event.logId
    }).remove();
    return {
      status: "success",
      reason: "Activity code deleted",
      userId: wxContext.OPENID
    };
  } else if (event.type === "useActivityCode") {
    await cloud.database().collection("piDay2026Temp").where({
      logId: event.logId
    }).update({
      data: {
        used: true
      }
    });
    return {
      status: "success",
      reason: "Activity code marked as used",
      userId: wxContext.OPENID
    };
  } else if (event.type === "activity") {
    await cloud.database().collection("piDay2026ActivityLog").add({
      data: {
        userId: wxContext.OPENID,
        type: event.type,
        issuerId: event.issuerId,
        logId: event.logId,
        eventId: event.eventId,
        eventName: event.eventName,
        points: event.points,
        timestamp: Date.now()
      }
    });
    return {
      status: "success",
      reason: "Activity log added",
      userId: wxContext.OPENID
    };
  } else if (event.type === "signup") {
    await cloud.database().collection("piDay2026EventsSignUp").add({
      data: {
        eventId: event.eventId,
        eventName: event.eventName,
        userId: wxContext.OPENID,
        studentName: event.studentName,
        studentGrade: event.studentGrade,
        studentClass: event.studentClass,
        studentGNumber: event.studentGNumber,
        timestamp: Date.now()
      }
    });
    let eventRes = await cloud.database().collection("piDay2026Events").where({
      eventId: event.eventId
    }).get();
    let regNum = eventRes.data[0].registered + 1;
    if (regNum >= eventRes.data[0].capacity){
      await cloud.database().collection("piDay2026Events").where({
        eventId: event.eventId
      }).update({
        data: {
          registered: regNum,
          active: false
        }
      })
    } else {
      await cloud.database().collection("piDay2026Events").where({
        eventId: event.eventId
      }).update({
        data: {
          registered: regNum
        }
      })
    }
    return {
      status: "success",
      reason: "Activity signup received",
      userId: wxContext.OPENID
    };
  } else {
    return {
      status: "error",
      reason: "Invalid action type",
      userId: wxContext.OPENID
    };
  }
}