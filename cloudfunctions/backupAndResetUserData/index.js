const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const SOURCE_COLLECTION = 'userData'
const BACKUP_COLLECTION = 'userDataBackup20261025'
const RUN_COLLECTION = 'userDataBackupRuns'
const BACKUP_BATCH = 'user-data-reset-2026-10-25-v1'
const CONFIRMATION = 'BACKUP_AND_CLEAR_USER_DATA'
const PAGE_SIZE = 100
const OPERATION_BATCH_SIZE = 100
const WRITE_BATCH_SIZE = 20

async function fetchAll(collectionName) {
  const result = []
  while (true) {
    const page = await db.collection(collectionName)
      .orderBy('_id', 'asc')
      .skip(result.length)
      .limit(PAGE_SIZE)
      .get()
    result.push(...page.data)
    if (page.data.length < PAGE_SIZE) return result
  }
}

async function fetchPage(collectionName, offset = 0) {
  const result = await db.collection(collectionName)
    .orderBy('_id', 'asc')
    .skip(offset)
    .limit(OPERATION_BATCH_SIZE)
    .get()
  return result.data
}

async function ensureCollection(collectionName) {
  try {
    await db.collection(collectionName).limit(1).get()
  } catch (error) {
    await db.createCollection(collectionName)
  }
}

async function getRun() {
  try {
    const result = await db.collection(RUN_COLLECTION).doc(BACKUP_BATCH).get()
    return result.data
  } catch (error) {
    return undefined
  }
}

