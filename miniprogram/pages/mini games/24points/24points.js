// miniprogram/pages/questions/24points/24points.js
const db = wx.cloud.database();
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    cards: [0, 0, 0, 0], // card values
    operations: ['+', '-', '*', '/', '(', ')'],
    expression: "", // expression that the user inputs
    used: [false, false, false, false], // whether each card is used or not
    error: "", // controls wiggle animation
    symbols: [0, 0, 0, 0], // the 花色 of cards
    displayValues: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    symbolColors: ["red", "black", "black", "red"],
    timer: 121, // timer time left in seconds
    timerDisplay: "2:00", // controls timer display
    score: 0, // stores user score
    timerId: 0, // used for controling timer
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
    clearTimeout(this.data.timerId) // stop countdown if there is one ongoing
    this.setData({timer: 121}) // initialize
    this.setData({timerDisplay: "2:00"})
    this.setData({score: 0})
    this.updateCards()
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

  check: function (a, n) { // recursive function to check solvability, 抄的 不comment了
    if (n == 1) { 
      if (Math.abs(a[0] - 24) < 1e-9) {
        return true
      } else return false
    }
    for (var i = 0; i < n; ++i) {
      for (var j = i + 1; j < n; ++j) {
        var t1 = a[i]
        var t2 = a[j]
        var b = [0, 0, 0, 0]
        var r = 0
        for (var k = 0; k < n; ++k) {
          if ((k != i) && (k != j)) b[r++] = a[k]
        }
        b[n-2] = t1 + t2
        if (this.check(b, n-1)) return true
        b[n-2] = t1 * t2
        if (this.check(b, n-1)) return true
        b[n-2] = t1 - t2
        if (this.check(b, n-1)) return true
        b[n-2] = t2 - t1
        if (this.check(b, n-1)) return true
        b[n-2] = t1 / t2
        if (this.check(b, n-1)) return true
        b[n-2] = t2 / t1
        if (this.check(b, n-1)) return true
      }
    }
    return false
  },

  solvable: function (x) { // call with array of 4 numbers as argument to check solvability
    return this.check(x, 4)
  },

  generateDeck: function () { // randomly generates a solvable deck
    do {
      var deck = []
      for (var i = 0; i < 4; i++) deck.push(Math.floor(Math.random() * 13) + 1)
    } while (!this.solvable(deck))
    return deck
  },

  updateCards: function() { // randomizes deck
    this.setData({cards: this.generateDeck()})
    var patterns = []
    for (var i = 0; i < 4; i++) patterns.push(Math.floor(Math.random() * 4))
    this.setData({symbols: patterns})
  },

  submit: function() { // called when submit is hit
    this.setData({error: ""})
    try { // check if the expression is evaluate-able, if not, incorrect
      var correct = (Math.abs(evaluate(this.data.expression) - 24) < 0.0001) // evaluate() evaluates to 6 decimal places
    }
    catch (e) {
      this.setData({error: "error"}) // shake input box
      this.clear()
      return -1
    }
    if (correct && this.data.used.every(v => v === true)) { // check if all numbers are used and is equal 24
      this.updateCards()
      if (this.data.timer > 0) this.setData({score: this.data.score + 100}) // only increment score if timer is not up
      this.clear() // remove input
    }
    else {
      this.setData({error: "error"})
      this.clear()
    }
  },

  selectNumber: function(e) { // used for inputting numbers
    let i = e.currentTarget.dataset.index
    var disabled = this.data.used
    if (disabled[i] == false) {
      var exp = this.data.expression
      if ("1234567890)".indexOf(exp.slice(-1)) <= -1 || exp == "") { // disable inputting number after a digit or )
        disabled[i] = true
        this.setData({used: disabled})
        exp = exp + this.data.cards[i]
        this.setData({expression: exp})
      }
    }
  },

  selectOperation: function(e) { // used for inputting sumbol
    let i = e.currentTarget.dataset.index
    var exp = this.data.expression
    if (i == 4 || "+-*/(".indexOf(exp.slice(-1)) <= -1) { // allow ( anywhere, disable inputting symbol after +-*/(
      exp = exp + this.data.operations[i]
      this.setData({expression: exp})
    }
  },

  clear: function() { // resets input
    this.setData({used: [false, false, false, false]})
    this.setData({expression: ""})
  },

  startSetInter: function(){ // start timer
    if (this.data.timer > 0) {
      var time = this.data.timer - 1
      this.setData({timer: time})
      var display = Math.floor(time/60) + ":" + ("0" + (time % 60)).slice(-2)
      this.setData({timerDisplay: display})
      this.setData({timerId: setTimeout(this.startSetInter, 1000)})
    } else this.timeUp()
  },

  skip: function() { // skips the current question
    this.updateCards()
    this.clear()
  }

})

