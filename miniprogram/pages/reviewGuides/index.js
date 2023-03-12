// miniprogram/pages/reviewGuides/index.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * Page initial data
   */
  data: {
    pages:[["Grade 9", "Grade 10", "Grade 11", "Grade 12"], ["Math", "Physics", "Chemistry", "Biology", "IT"], ["1st Sem. Midterm", "1st Sem. Final", "2nd Sem. Midterm", "2nd Sem. Final"],["test range", "mock test", "review guide"]],
    currentPage:0,
    grade: 0,
    subject: 0,
    exam: 0
  },

  redirect: function(event){
    if (this.data.gotUserData){

      wx.navigateTo({
        url: event.currentTarget.dataset.link
      })
    }
  },

  nextPage: function(event){
    let cur = this.data.currentPage;
    if (cur == 0){
      this.setData({
        grade:event.currentTarget.dataset.num
      })
    }
    if (cur == 1){
      this.setData({
        subject:event.currentTarget.dataset.num
      })
    }
    if (cur == 2){
      this.setData({
        exam:event.currentTarget.dataset.num
      })
    }
    if (cur<3){
      this.setData({
        currentPage: cur +1
      })
    }
    
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {

  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {

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