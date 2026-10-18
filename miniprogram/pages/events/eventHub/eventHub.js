// miniprogram/pages/events/eventHub/eventHub.js
//
// Generic event landing page. Shows the trivia questions currently available for
// the active event (see utils/eventConfig.js) and links to the shared leaderboard.
// Restored from the Bit Day 2025 "anyEvent" page that was deleted for Pi Day 2026.

import CacheSingleton from '../../../classes/CacheSingleton';
import { handleCode } from '../../../utils/handleCode';
import { getActiveEvent } from '../../../utils/eventConfig';
const app = getApp();

Page({

  /**
   * Page initial data
   */
  data: {
    cacheSingleton: CacheSingleton,
    eventTitle: 'Event',
    questions: [],
    userOpenId: 'undefined',
    isAdmin: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function (options) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    const event = await getActiveEvent();
    this.data.cacheSingleton = CacheSingleton.getInstance();
    this.setData({
      eventTitle: event.title,
      isAdmin: await this.data.cacheSingleton.fetchUserInfo('isPiDayAdmin'),
      userOpenId: await this.data.cacheSingleton.fetchUserOpenId(),
      questions: await this.data.cacheSingleton.fetchAnyEventTriviaQuestions(),
    });
    console.log(this.data.questions)
    wx.hideLoading();
  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: async function () {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.setData({
      questions: await this.data.cacheSingleton.fetchAnyEventTriviaQuestions(),
    });
    wx.hideLoading();
  },

  answerTrivia: function (event) {
    console.log(event.currentTarget.dataset.link)
    wx.navigateTo({
      url: '../piday/trivia/trivia',
      success: (res) => {
        res.eventChannel.emit('questionId', event.currentTarget.dataset.link);
      }
    })
  },

  redirect: function (event) {
    app.globalData.questionNum = event.currentTarget.dataset.qnum;
    wx.navigateTo({
      url: event.currentTarget.dataset.link,
    })
  },

  scanButtonClick: function () {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        handleCode(this.data.userOpenId, res.result);
      }
    });
  },
})
