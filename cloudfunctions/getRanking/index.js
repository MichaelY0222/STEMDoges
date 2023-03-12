// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'shsid-3tx38'
})
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  console.log(1)
  try {
    var arr = []
    var x = 0
    for (let i = 0; i < 3; i++) {
      x = await db.collection('userInfo').where({bitdayVerified: true}).skip(i*100).get()
      console.log(x)
      arr = arr.concat(x.data)
    }    
    console.log(arr)
    return arr

  } catch (e) {
    console.log(e)
  }
}