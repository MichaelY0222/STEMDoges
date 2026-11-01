const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BIT_DAY_END_TIME,
  BIT_DAY_START_TIME,
  IMPORT_BATCH,
  QUESTIONS_PER_DAY,
  questions,
} = require('../cloudfunctions/replaceBitDayTrivia/questions');

test('Bit Day 2026 import contains 30 unique, ordered questions', () => {
  assert.equal(questions.length, 30);
  assert.equal(new Set(questions.map(item => item.questionId)).size, 30);
  assert.deepEqual(questions.map(item => item.order), Array.from({ length: 30 }, (_, index) => index + 1));
  assert.equal(questions.filter(item => item.sourceSet === 'pdf').length, 15);
  assert.equal(questions.filter(item => item.sourceSet === 'docx').length, 15);
});

test('every question has valid options, answer, window, and import metadata', () => {
  for (const item of questions) {
    assert.equal(item.importBatch, IMPORT_BATCH);
    assert.ok(item.startTime >= BIT_DAY_START_TIME);
    assert.ok(item.endTime <= BIT_DAY_END_TIME);

    const options = [item.optA, item.optB, item.optC, item.optD];
    if (item.optE) options.push(item.optE);
    assert.ok(options.every(option => typeof option === 'string' && option.trim().length > 0));
    assert.ok(Number.isInteger(item.correctOptIndex));
    assert.ok(item.correctOptIndex >= 0 && item.correctOptIndex < options.length);
  }
});

test('six questions open on each day from October 26 through October 30', () => {
  assert.equal(BIT_DAY_START_TIME, 1792944000);
  assert.equal(BIT_DAY_END_TIME, 1793375999);
  assert.equal(QUESTIONS_PER_DAY, 6);
  for (let dayIndex = 0; dayIndex < 5; dayIndex += 1) {
    const dailyQuestions = questions.filter(item => item.startTime === BIT_DAY_START_TIME + dayIndex * 86400);
    assert.equal(dailyQuestions.length, 6);
    assert.ok(dailyQuestions.every(item => item.endTime === item.startTime + 86399));
  }
});

test('the five-option PDF question is preserved', () => {
  const gpuQuestion = questions.find(item => item.questionId === 'BD26-PDF-07');
  assert.ok(gpuQuestion);
  assert.equal(gpuQuestion.optE, 'It automatically enables cheats such as an aimbot.');
  assert.equal(gpuQuestion.correctOptIndex, 1);
});
