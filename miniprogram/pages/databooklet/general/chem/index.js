// miniprogram/pages/bitday/index.js
const db = wx.cloud.database();
const app = getApp();


function SHA256(s){
  var chrsz = 8;
  var hexcase = 0;
 
  function safe_add (x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
  }
 
  function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
  function R (X, n) { return ( X >>> n ); }
  function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
  function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
  function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
  function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
  function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
  function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }
 
  function core_sha256 (m, l) {
  var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
  var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
  var W = new Array(64);
  var a, b, c, d, e, f, g, h, i, j;
  var T1, T2;
 
  m[l >> 5] |= 0x80 << (24 - l % 32);
  m[((l + 64 >> 9) << 4) + 15] = l;
 
  for ( var i = 0; i<m.length; i+=16 ) {
  a = HASH[0];
  b = HASH[1];
  c = HASH[2];
  d = HASH[3];
  e = HASH[4];
  f = HASH[5];
  g = HASH[6];
  h = HASH[7];
 
  for ( var j = 0; j<64; j++) {
  if (j < 16) W[j] = m[j + i];
  else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
 
  T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
  T2 = safe_add(Sigma0256(a), Maj(a, b, c));
 
  h = g;
  g = f;
  f = e;
  e = safe_add(d, T1);
  d = c;
  c = b;
  b = a;
  a = safe_add(T1, T2);
  }
 
  HASH[0] = safe_add(a, HASH[0]);
  HASH[1] = safe_add(b, HASH[1]);
  HASH[2] = safe_add(c, HASH[2]);
  HASH[3] = safe_add(d, HASH[3]);
  HASH[4] = safe_add(e, HASH[4]);
  HASH[5] = safe_add(f, HASH[5]);
  HASH[6] = safe_add(g, HASH[6]);
  HASH[7] = safe_add(h, HASH[7]);
  }
  return HASH;
  }
 
  function str2binb (str) {
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz) {
  bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
  }
  return bin;
  }
 
  function Utf8Encode(string) {
  string = string.replace(/\r\n/g,'\n');
  var utftext = '';
 
  for (var n = 0; n < string.length; n++) {
 
  var c = string.charCodeAt(n);
 
  if (c < 128) {
  utftext += String.fromCharCode(c);
  }
  else if((c > 127) && (c < 2048)) {
  utftext += String.fromCharCode((c >> 6) | 192);
  utftext += String.fromCharCode((c & 63) | 128);
  }
  else {
  utftext += String.fromCharCode((c >> 12) | 224);
  utftext += String.fromCharCode(((c >> 6) & 63) | 128);
  utftext += String.fromCharCode((c & 63) | 128);
  }
 
  }
 
  return utftext;
  }
 
  function binb2hex (binarray) {
  var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
  var str = '';
  for(var i = 0; i < binarray.length * 4; i++) {
  str += hex_tab.charAt((binarray[i>>2] >> ((3 - i % 4)*8+4)) & 0xF) +
  hex_tab.charAt((binarray[i>>2] >> ((3 - i % 4)*8 )) & 0xF);
  }
  return str;
  }
 
  s = Utf8Encode(s);
  return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
 }

