const db = wx.cloud.database();
const app = getApp();

// miniprogram/pages/bitday/leader board/index.js
Page({

  /**
   * Page initial data
   */
  data: {
    users:[],
    user: null,
    rank:0,
    totalRanking:[]
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    this.getUsers();
    this.getRanking();
  },

  getUsers(){
    let that = this;
    db.collection('userInfo')
    //.orderBy('totalCorrect', 'desc') // descending order of 'totalCorrect' data of user
    .limit(20)
    .where({bitdayVerified: true})
    .get({
      success: function (res) {
        console.log(res.data[0].userRealName);
        that.setData({
          users:res.data
        })
      }
    })

    db.collection('userInfo')
    .where({_openid: app.globalData.openid})
    .get({
      success: function (res) {
        that.setData({
          user:res.data[0]
        })
      }
    })
  },

  getRanking() {
    let that = this;
    // wx.cloud.callFunction({
    //   name: 'getRanking',
    //   success: res => {
    //     var arr = res.result
    //     console.log(res.result);
    //     arr.sort((a, b) => b.bitdayPoints - a.bitdayPoints)
    //     that.setData({ totalRanking: arr })
    //     var totalRank = arr.map((a) => a._openid).indexOf(app.globalData.openid) + 1
    //     that.setData({ rank: totalRank })
        
    //   },
    // })
    
    let people = [];
    db.collection('userInfo').where({moledayVerified:true}).count({
      success: function(res) {
        for (let i=0 ; i<res.total; i+=20){
          db.collection('userInfo').where({moledayVerified:true}).skip(i).get({
            success: function(res) {
              people = people.concat(res.data);

              people.sort((a, b) => b.moledayPoints - a.moledayPoints)
              
              that.setData({
                totalRanking:people
              })

              var totalRank = people.map((a) => a._openid).indexOf(app.globalData.openid) + 1
              that.setData({ rank: totalRank })
              for (let j=0;j<people.length; j++){
                console.log((j+1).toString() +" " + people[j].userRealName +" "+ people[j].userGrade + "(" + people[j].userClass + ")" + " "+people[j].moledayPoints);
              }
            }
          })
        }
      }
    })
    
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