// miniprogram/pages/databooklet/IB/Chem/index.js
Page({

  /**
   * Page initial data
   */
  data: {
    pages:["0001","0002","0003"]
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

  },

  selectImage:function(event){
    var imgList = []
    for (var i = 0; i < this.data.pages.length; i++) {
      imgList.push("cloud://shsid-3tx38.7368-shsid-3tx38-1303924092/Data Booklets/General/IT/G9/" + String(this.data.pages[i]) + ".jpg")
    }
    var src = event.currentTarget.dataset.src;
       wx.previewImage({
         current: src,
         urls: imgList
       })
   }

})