import CacheSingleton from '../../../../classes/CacheSingleton';
import { createQRCode, lightBackgroundColor, UserDataType } from "../../../../utils/common";
import { generateQRCode } from '../../../../utils/generateQRCode';
import { isDarkTheme } from "../../../../utils/isDarkTheme";
import { extendNumberToLengthString } from "../../../../utils/util";

Page({

  /**
   * Page initial data
   */
  data: {
    cacheSingleton: CacheSingleton,
    eventData: [],
    eventOptions: [],
    eventLabels: [],
    event: 0,
    eventId: 'undefined',
    codeGenerated: false,
    recomputeCaller: null,
    codeLastGen: 'Updating...',
    qrCodeUrl: 'undefined',
    logId: 'undefined'
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function(options) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.data.cacheSingleton = CacheSingleton.getInstance();
    const eventData = await this.data.cacheSingleton.fetchAnyEventActivity();
    this.setData({
      eventData: eventData
    });

    const eventOptions = eventData.map(event => {
      return {
        eventName: event.eventName,
        eventHost: event.eventHost,
        points: event.points,
        eventId: event.eventId,
      };
    });

    const eventLabels = eventData.map(event => `${event.eventHost} - ${event.eventName} (${event.points} Pi Points)`);

    this.setData({
      eventOptions: eventOptions,
      eventLabels: eventLabels,
      eventId: eventOptions[this.data.event]?.eventId || 'undefined',
    });
  },

  eventChanged: function(e) {
    const selectedEvent = this.data.eventOptions[e.detail.value];
    this.setData({
      event: e.detail.value,
      eventId: selectedEvent?.eventId || 'undefined',
    });
  },

  recomputeCode: function() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.setData({
      codeGenerated: true
    })
    let uniqueLogId = this.data.logId;
    let qrCodeData=[];
    for (let i=0;i<uniqueLogId.length;i++) {
      qrCodeData.push(uniqueLogId.charCodeAt(i));
    }
    let accessCodeContents=generateQRCode("activityCode", "PI25", qrCodeData);
    if (accessCodeContents !== this.data.codeLastGen) {
      let myCreateQRCode = createQRCode.bind(this);
      if (isDarkTheme()) {
        myCreateQRCode("personalcodecanvas", accessCodeContents, 'FFFFFF', '000000');
      } else {
        myCreateQRCode("personalcodecanvas", accessCodeContents, '000000', lightBackgroundColor);
      }
      this.data.codeLastGen=accessCodeContents;
    }
    let date = new Date();
    let newUpdateString=`${extendNumberToLengthString(date.getHours(), 2)}:${extendNumberToLengthString(date.getMinutes(), 2)}:${extendNumberToLengthString(date.getSeconds(), 2)}`;
    this.setData({
      lastUpdateTime: newUpdateString,
    });
    wx.hideLoading();
    setTimeout(this.onClearClick, 7000);
  },

  generateRandomString(length) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';  // All letters of the alphabet
    let randomString = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);  // Random index in alphabet
      randomString += alphabet[randomIndex];  // Append the random letter to the string
    }
    
    return randomString;
  },

  onClearClick: function() {
    this.setData({
      codeGenerated: false,
      lastUpdateTime: undefined
    })
    wx.cloud.callFunction({
      name: "pushAnyEventLog",
      data: {
        type: 'delActivityCode',
        logId: this.data.logId,
      }
    })
  },

  onGenerateClick: async function() {
    const randomString = await this.generateRandomString(6);
    this.setData({
      logId: randomString
    })
    console.log(this.data.logId)
    await wx.cloud.callFunction({
      name: "pushAnyEventLog",
      data: {
        type: 'newActivityCode',
        logId: randomString,
        eventId: this.data.eventOptions[this.data.event].eventId,
        eventName: this.data.eventOptions[this.data.event].eventName,
        points: this.data.eventOptions[this.data.event].points
      }
    })
    this.recomputeCode();
  },
});
