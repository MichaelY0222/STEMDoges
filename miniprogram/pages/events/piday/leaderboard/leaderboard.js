// const db = wx.cloud.database();
// const app = getApp();

// miniprogram/pages/bitday/leader board/index.js
Page({

  /**
   * Page initial data
   */
  data: {
    // users:[],
    // user: [],
    // day: 0
    currentUserRank: 0,
    currentUserPoints: 0,
    leaderboard: []
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    // this.getUsers();
 //   this.getRanking();
    // this.getGamesUsers();
    // this.setData({
    //   day: new Date().getDate()
    // });
    //console.log("hello", this.data.day);
    wx.cloud.callFunction({
      name: "computeLeaderboard",
    }).then(res => {
      this.setData({
        leaderboard: res.result.leaderboard,
        currentUserRank: res.result.currentUserRank,
        currentUserPoints: res.result.currentUserPoints,
      })
    }).catch(err => {
      console.error("Error fetching leaderboard:", err);
    });
    wx.hideLoading();
  },

  // getUsers(){
  //   let that = this;
  //   //db.collection('userInfo').orderBy('bitdayPoints', 'desc')
  //   db.collection('userInfo').orderBy('gamesPoints', 'desc')
  //   .limit(20)
  //   .get({
  //     success: function (res) {
  //       let users = [];
  //       let user = [];
  //       for (var i=0; i<res.data.length; i++)
  //       {
  //         users[i] = [i+1, res.data[i].userRealName, res.data[i].bitdayPoints,res.data[i].userGrade, res.data[i].userClass];
  //         if (res.data[i]._openid==app.globalData.openid){
  //           user = [i+1, res.data[i].userRealName, res.data[i].bitdayPoints,res.data[i].userGrade, res.data[i].userClass];
  //         }
  //       }
  //       console.log(users);
  //       console.log(user);
  //       that.setData({
  //         users:users,
  //         user:user
  //       })
  //     }
  //   })
  // },

  // getGamesUsers(){
  //       let that = this;
  //       db.collection('userInfo').orderBy('gamesPoints', 'desc')
  //       .limit(20)
  //       .get({
  //         success: function (res) {
  //           let users = [];
  //           let user = [];
  //           for (var i=0; i<res.data.length; i++)
  //           {
  //             users[i] = [i+1, res.data[i].userRealName, res.data[i].gamesPoints,res.data[i].userGrade, res.data[i].userClass];
  //             if (res.data[i]._openid==app.globalData.openid){
  //               user = [i+1, res.data[i].userRealName, res.data[i].gamesPoints,res.data[i].userGrade, res.data[i].userClass];
  //             }
  //           }
  //           console.log(users);
  //           console.log(user);
  //           that.setData({
  //             users:users,
  //             user:user
  //           })
  //         }
  //       })
  //     },
/**
  getRanking() {
    let that = this;
    // wx.cloud.callFunction({
    //   name: 'getRanking',
    //   success: res => {
    //     var arr = res.result
    //     console.log(res.result);
    //     arr.sort((a, b) => b.bitdayPoints - a.bitdayPoints)
    //     that.setData({ totalRanking: arr })
    //     var totalRank = arr.map((a) => a._openid).indexOf(app.globalData.openid) + 1
    //     that.setData({ rank: totalRank })
        
    //   },
    // })
    
    db.collection('bitday')
    .where({type:"trivia-1"})
    .get({
      success: function (res){
        let trivia1 = res.data;
        db.collection('bitday')
        .where({type:"trivia-2"})
        .get({
          success: function (res){
            let trivia2 = res.data;
            db.collection('bitday')
            .where({type:"trivia-3"})
            .get({
              success: function (res){
                let trivia3 = res.data;  
                db.collection('bitday')
                .where({type:"scavenger hunt"})
                .get({
                  success: function (res){
                  let scavenger = res.data;
                  db.collection('bitday')
                  .where({type:"scavenger hunt"})
                  .skip(20)
                  .get({
                    success: function (res){
                    scavenger = scavenger.concat(res.data);
                    db.collection('bitday')
                  .where({type:"programming"})
                  .get({
                    success: function (res){
                      let programmingQuestions = res.data;
                      let arr = [];
                      for (let i=1; i<=49; i++){
                        db.collection('userInfo')
                        .where({bitdayVerified:true})
                        .skip(i*20)
                        .get({
                          success: function (res){
                            arr = arr.concat(res.data);
                            if (i == 49){
                              console.log(arr);
                              let newArr = [];
                              for (let j=0; j<arr.length;j++){
                                if (arr[j].bitdayAnswers!=null){
                                  console.log(j);
                                  for (const key in arr[j]["bitdayAnswers"]) {
                                    if (key == "trivia-1"){
                                      for (let k = 0; k<10; k++){
                                        if (arr[j]["bitdayAnswers"][key][k] == trivia1[k].answer)
                                          arr[j].bitdayPoints +=100;
                                      }
                                    }
                                    else if (key == "trivia-2"){
                                      for (let k = 0; k<10; k++){
                                        if (arr[j]["bitdayAnswers"][key][k] == trivia2[k].answer)
                                          arr[j].bitdayPoints +=100;
                                      }
                                    }
                                    else if (key == "trivia-3"){
                                      for (let k = 0; k<10; k++){
                                        if (arr[j]["bitdayAnswers"][key][k] == trivia3[k].answer)
                                          arr[j].bitdayPoints +=100;
                                      }
                                    }
                                }
                                for (let k =1; k<=9;k++){
                                  if (arr[j]["bitdayAnswers"]["programmingQuestion-" + k.toString()] != null){
                                    let correct = true;
                                    for (let l = 0; l<arr[j]["bitdayAnswers"]["programmingQuestion-" + k.toString()]; l++){
                                      if (arr[j]["bitdayAnswers"]["programmingQuestion-" + k.toString()][l] != programmingQuestions[k-1].order[l] )
                                        correct = false;
                                    }
                                    console.log("programming");
                                    if (correct)
                                      arr[j].bitdayPoints +=200;
                                  }
                                }
                                for (let k=1; k<=30; k++){
                                  if (arr[j]["bitdayAnswers"]["scav-" + k.toString()] != null){
                                    if (arr[j]["bitdayAnswers"]["scav-" + k.toString()] == scavenger[k-1].answer){
                                      console.log("scav");

                                      arr[j].bitdayPoints +=150;
                                    }
                                  }
                                }
                                
                                newArr.push(arr[j]);
                              }
                              
                              }
                              newArr.sort((a,b) => b.bitdayPoints - a.bitdayPoints);
                              that.setData({
                                totalRanking:newArr
                              });
                              console.log(newArr);
                            }

                          }
                        })
                      }
                    }
                  })
                    }
                  })
                  }
                })
              }
            })
          }
        })
      }
    })
    
    
  },*/
})

