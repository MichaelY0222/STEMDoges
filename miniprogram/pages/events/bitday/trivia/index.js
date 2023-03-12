// miniprogram/pages/weekly questions/index.js
const db = wx.cloud.database();
const app = getApp();

Page({

  data: {
    week:1,
    curQuestion:0,
    questions:[],
    myAnswers: [],
    mySymbols:[],
    difficultyStars: [],
    finished: false,
    showQ: false,
    notFinished:false,
    colors:["#eeeeee","#C4D3D8", "#F2EFE6", "#DBEAD7", "#A3B5D9", "#C9B8C0"], // not answered, mc1, mc2, mc3, mc4, input
    correct:[],
    time:20,
    timer: null
  },

  onLoad: function (options) {
    let that =this;
    this.setData({
      curQuestion: 0
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
  onShow: function () {
    
  },

  restartTimer(){
    let that = this;
    this.setData({
      timer:setInterval(that.myTimer, 1000),
      time:20
    })
  },

  stopTimer(){
    clearInterval(this.data.timer);
  },

  myTimer(){
    let curTime = this.data.time;
    if (curTime>0){
      this.setData({
        time:curTime-1
      })
    }else{
      this.moveOn();
    }
  },

  showConfetti(){
    this.tips_oneBtn = this.selectComponent("#confetti")
    this.tips_oneBtn.showConfetti()
  },
  getWeeklyQuestions(){
    let that = this;
    let answers = [];
    let symbols = [];
    let stars = [];
    const db = wx.cloud.database();
    let type = "trivia-"+app.globalData.questionNum.toString();
    
    db.collection('bitday')
    .where({type:type})
    .get({
      success: function (res){
        that.setData({
          questions: res.data
        })
        that.refreshAnswers(); // load the user's weekly data
      }
    })
  },
  

  refreshAnswers(){
    let that = this;
    let answers = [];
    let symbols = [];
    let isFinished = false;

    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    db.collection('userInfo')
      .where({ _openid: app.globalData.openid })
      .get({
        success: function (res) {
          //check if this started this week's stuff
          if (res.data[0]['bitdayAnswers'] == null){
            that.setData({
              notFinished:true
            })
            that.restartTimer();
            //started
            let bitdayAns = {};
            if (res.data[0].bitdayAnswers != null){
              bitdayAns = res.data[0].bitdayAnswers;
            }
            bitdayAns["triviaStarted-" + (app.globalData.questionNum).toString()] = true;

            db.collection('userInfo')
            .where({ _openid: app.globalData.openid })
            .update({
              data: {
                bitdayAnswers: bitdayAns
              }
            });
            
          }
          else if (res.data[0]['bitdayAnswers']['triviaStarted-'+  app.globalData.questionNum]== null ){
            that.setData({
              notFinished:true
            })
            that.restartTimer();
            //started
            let bitdayAns = {};
            if (res.data[0].bitdayAnswers != null){
              bitdayAns = res.data[0].bitdayAnswers;
            }
            bitdayAns["triviaStarted-" + (app.globalData.questionNum).toString()] = true;

            db.collection('userInfo')
            .where({ _openid: app.globalData.openid })
            .update({
              data: {
                bitdayAnswers: bitdayAns
              }
            });
            
          }
          else{
            answers = res.data[0]['bitdayAnswers']["trivia-" + (app.globalData.questionNum).toString()];
            that.setData({
              finished:true,
              myAnswers: answers
            });
            that.checkCorrect(false);
          }

        }
      })
  },

  checkCorrect(givePoints){
    console.log(this.data.myAnswers);
    let that =this;
    let canAward = false;
    let points = 0;
    db.collection('settings')
    .where({type:"bitday"})
    .get({
      success: function (res){
        canAward = res.data[0].awardPoints;
        let correct = []
        for (let i=0; i<that.data.questions.length; i++){
          if (that.data.questions[i].answer == that.data.myAnswers[i]){
            correct.push(true)
            if (canAward && givePoints){
              points+=100;
            }
          }else{
            correct.push(false)
          }
        }
        that.setData({
          correct:correct
        });
        that.awardPoints(points);
      }
    })
    
    
   
  },

  awardPoints(num){
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res){
        db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .update({
          data: {
            bitdayPoints: res.data[0].bitdayPoints + num
          }
        });
        
      }
    })
  },
  
  selectAnswer(event){
    //add answer to the array and go to next question
    let answers = this.data.myAnswers;
    let cur = this.data.curQuestion;
    switch(event.currentTarget.dataset.choice){
      case "1": answers[cur] = 1; break;
      case "2": answers[cur] = 2; break;
      case "3": answers[cur] = 3; break;
      case "4": answers[cur] = 4; break;
    }
    
    this.setData({
      myAnswers:answers
    })
    this.moveOn();
  },

  goToNextQ(event){
    let cur = this.data.curQuestion + 1;
    this.setData({
      curQuestion:cur
    })
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

    this.stopTimer();

    if (cur==questions.length-1 && !this.finished){
      that.submitAllAnswers();
    }
    else{
      
      this.restartTimer();
      cur++;
      this.setData({
        curQuestion:cur
      })
    }

      
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
    
    this.setData({
      notFinished:false,
      finished: true,
      curQuestion:0
    })

    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res){
        if (res.data[0].bitdayAnswers != null){
          bitdayAns = res.data[0].bitdayAnswers;
        }
        console.log("submitting");
        bitdayAns["trivia-" + (app.globalData.questionNum).toString()] = that.data.myAnswers;
        db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .update({
          data: {
            bitdayAnswers: bitdayAns
          }
        });
        if (that.data.questions[that.data.curQuestion].answers ==  that.data.myAnswers[that.data.curQuestion]){
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