// CODE BELOW TO EVALUATE EXPRESSIONS

function evaluate(str) {
  str = str.replace(/\s+/g, '')
  str = str.replace(/(\d)(\()/g, "$1*$2")
  str = str.replace(/\)\(/g, ")*(")
  return evalRpn(dal2Rpn(str))  
}

function isOperator(value) {
  var operatorString = "+-*/()";
  return operatorString.indexOf(value) > -1
}

function getPrioraty(value) {
  switch (value) {
      case '+':
      case '-':
          return 1;
      case '*':
      case '/':
          return 2;
      default:
          return 0;
  }
}

function prioraty(o1, o2) {
  return getPrioraty(o1) <= getPrioraty(o2);
}

function dal2Rpn(exp) {
  var inputStack = [];
  var outputStack = [];
  var outputQueue = [];
  let res = '';
  for (var i = 0, len = exp.length; i < len; i++) {
    var cur = exp[i];
    if (cur != ' ') {
      res = res + cur;
      if (i + 1 < exp.length) {
        if (isOperator(exp[i])) {
          inputStack.push(res);
          res = ''
        } else {
          if (isOperator(exp[i + 1])) {
            inputStack.push(res);
            res = ''
          }
        }
      } else {
        inputStack.push(res);
        res = ''
      }
    }
  }

  while (inputStack.length > 0) {
      var cur = inputStack.shift();
      if (isOperator(cur)) {
          if (cur == '(') {
              outputStack.push(cur);
          } else if (cur == ')') {
              var po = outputStack.pop();
              while (po != '(' && outputStack.length > 0) {
                  outputQueue.push(po);
                  po = outputStack.pop();
              }
              if (po != '(') {
                  throw "error: unmatched ()";
              }
          } else {
              while (prioraty(cur, outputStack[outputStack.length - 1]) && outputStack.length > 0) {
                  outputQueue.push(outputStack.pop());
              }
              outputStack.push(cur);
          }
      } else {
          outputQueue.push(new Number(cur));
      }
  }

  if (outputStack.length > 0) {
      if (outputStack[outputStack.length - 1] == ')' || outputStack[outputStack.length - 1] == '(') {
          throw "error: unmatched ()";
      }
      while (outputStack.length > 0) {
          outputQueue.push(outputStack.pop());
      }
  }

  return outputQueue;

}

function evalRpn(rpnQueue) {
  var outputStack = [];
  while (rpnQueue.length > 0) {
      var cur = rpnQueue.shift();

      if (!isOperator(cur)) {
          outputStack.push(cur);
      } else {
          if (outputStack.length < 2) {
              throw "unvalid stack length";
          }
          var sec = outputStack.pop();
          var fir = outputStack.pop();

          outputStack.push(getResult(fir, sec, cur));
      }
  }
  if (outputStack.length != 1) {
      throw "unvalid expression";
  } else {
      return outputStack[0];
  }
}
function getResult(first, second, operator) {
  var result = 0;
  switch (operator) {
      case '+':
          result = first + second;
          break;
      case '-':
          result = first - second;
          break;
      case '*':
          result = first * second;
          break;
      case '/':
          result = first / second;
          break;
      default:
          return 0;
  }

  //浮点数的小数位超过两位时，只保留两位小数点
  function formatFloat(f, digit) {
      //pow(10,n) 为 10 的 n 次方
      var m = Math.pow(10, digit);
      return parseInt(f * m, 10) / m;
  }
  return (formatFloat(result, 6));
}

function addRecord(score) {
  wx.cloud.init({
    env: 'shsid-3tx38'
  })
  db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res) {
        var dayScore = res.data[0].dailyScore0
        dayScore = Math.max(dayScore, score)
        var scores = [...Array(5).keys()].map((x) => res.data[0]['dailyScore' + x])
        scores[0] = dayScore
        var totalScore = scores.reduce((a, b) => a + b, 0)
        db.collection('userInfo')
          .where({ _openid: app.globalData.openid })
          .update({
            data: {
              record: db.command.push({
                correctCount: score,
                answerTime: new Date(),
                subject: '24点'
              }),
              dailyScore0: dayScore,
              totalCorrect: totalScore
            }
          })
      }
    })
 
}
