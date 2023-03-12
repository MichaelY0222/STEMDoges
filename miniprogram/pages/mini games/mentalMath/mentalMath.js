const db = wx.cloud.database();
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    exp: "", // question expression
    ans: "", // answer to question
    inputVal: "", // value of user input
    inputFocus: true, // controls focus of input box
    timer: 61, // timer seconds 
    timerDisplay: "1:00",
    score: 0, // user score
    timerId: 0, // controls timer
    operation: false // false=add/sub, true=mult/div
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    clearTimeout(this.data.timerId) // initialize timer, score, and question
    this.setData({ timer: 61 })
    this.setData({ timerDisplay: "1:00" })
    this.setData({ score: 0 })
    this.generateExpression()
    this.startSetInter()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    clearTimeout(this.data.timerId)
  },

  onUnload: function () {
    clearTimeout(this.data.timerId)
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  timeUp: function(){ // CALLED WHEN TIMER IS UP, SCORE STORED IN this.data.score
    var scoreVal = this.data.score
    console.log("time's up :D")
    console.log("your score: " + scoreVal)
    addRecord(scoreVal)
    wx.showModal({
      title: '时间到！',
      content: "分数: " + scoreVal,//提示内容
      showCancel: false,
      success(res) {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  },

  generateExpression: function() {
    var selection = 0.9 // Math.random() 
    var expression, answer, op

    // makes selection of operation based on weights and random number
    if (selection < 0.3) [expression, answer, op] = this.generateAddition() 
    else if (selection < 0.6) [expression, answer, op] = this.generateSubtraction()
    else if (selection < 0.85) [expression, answer, op] = this.generateMultiplication()
    else [expression, answer, op] = this.generateDivision()
    this.setData({
      ans: answer, 
      exp: expression,
      operation: op
    })
  },

  generateAddition: function() {
    var num1, num2
    if (Math.random() < 0.2) { // 20% addition questions includes 4 digit + 2 or 3 digit
      num1 = randInt(1000, 4999)
      num2 = randInt(10, 999)
    } else { // 80% 3 digit addition
      if (Math.random() < 0.6) { // 60% of which are whole numbers
        num1 = randInt(100, 999)
        if (Math.random() < 0.4) num2 = randInt(10, 99) // 40% of which is 3 + 2 digit
        else num2 = randInt(100, 999)                   // 60% of which is 3 + 3 digit
      } else { // 40% of which involve 1, 2, or 3 decimal places
        var n1 = randInt(1, 3)
        var n2 = randInt(1, 2)
        num1 = (randInt(100, 999) / (10 ** n1)).toFixed(n1)
        num2 = (randInt(10, 999) / (10 ** n2)).toFixed(n2)
      }
    }
    [num1, num2] = shuffle([num1, num2]) // randomize order of two numbers
    return [num1 + " + " + num2, +num1 + +num2, false] // returns array of display and answer
  },

  generateSubtraction: function() {
    var num1 = randInt(100, 999)
    var num2
    if (Math.random() < 0.5) { // 50% 3 - 3 digit
      num2 = randInt(100, 999)
    } else {                   // 50% 3 - 2 digit
      num2 = randInt(10, 99)
    }
    if (Math.random() < 0.2) { // 20% involves 1 or 2 decimal places
      var n = randInt(1, 2)
      num1 = (num1 / (10 ** n)).toFixed(n)
      num2 = (num2 / (10 ** n)).toFixed(n)
    }
    [num1, num2] = [num1, num2].sort((a, b) => b - a) // make larger one first to avoid negative result
    return [num1 + " − " + num2, num1 - num2, false]
  },

  generateMultiplication: function() {
    var num1 = randInt(11, 109) // larger number between 11 and 109 incl.
    var num2 = randInt(2, 10)   // smaller number between 2 and 10 incl.
    if (Math.random() < 0.5) {  // 50% have 0, 1, or 2 decimals
      var n1 = randInt(0, 2)
      var n2 = randInt(0, 1)
      num1 = (num1 / (10 ** n1)).toFixed(n1)
      num2 = (num2 / (10 ** n2)).toFixed(n2)
    }
    [num1, num2] = shuffle([num1, num2]) // randomize order
    return [num1 + " × " + num2, num1 * num2, true]
  },

  generateDivision: function() { // picks 1 & 2 digit integer, uses product as dividend and 2 digit as divisor
    var num1 = randInt(10, 99)
    var ans = randInt(2, 9)
    var num2 = num1 * ans
    if (Math.random() < 0.2) { // 20% have 0 or 1 decimal place
      var n1 = randInt(0, 1)
      var n2 = randInt(0, 1)
      num1 = (num1 / (10 ** n1)).toFixed(n1)
      num2 = (num2 / (10 ** n2)).toFixed(n2)
    }
    return [num2 + " ÷ " + num1, num2 / num1, true]
  },

  submitInput: function(e) { // checks answer
    var input = e.detail.value
    if (Math.abs(parseFloat(input) - this.data.ans) < 0.0001) { // checks if input is equal answer
      if (this.data.timer > 0) this.setData({score: this.data.score + (this.data.operation ? 80 : 70)})
      this.generateExpression()
      this.clear()
    }
  },

  clear: function() {
    this.setData({inputVal: ""})
  },

  startSetInter: function(){
    if (this.data.timer > 0) {
      var time = this.data.timer - 1
      this.setData({timer: time})
      var display = Math.floor(time/60) + ":" + ("0" + (time % 60)).slice(-2)
      this.setData({timerDisplay: display})
      this.setData({ timerId: setTimeout(this.startSetInter, 1000) })
    } else this.timeUp()
  },

  focus: function() {
    this.setData({inputFocus: true})
  }

})

function randInt(min, max) { // returns random integer between min and max inclusive
  return Math.floor(Math.random() * (max + 1 - min) + min)
}  

function shuffle(arr) { // shuffles 2 number arrays
  if (Math.random() < 0.5) return [arr[0], arr[1]]
  return [arr[1], arr[0]]
}

function addRecord(score) {
  wx.cloud.init({
    env: 'shsid-3tx38'
  })
  db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res) {
        var dayScore = res.data[0].dailyScore1
        dayScore = Math.max(dayScore, score)
        var scores = [...Array(5).keys()].map((x) => res.data[0]['dailyScore' + x])
        scores[1] = dayScore
        var totalScore = scores.reduce((a, b) => a + b, 0)
        db.collection('userInfo')
          .where({ _openid: app.globalData.openid })
          .update({
            data: {
              record: db.command.push({
                correctCount: score,
                answerTime: new Date(),
                subject: '速算'
              }),
              dailyScore1: dayScore,
              totalCorrect: totalScore
            }
          })
      }
    })
 
}