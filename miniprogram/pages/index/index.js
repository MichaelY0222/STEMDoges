const app = getApp();
const db = wx.cloud.database();
import CacheSingleton from '../../classes/CacheSingleton';
import { handleCode } from '../../utils/handleCode';

Page({
  data: {
    isAdmin: false,
    userOpenId: 'undefined',
    needRegistration: false,

    cacheSingleton: CacheSingleton,

    name: String,
    grade: String,
    class: String,

    weekNum: 1,
    showWeekResults: false,
    lastWeek: 0,
    gotUserData: false,
    correct: false,
    showPopup: [false],
  },

  onLoad: async function () {
    //this.updateWeekNum();
    //this.getUser();
    //this.getBitDayNum();
    wx.cloud.init();
    this.data.cacheSingleton = CacheSingleton.initialize(wx.cloud.database());
    this.setData({
      userOpenId: await this.data.cacheSingleton.fetchUserOpenId(),
      needRegistration: await this.data.cacheSingleton.determineNeedNewUser(),
    })
    if (this.data.needRegistration) {
      wx.showModal({
        title: 'Not Registered...',
        content: 'Registration is required to participate in most events, such as Pi Day, Mole Day, and Bit Day.',
        confirmText: 'Continue',
        cancelText: 'Back',
        complete: (res) => {      
          if (res.confirm) {
            this.handleRegister();
          }
        }
      })
    } else {
      this.setData({
        name: await this.data.cacheSingleton.fetchUserInfo('name'),
        grade: await this.data.cacheSingleton.fetchUserInfo('grade'),
        class: await this.data.cacheSingleton.fetchUserInfo('class'),
        isAdmin: await this.data.cacheSingleton.fetchUserInfo('isAdmin'),
      })
      console.log(this.data.isAdmin)
    }
    // db.collection('userInfo').where({openid: app.globalData.openid}).count().then(res => {
    //   console.log(res.total);
    // }).catch(err => {
    //   console.error('获取集合长度失败:', err);
    // });
  },

  // getUser() {
  //   let that = this;
  //   // wx.cloud.callFunction({
  //   //   name: 'login',
  //   //   data: {},
  //   //   success: res => {
  //   //     app.globalData.openid = res.result.openid;
  //   //     db.collection('userInfo').where({
  //   //       _openid: app.globalData.openid
  //   //     })
  //   //     .get({
  //   //       success: function (res) {
  //   //         if (res.data.length !== 0) {
  //   //           that.setData({
  //   //             showPopup: [true]
  //   //           });
  //   //         }
  //   //         console.log(that.data.showPopup);
  //   //         that.getUserData();     
  //   //       },
  //   //       fail: function (err) {
  //   //         console.error('查询用户信息失败:', err);
  //   //       },
  //   //     });
  //   //   },
  //   //   fail: e => {
  //   //     console.error('调用登录云函数失败:', e);
  //   //   }
  //   // });
  // },

  // submitInfo(event){
  //   let name = event.detail.value.name;
  //   let classNum = event.detail.value.class;
  //   let grade = event.detail.value.grade;
  //   let gnum = event.detail.value.gnum;
  //   console.log(name, classNum, grade, gnum);

  //   if (name && classNum && grade && gnum) {
  //     wx.showLoading({
  //       title: '提交中...',
  //       mask: true
  //     });

  //     let ques = {};
  //     for(var i = 0; i < 15; i++) {
  //       ques[i+1] = {status: 0, trials: 0};
  //     }

  //     db.collection('userInfo').add({
  //       data: {
  //         openid: app.globalData.openid,
  //         userRealName: name,
  //         userClass: classNum,
  //         userGrade: grade,
  //         userGnum: gnum,
  //         mathquizzes: ques,
  //         bitdayVerified: true,
  //         bitdayPoints: 0,
  //         quizzesPoints: 0,
  //         fairPoints: 0,
  //         pointsPoints: 0,
  //         gamesPoints: 0
  //       },
  //       success: res => {
  //         this.setData({
  //           showingPopup: false,
  //           showPopup: [],
  //           gotUserData: true
  //         });
  //         console.log('用户信息提交成功:', res);
  //       },
  //       fail: err => {
  //         console.error('提交用户信息失败:', err);
  //       },
  //       complete: () => {
  //         wx.hideLoading();
  //       }
  //     });

  //     wx.getUserProfile({
  //       desc: '登录',
  //       success: (res) => {
  //         this.setData({
  //           nickName: res.userInfo.nickName,
  //           avatarUrl: res.userInfo.avatarUrl
  //         });
  //         db.collection('userInfo').where({_openid: app.globalData.openid})
  //           .update({
  //             data: {
  //               nickName: this.data.nickName,
  //               avatarUrl: this.data.avatarUrl
  //             },
  //             success: res => {
  //               this.setData({
  //                 gotUserData: true
  //               });
  //               console.log(this.data.nickName, this.data.avatarUrl);
  //             },
  //             fail: err => {
  //               console.error('更新用户头像和昵称失败:', err);
  //             }
  //           });
  //       },
  //       fail: err => {
  //         console.error('获取用户信息失败:', err);
  //         wx.hideLoading();
  //       }
  //     });
  //   } else {
  //     wx.showToast({
  //       title: '请填写所有信息',
  //       icon: 'none'
  //     });
  //   }
  // },

  showSettingToast: function(e) {
    wx.showModal({
      title: '提示！',
      confirmText: '去设置',
      showCancel: false,
      content: e,
      success: function(res) {
        if (res.confirm) {
          wx.openSetting();
        }
      }
    });
  },

  getBitDayNum() {
    let that = this;
    wx.showLoading({
      title: '获取数据中...',
      mask: true
    });

    db.collection('settings')
      .where({type:"bitday"})
      .get({
        success: function (res) {
          app.bitdayNum = res.data[0].day;
        },
        fail: function (err) {
          console.error('获取 bitdayNum 失败:', err);
        },
        complete: function () {
          wx.hideLoading();
        }
      });
  },

  updateWeekNum() {
    let that = this;
    wx.showLoading({
      title: '更新周数中...',
      mask: true
    });

    db.collection('settings')
      .where({type:"weekInfo"})
      .get({
        success: res => {
          app.weekNum = res.data[0].weekNum;
          that.setData({
            weekNum: app.weekNum
          });  
        },
        fail: err => {
          console.error('更新周数失败:', err);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
  },

  hidePopup(event) {
    this.setData({
      showWeekResults: false,
      lastWeekSeen: app.weekNum
    });
  },

  showWeeklyAnswers(weeknum) {
    console.log(weeknum);
    wx.cloud.init({
      env: 'shsid-3tx38'
    });

    wx.showLoading({
      title: '更新中...',
      mask: true
    });

    db.collection('userInfo')
      .where({ _openid: app.globalData.openid })
      .update({
        data: {
          isFinished: false,
          lastWeek: weeknum
        },
        success: res => {
          console.log('更新用户信息成功:', res);
        },
        fail: err => {
          console.error('更新用户信息失败:', err);
        },
        complete: () => {
          wx.hideLoading();
        }
      });

    if (weeknum == null)
      return 0;

    this.setData({
      showWeekResults: true,
      lastWeek: weeknum
    });
  },

  handleRegister: function() {
    wx.redirectTo({
      url: '/pages/registration/registration',
    });
  },

  scanButtonClick: function() {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        console.log(this.data.userOpenId)
        handleCode(this.data.userOpenId, res.result);
      }
    });
  },

  redirect: function(event) {
    wx.navigateTo({
      url: event.currentTarget.dataset.link
    });
  },

  redirectRestrictedAccessEvent: function(event) {
    if (this.data.needRegistration) {
      wx.showModal({
        title: 'Not Registered...',
        content: 'Registration is required to participate in most events, such as Pi Day, Mole Day, and Bit Day.',
        confirmText: 'Continue',
        cancelText: 'Back',
        complete: (res) => {      
          if (res.confirm) {
            this.handleRegister();
          }
        }
      })
    } else {
      wx.navigateTo({
        url: event.currentTarget.dataset.link
      });
    }
  },

  onReady: function () {},

  onShow: function () {
    // this.updateWeekNum();
    // this.getUser();
    // this.getBitDayNum();
    // console.log(app.globalData.openid);
    // db.collection('userInfo').where({openid: app.globalData.openid}).count().then(res => {
    //   console.log(res.total);
    // }).catch(err => {
    //   console.error('获取集合长度失败:', err);
    // });
  },

  onHide: function () {},

  onUnload: function () {},

  onPullDownRefresh: function () {},

  onReachBottom: function () {},

  onShareAppMessage: function () {}
});