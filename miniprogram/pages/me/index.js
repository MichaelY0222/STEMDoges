// miniprogram/pages/me/index.js
const app = getApp();
const db = wx.cloud.database();

Page({

  /**
   * Page initial data
   */
  data: {
    name:"",
    pfpUrl:""
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {

  },

  getUser(){
    //get user nickname and profile pic
    let that = this;
    db.collection('userInfo').where({
      _openid: app.globalData.openid
    })
      .get({
        success: function (res) {
          that.setData({
            name:res.data[0].nickName,
            pfpUrl:res.data[0].avatarUrl
          })
          
        }
      })
    },
  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {
    this.getUser();
  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function () {

  }
})