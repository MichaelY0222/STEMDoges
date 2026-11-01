const assert = require('node:assert/strict')
const Module = require('node:module')
const path = require('node:path')
const test = require('node:test')

const resetFunctionPath = path.resolve(__dirname, '../cloudfunctions/backupAndResetUserData/index.js')
const registerFunctionPath = path.resolve(__dirname, '../cloudfunctions/registerUser/index.js')

function makeFakeSdk(initialCollections, openid = 'openid-1') {
  const collections = structuredClone(initialCollections)

  function collection(name) {
    if (!collections[name]) throw new Error(`Collection does not exist: ${name}`)
    const state = {
      offset: 0,
      maximum: Infinity,
      criteria: null,
      orderField: null,
      orderDirection: 'asc',
    }
    const query = {
      where(criteria) {
        state.criteria = criteria
        return this
      },
      skip(value) {
        state.offset = value
        return this
      },
      limit(value) {
        state.maximum = value
        return this
      },
      orderBy(field, direction) {
        state.orderField = field
        state.orderDirection = direction
        return this
      },
      async get() {
        let data = [...collections[name]]
        if (state.criteria) {
          data = data.filter(item => Object.entries(state.criteria)
            .every(([key, value]) => item[key] === value))
        }
        if (state.orderField) {
          const direction = state.orderDirection === 'desc' ? -1 : 1
          data.sort((left, right) => String(left[state.orderField])
            .localeCompare(String(right[state.orderField])) * direction)
        }
        return { data: structuredClone(data.slice(state.offset, state.offset + state.maximum)) }
      },
      doc(id) {
        return {
          async get() {
            const document = collections[name].find(item => item._id === id)
            if (!document) throw new Error(`Document does not exist: ${name}/${id}`)
            return { data: structuredClone(document) }
          },
          async set({ data }) {
            const document = { _id: id, ...structuredClone(data) }
            const index = collections[name].findIndex(item => item._id === id)
            if (index === -1) collections[name].push(document)
            else collections[name][index] = document
          },
          async update({ data }) {
            const index = collections[name].findIndex(item => item._id === id)
            if (index === -1) throw new Error(`Document does not exist: ${name}/${id}`)
            collections[name][index] = { ...collections[name][index], ...structuredClone(data) }
          },
          async remove() {
            collections[name] = collections[name].filter(item => item._id !== id)
          },
        }
      },
      async add({ data }) {
        const id = `generated-${collections[name].length + 1}`
        collections[name].push({ _id: id, ...structuredClone(data) })
        return { _id: id }
      },
    }
    return query
  }

  const database = {
    collection,
    async createCollection(name) {
      if (!collections[name]) collections[name] = []
    },
  }
  return {
    collections,
    sdk: {
      DYNAMIC_CURRENT_ENV: 'local-test',
      init() {},
      database() {
        return database
      },
      getWXContext() {
        return { OPENID: openid }
      },
    },
  }
}

function loadWithSdk(functionPath, sdk) {
  const originalLoad = Module._load
  Module._load = function loadWithFakeSdk(request, parent, isMain) {
    if (request === 'wx-server-sdk') return sdk
    return originalLoad.call(this, request, parent, isMain)
  }
  try {
    delete require.cache[functionPath]
    return require(functionPath).main
  } finally {
    Module._load = originalLoad
  }
}

function users() {
  return [
    {
      _id: 'original-user-1',
      userId: 'openid-1',
      name: 'Student One',
      grade: '10',
      class: '3',
      gNumber: 'G2024010001',
    },
    {
      _id: 'original-user-2',
      userId: 'openid-2',
      name: 'Student Two',
      grade: '11',
      class: '4',
      gNumber: 'G2023010002',
    },
  ]
}

test('preview reports the current userData count without changing data', async () => {
  const { collections, sdk } = makeFakeSdk({ userData: users() })
  const main = loadWithSdk(resetFunctionPath, sdk)

  const result = await main({})

  assert.equal(result.status, 'preview')
  assert.equal(result.sourceCount, 2)
  assert.equal(collections.userData.length, 2)
  assert.equal(collections.userDataBackup20261025, undefined)
})

test('a mismatched expected count prevents backup and deletion', async () => {
  const { collections, sdk } = makeFakeSdk({ userData: users() })
  const main = loadWithSdk(resetFunctionPath, sdk)

  const result = await main({
    confirm: 'BACKUP_AND_CLEAR_USER_DATA',
    expectedUserCount: 99,
  })

  assert.equal(result.status, 'error')
  assert.equal(result.changed, false)
  assert.equal(collections.userData.length, 2)
})

