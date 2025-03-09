export class Question {
  questionId;
  questionContent;
  optA;
  optB;
  optC;
  optD;
  correctOptIndex;
  startTime;
  endTime;
  status;
  constructor(questionId, questionContent, optA, optB, optC, optD, correctOptIndex, startTime, endTime, status) {
    this.questionId = questionId;
    this.questionContent = questionContent;
    this.optA = optA;
    this.optB = optB;
    this.optC = optC;
    this.optD = optD;
    this.correctOptIndex = correctOptIndex;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
  }
}