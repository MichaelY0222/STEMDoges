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
    pythonView:false,
    order:[]
  },

  onLoad: function (options) {
  },
  onShow: function () {
    
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
    db.collection('bitday')
    .where({type:"programming"})
    .get({
      success: function (res){
        
        let order = [];
        for (let i=0; i<res.data[that.data.curQuestion].blocks.length; i++){
          order.push(i);
        }
        that.setData({
          questions: res.data,
          order: order
        })
        that.refreshAnswers(); // load the user's weekly data
      }
    })
  },

  changeView(){
    this.setData({
      pythonView:!this.data.pythonView
    })
  },

  movedown(event){
    
    let n = event.currentTarget.dataset.num;
    let order = this.data.order;
    let a = order[n];
    order[n] = order[n-1];
    order[n-1] = a;
    this.setData({
      order:order
    })
  },

  moveup(event){
    let n = event.currentTarget.dataset.num;
    let order = this.data.order;
    let a = order[n];
    order[n] = order[n+1];
    order[n+1] = a;
    this.setData({
      order:order
    })
  },
  refreshAnswers(){
    let that = this;
    let answers = [];
    let symbols = [];
    let isFinished = false;
    this.setData({
      myAnswers: [],
      mySymbols: []
    })
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    db.collection('userInfo')
      .where({ _openid: app.globalData.openid })
      .get({
        success: function (res) {
          //check if this started this week's stuff
          if (res.data[0]['bitdayAnswers'] == null){
            answers.push(0);
            that.setData({
              notFinished:true
            })
            
          }
          else if (res.data[0]['bitdayAnswers']['programmingQuestion-'+  app.globalData.questionNum]== null ){
            answers.push(0);
            that.setData({
              notFinished:true
            })
          }
          else{
            let order = res.data[0]['bitdayAnswers']['programmingQuestion-'+  app.globalData.questionNum];
            that.setData({
              finished:true,
              order:order
            });
            that.checkCorrect(false);
            
          }

        }
      })
  },
  
  selectAnswer(event){
    //add answer to the array and go to next question
    let answers = this.data.myAnswers;
    let cur = this.data.curQuestion;
    let symbols = this.data.mySymbols;
    switch(event.currentTarget.dataset.choice){
      case "1": answers[cur] = 1; break;
      case "2": answers[cur] = 2; break;
      case "3": answers[cur] = 3; break;
      case "4": answers[cur] = 4; break;
    }
    
    symbols[cur] = '';
    this.setData({
      myAnswers:answers,
      mySymbols: symbols
    })
    this.moveOn();
  },

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
    
    wx.showModal({
      title: 'Submit',
        content: 'Submit Answers?',
        success (res) {
          if (res.confirm) {
            that.submitAllAnswers();
          } else if (res.cancel) {
            console.log('"Cancel" is tapped')
          }
        }
   })
      
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
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res){
        if (res.data[0].bitdayAnswers != null){
          bitdayAns = res.data[0].bitdayAnswers;
        }
        bitdayAns["programmingQuestion-" + (that.data.curQuestion+1).toString()] = that.data.order;
        db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .update({
          data: {
            bitdayAnswers: bitdayAns
          }
        });
        
        that.checkCorrect(true);
        that.refreshAnswers();
        that.getWeeklyQuestions();
      }
    })
  
  },
  checkCorrect(givePoints){
    let correct = true;
    let that = this;
    console.log(this.data.questions[this.data.curQuestion].order );
    console.log(this.data.order);
    for (let i=0; i<this.data.order.length; i++){
      if (this.data.questions[this.data.curQuestion].order[i] !=  this.data.order[i]){
        correct = false;
      }
    }
    console.log(correct);
    this.setData({
      correct:correct
    });

    db.collection('settings')
    .where({type:"bitday"})
    .get({
      success: function (res){
        if (res.data[0].awardPoints && givePoints && correct){
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
            bitdayPoints: res.data[0].bitdayPoints + num
          }
        });
        
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

  redirect: function(event){
    app.globalData.questionNum = app.globalData.questionNum+1;
    wx.redirectTo({
      url: '../programming questions/index',
    })
  },
})
