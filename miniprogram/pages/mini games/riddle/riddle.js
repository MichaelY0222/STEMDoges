var db = wx.cloud.database();
var app = getApp();

Page({ 
       // TODO: check if cross device cheating possible
       // TODO: check if user exists before allowing visiting page (!!!)

  data: {
    //page data
    timer: 181, 
    timerDisplay: "3:00",
    timerId: 0,
    questions: [],    // array of all questions
    questionIndex: 0, // current q user is on
    question: {},     // current q displayed
    qIds: [],         // array of all q ids
    disabled: true,   // whether submit button available
    unNextable: true, // if true: NEXT is grayed out and SUBMIT is visible, vice versa
    letters: [],
    input: []
  },

  onLoad: function () {
    let that = this
   
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    const db = wx.cloud.database();

    wx.cloud.callFunction({ // fetch all questions
      name: 'getQuestions',
      data: {type: 'riddle'},
      success: res => {
        var allQuestions = res.result.data
        db.collection('userInfo')
          .where({_openid: app.globalData.openid})
          .get({
            success: function (res2) {

              if (typeof res2.data[0].riddleBank === 'undefined') { // check if questions already generated
                var qData = getRandom(allQuestions, 10)
                db.collection('userInfo').where({_openid: app.globalData.openid}).update({data: {riddleBank: qData}})
              } else qData = res2.data[0].riddleBank

              var exists = that.checkRecord(res2, qData[0]._id)
              if (exists) clearTimeout(that.data.timerId)
              var lets = qData[0].riddleKey.map((a) => a[0])
              that.setData({ // write in question data
                questions: qData,
                question: qData[0],
                img: qData[0].imgUrl,
                letters: lets,
                qIds: qData.map((a) => a._id),
                input: new Array(lets.length).fill(''),
                unNextable: !exists
              })

            }
          })
          clearTimeout(this.data.timerId)
          this.setData({ timer: 181 })
          this.setData({ timerDisplay: "3:00" })
          this.startSetInter()
      }
    })
  },

  onShow: function () {

  },

  onHide: function () {
    clearTimeout(this.data.timerId)
    if (this.data.unNextable)
      addRecord(0, this.data.question._id, '数字谜')
  },

  onUnload: function () {
    clearTimeout(this.data.timerId)
    if (this.data.unNextable)
      addRecord(0, this.data.question._id, '数字谜')
  },


  timeUp: function () { // CALLED WHEN TIMER IS UP, SCORE STORED IN this.data.score
    clearTimeout(this.data.timerId)
    this.setData({timer: 180})
    this.submit(true)
  },

  submit: function (skip) {
    let that = this
    var inputData = this.data.input
    if (!inputData.includes('') || typeof skip !== 'object') { // check if all filled in or if time is up
      clearTimeout(this.data.timerId)
      var qId = this.data.question._id
      this.setData({unNextable: false})
      db.collection('userInfo') // check again if user answered to prevent cross-device
      .where({_openid: app.globalData.openid})
      .get({
        success: function (res) {
          var exists = that.checkRecord(res, qId)
          if (!exists) {
            // check correct count
            var correct = 0
            var input = that.data.input
            var correctVals = that.data.question.riddleKey.map((a) => a[1])

            for (var i = 0; i < input.length; i++) {
              if (input[i] === correctVals[i]) correct++
            }
            console.log(correct)
            console.log(skip)
            if (typeof skip === 'object')
              wx.showToast({
                title: '答对题数: ' + correct,
                icon: 'none',
                duration: 3000
              })
            else
              wx.showModal({
                title: '时间到!',
                content: '答对题数: ' + correct, //提示内容
                showCancel: false,
              })

            that.setData({
              disabled: true,
              unNextable: false
            })
            addRecord(correct, qId, '数字谜')
          } else
            wx.showModal({
              title: '时间到!',
              content: '已回答!', //提示内容
              showCancel: false,
            })
        }
      })
    }
    wx.hideShareMenu()
  },

  startSetInter: function () {
    if (this.data.timer > 0) {
      var time = this.data.timer - 1
      this.setData({ timer: time })
      var display = Math.floor(time / 60) + ":" + ("0" + (time % 60)).slice(-2)
      this.setData({ timerDisplay: display })
      this.setData({ timerId: setTimeout(this.startSetInter, 1000) })
    } else this.timeUp()
  },

  directNext: function() {
    if (!this.data.unNextable) {
      clearTimeout(this.data.timerId)
      if (this.data.questionIndex >= (this.data.questions.length - 1)) { // go back if on last question
        wx.navigateBack()
      } else {
        var qIdx = this.data.questionIndex + 1 // increment question index
        var image = this.data.questions[qIdx].imgUrl
        var lets = this.data.questions[qIdx].riddleKey.map((a) => a[0])
        this.setData({       // reset everything
          timer: 180,
          timerDisplay: "3:00",
          questionIndex: qIdx,
          question: this.data.questions[qIdx],
          unNextable: true,
          unNextable: !this.userAnswered(this.data.qIds[qIdx]),
          img: (typeof image === 'undefined') ? '' : image,
          disabled: true,
          letters: lets,
          input: new Array(lets.length).fill('')
        })
        this.startSetInter() // reset timer
      }
    }
  },

  input: function(e) { // controls MC buttons
    let l = e.currentTarget.dataset.letter
    let val = e.detail.value
    var currentInput = this.data.input
    currentInput[l] = val
    var inputData = this.data.input
    var allQuestionsAnswered = !inputData.includes('')
    this.setData({
      input: currentInput,
      disabled: !allQuestionsAnswered
    })
  },

  userAnswered: function(id) { // checks if user has answered question of id
    var that = this
    db.collection('userInfo')
      .where({_openid: app.globalData.openid})
      .get({
        success: function (res) {
          var exists = that.checkRecord(res, id)
          if (exists) {
            clearTimeout(that.data.timerId)
            that.setData({
              unNextable: false,
            }, () => {
                return exists
            })
          }
        }
      })
  },

  checkRecord: function (res, id) {
    var records = res.data[0].record
    var exists = false
    if (typeof records === 'undefined') {
      return false
    } else {
      for (var i = 0; i < records.length; i++) {
        if (records[i]["questionID"] == id) {
          exists = true
          break
        }
      }
      return exists
    }
  }
})

function addRecord(correct, id, subject) {
  db.collection('userInfo')
  .where({ _openid: app.globalData.openid })
  .get({
    success: function (res) {
      var totalScore = res.data[0].totalCorrect
      var updatedScore = res.data[0].dailyScore4
      if (correct) {
        totalScore += 20 * (correct)
        updatedScore += 20 * (correct)
      }
      db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .update({
          data: {
            record: db.command.push({
              correctCount: correct,
              questionID: id,
              answerTime: new Date(),
              subject: subject
            }),
            dailyScore4: updatedScore,
            totalCorrect: totalScore
          }
        })
    }
  })
}

function getRandom(arr, n) {
  var result = new Array(n),
      len = arr.length,
      taken = new Array(len);
  if (n > len)
      throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
      var x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

