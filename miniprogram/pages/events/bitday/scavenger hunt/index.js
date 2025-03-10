// miniprogram/pages/weekly questions/index.js
const db = wx.cloud.database();
const app = getApp();
function throttle(fn, gapTime) {
  if (gapTime == null || gapTime == undefined) {
      gapTime = 1500
  }
  let _lastTime = null
  // 返回新的函数
  return function () {
      let _nowTime = + new Date()
      if (_nowTime - _lastTime > gapTime || !_lastTime) {
          fn.apply(this, arguments)   //将this和参数传给原函数
          _lastTime = _nowTime
      }
  }
}
Page({

  data: {
    is_click:true,
    week:1,
    curQuestion:0,
    questions:[],
    myAnswers: 0,
    mySymbols:[],
    difficultyStars: [],
    finished: false,
    showQ: false,
    notFinished:false,
    colors:["#eeeeee","#C4D3D8", "#F2EFE6", "#DBEAD7", "#A3B5D9", "#C9B8C0"], // not answered, mc1, mc2, mc3, mc4, input
    correct:false,
    started: false,
    time:480,
    timer:null
  },
  
  onLoad: function (options) {
    this.setData({
      curQuestion: app.globalData.questionNum -1
    });
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    //refresh questions on enter
    this.getWeeklyQuestions();
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
  },

  onUnload: function() {
    if (this.data.started==true && this.data.notFinished) {
      console.log("hiidden")
      this.submitAllAnswers();
    }
  },

  onShow: function () {

  },

 // showConfetti(){
 //   this.tips_oneBtn = this.selectComponent("#confetti")
 //   this.tips_oneBtn.showConfetti()
 // },
//函数节流
 
  getWeeklyQuestions(){
    let that = this;
    let answers = [];
    let symbols = [];
    let stars = [];
    const db = wx.cloud.database();
    db.collection('bitday')
    .where({type:"scavenger hunt"})
    .get({
      success: function (res){
        let questions = res.data;
        db.collection('bitday')
        .where({type:"scavenger hunt"})
        .get({
          success: function (res){
            questions = questions.concat(res.data);
            console.log(questions);
            that.setData({
              questions: questions
            })
            that.refreshAnswers(); // load the user's weekly data
          }
        })
      }
    })
  },
  

  refreshAnswers(){
    let that = this;
    let answers = [];
    let symbols = [];
    let isFinished = false;
    this.setData({
      myAnswers: 0
    })
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    db.collection('userInfo')
      .where({ _openid: app.globalData.openid })
      .get({
        success: function (res) {
          let answer = 0;
          //check if this started this week's stuff
          if (res.data[0]['bitdayAnswers']['scavStarted-'+  app.globalData.questionNum] == null){
            that.setData({
              started:false
            })
            that.foundQuestion();
            that.setData({
              notFinished:true
            })
          }
          else{
            answer = res.data[0]['bitdayAnswers']['scav-'+  app.globalData.questionNum];
            that.setData({
              finished:true,
              started: true,
              myAnswers: answer
            });
            that.checkCorrect(false);
          }

        }
      })
  },
  myTimer(){
    let curTime = this.data.time;
    if (curTime>0){
      this.setData({
        time:curTime-1
      });
    }else{
      clearInterval(this.data.timer);
      this.submitAllAnswers();
    }
  },
  
  checkCorrect(givePoints){
    console.log("check")
    console.log(this.data.myAnswers);
    let correct = false;
    let that =this;
    this.setData({
      notFinished:false,
      finished: true
    })
    if (this.data.questions[this.data.curQuestion].answer ==  this.data.myAnswers){
      correct = true;
    }
    this.setData({
      correct:correct
    })   
    console.log(givePoints);
    if (givePoints==true && correct && this.data.is_click){
      that.awardPoints(1);
      console.log("given points")
      this.setData({
        is_click: false
      })
    }
  },

  awardPoints(num){
    console.log("award" + num)
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res){
        db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .update({
          data: {
            gamesPoints: res.data[0].gamesPoints + num
          }
        });
        
      }
    })
  },

  foundQuestion(){

    let that = this;
  //  this.showConfetti();
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res){
        let bitdayAns = {};
        if (res.data[0].bitdayAnswers != null){
          bitdayAns = res.data[0].bitdayAnswers;
        }
        console.log("scav-" + (that.data.curQuestion+1).toString());
        
        if (bitdayAns["scav-" + (that.data.curQuestion+1).toString()] == null){
          db.collection('settings')
          .where({type:"bitday"})
          .get({
            success: function (res){
              that.awardPoints(0);
            }
          })
        }
        // bitdayAns["scav-" + (that.data.curQuestion+1).toString()] = 0;
        // db.collection('userInfo')
        // .where({ _openid: app.globalData.openid })
        // .update({
        //   data: {
        //     bitdayAnswers: bitdayAns
        //   }
        // });
      }
    })
  },
  startQuestion(event){
    console.log("started");
    this.setData({
      timer:setInterval(this.myTimer, 1000),
      time:60,
      started: true,
      notFinished: true
    })

    let that = this;
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res){
        let bitdayAns = {};
        if (res.data[0].bitdayAnswers != null){
          bitdayAns = res.data[0].bitdayAnswers;
        }
        bitdayAns["scavStarted-" + (that.data.curQuestion+1).toString()] = true;
        db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .update({
          data: {
            bitdayAnswers: bitdayAns
          }
        });
      }
    })
  },
  selectAnswer: throttle(function(event){
      //add answer to the array and go to next question
    let answers = 0;
    switch(event.currentTarget.dataset.choice){
      case "1": answers= 1; break;
      case "2": answers = 2; break;
      case "3": answers = 3; break;
      case "4": answers = 4; break;
    }
    
    this.setData({
      myAnswers:answers
    })
    this.moveOn();
  },4000),

  goToNextQ(event){
    this.moveOn();
  },
  goToPrevQ(event){
    let cur = this.data.curQuestion;
    let answers = this.data.myAnswers;
    let questions = this.data.questions;
    let that = this;
    if (cur==0){
     
    }
    else{
      cur--;
      let symbols = this.data.mySymbols;
      symbols[cur] = '';
      this.setData({
        curQuestion:cur,
        mySymbols: symbols
      })
    }
  },
  moveOn(){
    let cur = this.data.curQuestion;
    let answers = this.data.myAnswers;
    let questions = this.data.questions;
    let that = this;
    
   this.submitAllAnswers();
      
  },
  submitAnswer(event){
    let answers = this.data.myAnswers;
    let cur = this.data.curQuestion;
    let symbols = this.data.mySymbols;
    answers[cur] = event.detail.value.textarea;
    console.log(answers[cur]);
    
    symbols[cur] = '';
    this.setData({
      myAnswers:answers,
      mySymbols: symbols
    })
    this.moveOn();
    
  },
  
  
  submitAllAnswers(event){
    let bitdayAns = {};
    let that = this;
    that.checkCorrect(true);
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res){
        if (res.data[0].bitdayAnswers != null){
          bitdayAns = res.data[0].bitdayAnswers;
        }
        bitdayAns["scav-" + (that.data.curQuestion+1).toString()] = that.data.myAnswers;
        db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .update({
          data: {
            bitdayAnswers: bitdayAns
          }
        });
        if (that.data.questions[that.data.curQuestion] ==  that.data.myAnswers){
          that.setData({
            correct:true
          });
        }
        that.checkCorrect(true);
      }
    })
  
  },

  changeAnswers(event){
    this.setData({
      finished: false,
      curQuestion:0
    });
    let that = this;
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .update({
      data: {
        isFinished: false
      }
    })
    
  },

  showQuestions(event){
    this.setData({
      showQ:true
    })
  },

  hideQuestions(event){
    this.setData({
      showQ:false
    })
  },

  redirect(event){
    console.log(event);
    wx.navigateBack();
  }
})
