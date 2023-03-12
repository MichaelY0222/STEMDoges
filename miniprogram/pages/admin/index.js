// miniprogram/pages/admin/index.js

const db = wx.cloud.database();
const app = getApp();

Page({

  data: {
    
    finishedWeekly:0,
    weeklyQuestions: [],
    weekNum: 1, 
    curQuestion: 0,
    stars:"",
    correctChoice:0,
    adminError:"",
    lookingAtWeek:0,
    changedWeek: false,
    colors:["#F9A468","#BBB8B6","#C4D3D8", "#F2EFE6", "#DBEAD7", "#A3B5D9"], //selected, not selected, mcq1, mcq2, mcq3, mcq4
    userNum:0,
    admins:[],
    popups:[false,false,false,false,false],
    showingPopup: false,
    autoUpdate: false,
    prevWeek:0,
    coverImg: null,
    abc: ["no","yes"],
    timeLeftTillUpdate: "10:00:00"
  },

 
  onLoad: function (options) {
    this.setData({
      weekNum: app.weekNum,
      lookingAtWeek:app.weekNum
    }) 
    
    this.getWeeklyQuestionStats();
    this.getUsersStats();
    this.getAutoUpdateInfo();
    this.getTime();
  },
  getAutoUpdateInfo(){
    let that = this;
    db.collection('settings')
    .where({type:"autoUpdate"})
    .get({
      success: function (res){
        console.log(res.data[0].auto);
        that.setData({
          autoUpdate:res.data[0].auto,
          prevWeek:res.data[0].prev
        })
      }
    })
  },

  toggleAutoUpdate(event){
    let update = !this.data.autoUpdate
    this.setData({
      autoUpdate:update
    })

    db.collection('settings')
    .where({type:"autoUpdate"})
    .update({
      data: {
        auto: update
      }
    })

  },
  getTime(){
    // var firstDay = new Date("2009/06/25");
    // var nextWeek = new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    var today = new Date();
    if (today.getHours() < 21 && today.getDay() == 5)
      var daysLeft = 0;
    else if (today.getDay() >= 5)
      var daysLeft = 7-today.getDay()+5
    else
      var daysLeft = 5%today.getDay()

    var countDownDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()+daysLeft, 21);
    //var countDownDate = new Date("Jan 5, 2022 15:37:25").getTime();
    // Update the count down every 1 second
    let that = this;
    setInterval(function() {
      // Get today's date and time
      var now = new Date().getTime();

      // Find the distance between now and the count down date
      var distance = countDownDate - now;

      // Time calculations for days, hours, minutes and seconds
      var days = Math.floor(distance / (1000 * 60 * 60 * 24));
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Display the result in the element with id="demo"
      that.setData({
        timeLeftTillUpdate: days + "d " + hours + "h "+ minutes + "m " + seconds + "s "
      });

    }, 1000);
  },
  chooseCoverImg(event){
    let that = this;
    wx.chooseImage({count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success (res) {
        wx.cloud.uploadFile({
          cloudPath: "weeklyQuestions/week"+(that.data.weekNum+1)+ '/cover.jpg', // image file in folder named after its type
          filePath: res.tempFilePaths[0],
          success(res2) { // write the address of uploaded pic back into question data
            //questions[curQ].img = res2.fileID;
            console.log(res2.fileID);
          },
          fail: err => {
            // handle error
            console.log(err)
          }
        })
    }})
  },

  changeQ: function(event){
    let star = "★".repeat(this.data.weeklyQuestions[event.currentTarget.dataset.num].difficulty);
    let questions = this.data.weeklyQuestions
    this.setData({
      curQuestion: event.currentTarget.dataset.num, // change question index
      stars: star,
      correctChoice: questions[event.currentTarget.dataset.num].answer==null?0:questions[event.currentTarget.dataset.num].answer
    })
  },

  addPointsToUsers(){
    let that = this;
    db.collection('userInfo')
    .where({
      isFinished:true,
      lastWeekSeen:that.data.weekNum //make sure that it's newest week
    })
    .get({
      success: function (res){
        let people = res.data;  
        for (let i=0; i<people.length; i++){
          //console.log(people[i]._id)
          let curPoints = 0;
          if (people[i].WeeklyQuestionPoints != null)
            curPoints = people[i].WeeklyQuestionPoints;

          db.collection('userInfo')
          .where({
            _id:people[i]._id
          })
          .update({
            data: {
              WeeklyQuestionPoints: curPoints
            }
          })
          //console.log(people[i])
        }
      }
    })
  },

  getWeeklyQuestionStats(){
    let that = this;
    let cur = this.data.curQuestion;
    let whichWeek = this.data.lookingAtWeek;
    const db = wx.cloud.database();
    //get questions
    db.collection('question')
    .where({weekNum:whichWeek})
    .get({
      success: function (res){
        
        if (that.data.changedWeek){
          cur = 0;
          that.setData({
            curQuestion:0,
            changedWeek: false,
            weeklyQuestions: res.data,
            correctChoice:0
          })
          //if there are any questoins, then get the stars & answer
          if (res.data.length > 0){
            let star = "★".repeat(res.data[cur].difficulty)
            that.setData({
              stars:star,
              correctChoice: res.data[cur].answer==null?0:res.data[cur].answer
            })
          }
        }
        else{
          let star = "★".repeat(res.data[cur].difficulty)
          that.setData({
            weeklyQuestions: res.data,
            correctChoice: res.data[cur].answer==null?0:res.data[cur].answer,
            stars:star
          })
        }
        
      }
    })

    //get users finished
    db.collection('userInfo')
    .where({
      isFinished:true,
      lastWeekSeen:that.data.weekNum //make sure that it's newest week
    })
    .count({
      success: function (res){
        that.setData({
          finishedWeekly: res.total
        })
        
      }
    })
  },

  lookAtNextWeek(event){
    let week = this.data.lookingAtWeek +1;
    this.setData({
      lookingAtWeek:week,
      changedWeek: true
    })
    this.getWeeklyQuestionStats();
  },

  lookAtPrevWeek(event){
    let week = this.data.lookingAtWeek-1;
    this.setData({
      lookingAtWeek:week,
      changedWeek: true
    })
    this.getWeeklyQuestionStats();
  },

  getUsersStats(){
    let that = this;
    //count total users
    const db = wx.cloud.database();
    db.collection('userInfo')
    .count({
      success: function (res){
        that.setData({
          userNum: res.total
        })
        
      }
    })

    //count admins
    db.collection('userInfo')
    .where({ admin: true})
    .get({
      success: function (res){
        console.log(res.data)
        that.setData({
          admins: res.data
        })
        
      }
    })
  },
  hidePopup(event){
    this.setData({
      showingPopup: false,
      popups:[]
    })
  },
  showPopup(event){
    let thePopups = this.data.popups;
    thePopups[event.currentTarget.dataset.popupnum] = true; //set value in popups to be true 
    this.setData({
      showingPopup: true,
      popups:thePopups
    })
  },
  startNewWeek(n){
    let that = this;
    let newWeekNum = this.data.weekNum+=n;
    this.setData({
      weekNum:newWeekNum,
      weeklyQuestions:[]
    })
    
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    
    db.collection('settings')
    .where({type:"weekInfo"})
    .update({
      data: {
        weekNum: newWeekNum
      }
    }).then(res=>{
      that.getWeeklyQuestionStats()
    })

  },
  nextWeek(event){
    //confirm if want to end
    let that = this;
    wx.showModal({
      title: 'confirm',
        content: 'Are you sure you want to go to next week?',
        success (res) {
          if (res.confirm) {
            that.startNewWeek(1);
          } else if (res.cancel) {
            console.log('"Cancel" is tapped')
          }
        }
      })
  },
  prevWeek(event){
    //confirm if want to end
    let that = this;
    wx.showModal({
      title: 'confirm',
        content: 'Are you sure you want to go to previous week?',
        success (res) {
          if (res.confirm) {
            that.startNewWeek(-1);
          } else if (res.cancel) {
            console.log('"Cancel" is tapped')
          }
        }
      })
  },
  addQ(event){
    //let currentQuestions = this.data.weeklyQuestions;
    //currentQuestions.push();
    let that = this;
    let create = app.globalData.openid ;
    db.collection('question')
    .add({
      data: {
        uploadDate: new Date(),
        creator: create,
        difficulty:1,
        weekNum: that.data.lookingAtWeek
      }
    }).then(res=>{
      that.getWeeklyQuestionStats()
    })
  },
  setNewQuestions(event){

  },
  deleteQuestion(event){
    let curQ = this.data.curQuestion;
    //change cur Q index
    if (curQ == 0)
      curQ = this.data.weeklyQuestions.length-2;
    else
      curQ --;
    let that = this;
    let QuestionId = this.data.weeklyQuestions[this.data.curQuestion]._id;
    db.collection('question').doc(QuestionId)
    .remove()
    .then(res=>{
      that.setData({curQuestion:curQ})
      that.getWeeklyQuestionStats()
    })
  },
  changeDifficulty(event){
    let star = "★".repeat(event.detail.value);
    this.setData({
      stars: star
    })
  },
  submitQuestion(event){
    let questions = this.data.weeklyQuestions;
    let currentQ = this.data.curQuestion;
    let qDifficulty = this.data.stars.length;
    let that = this;
    questions[currentQ].choice1 = event.detail.value.choice1;
    questions[currentQ].choice2 = event.detail.value.choice2;
    questions[currentQ].choice3 = event.detail.value.choice3;
    questions[currentQ].choice4 = event.detail.value.choice4;
    questions[currentQ].difficulty = qDifficulty;
    questions[currentQ].chiQuestion = event.detail.value.question;
    questions[currentQ].subject = event.detail.value.subject.toUpperCase();
    if (!questions[currentQ].isMC)
      questions[currentQ].answer = event.detail.value.answerInputText;
    else
      questions[currentQ].answer = this.data.correctChoice;
    questions[currentQ].steps = event.detail.value.answerSteps;
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    db.collection('question')
    .where({ _id: questions[currentQ]._id })
    .update({
      data: {
        answer: questions[currentQ].answer,
        chiQuestion: questions[currentQ].chiQuestion,
        choice1: questions[currentQ].choice1,
        choice2: questions[currentQ].choice2,
        choice3: questions[currentQ].choice3,
        choice4: questions[currentQ].choice4,
        difficulty: questions[currentQ].difficulty,
        isMC: questions[currentQ].isMC,
        img:questions[currentQ].img,
        titleImg:questions[currentQ].titleImg,
        subject:questions[currentQ].subject,
        steps: questions[currentQ].steps
      }
    }).then(res=>{
      that.setData({
        weeklyQuestions:questions
      })
    });
  },

  chooseCorrectAnswer(event){
    this.setData({
      correctChoice: event.currentTarget.dataset.choice
    })
  },

  changeQuestionProperties(event){
    let questions = this.data.weeklyQuestions;
    let currentQ = this.data.curQuestion;
    switch(event.currentTarget.dataset.type){
      case "MCQ": questions[currentQ].isMC = true; break;
      case "INPUT": questions[currentQ].isMC = false; break;
      case "TEXT": questions[currentQ].chiQuestion = questions[currentQ].chiQuestion==null?'':null; break;
      case "IMG": questions[currentQ].img  = questions[currentQ].img == null?'null':null;break;
    }

    this.setData({
      weeklyQuestions:questions
    })
  },

  chooseImg(event){
    let that = this;
    let questions = this.data.weeklyQuestions;
    let curQ = this.data.curQuestion;
    wx.chooseImage({count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success (res) {
        wx.cloud.uploadFile({
          cloudPath: "weeklyQuestions/week"+that.data.lookingAtWeek+ '/' + that.data.curQuestion + '.jpg', // image file in folder named after its type
          filePath: res.tempFilePaths[0],
          success(res2) { // write the address of uploaded pic back into question data
            questions[curQ].img = res2.fileID;
            console.log(res2.fileID);
            that.setData({
              weeklyQuestions:questions
            })
          },
          fail: err => {
            // handle error
            console.log(err)
          }
        })
    }})
  },
  chooseTitleImg(event){
    let that = this;
    let questions = this.data.weeklyQuestions;
    let curQ = this.data.curQuestion;
    wx.chooseImage({count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success (res) {
        wx.cloud.uploadFile({
          cloudPath: "weeklyQuestions/week"+that.data.lookingAtWeek+ '/title' + that.data.curQuestion + '.jpg', // image file in folder named after its type
          filePath: res.tempFilePaths[0],
          success(res2) { // write the address of uploaded pic back into question data
            questions[curQ].titleImg = res2.fileID;
            console.log(res2.fileID);
            that.setData({
              weeklyQuestions:questions
            })
          },
          fail: err => {
            // handle error
            console.log(err)
          }
        })
    }})
  },
  addAdminRes(res){
    console.log(res);
    if (res.data.length == 0){
      //user not found
      this.setData({
        adminError:"user not found"
      })
    }
    else{
      //user found
      // let curAdmins = this.data.admins;
      // curAdmins.push(res.data[0])
      let that =this;
      this.setData({
        adminError:"success"
      })
      db.collection('userInfo')
      .where({ _id: res.data[0]._id})
      .update({
        data: {
          admin:true
        }
      }).then(res=>{
        that.getUsersStats();
      });
    }
  },
  removeAdmin(event){
    let that = this
    let adminId = this.data.admins[event.currentTarget.dataset.person]._id
    console.log(adminId)
    db.collection('userInfo')
    .where({ _id: adminId})
    .update({
      data: {
        admin:false
      }
    }).then(res=>{
      that.getUsersStats();
    });
  },
  addAdmin(event){
    let that = this;
    let gNum = event.detail.value.gNum;
    let name = event.detail.value.name;

   
    if (gNum != ""){
       //find user by Gnum
       db.collection('userInfo')
      .where({
        userGnum:gNum
      })
      .get({
        success: function (res) {
          that.addAdminRes(res);
        }
      })
    }
    else if(name!=""){
       //find user by Wechat Nickname
       db.collection('userInfo')
       .where({
         userRealName:name
       })
       .get({
        success: function (res) {
            that.addAdminRes(res);
          
        }
       })
    }
    else{
      this.setData({
        adminError:"please enter gnumber/name"
      })
    }
  },
})
