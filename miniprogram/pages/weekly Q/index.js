// miniprogram/pages/index/index.js
const app = getApp();
const db = wx.cloud.database();

Page({

  /**
   * Page initial data
   */
  data: {
    weekNum: 0,
    totalRanking: []
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    this.setData({
      weekNum:app.weekNum
    })
    
  },


  redirect: function(event){
    wx.navigateTo({
      url: event.currentTarget.dataset.link
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
    db.collection('userInfo_bak5').where({isFinished:true, lastWeekSeen: app.weekNum}).count({
      success: function(res) {
        console.log(res);
        for (let i=0 ; i<res.total; i+=20){
          db.collection('userInfo_bak5').where({isFinished:true, lastWeekSeen: app.weekNum}).skip(i).get({
            success: function(res) {
              people = people.concat(res.data);

              people.sort((a, b) => b["weeklyPoints-"+app.weekNum] - a["weeklyPoints-"+app.weekNum])
              
              that.setData({
                totalRanking:people
              })

              var totalRank = people.map((a) => a._openid).indexOf(app.globalData.openid) + 1
              that.setData({ rank: totalRank })
              for (let j=0;j<people.length; j++){
                console.log((j+1).toString() +" " + people[j].userRealName +" "+ people[j].userGrade + "(" + people[j].userClass + ")" + " "+people[j]["weeklyPoints-"+app.weekNum]);
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
    this.getRanking();
  },


})