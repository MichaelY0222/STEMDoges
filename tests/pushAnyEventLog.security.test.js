const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const cloudFunctionPath = path.resolve(
  __dirname,
  '../cloudfunctions/pushAnyEventLog/index.js'
);

function loadCloudFunctionWithFakeSdk() {
  const writes = [];
  const queries = [];

  const database = {
    collection(collectionName) {
      return {
        where(query) {
          queries.push({ collectionName, query });
          return {
            async get() {
              // Simulate a user who has never submitted this activity.
              return { data: [] };
            },
            async remove() {
              return { stats: { removed: 0 } };
            },
            async update({ data }) {
              writes.push({ operation: 'update', collectionName, data });
              return { stats: { updated: 1 } };
            },
          };
        },
        async add({ data }) {
          writes.push({ operation: 'add', collectionName, data });
          return { _id: `fake-${writes.length}` };
        },
      };
    },
  };

  const fakeCloudSdk = {
    DYNAMIC_CURRENT_ENV: 'local-security-test',
    init() {},
    getWXContext() {
      return { OPENID: 'ordinary-user-openid' };
    },
    database() {
      return database;
    },
  };

  const originalLoad = Module._load;
  Module._load = function loadWithFakeCloudSdk(request, parent, isMain) {
    if (request === 'wx-server-sdk') {
      return fakeCloudSdk;
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    delete require.cache[cloudFunctionPath];
    const cloudFunction = require(cloudFunctionPath);
    return { main: cloudFunction.main, queries, writes };
  } finally {
    Module._load = originalLoad;
  }
}

test('PoC: a client can mark a nonexistent trivia question as correct', async () => {
  const { main, queries, writes } = loadCloudFunctionWithFakeSdk();

  const result = await main({
    type: 'Trivia',
    questionId: 'nonexistent-question',
    status: 'correct',
    eventTag: 'MD26',
  });

  assert.equal(result.status, 'success');
  assert.deepEqual(queries, [{
    collectionName: 'piDay2026ActivityLog',
    query: {
      userId: 'ordinary-user-openid',
      questionId: 'nonexistent-question',
      eventTag: 'MD26',
    },
  }]);
  assert.deepEqual(writes, [{
    operation: 'add',
    collectionName: 'piDay2026ActivityLog',
    data: {
      userId: 'ordinary-user-openid',
      type: 'Trivia',
      questionId: 'nonexistent-question',
      status: 'correct',
      eventTag: 'MD26',
      timestamp: writes[0].data.timestamp,
    },
  }]);
  assert.equal(typeof writes[0].data.timestamp, 'number');
});

test('PoC: a client can submit an arbitrary activity point value', async () => {
  const { main, writes } = loadCloudFunctionWithFakeSdk();

  const result = await main({
    type: 'activity',
    issuerId: 'forged-admin-openid',
    logId: 'forged-log-id',
    eventId: 'forged-event-id',
    eventName: 'Forged activity',
    points: 999999,
    eventTag: 'MD26',
  });

  assert.equal(result.status, 'success');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].collectionName, 'piDay2026ActivityLog');
  assert.equal(writes[0].data.userId, 'ordinary-user-openid');
  assert.equal(writes[0].data.issuerId, 'forged-admin-openid');
  assert.equal(writes[0].data.points, 999999);
  assert.equal(writes[0].data.eventTag, 'MD26');
});
