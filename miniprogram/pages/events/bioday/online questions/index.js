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
    correct:false,
    time:20,
    timer: null,
    biodayQuestions: []
  },

  onLoad: function (options) {
    let that =this;
    this.setData({
      curQuestion: app.globalData.questionNum
    });
    console.log(app.globalData.questionNum);
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
    let type = "online questions";
    let n = app.globalData.questionNum;

    let Qs = [];

    for (let i =0; i<=100; i+=20){
      db.collection('bioweek')
      .where({type:type})
      .skip(i)
      .get({
        success: function (res){
          Qs = Qs.concat(res.data);

          Qs.sort((a, b) => b.question - a.question)
              
          that.setData({
            questions: Qs

          })
          
        }
      })
    }

    that.refreshAnswers(); // load the user's weekly data
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
          console.log("onlineQuestions-" + (res.data[0].biodayQuestions[app.globalData.questionNum]).toString());
          if (res.data[0]['bioweekAnswers'] == null || res.data[0]['bioweekAnswers']["onlineQuestions-" + (res.data[0].biodayQuestions[app.globalData.questionNum]).toString()] == null){
            that.setData({
              notFinished:true,
              biodayQuestions: res.data[0].biodayQuestions,
              curQuestion: res.data[0].biodayQuestions[app.globalData.questionNum]
            })
            //started
            let bioweekAns = {};
            if (res.data[0].bioweekAnswers != null){
              bioweekAns = res.data[0].bioweekAnswers;
            }
            console

            db.collection('userInfo')
            .where({ _openid: app.globalData.openid })
            .update({
              data: {
                bioweekAnswers: bioweekAns
              }
            });
            

          }
          else{
            answers = res.data[0]['bioweekAnswers']["onlineQuestions-" + (res.data[0].biodayQuestions[app.globalData.questionNum]).toString()];
            that.setData({
              finished:true,
              myAnswers: answers,
              biodayQuestions: res.data[0].biodayQuestions,
              curQuestion:res.data[0].biodayQuestions[app.globalData.questionNum]
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
  
    let n = this.data.curQuestion;
    let biodayQuestions = this.data.biodayQuestions;
    db.collection('settings')
    .where({type:"bioweek"})
    .get({
      success: function (res){
        canAward = res.data[0].awardPoints;
        let correct = []
        if (that.data.questions[n].answer == that.data.myAnswers[n]){
          if (canAward && givePoints){
            that.awardPoints(100);
          }
          that.setData({
            correct:true
          });
        }else{
          that.setData({
            correct:false
          });
        }
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
            bioweekPoints: res.data[0].bioweekPoints + num
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
    this.submitAllAnswers();
  

      
  },
  submitAnswer(event){
    let answers = this.data.myAnswers;
    let cur = this.data.curQuestion;
    let symbols = this.data.mySymbols;
    answers[this.data.curQuestion] = event.detail.value.textarea;
    console.log(answers[this.data.curQuestion]);
    
    symbols[this.data.curQuestion] = '';
    this.setData({
      myAnswers:answers,
      mySymbols: symbols
    })
    this.moveOn();
    
  },
  
  
  submitAllAnswers(event){
    let bioweekAns = {};
    let that = this;
    let biodayQuestions = this.data.biodayQuestions;
    this.setData({
      notFinished:false,
      finished: true
    })
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res){
        if (res.data[0].bioweekAnswers != null){
          bioweekAns = res.data[0].bioweekAnswers;
        }
        console.log("submittingg");
        bioweekAns["onlineQuestions-" + (biodayQuestions[app.globalData.questionNum]).toString()] = that.data.myAnswers;
        console.log(biodayQuestions[app.globalData.questionNum].toString());
        db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .update({
          data: {
            bioweekAnswers: bioweekAns
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