test('verified backup preserves document IDs before userData is cleared', async () => {
  const { collections, sdk } = makeFakeSdk({ userData: users() })
  const main = loadWithSdk(resetFunctionPath, sdk)

  const request = {
    confirm: 'BACKUP_AND_CLEAR_USER_DATA',
    expectedUserCount: 2,
  }
  let result
  for (let attempt = 0; attempt < 10; attempt += 1) {
    result = await main(request)
    if (result.status === 'success') break
    assert.equal(result.status, 'in_progress')
    assert.equal(result.repeatSameRequest, true)
  }

  assert.equal(result.status, 'success')
  assert.equal(result.backedUpCount, 2)
  assert.equal(result.deletedCount, 2)
  assert.equal(result.remainingCount, 0)
  assert.equal(collections.userData.length, 0)
  assert.equal(collections.userDataBackup20261025.length, 2)
  assert.equal(collections.userDataBackup20261025[0]._id, 'original-user-1')
  assert.equal(collections.userDataBackup20261025[0].userId, 'openid-1')
  assert.equal(collections.userDataBackupRuns[0].status, 'complete')
})

test('a timed-out partial backup is resumed safely before deletion', async () => {
  const sourceUsers = users()
  const { collections, sdk } = makeFakeSdk({
    userData: sourceUsers,
    userDataBackup20261025: [{
      _id: 'original-user-1',
      userId: 'openid-1',
      name: 'Student One',
      grade: '10',
      class: '3',
      gNumber: 'G2024010001',
      originalDocumentId: 'original-user-1',
      originalOpenId: '',
      sourceCollection: 'userData',
      backupBatch: 'user-data-reset-2026-10-25-v1',
      backedUpAt: 1,
    }],
    userDataBackupRuns: [{
      _id: 'user-data-reset-2026-10-25-v1',
      backupBatch: 'user-data-reset-2026-10-25-v1',
      sourceCollection: 'userData',
      backupCollection: 'userDataBackup20261025',
      expectedUserCount: 2,
      status: 'backing_up',
      startedAt: 1,
    }],
  })
  const main = loadWithSdk(resetFunctionPath, sdk)
  const request = {
    confirm: 'BACKUP_AND_CLEAR_USER_DATA',
    expectedUserCount: 2,
  }

  let result
  for (let attempt = 0; attempt < 10; attempt += 1) {
    result = await main(request)
    if (result.status === 'success') break
  }

  assert.equal(result.status, 'success')
  assert.equal(collections.userData.length, 0)
  assert.equal(collections.userDataBackup20261025.length, 2)
  assert.equal(collections.userDataBackupRuns[0].status, 'complete')
})

test('returning users reuse their original document ID when registering again', async () => {
  const { collections, sdk } = makeFakeSdk({
    userData: [],
    userDataBackup20261025: [{
      _id: 'original-user-1',
      userId: 'openid-1',
      name: 'Old Name',
      grade: '9',
      class: '1',
      gNumber: 'G2024010001',
    }],
    userDataBackupRuns: [{
      _id: 'user-data-reset-2026-10-25-v1',
      status: 'complete',
    }],
  })
  const main = loadWithSdk(registerFunctionPath, sdk)

  const result = await main({
    name: 'New Name',
    grade: '10',
    class: '3',
    gNumber: 'G2024010001',
  })

  assert.equal(result.status, 'success')
  assert.equal(result.restoredDocumentId, true)
  assert.equal(collections.userData.length, 1)
  assert.equal(collections.userData[0]._id, 'original-user-1')
  assert.equal(collections.userData[0].name, 'New Name')
  assert.equal(collections.userData[0].grade, '10')
  assert.equal(collections.userData[0].class, '3')
  assert.equal(collections.userData[0].gNumber, 'G2024010001')
})

test('registration is blocked while the reset is incomplete', async () => {
  const { collections, sdk } = makeFakeSdk({
    userData: [],
    userDataBackup20261025: [],
    userDataBackupRuns: [{
      _id: 'user-data-reset-2026-10-25-v1',
      status: 'backing_up',
    }],
  })
  const main = loadWithSdk(registerFunctionPath, sdk)

  const result = await main({
    name: 'Student',
    grade: '10',
    class: '3',
    gNumber: 'G2024010001',
  })

  assert.equal(result.status, 'error')
  assert.match(result.reason, /reset is in progress/)
  assert.equal(collections.userData.length, 0)
})