function chunks(items, size) {
  const result = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

function backupData(item, backedUpAt) {
  const { _id, _openid, ...fields } = item
  return {
    ...fields,
    originalDocumentId: _id,
    originalOpenId: _openid || '',
    sourceCollection: SOURCE_COLLECTION,
    backupBatch: BACKUP_BATCH,
    backedUpAt,
  }
}

function backupMatches(source, backup) {
  if (!backup
    || backup._id !== source._id
    || backup.originalDocumentId !== source._id
    || backup.backupBatch !== BACKUP_BATCH
    || backup.sourceCollection !== SOURCE_COLLECTION) {
    return false
  }
  return Object.entries(source)
    .filter(([key]) => key !== '_id' && key !== '_openid')
    .every(([key, value]) => JSON.stringify(backup[key]) === JSON.stringify(value))
}

async function inspect() {
  const users = await fetchAll(SOURCE_COLLECTION)
  const fields = Array.from(new Set(users.flatMap(item => Object.keys(item)))).sort()
  return {
    status: 'preview',
    sourceCollection: SOURCE_COLLECTION,
    sourceCount: users.length,
    detectedFields: fields,
    backupCollection: BACKUP_COLLECTION,
    backupBatch: BACKUP_BATCH,
    requiredConfirmation: CONFIRMATION,
  }
}

function progress(phase, details = {}) {
  return {
    status: 'in_progress',
    phase,
    backupCollection: BACKUP_COLLECTION,
    backupBatch: BACKUP_BATCH,
    repeatSameRequest: true,
    ...details,
  }
}

async function startRun(expectedUserCount) {
  const sourceUsers = await fetchAll(SOURCE_COLLECTION)
  if (sourceUsers.length !== expectedUserCount) {
    return {
      error: {
        status: 'error',
        reason: 'expectedUserCount does not match the current userData count',
        expectedUserCount,
        actualUserCount: sourceUsers.length,
        changed: false,
      },
    }
  }

  if (sourceUsers.length === 0) {
    return {
      result: {
        status: 'success',
        reason: 'userData is already empty',
        backupCollection: BACKUP_COLLECTION,
        backupBatch: BACKUP_BATCH,
        backedUpCount: 0,
        deletedCount: 0,
        remainingCount: 0,
        changed: false,
      },
    }
  }

  const startedAt = Date.now()
  const run = {
    backupBatch: BACKUP_BATCH,
    sourceCollection: SOURCE_COLLECTION,
    backupCollection: BACKUP_COLLECTION,
    expectedUserCount,
    status: 'backing_up',
    backupCursor: 0,
    backedUpCount: 0,
    deletedCount: 0,
    startedAt,
  }
  await db.collection(RUN_COLLECTION).doc(BACKUP_BATCH).set({ data: run })
  return { run: { _id: BACKUP_BATCH, ...run } }
}

async function continueBackup(run) {
  // Old versions of this function did not store a cursor. Restarting at zero is
  // safe because every backup is an idempotent upsert using the source _id.
  const cursor = Number.isInteger(run.backupCursor) ? run.backupCursor : 0
  const sourceBatch = await fetchPage(SOURCE_COLLECTION, cursor)

  if (sourceBatch.length === 0) {
    await db.collection(RUN_COLLECTION).doc(BACKUP_BATCH).update({
      data: { status: 'verifying_backup', backupCursor: cursor },
    })
    return progress('verifying_backup', {
      backedUpCount: cursor,
      remainingBackupCount: 0,
    })
  }

  const backedUpAt = run.startedAt || Date.now()
  for (const batch of chunks(sourceBatch, WRITE_BATCH_SIZE)) {
    await Promise.all(batch.map(item => db.collection(BACKUP_COLLECTION)
      .doc(item._id)
      .set({ data: backupData(item, backedUpAt) })))
  }

  const nextCursor = cursor + sourceBatch.length
  const reachedEnd = sourceBatch.length < OPERATION_BATCH_SIZE
  await db.collection(RUN_COLLECTION).doc(BACKUP_BATCH).update({
    data: {
      status: reachedEnd ? 'verifying_backup' : 'backing_up',
      backupCursor: nextCursor,
      backedUpCount: nextCursor,
      lastBackupAt: Date.now(),
    },
  })
  return progress(reachedEnd ? 'verifying_backup' : 'backing_up', {
    backedUpCount: nextCursor,
    remainingBackupCount: Math.max(run.expectedUserCount - nextCursor, 0),
  })
}

async function verifyBackup(run) {
  const [sourceUsers, backups] = await Promise.all([
    fetchAll(SOURCE_COLLECTION),
    fetchAll(BACKUP_COLLECTION),
  ])
  if (sourceUsers.length !== run.expectedUserCount) {
    return {
      status: 'error',
      reason: 'userData count changed during backup; no records were deleted',
      expectedUserCount: run.expectedUserCount,
      actualUserCount: sourceUsers.length,
      changed: false,
    }
  }

  const backupById = new Map(backups.map(item => [item._id, item]))
  const verified = sourceUsers.every(item => backupMatches(item, backupById.get(item._id)))
  if (!verified) {
    // A source record may have changed while a previous batch was running.
    // Re-copying from the beginning is safe and makes the next verification
    // use one consistent snapshot before any deletion is allowed.
    await db.collection(RUN_COLLECTION).doc(BACKUP_BATCH).update({
      data: {
        status: 'backing_up',
        backupCursor: 0,
        backedUpCount: 0,
        lastVerificationFailureAt: Date.now(),
      },
    })
    return progress('backing_up', {
      reason: 'Backup did not match userData; safely restarting the backup pass',
      backedUpCount: 0,
      remainingBackupCount: run.expectedUserCount,
    })
  }

  await db.collection(RUN_COLLECTION).doc(BACKUP_BATCH).update({
    data: {
      status: 'backup_verified',
      backedUpCount: sourceUsers.length,
      verifiedAt: Date.now(),
    },
  })
  return progress('backup_verified', {
    backedUpCount: sourceUsers.length,
    remainingBackupCount: 0,
    reason: 'All backups verified; repeat the same request to clear userData in batches',
  })
}

async function continueDeletion(run) {
  // Always delete the first remaining page. If a call times out after deleting
  // but before saving progress, the next call simply continues with the next
  // remaining documents instead of skipping any records.
  const sourceBatch = await fetchPage(SOURCE_COLLECTION)
  if (sourceBatch.length === 0) {
    await db.collection(RUN_COLLECTION).doc(BACKUP_BATCH).update({
      data: {
        status: 'complete',
        completedAt: Date.now(),
        backedUpCount: run.expectedUserCount,
        deletedCount: run.expectedUserCount,
        remainingCount: 0,
      },
    })
    return {
      status: 'success',
      reason: 'userData backed up, verified, and cleared',
      backupCollection: BACKUP_COLLECTION,
      backupBatch: BACKUP_BATCH,
      backedUpCount: run.expectedUserCount,
      deletedCount: run.expectedUserCount,
      remainingCount: 0,
      changed: true,
    }
  }

  for (const batch of chunks(sourceBatch, WRITE_BATCH_SIZE)) {
    await Promise.all(batch.map(item => db.collection(SOURCE_COLLECTION)
      .doc(item._id)
      .remove()))
  }

  const previousDeleted = Number.isInteger(run.deletedCount) ? run.deletedCount : 0
  const deletedCount = Math.min(previousDeleted + sourceBatch.length, run.expectedUserCount)
  if (sourceBatch.length < OPERATION_BATCH_SIZE) {
    await db.collection(RUN_COLLECTION).doc(BACKUP_BATCH).update({
      data: {
        status: 'complete',
        completedAt: Date.now(),
        backedUpCount: run.expectedUserCount,
        deletedCount: run.expectedUserCount,
        remainingCount: 0,
      },
    })
    return {
      status: 'success',
      reason: 'userData backed up, verified, and cleared',
      backupCollection: BACKUP_COLLECTION,
      backupBatch: BACKUP_BATCH,
      backedUpCount: run.expectedUserCount,
      deletedCount: run.expectedUserCount,
      remainingCount: 0,
      changed: true,
    }
  }

  await db.collection(RUN_COLLECTION).doc(BACKUP_BATCH).update({
    data: { deletedCount, lastDeletionAt: Date.now() },
  })
  return progress('deleting', {
    backedUpCount: run.expectedUserCount,
    deletedCount,
    estimatedRemainingCount: Math.max(run.expectedUserCount - deletedCount, 0),
  })
}

exports.main = async (event = {}) => {
  if (event.confirm !== CONFIRMATION) return inspect()
  if (!Number.isInteger(event.expectedUserCount) || event.expectedUserCount < 0) {
    return {
      status: 'error',
      reason: 'expectedUserCount must be a non-negative integer',
      changed: false,
    }
  }

  await ensureCollection(BACKUP_COLLECTION)
  await ensureCollection(RUN_COLLECTION)

  let run = await getRun()
  if (!run) {
    const started = await startRun(event.expectedUserCount)
    if (started.error) return started.error
    if (started.result) return started.result
    run = started.run
  } else if (run.expectedUserCount !== event.expectedUserCount) {
    return {
      status: 'error',
      reason: 'expectedUserCount does not match the existing reset run',
      expectedUserCount: event.expectedUserCount,
      runExpectedUserCount: run.expectedUserCount,
      changed: false,
    }
  }

  if (run.status === 'complete') {
    return {
      status: 'success',
      reason: 'This backup and reset run is already complete',
      backupCollection: BACKUP_COLLECTION,
      backupBatch: BACKUP_BATCH,
      backedUpCount: run.expectedUserCount,
      deletedCount: run.expectedUserCount,
      remainingCount: 0,
      changed: false,
    }
  }
  if (run.status === 'backing_up') return continueBackup(run)
  if (run.status === 'verifying_backup') return verifyBackup(run)
  if (run.status === 'backup_verified') return continueDeletion(run)

  return {
    status: 'error',
    reason: `Unknown reset status: ${run.status}`,
    changed: false,
  }
}
