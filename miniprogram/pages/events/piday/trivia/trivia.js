// pages/events/piday/trivia/trivia.js
import CacheSingleton from '../../../../classes/CacheSingleton';
Page({

  /**
   * Page initial data
   */
  data: {
    questionId: 'undefined',
    cacheSingleton: CacheSingleton,
    triviaQuestions: [],
    scavQuestions: [],
    questions: [],
    selectedQuestion: [],
    questionStatus: 'unanswered',
    userOpenId: 'undefined',
    remainingTime: 30,
    timerElapsed: false,
    opt0Class: 'pi-day-question-unanswered',
    opt1Class: 'pi-day-question-unanswered',
    opt2Class: 'pi-day-question-unanswered',
    opt3Class: 'pi-day-question-unanswered',
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.data.cacheSingleton = CacheSingleton.getInstance();
    this.setData({
      userOpenId: await this.data.cacheSingleton.fetchUserOpenId(),
      triviaQuestions: await this.data.cacheSingleton.fetchAnyEventTriviaQuestions(),
      scavQuestions: await this.data.cacheSingleton.fetchAnyEventScavQuestions(),
    });
    this.setData({
      questions: [...this.data.scavQuestions, ...this.data.triviaQuestions]
    })
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('questionId', async (data) => {
      this.setData({
        questionId: data,
        selectedQuestion: this.data.questions.find(q => q.questionId === data)
      });
      let checkQuestionStatus = await wx.cloud.database().collection("piDayActivityLog").where({
        userId: this.data.userOpenId,
        questionId: data
      }).get();
      
      if (checkQuestionStatus.data.length !== 0) {
        this.setData({
          questionStatus: checkQuestionStatus.data[0].status
        })
      }

      let correctAnsOpt = this.data.selectedQuestion.correctOptIndex
      let correctAnsClass = `opt${correctAnsOpt}Class`
      if (this.data.questionStatus === 'unanswered') {
        this.startCountdown();
      } else if (this.data.questionStatus === 'correct') {
        this.setData({
          [correctAnsClass]: 'pi-day-question-correct',
        })
      } else if (this.data.questionStatus === 'wrong') {
        this.setData({
          [correctAnsClass]: 'pi-day-question-wrong',
        })
      }
    })
    wx.hideLoading();
  },

  startCountdown() {
    this.timer = setInterval(() => {
      let newTime = this.data.remainingTime - 1;
      if (newTime <= 0) {
        clearInterval(this.timer);
        this.setData({ remainingTime: 0 });
        this.handleTimeUp();
      } else {
        this.setData({ remainingTime: newTime });
      }
    }, 1000);
  },

  handleTimeUp: async function() {
    this.setData({
      timerElapsed: true
    })
    console.log("time's up")
    let correctAnsOpt = this.data.selectedQuestion.correctOptIndex
    let correctAnsClass = `opt${correctAnsOpt}Class`
    if (this.data.questionStatus === 'unanswered') {
      console.log('question unanswered')
      wx.showModal({
        title: "Time's Up!",
        content: 'Your answering time for this question has elapsed, and you will not receive credit for this question. Do you want to continue to reveal the answer?',
        cancelText: 'Cancel',
        confirmText: 'Continue',
        complete: async (res) => {
          wx.showLoading({
            title: '加载中...',
            mask: true
          });
          if (res.confirm) {
            this.setData({
              [correctAnsClass]: 'pi-day-question-wrong',
              questionStatus: 'wrong'
            })
            await wx.cloud.callFunction({
              name: "pushAnyEventLog",
              data: {
                type: 'Trivia',
                questionId: this.data.selectedQuestion.questionId,
                status: this.data.questionStatus
              }
            })
            wx.hideLoading();
            await this.data.cacheSingleton.forceGetAnyEventTriviaQuestions();
          }
          wx.hideLoading();
        }
      })
    }
    wx.hideLoading();
  },

  correctAnswer: async function() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.setData({
      questionStatus: 'correct'
    })
    if (!this.data.timerElapsed) {
      await wx.cloud.callFunction({
        name: "pushAnyEventLog",
        data: {
          type: 'Trivia',
          questionId: this.data.selectedQuestion.questionId,
          status: this.data.questionStatus
        }
      })
      wx.hideLoading();
      await this.data.cacheSingleton.forceGetAnyEventTriviaQuestions();
    }
    wx.hideLoading();
  },

  handleAnswer: async function(event) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    if (this.data.questionStatus === 'unanswered'){
      clearInterval(this.timer);
      let correctAnsOpt = this.data.selectedQuestion.correctOptIndex
      let correctAnsClass = `opt${correctAnsOpt}Class`
      let selectedAnsOpt = event.currentTarget.dataset.link
      let selectedAnsClass = `opt${selectedAnsOpt}Class`
      console.log(correctAnsOpt, correctAnsClass, selectedAnsOpt, selectedAnsClass)
      if (event.currentTarget.dataset.link == this.data.selectedQuestion.correctOptIndex) {
        this.correctAnswer();
        this.setData({
          [correctAnsClass]: 'pi-day-question-correct',
        })
      } else {
        this.setData({
          [correctAnsClass]: 'pi-day-question-correct',
          [selectedAnsClass]: 'pi-day-question-wrong',
          questionStatus: 'wrong'
        })
        await wx.cloud.callFunction({
          name: "pushAnyEventLog",
          data: {
            type: 'Trivia',
            questionId: this.data.selectedQuestion.questionId,
            status: this.data.questionStatus
          }
        })
        wx.hideLoading();
        await this.data.cacheSingleton.forceGetAnyEventTriviaQuestions();
      }
    }
    wx.hideLoading();
  },

  onUnload() {
    clearInterval(this.timer);
  }
})