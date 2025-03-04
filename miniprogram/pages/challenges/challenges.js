// pages/challenges/challenges.js
Page({

  /**
   * Page initial data
   */
  data: {

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {

  },

  redirect: function(event) {
    wx.navigateTo({
      url: event.currentTarget.dataset.link
    });
  },
})