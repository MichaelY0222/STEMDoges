const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 修改数据库信息云函数入口函数
exports.main = async (event, context) => {
  try {
    var weekNum = event.weekNum;
    setInterval(() => {
      var now = new Date();
      // friday 9pm
      if (now.getHours() == 21 && now.getMinutes() == 0 && now.getSeconds() ==0 && now.getDay() == 5){
        db.collection('settings')
        .where({type:"autoUpdate"})
        .get({
          success: function (res){
            if (res.data[0].auto == true){
              db.collection('settings')
              .where({type:"weekInfo"})
              .update({
                data: {
                  weekNum: weekNum+1
                }
              })
              weekNum++;
            }
          }
        })
        
      }
    }, 1000);
  }catch (e) {
    return {
      success: false,
      errMsg: e
    }
  }
}