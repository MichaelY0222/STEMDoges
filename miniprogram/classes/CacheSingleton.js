import allCollectionsData from "../utils/allCollectionsData";
import { Question } from "./question";
import { Event } from "./event";
let instance = null;

class CacheSingleton {
    #db
    #userOpenId
    #needRegistration
    #studentName
    #studentGrade
    #studentClass
    #isAdmin
    #isPiDayAdmin
    #questions
    #scavQuestions
    #events
    constructor(db) {
        this.#db = db;
        this.#questions = undefined;
    }
    static initialize(db) {
        wx.showLoading({
          title: '加载中...',
          mask: true
        }); 
        if (instance === null) {
          instance = new CacheSingleton(db);
        }
        wx.hideLoading();
        return instance;
    }
    static getInstance() {
        wx.showLoading({
          title: '加载中...',
          mask: true
        });
        if (instance === null) {
          wx.hideLoading();
          throw new Error("CacheSingleton not initialized");
        }
        wx.hideLoading();
        return instance;
    }

    async fetchUserOpenId() {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      if (this.#userOpenId !== undefined) {
        wx.hideLoading();
        return this.#userOpenId;
      }
      let res = ((await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "getOpenId"
        }
      })).result).openid;
      this.#userOpenId = res;
      wx.hideLoading();
      return this.#userOpenId;
    }

    async determineNeedNewUser() {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      // if (this.#needRegistration !== undefined) {
      //   console.log("Registration Status Already Fetched");
      //   wx.hideLoading();
      //   return this.#needRegistration;
      // }
      let checkUser = await wx.cloud.database().collection("userData").where({
        userId: this.#userOpenId,
      }).get();
      if (checkUser.data.length === 0){
        console.log("User not registered...")
        wx.hideLoading();
        this.#needRegistration = true;
        return this.#needRegistration;
      }
      this.#studentName = checkUser.data[0].name;
      this.#studentGrade = checkUser.data[0].grade;
      this.#studentClass = checkUser.data[0].class;
      this.#needRegistration = false;
      let checkAdmin = await wx.cloud.database().collection("admins").where({
        adminId: checkUser.data[0]._id,
      }).get();
      if (checkAdmin.data.length === 1){
        this.#isAdmin = true;
      } else this.#isAdmin = false;
      let checkPiDayAdmin = await wx.cloud.database().collection("bitDayAdmins").where({
        adminId: checkUser.data[0]._id,
      }).get();
      if (checkPiDayAdmin.data.length === 1){
        this.#isPiDayAdmin = true;
      } else this.#isPiDayAdmin = false;
      wx.hideLoading();
      return this.#needRegistration;
    }

    fetchUserInfo(option) {
      if (option === 'name') {
        return this.#studentName;
      } else if (option === 'grade') {
        return this.#studentGrade;
      } else if (option === 'class') {
        return this.#studentClass;
      } else if (option === 'isAdmin') {
        return this.#isAdmin;
      } else if (option === 'isBitDayAdmin') {
        return this.#isPiDayAdmin;
      } else return undefined;
    }

    async forceGetAnyEventTriviaQuestions() {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      this.#questions = undefined;
  
      this.#questions = new Array()
      let questions = await allCollectionsData(this.#db, "bitDayTrivia");
      for (let i=0;i<questions.data.length;i++) {
          if (questions.data[i].startTime <= (Date.now()/1000) && (Date.now()/1000) <= questions.data[i].endTime){
            let status = 'unanswered'
            let checkQuestionStatus = await wx.cloud.database().collection("bitDayActivityLog").where({
              userId: this.#userOpenId,
              questionId: questions.data[i].questionId
            }).get();
            
            if (checkQuestionStatus.data.length !== 0) {
              status = checkQuestionStatus.data[0].status
            }
            
            this.#questions.push(new Question(questions.data[i].questionId, questions.data[i].questionContent, questions.data[i].optA, questions.data[i].optB, questions.data[i].optC, questions.data[i].optD, questions.data[i].correctOptIndex, questions.data[i].startTime, questions.data[i].endTime, status));
          }
      }
 
      wx.hideLoading();
      return this.#questions;
  }

  async fetchAnyEventTriviaQuestions() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    if (this.#questions !== undefined) {
        wx.hideLoading();
        return this.#questions;
    } else {
      await this.forceGetAnyEventTriviaQuestions();
      wx.hideLoading();
      return this.#questions;
    }
  }

  async fetchAnyEventScavQuestions() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    if (this.#scavQuestions !== undefined) {
      wx.hideLoading();
      return this.#scavQuestions;
    } else {
      this.#scavQuestions = new Array()
    let questions = await allCollectionsData(this.#db, "piDayScav");
    for (let i=0;i<questions.data.length;i++) {
          let status = 'unanswered'
          let checkQuestionStatus = await wx.cloud.database().collection("bitDayActivityLog").where({
            userId: this.#userOpenId,
            questionId: questions.data[i].questionId
          }).get();
          
          if (checkQuestionStatus.data.length !== 0) {
            status = checkQuestionStatus.data[0].status
          }
          
          let startTime = 1800000000;
          let endTime = -1;

          this.#scavQuestions.push(new Question(questions.data[i].questionId, questions.data[i].questionContent, questions.data[i].optA, questions.data[i].optB, questions.data[i].optC, questions.data[i].optD, questions.data[i].correctOptIndex, startTime, endTime, status));
      }

      wx.hideLoading();
      return this.#scavQuestions;
    }
  }

  async fetchAnyEventActivity() {
    console.log('fetching activivty')
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    if (this.#events !== undefined) {
      wx.hideLoading();
      return this.#events;
    } else {
      this.#events = new Array()
      let activity = await allCollectionsData(this.#db, "bitDayEvents");
      for (let i=0;i<activity.data.length;i++) {
        this.#events.push(new Event(activity.data[i].eventId, activity.data[i].eventName, activity.data[i].eventHost, activity.data[i].points));
      }

      wx.hideLoading();
      return this.#events;
    }
  }
}

export default CacheSingleton;