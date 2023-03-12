// miniprogram/pages/index/index.js
const app = getApp();
const db = wx.cloud.database();

Page({

  /**
   * Page initial data
   */
  data: {
    isAdmin: false,
    name:"human",
    weekNum:1,
    showWeekResults:false,
    lastWeek:0,
    gotUserData: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {

    
  },

  getUser(){
    let that = this;
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        //call 'login' cloud function
        app.globalData.openid = res.result.openid
        db.collection('userInfo').where({
          _openid: app.globalData.openid
        })
          .get({
            success: function (res) {

              // if the user openid is not in database
              if (res.data.length == 0) {
                // create new user object in database
                that.getUserData();
                db.collection('userInfo').add({
                  data: {
                    monthAnswer: 0, //number answered every month
                    monthCorrect: 0, // number of questions answered correctly every month
                    totalAnswer: 0, //total number of questions answered
                    totalCorrect: 0, // total number of questions answered correctly
                    record: []
                  },
                  success: function (res) {
                    //if success, log the new userinfo object
                    console.log(res)
                    
                    that.setData({
                      gotUserData:true
                    });
                  }
                })
              } else{
                if (res.data[0].wechatInfo == null)
                  that.getUserData();

                  
                
                  that.setData({
                    gotUserData:true
                  });
                  
                that.setData({
                  name:res.data[0].wechatInfo.nickName,
                  isAdmin: res.data[0].admin?true:false
                })
                app.isAdmin = res.data[0].admin?true:false;
                if (res.data[0].lastWeekSeen != app.weekNum) // if a new week started
                  that.showWeeklyAnswers(res.data[0].lastWeekSeen);
                else
                  console.log("no")
              } 
              
            }
          })
        },
        fail: e => {
          console.error(e)
        }
      })

  },

  

  getUserData: function () {
    // 获取用户信息
    let that = this;
    
    wx.getSetting({
      success(res) {
        console.log(res);
        that.showSettingToast("请授权")
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              //info stored into global data; can be called anytime
              console.log(res);
              app.globalData.userInfo = res.userInfo
              db.collection('userInfo')
                .where({_openid: app.globalData.openid})
                .update({
                  data: {
                    wechatInfo: app.globalData.userInfo,
                  }
                })
                that.setData({
                  gotUserData:true
                });
            }
          })
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
        } else {
          console.log("未授权=====")
          that.showSettingToast("请授权")
          
        }
      }
    })

  },

  
  showSettingToast: function(e) {
    wx.showModal({
      title: '提示！',
      confirmText: '去设置',
      showCancel: false,
      content: e,
      success: function(res) {
        if (res.confirm) {
          wx.openSetting()
        }
      }
    })
  },
  getBitDayNum(){
    let that = this;
    db.collection('settings')
    .where({type:"bitday"})
    .get({
      success: function (res){
        app.bitdayNum = res.data[0].day;
      }
    })
  },
  updateWeekNum(){
    let that = this;
    db.collection('settings')
    .where({type:"weekInfo"})
    .get({
      success: function (res){
        app.weekNum = res.data[0].weekNum;
        that.setData({
          weekNum: app.weekNum
        }) 
      }
    })
  },
  hidePopup(event){
    this.setData({
      showWeekResults: false,
      lastWeekSeen: app.weekNum
    })
  },
  showWeeklyAnswers(weeknum){
    console.log(weeknum)
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .update({
      data: {
        isFinished: false,
        lastW
      }
    })

    if (weeknum == null)
      return 0;

    this.setData({
      showWeekResults: true,
      lastWeek: weeknum
    })
  },

  redirect: function(event){
    if (this.data.gotUserData){

      wx.navigateTo({
        url: event.currentTarget.dataset.link
      })
    }
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
    this.updateWeekNum();
    this.getUser();
    this.getBitDayNum();
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