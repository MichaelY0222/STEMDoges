// pages/events/piday/mathquizzes/mathquizzes.js
const db = wx.cloud.database();
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    points:0,
    answers:{},
    questions:{},
    colors:["darkgrey","#FFFFFF","lightgrey","lightgrey"],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initialize();
  },
  initialize(){
    let that = this;
    db.collection('userInfo')
      .where({ _openid: app.globalData.openid })
      .get({
        success: function (res) {
          var ans = res.data[0]["mathquizzes"]
          var dd = new Date().getDate()
          for(var i = 0; i < (dd-12+1)*3; i++){
            if(ans[i+1]["status"]==0){
              ans[i+1]["status"]=1;
            }
          }
          that.setData({
            answers: ans,
            points: res.data[0]["quizzespoints"]
          })
          db.collection('userInfo').where({ _openid: app.globalData.openid })
          .update({
            data: {
                mathquizzes: ans
          }})
        }
      })
    db.collection('mathquizzes')
      .get({
        success: function (res) 
        {
          that.setData({
            questions:res.data
          })
        }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },
    to_question(event){
      console.log(this.data.answers)
      if(this.data.answers[event.currentTarget.dataset.id]["status"] != 0){
        wx.navigateTo({
          url: "../mathquizzes_ques/mathquizzes_ques?number="+(event.currentTarget.dataset.id),
        })
      }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})