// const db = wx.cloud.database();
// const app = getApp();

// // miniprogram/pages/bitday/leader board/index.js
// Page({

//   /**
//    * Page initial data
//    */
//   data: {
//     users:[],
//     user: [],
//     image1: "../../../../images/fair-dark.png",
//     image2: "../../../../images/points-light.png",
//     image3: "../../../../images/quizzes-light.png",
//     image4: "../../../../images/games-light.png"
//   },

//   /**
//    * Lifecycle function--Called when page load
//    */
//   onLoad: function (options) {
//     //this.getUsers();
//     //this.getGamesUsers();
//     //this.getPointsUsers();
//     //this.getQuizzesUsers();
//     this.getFairUsers();
//  //   this.getRanking();
//   },

//   redirect: function(event){
//     //wx.navigateTo({
//       //url: event.currentTarget.dataset.link
//     //})
//     let that = this;
//     //this.awardPoints(100);
//     //this.getGamesUsers();
//     //this.getPointsUsers();
//     //this.getQuizzesUsers();
//     //this.getFairUsers();
//     that.setData({
//       image1: "../../../../images/me2.jpg"
//     })
//   },

//   redirect1: function(event){
//     let that = this;
//     this.getFairUsers();
//     that.setData({
//       image1: "../../../../images/fair-dark.png",
//       image2: "../../../../images/points-light.png",
//       image3: "../../../../images/quizzes-light.png",
//       image4: "../../../../images/games-light.png"
//     })
//   },

//   redirect2: function(event){
//     let that = this;
//     this.getPointsUsers();
//     that.setData({
//       image1: "../../../../images/fair-light.png",
//       image2: "../../../../images/points-dark.png",
//       image3: "../../../../images/quizzes-light.png",
//       image4: "../../../../images/games-light.png"
//     })
//   },

//   redirect3: function(event){
//     let that = this;
//     this.getQuizzesUsers();
//     that.setData({
//       image1: "../../../../images/fair-light.png",
//       image2: "../../../../images/points-light.png",
//       image3: "../../../../images/quizzes-dark.png",
//       image4: "../../../../images/games-light.png"
//     })
//   },

//   redirect4: function(event){
//     let that = this;
//     this.getGamesUsers();
//     that.setData({
//       image1: "../../../../images/fair-light.png",
//       image2: "../../../../images/points-light.png",
//       image3: "../../../../images/quizzes-light.png",
//       image4: "../../../../images/games-dark.png"
//     })
//   },

