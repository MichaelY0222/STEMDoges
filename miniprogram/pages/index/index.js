const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    isAdmin: false,
    name: "human",
    weekNum: 1,
    showWeekResults: false,
    lastWeek: 0,
    gotUserData: false,
    correct: false,
    showPopup: [false],
    avatarUrl: '', 
    nickName: ''
  },

  onLoad: function (options) {},

  getUser() {
    let that = this;
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openid = res.result.openid
        db.collection('userInfo').where({
          _openid: app.globalData.openid
        })
          .get({
            success: function (res) {
              if (res.data!=0) {
                that.setData({
                  showPopup: [true]
                })
              }
              console.log(showPopup);
              that.getUserData();     
            }
          })
      },
      fail: e => {
        console.error(e)
      }
    })
  },

  submitInfo(event){
    let name =  event.detail.value.name;
    let classNum =  event.detail.value.class;
    let grade =  event.detail.value.grade;
    let gnum = event.detail.value.gnum;
    console.log(name, classNum, grade, gnum);
    if (name != null && name != '' && classNum!= null && classNum!='' && gnum != '' && gnum!=null &&grade!='' && grade!=null) {
      let ques = {}
      for(var i = 0; i < 15; i++) {
        ques[i+1] = {status: 0, trials: 0}
      }
      db.collection('userInfo').add({
        data:{
          openid: app.globalData.openid,
          userRealName: name,
          userClass: classNum,
          userGrade: grade,
          userGnum: gnum,
          mathquizzes: ques,
          bitdayVerified: true,
          bitdayPoints: 0,
          quizzesPoints: 0,
          fairPoints: 0,
          pointsPoints: 0,
          gamesPoints: 0
        }
      })
      this.setData({
        showingPopup: false,
        showPopup:[],
        gotUserData:true
      })
    }
    wx.getUserProfile({
      desc: '登录',
      success: (res) => {
        this.setData({
          nickName: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl
        })
        db.collection('userInfo').where({_openid: app.globalData.openid})
                .update({
                  data: {
                    nickName: this.data.nickName,
                    avatarUrl: this.data.avatarUrl
                  }
                })
                that.setData({
                  gotUserData:true
                })
        console.log(this.data.nickName,this.data.avatarUrl);
      }
    }) 
  },

  getUserData: function () {},
  
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

  getBitDayNum() {
    let that = this;
    db.collection('settings')
    .where({type:"bitday"})
    .get({
      success: function (res) {
        app.bitdayNum = res.data[0].day;
      }
    })
  },

  updateWeekNum() {
    let that = this;
    db.collection('settings')
    .where({type:"weekInfo"})
    .get({
      success: res => {
        app.weekNum = res.data[0].weekNum;
        that.setData({
          weekNum: app.weekNum
        })  
      }
    })
  },

  hidePopup(event) {
    this.setData({
      showWeekResults: false,
      lastWeekSeen: app.weekNum
    })
  },

  showWeeklyAnswers(weeknum) {
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

  redirect: function(event) {
      wx.navigateTo({
        url: event.currentTarget.dataset.link
      })
  },

  onReady: function () {},

  onShow: function () {
    this.updateWeekNum();
    this.getUser();
    this.getBitDayNum();
    console.log(app.globalData.openid);
    console.log(db.collection('userInfo').where({openid:app.globalData.openid}).length);
  },

  onHide: function () {},

  onUnload: function () {},

  onPullDownRefresh: function () {},

  onReachBottom: function () {},

  onShareAppMessage: function () {}
}) 