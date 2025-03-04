// pages/scanFailure/scanFailure.js
Page({

  /**
   * Page initial data
   */
  data: {

  },

  onLoad: function() {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('errorDetail', (data) => {
      this.setData({
        caption: data,
      });
    })
  },
  
  onOkClick: function() {
    wx.navigateBack();
  }
})