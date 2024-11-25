const db = wx.cloud.database();
const app = getApp();

// miniprogram/pages/bitday/leader board/index.js
Page({

  /**
   * Page initial data
   */
  data: {
    users:[],
    user: [],
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    // this.getUsers();
 //   this.getRanking();
    this.getGamesUsers();
    //console.log("hello", this.data.day);
  },

  getGamesUsers(){
        let that = this;

        wx.cloud.callFunction({ // get openid
          name: 'getRanking',
          success: res => {
            console.log(res.result.data)
            let users = [];
            let user = [];
            for (var i=0; i<res.result.data.length; i++)
            {
              users[i] = [i+1, res.result.data[i].userRealName, res.result.data[i].gamesPoints, res.result.data[i].userGrade, res.result.data[i].userClass];
              if (res.result.data[i]._openid==app.globalData.openid){
                user = [i+1, res.result.data[i].userRealName, res.result.data[i].gamesPoints, res.result.data[i].userGrade, res.result.data[i].userClass];
              }
            }
            console.log(users);
            console.log(user);
            that.setData({
              users:users,
              user:user
            })
          },
          fail: err => {
            console.error(err)
          }
        })

        // db.collection('userInfo').orderBy('gamesPoints', 'desc')
        // .limit(100)
        // .get({
        //   success: function (res) {
        //     let users = [];
        //     let user = [];
        //     for (var i=0; i<res.data.length; i++)
        //     {
        //       users[i] = [i+1, res.data[i].userRealName, res.data[i].gamesPoints,res.data[i].userGrade, res.data[i].userClass];
        //       if (res.data[i]._openid==app.globalData.openid){
        //         user = [i+1, res.data[i].userRealName, res.data[i].gamesPoints,res.data[i].userGrade, res.data[i].userClass];
        //       }
        //     }
        //     console.log(users);
        //     console.log(user);
        //     that.setData({
        //       users:users,
        //       user:user
        //     })
        //   }
        // })
      },

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