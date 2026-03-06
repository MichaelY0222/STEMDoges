// pages/events/piday2026/piday2026.js
import CacheSingleton from '../../../classes/CacheSingleton';
import allCollectionsData from "../../../utils/allCollectionsData";
import { handleCode } from '../../../utils/handleCode';
import { PiDay2026Event } from "../../../classes/piday2026event";
const db = wx.cloud.database();
Page({

  /**
   * Page initial data
   */
  data: {
    cacheSingleton: CacheSingleton,
    selectedEventId: 'undefined',
    events: [],
    isAdmin: false,
    userOpenId: 'undefined',
    studentName: 'undefined',
    studentGrade: 0,
    studentClass: 0,
    studentGNumber: 'undefined',
    startTime: 0,
    endTime: 0,
    regLimit: 0,
    maxReached: true,
    signedUpEvent: 'No Records Found'
  },

  onLoad: async function() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.data.cacheSingleton = await CacheSingleton.getInstance();
    this.setData({
      isAdmin: await this.data.cacheSingleton.fetchUserInfo('isPiDayAdmin'),
      studentName: await this.data.cacheSingleton.fetchUserInfo('name'),
      studentGrade: await this.data.cacheSingleton.fetchUserInfo('grade'),
      studentClass: await this.data.cacheSingleton.fetchUserInfo('class'),
      studentGNumber: await this.data.cacheSingleton.fetchUserInfo('gNumber'),
      userOpenId: await this.data.cacheSingleton.fetchUserOpenId(),
    });
    await this.checkAllowRegistration();
    console.log(this.data.events)
    wx.hideLoading();
  },

  eventTap: function(e) {
    let eventActive = this.data.events.find(event => event.eventId === e.currentTarget.dataset.id)?.active;
    if (eventActive){
      this.setData({
        selectedEventId: e.currentTarget.dataset.id
      })
    }
  },

  scanButtonClick: function() {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        handleCode(this.data.userOpenId, res.result);
      }
    });
  },

  redirect: function(event){
    wx.navigateTo({
      url: event.currentTarget.dataset.link,
    })
  },

  checkAllowRegistration: async function() {
    wx.showLoading({
      title: 'Loading...',
      mask: true
    });
    let fetchEvents = new Array();
    let activity = await allCollectionsData(db, "piDay2026Events");
    for (let i=0;i<activity.data.length;i++) {
      fetchEvents.push(new PiDay2026Event(activity.data[i].eventId, activity.data[i].active, activity.data[i].capacity, activity.data[i].name, activity.data[i].registered, activity.data[i].capacity-activity.data[i].registered));
    }
    this.setData({
      events: fetchEvents
    })
    const configRes = await db.collection("piDay2026Config").where({
      key: "config"
    }).get();
    const regRes = await db.collection("piDay2026EventsSignUp").where({
      userId: this.data.userOpenId
    }).get();
    if (configRes.data.length === 0){
      wx.hideLoading();
      wx.showModal({
        title: 'Error',
        content: 'Error fetching Pi Day configuration files. Contact admin for assistance.',
        showCancel: false,
        confirmText: "Dismiss",
        complete: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      })
    } else {
      this.setData({
        startTime: configRes.data[0].startTime,
        endTime: configRes.data[0].endTime,
        regLimit: configRes.data[0].limit
      })
      console.log(this.data.startTime, this.data.endTime, this.data.regLimit);
    }
    console.log(this.data.userOpenId, regRes)
    if (regRes.data.length >= this.data.regLimit){
      this.setData({
        maxReached: true,
        signedUpEvent: regRes.data[0].eventName,
      })
    } else {
      this.setData({
        maxReached: !(this.data.startTime<=(Date.now()/1000) && (Date.now()/1000)<=this.data.endTime)
      })
      console.log(this.data.maxReached);
    }
  },

  submitSignup: async function() {
    // check if user selected an event
    if (this.data.selectedEventId == 'undefined') {
      wx.showModal({
        title: "Error",
        content: "Please select an event before submitting.",
        showCancel: false,
        confirmText: "Dismiss"
      })
      return;
    } else {
      wx.showModal({
        title: "Submit Signup",
        content: "Are you sure you want to submit your signup?",
        cancelText: "Cancel",
        confirmText: "Confirm",
        success: async (res) => {
          if (res.confirm) {
            wx.showLoading({
              title: 'Loading...',
              mask: true
            })
            const capacityRes = await db.collection("piDay2026Events").where({
              eventId: this.data.selectedEventId
            }).get();
            if (capacityRes.data[0].active) {
              await wx.cloud.callFunction({
                name: "pushAnyEventLog",
                data: {
                  type: 'signup',
                  eventId: this.data.selectedEventId,
                  eventName: this.data.events.find(e => e.eventId === this.data.selectedEventId)?.name,
                  studentName: this.data.studentName,
                  studentGrade: this.data.studentGrade,
                  studentClass: this.data.studentClass,
                  studentGNumber: this.data.studentGNumber
                }
              })
              await this.checkAllowRegistration();
            } else {
              wx.hideLoading();
              wx.showModal({
                title: 'Event Full',
                content: 'Sorry, the event you selected is no longer available.',
                showCancel: false,
                confirmText: 'Dismiss'
              })
              await this.checkAllowRegistration();
            }
            wx.hideLoading();
          }
        }
      })
    }
  }
})