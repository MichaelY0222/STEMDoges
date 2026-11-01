// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const USER_COLLECTION = 'userData'
const BACKUP_COLLECTION = 'userDataBackup20261025'
const RESET_RUN_COLLECTION = 'userDataBackupRuns'
const RESET_BATCH = 'user-data-reset-2026-10-25-v1'

function normalizeRegistration(event) {
  const data = {
    name: typeof event.name === 'string' ? event.name.trim() : '',
    grade: String(event.grade || ''),
    class: String(event.class || ''),
    gNumber: typeof event.gNumber === 'string' ? event.gNumber.trim().toUpperCase() : '',
  }

  if (!data.name
    || !['9', '10', '11', '12'].includes(data.grade)
    || !Array.from({ length: 12 }, (_, index) => String(index + 1)).includes(data.class)
    || !/^G(201[0-9]|202[0-9])010\d{3}$/.test(data.gNumber)) {
    throw new Error('Invalid registration data')
  }
  return data
}

async function findBackup(userId) {
  try {
    const result = await db.collection(BACKUP_COLLECTION)
      .where({ userId })
      .limit(1)
      .get()
    return result.data[0]
  } catch (error) {
    // The collection does not exist before the one-time reset. New users should
    // still be able to register normally.
    return undefined
  }
}

async function registrationResetInProgress() {
  try {
    const result = await db.collection(RESET_RUN_COLLECTION).doc(RESET_BATCH).get()
    return Boolean(result.data && result.data.status !== 'complete')
  } catch (error) {
    // Before the reset starts there is no run document, so registration remains
    // available as normal.
    return false
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const registration = normalizeRegistration(event)
  if (await registrationResetInProgress()) {
    return {
      status: 'error',
      reason: 'Registration reset is in progress. Please try again shortly.',
    }
  }
  let determineNeedNewUser = await db.collection(USER_COLLECTION).where({
    userId: wxContext.OPENID,
  }).get();
  if (determineNeedNewUser.data.length !== 0) {
    return {
      status: "error",
      reason: "User already registered"
    };
  } else {
    const data = {
      userId: wxContext.OPENID,
      ...registration,
    }
    const backup = await findBackup(wxContext.OPENID)
    if (backup) {
      // Reuse the original document ID so admin collections that reference it
      // remain valid after users re-enter their registration information.
      await db.collection(USER_COLLECTION).doc(backup._id).set({ data })
      return {
        status: 'success',
        restoredDocumentId: true,
      }
    }
    await db.collection(USER_COLLECTION).add({ data })
    return {
      status: 'success',
      restoredDocumentId: false,
    }
  }
}
