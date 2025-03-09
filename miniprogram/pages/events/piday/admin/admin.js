import CacheSingleton from '../../../../classes/CacheSingleton';
const { generateQRCode } = require('../../../../utils/generateQRCode');

Page({

  /**
   * Page initial data
   */
  data: {
    cacheSingleton: CacheSingleton,
    eventData: [],
    eventOptions: [],
    event: 0,
    eventId: 'undefined',
    codeGenerated: false,
    recomputeCaller: null,
    codeLastGen: 'Updating...',
    qrCodeUrl: 'undefined',
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

    this.setData({
      eventOptions: eventOptions,
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

  recomputeCode: function(data) {
    const that = this;
    
    // Use the generateQRCode utility to generate the QR code
    generateQRCode('activitycodecanvas', data)
      .then((msg) => {
        console.log(msg);
        that.setData({
          codeGenerated: true,
          codeLastGen: new Date().toLocaleTimeString(),
        });
      })
      .catch((error) => {
        console.error(error);
        that.setData({
          codeGenerated: false,
          codeLastGen: 'Error generating QR code',
        });
      });
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

  onGenerateClick: function() {
    const randomString = this.generateRandomString(6);
    const data = `stemDoges;1;type-activityCode;event-PI25;dat-6-${randomString}`;
    this.recomputeCode(data);
  },
});
