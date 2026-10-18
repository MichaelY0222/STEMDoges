import allCollectionsData from "../utils/allCollectionsData";
import { Question } from "./question";
import { Event } from "./event";
import { getActiveEvent, isWindowOpen } from "../utils/eventConfig";
let instance = null;

class CacheSingleton {
    #db
    #userOpenId
    #needRegistration
    #studentName
    #studentGrade
    #studentClass
    #studentGNumber
    #isBanned
    #banRemarks
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
      this.#studentGNumber = checkUser.data[0].gNumber;
      this.#needRegistration = false;
      let checkAdmin = await wx.cloud.database().collection("admins").where({
        adminId: checkUser.data[0]._id,
      }).get();
      let checkBan = await wx.cloud.database().collection("userBan").where({
        userId: this.#userOpenId,
      }).get();
      if (checkAdmin.data.length === 1){
        this.#isAdmin = true;
      } else this.#isAdmin = false;
      if (checkBan.data.length >= 1){
        this.#isBanned = checkBan.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=checkBan.data[0].endTime;
        this.#banRemarks = checkBan.data[0].remarks;
      } else {
        this.#isBanned = false;
        this.#banRemarks = "";
      }
      const event = await getActiveEvent();
      let checkPiDayAdmin = await wx.cloud.database().collection(event.adminsCollection).where({
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
      } else if (option === 'gNumber') {
        return this.#studentGNumber;
      } else if (option === 'isAdmin') {
        return this.#isAdmin;
      } else if (option === 'isPiDayAdmin') {
        return this.#isPiDayAdmin;
      } else if (option === 'isBanned') {
        return this.#isBanned;
      } else if (option === 'banRemarks') {
        return this.#banRemarks;
      } else return undefined;
    }

    async forceGetAnyEventTriviaQuestions() {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      this.#questions = undefined;
  
      this.#questions = new Array()
      const event = await getActiveEvent();
      let questions;
      try {
        questions = await allCollectionsData(this.#db, event.triviaCollection);
      } catch (err) {
        console.error(`Failed to read trivia collection "${event.triviaCollection}":`, err);
        wx.hideLoading();
        return this.#questions;
      }
      const now = Date.now()/1000;
      for (let i=0;i<questions.data.length;i++) {
          const q = questions.data[i];
          if (isWindowOpen(q.startTime, q.endTime, event.windowMode, now)){
            let status = 'unanswered'
            let statusQuery = {
              userId: this.#userOpenId,
              questionId: q.questionId
            };
            if (event.logTag) {
              statusQuery.eventTag = event.logTag;
            }
            let checkQuestionStatus = await wx.cloud.database().collection(event.activityLog).where(statusQuery).get();
            
            if (checkQuestionStatus.data.length !== 0) {
              status = checkQuestionStatus.data[0].status
            }
            
            this.#questions.push(new Question(q.questionId, q.questionContent, q.optA, q.optB, q.optC, q.optD, q.correctOptIndex, q.startTime, q.endTime, status));
          }
      }
 
      console.log(`Trivia: ${this.#questions.length} of ${questions.data.length} questions open (windowMode: ${event.windowMode})`);
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
    const event = await getActiveEvent();
    let questions;
    try {
      questions = await allCollectionsData(this.#db, event.scavCollection);
    } catch (err) {
      console.error(`Failed to read scav collection "${event.scavCollection}":`, err);
      wx.hideLoading();
      return this.#scavQuestions;
    }
    for (let i=0;i<questions.data.length;i++) {
          let status = 'unanswered'
          let statusQuery = {
            userId: this.#userOpenId,
            questionId: questions.data[i].questionId
          };
          if (event.logTag) {
            statusQuery.eventTag = event.logTag;
          }
          let checkQuestionStatus = await wx.cloud.database().collection(event.activityLog).where(statusQuery).get();
          
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
      const event = await getActiveEvent();
      let activity = await allCollectionsData(this.#db, event.activitiesCollection);
      for (let i=0;i<activity.data.length;i++) {
        this.#events.push(new Event(activity.data[i].eventId, activity.data[i].eventName, activity.data[i].eventHost, activity.data[i].points));
      }

      wx.hideLoading();
      return this.#events;
    }
  }
}

export default CacheSingleton;