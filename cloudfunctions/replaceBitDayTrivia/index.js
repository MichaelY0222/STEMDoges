const cloud = require('wx-server-sdk');
const { IMPORT_BATCH, questions } = require('./questions');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const TARGET_COLLECTION = 'bitDayTrivia';
const BACKUP_COLLECTION = 'bitDayTriviaBackups';
const SETTINGS_COLLECTION = 'settings';
const CONFIRMATION = 'REPLACE_BIT_DAY_TRIVIA_WITH_30_QUESTIONS';

async function fetchAll(collectionName) {
  const pageSize = 100;
  const result = [];

  while (true) {
    const page = await db.collection(collectionName)
      .skip(result.length)
      .limit(pageSize)
      .get();
    result.push(...page.data);
    if (page.data.length < pageSize) return result;
  }
}

function validateQuestionBank() {
  if (questions.length !== 30) {
    throw new Error(`Expected 30 questions, received ${questions.length}`);
  }

  const ids = new Set();
  for (const item of questions) {
    const requiredStrings = ['questionId', 'questionContent', 'optA', 'optB', 'optC', 'optD'];
    for (const field of requiredStrings) {
      if (typeof item[field] !== 'string' || item[field].trim() === '') {
        throw new Error(`${item.questionId || 'Unknown question'} has an invalid ${field}`);
      }
    }
    if (ids.has(item.questionId)) {
      throw new Error(`Duplicate questionId: ${item.questionId}`);
    }
    ids.add(item.questionId);

    const optionCount = item.optE ? 5 : 4;
    if (!Number.isInteger(item.correctOptIndex)
      || item.correctOptIndex < 0
      || item.correctOptIndex >= optionCount) {
      throw new Error(`${item.questionId} has an invalid correctOptIndex`);
    }
    if (!Number.isFinite(item.startTime)
      || !Number.isFinite(item.endTime)
      || item.startTime > item.endTime) {
      throw new Error(`${item.questionId} has an invalid availability window`);
    }
  }
}

async function ensureBackupCollection() {
  try {
    await db.collection(BACKUP_COLLECTION).limit(1).get();
  } catch (error) {
    await db.createCollection(BACKUP_COLLECTION);
  }
}

async function fetchActiveEventSettings() {
  const result = await db.collection(SETTINGS_COLLECTION)
    .where({ type: 'activeEvent' })
    .get();
  return result.data;
}

async function activateBitDay(activeEventSettings) {
  const data = {
    type: 'activeEvent',
    event: 'bitday',
    windowMode: 'currentYear',
  };

  if (activeEventSettings.length > 0) {
    await db.collection(SETTINGS_COLLECTION).doc(activeEventSettings[0]._id).update({ data });
    return;
  }
  await db.collection(SETTINGS_COLLECTION).add({ data });
}

exports.main = async (event = {}) => {
  if (event.confirm !== CONFIRMATION) {
    return {
      status: 'error',
      reason: 'Explicit replacement confirmation is required',
    };
  }

  validateQuestionBank();

  const existing = await fetchAll(TARGET_COLLECTION);
  const activeEventSettings = await fetchActiveEventSettings();
  const alreadyImported = existing.length === questions.length
    && existing.every(item => item.importBatch === IMPORT_BATCH);
  if (alreadyImported) {
    await activateBitDay(activeEventSettings);
    return {
      status: 'success',
      reason: 'Question bank already matches this import batch',
      importBatch: IMPORT_BATCH,
      previousCount: existing.length,
      newCount: existing.length,
      changed: false,
      activeEvent: 'bitday',
    };
  }

  const backupId = `${IMPORT_BATCH}-${Date.now()}`;
  await ensureBackupCollection();
  await db.collection(BACKUP_COLLECTION).doc(backupId).set({
    data: {
      sourceCollection: TARGET_COLLECTION,
      importBatch: IMPORT_BATCH,
      createdAt: Date.now(),
      questionCount: existing.length,
      questions: existing,
      activeEventSettings,
    },
  });

  await db.runTransaction(async transaction => {
    for (const item of existing) {
      await transaction.collection(TARGET_COLLECTION).doc(item._id).remove();
    }
    for (const item of questions) {
      await transaction.collection(TARGET_COLLECTION).add({ data: item });
    }
  });

  const updated = await fetchAll(TARGET_COLLECTION);
  const importedIds = new Set(updated
    .filter(item => item.importBatch === IMPORT_BATCH)
    .map(item => item.questionId));
  if (updated.length !== questions.length || importedIds.size !== questions.length) {
    throw new Error(`Replacement verification failed: expected 30 questions, found ${updated.length}`);
  }

  await activateBitDay(activeEventSettings);

  return {
    status: 'success',
    reason: 'Bit Day trivia question bank replaced and verified',
    importBatch: IMPORT_BATCH,
    backupId,
    previousCount: existing.length,
    newCount: updated.length,
    changed: true,
    activeEvent: 'bitday',
  };
};

