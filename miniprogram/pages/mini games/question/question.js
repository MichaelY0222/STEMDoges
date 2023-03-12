// miniprogram/pages/question/question.js
var db = wx.cloud.database();
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    question: {},
    choices: [],
    userChoice: -1,
    choiceDisplay: ["false", "false", "false", "false"],
    hasAnswered: false,
    disabled: true,
    unNextable: true,
    questionNumber: 0,
    title: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({title: options.subject})

    let that = this
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openid = res.result.openid
      }

      })
    console.log(app.globalData)

    var qType = options.type
    var pageTitle
    switch (qType) {
      case "concept":
        pageTitle = "概念"
        break
      case "geometry":
        pageTitle = "几何"
        break
      case "riddle":
        pageTitle = "急转弯"
        break
    }
    this.setData({
      type: qType,
      title: pageTitle
    })
   
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    const db = wx.cloud.database();

    db.collection('question')
      .limit(1)
      .get({
        success: function (res) {
          that.setData({
            question: res.data[0],
            choices: [res.data[0]["choice1"], res.data[0]["choice2"], res.data[0]["choice3"], res.data[0]["choice4"]],
            hasAnswered: that.userAnswered(res.data[0]._id),
            questionNumber: res.data[0]["number"]
          })
        }
      })
  },

  submit: function () {
    let that = this
    if (this.data.userChoice) {
      var qId = this.data.question["_id"]
      var correct = this.data.choices[this.data.userChoice] == this.data.question['answer']
      if (!this.userAnswered(qId)) { 
        var disp = ["false", "false", "false", "false"]
        disp[this.data.userChoice] = "incorrect"
        disp[this.data.choices.indexOf(this.data.question['answer'])] = "correct"
        this.setData({
          choiceDisplay: disp,
          disabled: true,
          unNextable: false
        })
        addRecord(correct, qId, that.data.question.subject)
      } else {
        this.setData({
          hasAnswered: true,
          unNextable: false
        })
      }
    }
  },

  choose: function(e) {
    let c = e.currentTarget.dataset.choice

    var disp = ["false", "false", "false", "false"]
    disp[c] = "true"

    this.setData({
      userChoice: c,
      choiceDisplay: disp,
      disabled: false
    })

  },

  userAnswered: function(id) {
    var that = this
    db.collection('userInfo')
      .where({
        _openid: app.globalData.openid
        })
      .get({
        success: function (res) {
          var records = res.data[0]["record"]
          var exists = false
          for (var i = 0; i < records.length; i++) {
            if (records[i]["questionID"] == id) {
              exists = true
              break
            }
          }
          if (exists) {
            that.setData({
              unNextable: false,
              hasAnswered: true
            }, () => {
                return exists
            })
            }
          
        }
      })
  },

  directNext: function () {
    
  }

})

function addRecord(correct, id, subject) {
  db.collection('userInfo').where({
    _openid: app.globalData.openid
  }).update({
    data: {
      record: db.command.push({
        isCorrect: correct,
        questionID: id,
        answerTime: new Date(),
        subject: subject
      }),
      totalAnswer: db.command.inc(1),
      monthAnswer: db.command.inc(1),
      totalCorrect: db.command.inc(correct ? 1 : 0),
      monthCorrect: db.command.inc(correct ? 1 : 0)
    }
  })
}
