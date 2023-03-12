// miniprogram/pages/weekly questions/index.js
const db = wx.cloud.database();
const app = getApp();

Page({

  data: {
    week:1,
    curQuestion: 0,
    questions:[],
    myAnswers: [],
    mySymbols:[],
    difficultyStars: [],
    finished: false,
    showQ: false,
    viewQuestions:false,
    colors:["#eeeeee","#C4D3D8", "#F2EFE6", "#DBEAD7", "#A3B5D9", "#C9B8C0"], // not answered, mc1, mc2, mc3, mc4, input
  },

  onLoad: function (options) {
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

  showConfetti(){
    this.tips_oneBtn = this.selectComponent("#confetti")
    this.tips_oneBtn.showConfetti()
  },
  checkCorrect(givePoints){
    console.log(this.data.myAnswers);
    let that =this;
    let points = 0;
    
    let correct = [];
    let numCorrect = 0;
    let pointsAvaliable = 0;
    for (let i=0; i<this.data.myAnswers.length; i+=1){
      pointsAvaliable += that.data.questions[i].difficulty;
      if (that.data.questions[i].answer == that.data.myAnswers[i]){
        correct.push(true);
        points += that.data.questions[i].difficulty;
        numCorrect +=1;
      }else{
        correct.push(false);
      }
    }

    that.setData({
      correct:correct,
      numCorrect:numCorrect,
      numPoints: points,
      pointsAvaliable: pointsAvaliable
    });

    if (givePoints){
      that.awardPoints(points);
    }
   
  },
  awardPoints(num){
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res){
        let total = 0;
        if (res.data[0].totalPoints == null)
          total = num
        else
          total = res.data[0].totalPoints + num

        db.collection('userInfo')
        .where({ _openid: app.globalData.openid })
        .update({
          data: {
            ["weeklyPoints-"+app.weekNum]: num,
            totalPoints:  total,
          }
        });
        
      }
    })
  },
  
  getWeeklyQuestions(){
    let that = this;
    let answers = [];
    let symbols = [];
    let stars = [];
    const db = wx.cloud.database();
    db.collection('question')
    .where({weekNum:app.weekNum})
    .get({
      success: function (res){
        for (let i=0; i<res.data.length; i++){
          stars.push("★".repeat(res.data[i].difficulty));
        }

        that.setData({
          questions: res.data,
          difficultyStars:stars
        })
        console.log(res.data)
        that.refreshAnswers(); // load the user's weekly data
      }
    })
  },
  
  changeQ: function(event){
    this.hideQuestions();
    let symbols = this.data.mySymbols;
    symbols[event.currentTarget.dataset.num] = '';
    this.setData({
      curQuestion: event.currentTarget.dataset.num, // change question index
      mySymbols: symbols
    })
  },

  updateAnswers(){
    let answers = this.data.myAnswers;
    let symbols = this.data.mySymbols;
    wx.cloud.init({
      env: 'shsid-3tx38'
    })

    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .update({
      data: {
        ['myWeeklyAnswers-'+app.weekNum]: answers,
        myWeeklySymbols: symbols,
        lastWeekSeen: app.weekNum
      } 
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
          console.log(res.data[0])
          //check if this started this week's stuff
          if (res.data[0]['myWeeklyAnswers-'+app.weekNum]== null){
            // if not, create new 
            for (let i=0; i<that.data.questions.length; i++){
              answers.push(0);
              if (i==0)
                symbols.push('');
              else
                symbols.push('?');
            }
            isFinished = false;
            //symbols[0] = ''; // first symbol will be nothing since user will see q1
          }
          else{
            answers = res.data[0]['myWeeklyAnswers-'+app.weekNum];
            //add blank answers if questions are added
            console.log(answers);
            for (let i=answers.length; i<that.data.questions.length; i++){
              answers.push(0);
              symbols.push('?');
            }
            
            isFinished =  res.data[0].isFinished;
            if (isFinished == null)
              isFinished = false;

            if (isFinished){
              that.showConfetti();
              symbols = res.data[0].myWeeklySymbols;
            }
            else{ //add symbols back
              for (let i=0; i<that.data.questions.length; i++){
                if (answers[i]==0 ||answers[i]==null )
                  symbols.push('?');
                else
                  symbols.push('');
              }
              symbols[0] = ""//already looking at first q
            }
          }
          that.setData({
            myAnswers: answers,
            mySymbols: symbols,
            finished: isFinished
          })
          if (isFinished)
            that.checkCorrect(false);
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
    this.updateAnswers();
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
    if (cur==questions.length-1){
      // if finished, show submit popup
      if (this.data.finished){
        this.setData({
          curQuestion:0,
          viewQuestions:false
        })
      }else{
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
      }
      
      }
      else{
        cur++;
        let symbols = this.data.mySymbols;
        symbols[cur] = '';
        this.setData({
          curQuestion:cur,
          mySymbols: symbols
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
    this.updateAnswers();
    
  },
  
  
  submitAllAnswers(event){
    this.setData({
      finished: true,
      curQuestion:0
    })
    this.showConfetti();
    this.checkCorrect(true);
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .update({
      data: {
        isFinished: true,
        lastWeekSeen: app.weekNum
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

  viewAnswers(event){
    this.setData({
      viewQuestions:true
    });
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