//   awardPoints(num){
//     console.log("award" + num)
//     db.collection('userInfo')
//     .where({ _openid: app.globalData.openid })
//     .get({
//       success: function (res){
//         db.collection('userInfo')
//         .where({ _openid: app.globalData.openid })
//         .update({
//           data: {
//             gamesPoints: res.data[0].gamesPoints + num
//           }
//         });
        
//       }
//     })
//   },

//   getUsers(){
//     let that = this;
//     db.collection('userInfo').orderBy('bitdayPoints', 'desc')
//     .limit(20)
//     .get({
//       success: function (res) {
//         let users = [];
//         let user = [];
//         for (var i=0; i<res.data.length; i++)
//         {
//           users[i] = [i+1, res.data[i].userRealName, res.data[i].bitdayPoints,res.data[i].userGrade, res.data[i].userClass];
//           if (res.data[i]._openid==app.globalData.openid){
//             user = [i+1, res.data[i].userRealName, res.data[i].bitdayPoints,res.data[i].userGrade, res.data[i].userClass];
//           }
//         }
//         console.log(users);
//         console.log(user);
//         that.setData({
//           users:users,
//           user:user
//         })
//       }
//     })
//   },

//   getGamesUsers(){
//     let that = this;
//     db.collection('userInfo').orderBy('gamesPoints', 'desc')
//     .limit(20)
//     .get({
//       success: function (res) {
//         let users = [];
//         let user = [];
//         for (var i=0; i<res.data.length; i++)
//         {
//           users[i] = [i+1, res.data[i].userRealName, res.data[i].gamesPoints,res.data[i].userGrade, res.data[i].userClass];
//           if (res.data[i]._openid==app.globalData.openid){
//             user = [i+1, res.data[i].userRealName, res.data[i].gamesPoints,res.data[i].userGrade, res.data[i].userClass];
//           }
//         }
//         console.log(users);
//         console.log(user);
//         that.setData({
//           users:users,
//           user:user
//         })
//       }
//     })
//   },

//   getFairUsers(){
//     let that = this;
//     db.collection('userInfo').orderBy('fairPoints', 'desc')
//     .limit(20)
//     .get({
//       success: function (res) {
//         let users = [];
//         let user = [];
//         for (var i=0; i<res.data.length; i++)
//         {
//           users[i] = [i+1, res.data[i].userRealName, res.data[i].fairPoints,res.data[i].userGrade, res.data[i].userClass];
//           if (res.data[i]._openid==app.globalData.openid){
//             user = [i+1, res.data[i].userRealName, res.data[i].fairPoints,res.data[i].userGrade, res.data[i].userClass];
//           }
//         }
//         console.log(users);
//         console.log(user);
//         that.setData({
//           users:users,
//           user:user
//         })
//       }
//     })
//   },

//   getPointsUsers(){
//     let that = this;
//     db.collection('userInfo').orderBy('pointsPoints', 'desc')
//     .limit(20)
//     .get({
//       success: function (res) {
//         let users = [];
//         let user = [];
//         for (var i=0; i<res.data.length; i++)
//         {
//           users[i] = [i+1, res.data[i].userRealName, res.data[i].pointsPoints,res.data[i].userGrade, res.data[i].userClass];
//           if (res.data[i]._openid==app.globalData.openid){
//             user = [i+1, res.data[i].userRealName, res.data[i].pointsPoints,res.data[i].userGrade, res.data[i].userClass];
//           }
//         }
//         console.log(users);
//         console.log(user);
//         that.setData({
//           users:users,
//           user:user
//         })
//       }
//     })
//   },

//   getQuizzesUsers(){
//     let that = this;
//     db.collection('userInfo').orderBy('quizzesPoints', 'desc')
//     .limit(20)
//     .get({
//       success: function (res) {
//         let users = [];
//         let user = [];
//         for (var i=0; i<res.data.length; i++)
//         {
//           users[i] = [i+1, res.data[i].userRealName, res.data[i].quizzesPoints,res.data[i].userGrade, res.data[i].userClass];
//           if (res.data[i]._openid==app.globalData.openid){
//             user = [i+1, res.data[i].userRealName, res.data[i].quizzesPoints,res.data[i].userGrade, res.data[i].userClass];
//           }
//         }
//         console.log(users);
//         console.log(user);
//         that.setData({
//           users:users,
//           user:user
//         })
//       }
//     })
//   },
// /**
//   getRanking() {
//     let that = this;
//     // wx.cloud.callFunction({
//     //   name: 'getRanking',
//     //   success: res => {
//     //     var arr = res.result
//     //     console.log(res.result);
//     //     arr.sort((a, b) => b.bitdayPoints - a.bitdayPoints)
//     //     that.setData({ totalRanking: arr })
//     //     var totalRank = arr.map((a) => a._openid).indexOf(app.globalData.openid) + 1
//     //     that.setData({ rank: totalRank })
        
