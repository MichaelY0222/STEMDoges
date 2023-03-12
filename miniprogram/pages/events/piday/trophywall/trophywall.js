// pages/events/piday/trophywall/trophywall.js
const db = wx.cloud.database();
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mathquizzes_level: 0,
    tfpoints_level: 0,
    logic_level: 0,
    level :[1,2,3,4,5,6],
    color:["light grey","light grey","light grey","light grey","light grey","light grey","#6495ED","#6495ED","#6495ED","#6495ED","#6495ED","#6495ED"]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initialize();
    this.initialize_24();
    this.initialize_logic();
  },
  initialize_24(){
    var that = this;
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res) {
        var number = res.data[0]["pointsPoints"]
        number = number/50
        var level = 0
        if(number>=100 && level==0){
          level = 6
        }
        if(number>=70 && level==0){
          level = 5
        }
        if(number>=50 && level==0){
          level = 4
        }
        if(number>=30 && level==0){
          level = 3
        }
        if(number>=15 && level==0){
          level = 2
        }
        if(number>=5 && level==0){
          level = 1
        }
        that.setData({    
          tfpoints_level: level
        })   
  }})},
  initialize_logic(){
    var that = this;
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .get({
      success: function (res) {
        var number = res.data[0]["gamesPoints"]
        number = number/50
        var level = 0
        if(number>=15 && level==0){
          level = 6
        }
        if(number>=12 && level==0){
          level = 5
        }
        if(number>=9 && level==0){
          level = 4
        }
        if(number>=6 && level==0){
          level = 3
        }
        if(number>=4 && level==0){
          level = 2
        }
        if(number>=2 && level==0){
          level = 1
        }
        that.setData({    
          logic_level: level
        })   
  }})},
  initialize(){
    var that = this;
    var mathquizzes = {};
    db.collection('userInfo')
      .where({ _openid: app.globalData.openid })
      .get({
        success: function (res) {
          mathquizzes = res.data[0]["mathquizzes"]
          var trial_list = []
          console.log(mathquizzes)
          for(var i = 0; i < 15; i+=1){
            if (mathquizzes[i+1]["status"] == 2){
              if (mathquizzes[i+1]["trials"] >= 0){
                trial_list.push(mathquizzes[i+1]["trials"])
              }
            }
          }
          console.log(trial_list)
          var ans = 0
//level 6
          if(trial_list.length == 15){
            var count = 0
            for(var i = 0;i<trial_list.length;i+=1){
              if(trial_list[i]==1){
                count += 1
              }
            }
            if(count>=14){
              ans = 6
            }
          }
//level 5
          if (trial_list.length == 15){
            var count = 0
            for(var i = 0;i<trial_list.length;i+=1){
              if(trial_list[i]<=2){
                count += 1
              }
            }
            if(count == 15 && ans == 0){
              ans = 5
            }
          }
// level 4
          if (trial_list.length>=12){
            var count = 0
            for(var i = 0;i<trial_list.length;i+=1){
              if(trial_list[i]<=2){
                count += 1
              }
            }
            if(count >= 8 && ans == 0){
              ans = 4
            }
          }
// level 3
          if (trial_list.length >= 8){
            var count = 0
            for(var i = 0;i<trial_list.length;i+=1){
              if(trial_list[i]<=3){
                count += 1
              }
            }
            if(count>=8 && ans == 0){
              ans = 3
            }
          }
// level 2
          if (trial_list.length >= 5){
            console.log(trial_list)
            console.log(123)
            var count = 0
            for(var i = 0;i<trial_list.length;i+=1){
              if(trial_list[i]<=3){
                count += 1
              }
            }
            if(count>=5 && ans == 0){
              ans = 2
            }
            console.log(ans)
          }
// level 1
          if (trial_list.length>=2){
            var count = 0
            for(var i = 0;i<trial_list.length;i+=1){
              if(trial_list[i]<=3){
                count += 1
              }
            }
            if(count>=2 && ans == 0){
              ans = 1
            }
          }
//store
          that.setData({    
            mathquizzes_level: ans
          })   

          
/*
	-Level 1: 2 questions correct (all within 3 trials)
	-Level 2: 5 questions correct (all within 3 trials)
	-Level 3: 8 questions correct (all within 3 trials)
	-Level 4: 12 questions correct (at least 8 within 2 trials)
	-Level 5: 15 questions correct (all within 2 trials)
	-Level 6: 15 questions correct (at least 14 within 1 trial)
*/
        }
      })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})