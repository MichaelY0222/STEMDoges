// pages/events/piday/mathquizzes_ques/mathquizzes_ques.js
const db = wx.cloud.database();
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    number:0,
    points:0,
    answers:{},
    questions:{},
  },

  /**
   * 生命周期函数--监听页面加载
   */

    onLoad: function(options) {    
      this.setData({    
        number: options.number  
      })    
      this.initialize();

    },
    initialize(){
      let that = this;
      db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .get({
          success: function (res) {
            that.setData({
              answers: res.data[0]["mathquizzes"],
              points: res.data[0]["quizzesPoints"]
            })
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
  try_again(){
    var that = this
    var new_answer = that.data.answers
    console.log(that.data)
    new_answer[that.data.number]["status"] = 1
    that.setData({
      answers: new_answer
    })
    db.collection('userInfo').where({ _openid: app.globalData.openid })
      .update({
        data: {
            mathquizzes: new_answer
    }})
  },
  submitInfo(event){
    var that = this;
    console.log(event.detail.value);
    console.log(that.data.questions[parseInt(that.data.number)-1]["answer"]);
    let ans_status = JSON.stringify(event.detail.value) === JSON.stringify(that.data.questions[parseInt(that.data.number)-1]["answer"]);
    let db = wx.cloud.database()
    if (ans_status == true){
      var new_answer = that.data.answers
      var new_points = that.data.points
      var new_trial = new_answer[that.data.number]["trials"] +1
      new_answer[that.data.number]["status"] = 2
      new_answer[that.data.number]["trials"] = new_trial
      new_points = new_points + 50
      that.setData({
        answers: new_answer,
        points: new_points
      })
      db.collection('userInfo').where({ _openid: app.globalData.openid })
      .update({
        data: {
            mathquizzes: new_answer,
            quizzesPoints: new_points
      }})
    }
    if (ans_status == false){
      var new_answer = that.data.answers
      var new_points = that.data.points
      var new_trial = new_answer[that.data.number]["trials"] +1
      new_answer[that.data.number]["trials"] = new_trial
      new_answer[that.data.number]["status"] = 3
      new_answer[that.data.number]["my_answer"]= event.detail.value
      that.setData({
        answers: new_answer,
      })
      db.collection('userInfo').where({ _openid: app.globalData.openid })
      .update({
        data: {
            mathquizzes: new_answer
      }})
    }

  },
  onReady() {

  },
  // onLazyLoad(info) {
  //   console.log(info)
  // },
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