//     //   },
//     // })
    
//     db.collection('bitday')
//     .where({type:"trivia-1"})
//     .get({
//       success: function (res){
//         let trivia1 = res.data;
//         db.collection('bitday')
//         .where({type:"trivia-2"})
//         .get({
//           success: function (res){
//             let trivia2 = res.data;
//             db.collection('bitday')
//             .where({type:"trivia-3"})
//             .get({
//               success: function (res){
//                 let trivia3 = res.data;  
//                 db.collection('bitday')
//                 .where({type:"scavenger hunt"})
//                 .get({
//                   success: function (res){
//                   let scavenger = res.data;
//                   db.collection('bitday')
//                   .where({type:"scavenger hunt"})
//                   .skip(20)
//                   .get({
//                     success: function (res){
//                     scavenger = scavenger.concat(res.data);
//                     db.collection('bitday')
//                   .where({type:"programming"})
//                   .get({
//                     success: function (res){
//                       let programmingQuestions = res.data;
//                       let arr = [];
//                       for (let i=1; i<=49; i++){
//                         db.collection('userInfo')
//                         .where({bitdayVerified:true})
//                         .skip(i*20)
//                         .get({
//                           success: function (res){
//                             arr = arr.concat(res.data);
//                             if (i == 49){
//                               console.log(arr);
//                               let newArr = [];
//                               for (let j=0; j<arr.length;j++){
//                                 if (arr[j].bitdayAnswers!=null){
//                                   console.log(j);
//                                   for (const key in arr[j]["bitdayAnswers"]) {
//                                     if (key == "trivia-1"){
//                                       for (let k = 0; k<10; k++){
//                                         if (arr[j]["bitdayAnswers"][key][k] == trivia1[k].answer)
//                                           arr[j].bitdayPoints +=100;
//                                       }
//                                     }
//                                     else if (key == "trivia-2"){
//                                       for (let k = 0; k<10; k++){
//                                         if (arr[j]["bitdayAnswers"][key][k] == trivia2[k].answer)
//                                           arr[j].bitdayPoints +=100;
//                                       }
//                                     }
//                                     else if (key == "trivia-3"){
//                                       for (let k = 0; k<10; k++){
//                                         if (arr[j]["bitdayAnswers"][key][k] == trivia3[k].answer)
//                                           arr[j].bitdayPoints +=100;
//                                       }
//                                     }
//                                 }
//                                 for (let k =1; k<=9;k++){
//                                   if (arr[j]["bitdayAnswers"]["programmingQuestion-" + k.toString()] != null){
//                                     let correct = true;
//                                     for (let l = 0; l<arr[j]["bitdayAnswers"]["programmingQuestion-" + k.toString()]; l++){
//                                       if (arr[j]["bitdayAnswers"]["programmingQuestion-" + k.toString()][l] != programmingQuestions[k-1].order[l] )
//                                         correct = false;
//                                     }
//                                     console.log("programming");
//                                     if (correct)
//                                       arr[j].bitdayPoints +=200;
//                                   }
//                                 }
//                                 for (let k=1; k<=30; k++){
//                                   if (arr[j]["bitdayAnswers"]["scav-" + k.toString()] != null){
//                                     if (arr[j]["bitdayAnswers"]["scav-" + k.toString()] == scavenger[k-1].answer){
//                                       console.log("scav");

//                                       arr[j].bitdayPoints +=150;
//                                     }
//                                   }
//                                 }
                                
//                                 newArr.push(arr[j]);
//                               }
                              
//                               }
//                               newArr.sort((a,b) => b.bitdayPoints - a.bitdayPoints);
//                               that.setData({
//                                 totalRanking:newArr
//                               });
//                               console.log(newArr);
//                             }

//                           }
//                         })
//                       }
//                     }
//                   })
//                     }
//                   })
//                   }
//                 })
//               }
//             })
//           }
//         })
//       }
//     })
    
    
//   },*/
//   /**
//    * Lifecycle function--Called when page is initially rendered
//    */
//   onReady: function () {

//   },

//   /**
//    * Lifecycle function--Called when page show
//    */
//   onShow: function () {

//   },

//   /**
//    * Lifecycle function--Called when page hide
//    */
//   onHide: function () {

//   },

//   /**
//    * Lifecycle function--Called when page unload
//    */
//   onUnload: function () {

//   },

//   /**
//    * Page event handler function--Called when user drop down
//    */
//   onPullDownRefresh: function () {

//   },

//   /**
//    * Called when page reach bottom
//    */
//   onReachBottom: function () {

//   },

//   /**
//    * Called when user click on the top right corner to share
//    */
//   onShareAppMessage: function () {

//   }
// })