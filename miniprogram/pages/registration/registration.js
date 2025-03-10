// pages/registration/registration.js
import CacheSingleton from '../../classes/CacheSingleton';
const db = wx.cloud.database();
Page({

  /**
   * Page initial data
   */
  data: {
    cacheSingleton: CacheSingleton,
    userOpenId: String,
    grade: 0,
    gradeOptions: ['Please Select...','9','10','11','12'],
    class: 0,
    classOptions: ['Please Select...','1','2','3','4','5','6','7','8','9','10','11','12'],
    name: String,
    gNumber: String,
    needRegistration: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function() {
    this.data.cacheSingleton = CacheSingleton.getInstance();
  },

  nameInputChanged: function(x) {
    this.setData({
        name: x.detail.value,
    });
  },

  handleGInput: function(x) {
    this.setData({
        gNumber: `G${x.detail.value}`,
    });
  },

  gradeChanged: function(x) {
    this.setData({
        grade: x.detail.value,
    });
  },

  classChanged: function(x) {
    this.setData({
        class: x.detail.value,
    });
  },

  onSubmitClick: async function() {
    const regex = /^G(201[0-9]|202[0-9])010\d{3}$/;
    if (this.data.name.length !== 0 && this.data.grade !== "0" && this.data.class !== "0" && regex.test(this.data.gNumber)) {
      wx.showModal({
        title: 'Confirm Registration',
        content: 'Confirm Registration? Once submitted, this cannot be changed.',
        cancelText: 'Cancel',
        confirmText: 'Confirm',
        complete: async (res) => {
          if (res.confirm) {
            this.setData({
              needRegistration: await this.data.cacheSingleton.determineNeedNewUser()
            })
            if (this.data.needRegistration) {
              await wx.cloud.callFunction({
                name: "registerUser",
                data: {
                  name: this.data.name,
                  grade: this.data.gradeOptions[this.data.grade],
                  class: this.data.classOptions[this.data.class],
                  gNumber: this.data.gNumber
                }
              })
              this.skipRegistration();
            } else {
              wx.showModal({
                title: 'User Already Registered',
                content: 'This account is already registered. Your registration information cannot be changed.',
                showCancel: false,
                confirmText: 'Dismiss',
                complete: (res) => {
                  this.skipRegistration();
                }
              })
            }
          }
        }
      })
    } else {
      wx.showModal({
        title: 'Error',
        content: 'All fields are required to continue. Please complete all fields to the correct format and try again.',
        showCancel: false,
        confirmText: 'Dismiss',
      })
    }
  },

  skipRegistration: function() {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  }
})