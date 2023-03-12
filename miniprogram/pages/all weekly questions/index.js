// miniprogram/pages/all weekly questions/index.js
const app = getApp();
const db = wx.cloud.database();

Page({

  /**
   * Page initial data
   */
  data: {
    weekNum:0,
    showWeekResults: false,
    lookingAtWeek:0,
    questions: [],
    difficultyStars:{},
    myAnswers: [],
    curQuestion:app.q,
    letters:['','A','B','C','D'],
    questionItemColors:['#eeeeee','#5ea13d','#c34941'], //unanswred, correct, wrong
    colors:["#eeeeee","#C4D3D8", "#F2EFE6", "#DBEAD7", "#A3B5D9", "#C9B8C0"], // not answered, mc1, mc2, mc3, mc4, input
    numCorrect:[],
    checkCorrect:[],
    startWeek:5
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    console.log([1,2,3] )
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {
    this.setData({
      weekNum:app.weekNum
    })
    
    this.getWeeklyQuestions();
    this.getWeeklyAnswers();
  },
  changeQ: function(event){
    this.setData({
      curQuestion: event.currentTarget.dataset.num, // change question index
    })
  },

  hidePopup(event){
    this.setData({
      showWeekResults: false,
      lastWeekSeen: app.weekNum
    })
  },

  showWeek(event){
    this.setData({
      showWeekResults: true,
      lastWeekSeen: app.weekNum,
      lookingAtWeek:event.currentTarget.dataset.week,
      curQuestion:0
    })
  },

  getWeeklyAnswers(){
    let that = this;
    let answers = {}
    wx.cloud.init({
      env: 'shsid-3tx38'
    })

    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res) {
        //add answer choices for each
        for (let i=that.data.startWeek; i<=that.data.weekNum; i++){
          if (res.data[0]['myWeeklyAnswers-'+i]!=null)
            answers[i] = res.data[0]['myWeeklyAnswers-'+i]
          else
            answers[i] = []
        }
        let numCorrect = {}
        let checkCorrect = {}
        //check if answer choice is correct (RIP efficiency...)
        for (let i=that.data.startWeek; i<that.data.weekNum; i++){
          let weekCheckCorrect = [];
          let weekNumCorrect = 0;
          
          if (res.data[0]['myWeeklyAnswers-'+i]!=undefined){
            for (let j=0; j<that.data.questions[i].length; j++){
              if (res.data[0]['myWeeklyAnswers-'+i][j] == null ||res.data[0]['myWeeklyAnswers-'+i][j] == ''||res.data[0]['myWeeklyAnswers-'+i][j] == 0){ //unanswered
                weekCheckCorrect.push(0);
              }else if(res.data[0]['myWeeklyAnswers-'+i][j] == that.data.questions[i][j].answer){ //correct
                weekCheckCorrect.push(1);
                weekNumCorrect++;
              }else{ //incorrect
                weekCheckCorrect.push(2);
              }
            }
            console.log('ok')
            checkCorrect[i] = weekCheckCorrect;
            numCorrect[i]=weekNumCorrect;
            }
          }
         
        console.log("asdsad")
        console.log(checkCorrect);
        console.log(numCorrect)
        that.setData({
          myAnswers: answers,
          numCorrect: numCorrect,
          checkCorrect: checkCorrect
        })
      }
    })
    
  },
  
  getWeeklyQuestions(){
    let that = this;
    let stars = {};
    let questions= {};
    const db = wx.cloud.database();
    for (let i=that.data.startWeek; i<=that.data.weekNum; i++){
      db.collection('question')
      .where({weekNum:i})
      .get({
        success: function (res){
          let weekStars = [];
          for (let j=0; j<res.data.length; j++){
            weekStars.push("★".repeat(res.data[j].difficulty));
          }
          stars[i] = weekStars;
          questions[i] = res.data;
          that.setData({
            questions: questions,
            difficultyStars: stars
          })
        }
      })
    }
  },


  
  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function () {

  }
})