Page({

  /**
   * Page initial data
   */
  data: {
    showPopup:[false,false,false,false,false,false,false],
    bitdayVerified: false,
    QRCodes:[],
    ScavProgress:[], //not found, found, correct, incorrect
    colors:["grey","#dddddd","","darkgrey"],
    isAdmin: false,
    types:["programming", "trivia-1","trivia-2","trivia-3", "scavenger hunt"],
    questions:[],
    typeIdx: 0,
    curQuestion:0,
    changedWeek:false,
    correctChoice:1,
    dayNum: 0,
    blocks:[]
  },

  

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    this.setData({
      isAdmin:app.isAdmin,
      dayNum: app.bitdayNum
    });

    this.checkIfVerified();
    this.getScavengerHashes();
    this.getUserData();

    if (app.isAdmin){
      this.getQuestionStats();
    }
  },
  showPopup(event){
    let thePopups = this.data.showPopup;
    thePopups[event.currentTarget.dataset.popupnum] = true;
    this.setData({
      showingPopup: true,
      showPopup:thePopups
    })
    if (event.currentTarget.dataset.popupnum == 5)
      this.getQuestionStats();
  },
  getUserData(){
    let ScavProgress = [];
    for (let i=0; i<30; i++){
      ScavProgress[i] = 0;
    }

    this.setData({
      ScavProgress:ScavProgress
    })
  },
  addBlock(event){
    let blocks = this.data.blocks;
    blocks.push(["",""]);
    this.setData({
      blocks:blocks
    });
  },
  getScavengerHashes(){
    let codes=[30];

    //sha256 
    for (let i=0;i<30;i++){
      codes[i] = SHA256("scav" + (i+1).toString() +".");
    }

    this.setData({
      QRCodes:codes
    })
  },
  deleteQuestion(event){
    let curQ = this.data.curQuestion;
    //change cur Q index
    if (curQ == 0)
      curQ = this.data.questions.length-2;
    else
      curQ --;
    let that = this;
    let QuestionId = this.data.questions[this.data.curQuestion]._id;
    db.collection('bitday').doc(QuestionId)
    .remove()
    .then(res=>{
      that.setData({curQuestion:curQ})
      that.getQuestionStats()
    })
  },
  getQuestionStats(){
    let that = this;
    let cur = this.data.curQuestion;
    let type = this.data.types[this.data.typeIdx];
    console.log(type);
    //get questions
    db.collection('bitday')
    .where({type:type})
    .get({
      success: function (res){
        let questions = res.data;
        if (type == "scavenger hunt"){
          db.collection('bitday')
          .where({type:"scavenger hunt"})
          .skip(20)
          .get({
            success: function (res){
              questions = questions.concat(res.data);

              if (that.data.changedWeek){
                cur = 0;
                that.setData({
                  curQuestion:0,
                  changedWeek: false,
                  questions: questions,
                  correctChoice:0
                })
                //if there are any questoins, then get the stars & answer
                if (questions.length > 0){
                  that.setData({
                    correctChoice: questions[cur].answer==null?0:questions[cur].answer,
                    blocks: questions[cur].blocks==null?[]: questions[cur].blocks
                  })
                }
              }
              else{
                that.setData({
                  questions: questions,
                  correctChoice: questions[cur].answer==null?0:questions[cur].answer,
                  blocks: questions[cur].blocks==null?[]: questions[cur].blocks
                })
              }
              
            }
          })
        }else{
          if (that.data.changedWeek){
            cur = 0;
            that.setData({
              curQuestion:0,
              changedWeek: false,
              questions: res.data,
              correctChoice:0
            })
            //if there are any questoins, then get the stars & answer
            if (res.data.length > 0){
              that.setData({
                correctChoice: res.data[cur].answer==null?0:res.data[cur].answer,
                blocks: res.data[cur].blocks==null?[]: res.data[cur].blocks
              })
            }
          }
          else{
            that.setData({
              questions: res.data,
              correctChoice: res.data[cur].answer==null?0:res.data[cur].answer,
              blocks: res.data[cur].blocks==null?[]: res.data[cur].blocks
            })
          }
          
        }
      }
    })
  },

  
  changeQ: function(event){
    let questions = this.data.questions;
    this.setData({
      curQuestion: event.currentTarget.dataset.num, // change question index
      correctChoice: questions[event.currentTarget.dataset.num].answer==null?0:questions[event.currentTarget.dataset.num].answer,
      blocks: questions[event.currentTarget.dataset.num].blocks==null?[]:questions[event.currentTarget.dataset.num].blocks
    })
  },
  submitQuestion(event){
    let questions = this.data.questions;
    let currentQ = this.data.curQuestion;
    let that = this;
    questions[currentQ].choice1 = event.detail.value.choice1;
    questions[currentQ].choice2 = event.detail.value.choice2;
    questions[currentQ].choice3 = event.detail.value.choice3;
    questions[currentQ].choice4 = event.detail.value.choice4;
    questions[currentQ].question = event.detail.value.question;
    questions[currentQ].steps = event.detail.value.answerSteps;
    questions[currentQ].answer = this.data.correctChoice;
    questions[currentQ].type = this.data.types[this.data.typeIdx];

    let blocks = [];
    if (this.data.types[this.data.typeIdx] == "programming"){
      questions[currentQ].order = event.detail.value.order.split(" ");
      for (let i=0; i<questions[currentQ].order.length; i++){
        questions[currentQ].order[i] = parseInt(questions[currentQ].order[i]);
      }
      let blocksLength = this.data.blocks.length;
      for (let i=0; i<blocksLength; i++){
        let num = i.toString();
        blocks.push([event.detail.value["englishBlock" + num],event.detail.value["pythonBlock" + num]]);
      }
    }
    
    questions[currentQ].blocks = blocks;
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    db.collection('bitday')
    .where({ _id: questions[currentQ]._id })
    .update({
      data: {
        answer: questions[currentQ].answer,
        question: questions[currentQ].question,
        choice1: questions[currentQ].choice1,
        choice2: questions[currentQ].choice2,
        choice3: questions[currentQ].choice3,
        choice4: questions[currentQ].choice4,
        steps: questions[currentQ].steps,
        blocks: questions[currentQ].blocks,
        order: questions[currentQ].order==null?0:questions[currentQ].order
      }
    }).then(res=>{
      that.setData({
        questions:questions
      })
    });
  },
  
  chooseCorrectAnswer(event){
    this.setData({
      correctChoice: event.currentTarget.dataset.choice
    })
  },
  addQ(event){
    //let currentQuestions = this.data.weeklyQuestions;
    //currentQuestions.push();
    let that = this;
    let create = app.globalData.openid ;
    db.collection('bitday')
    .add({
      data: {
        uploadDate: new Date(),
        creator: create,
        type: that.data.types[that.data.typeIdx]
      }
    }).then(res=>{
      that.getQuestionStats()
    })
  },

  lookAtNextType(event){
    let week = this.data.typeIdx+1;
    if (week>=this.data.types.length){
      week = 0;
    }

    this.setData({
      typeIdx:week,
      changedWeek:true
    })
    this.getQuestionStats();
  },

  lookAtPrevType(event){
    let week = this.data.typeIdx -1;
    if (week<0){
      week = this.data.types.length -1;
    }
    this.setData({
      typeIdx:week,
      changedWeek:true
    })
    this.getQuestionStats();
  },
  
  checkIfVerified(){
    let that = this;
    wx.cloud.init({
      env: 'shsid-3tx38'
    })
    db.collection('userInfo')
    .where({_openid: app.globalData.openid})
    .get({
      success: function (res) {
        if (res.data[0].bitdayVerified){
          //scavenger hunt progress
          let scav = [];
          for (let i=1; i<=30; i++){
            if (res.data[0].bitdayAnswers["scav-" + i.toString()] == null){
              scav.push(0);
            }
            else if (res.data[0].bitdayAnswers["scav-" + i.toString()] >= 0){
              scav.push(1);
            }
          }
          that.setData({
            bitdayVerified:true,
            ScavProgress: scav
          })
        }
        else{
          let pops = that.data.showPopup;
          pops[0] = true;
          that.setData({
            showPopup:pops
          })
        }
      }
    })
  },
  hidePopup(event){
    this.setData({
      showingPopup: false,
      showPopup:[]
    })
  },

  redirect: function(event){
    app.globalData.questionNum = event.currentTarget.dataset.qnum;
    wx.navigateTo({
      url: event.currentTarget.dataset.link
    })
  },

  submitInfo(event){
    let name =  event.detail.value.name;
    let classNum =  event.detail.value.class;
    let grade =  event.detail.value.grade;
    db.collection('userInfo')
    .where({ _openid: app.globalData.openid })
    .update({
      data: {
        userRealName:name,
        userClass:classNum,
        userGrade:grade,
        bitdayVerified: true,
        bitdayPoints: 0
      } 
    })
    this.setData({
      showingPopup: false,
      showPopup:[]
    })
  },
  
  scanQRCode(){
    let that = this;
    let codes = this.data.QRCodes;
    let prog = this.data.ScavProgress;
    wx.scanCode({
      success (res) {
        console.log(res);
        for (let i =0; i<codes.length; i++){
          if (codes[i] == res.result){
            console.log(i+1);
            prog[i] = 1;
            that.setData({
              ScavProgress:prog
            })
            app.globalData.questionNum = i+1;
            wx.navigateTo({
              url: "../bitday/scavenger hunt/index"
            })
          }
          
        }
      }
    })
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