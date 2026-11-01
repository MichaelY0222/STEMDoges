const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const functionPath = path.resolve(__dirname, '../cloudfunctions/replaceBitDayTrivia/index.js');
const confirmation = 'REPLACE_BIT_DAY_TRIVIA_WITH_30_QUESTIONS';

function loadMigrationWithFakeSdk() {
  const collections = {
    bitDayTrivia: [{ _id: 'old-question', questionId: 'OLD-01' }],
    bitDayTriviaBackups: [],
    settings: [{ _id: 'active-event', type: 'activeEvent', event: 'moleday', windowMode: 'currentYear' }],
  };

  function collection(name) {
    const query = {
      offset: 0,
      maximum: Infinity,
      skip(value) {
        this.offset = value;
        return this;
      },
      limit(value) {
        this.maximum = value;
        return this;
      },
      async get() {
        return { data: collections[name].slice(this.offset, this.offset + this.maximum) };
      },
      where(criteria) {
        const matches = collections[name].filter(item => Object.entries(criteria)
          .every(([key, value]) => item[key] === value));
        return {
          async get() {
            return { data: matches };
          },
        };
      },
      doc(id) {
        return {
          async set({ data }) {
            collections[name].push({ _id: id, ...data });
          },
          async remove() {
            collections[name] = collections[name].filter(item => item._id !== id);
          },
          async update({ data }) {
            collections[name] = collections[name]
              .map(item => item._id === id ? { ...item, ...data } : item);
          },
        };
      },
      async add({ data }) {
        collections[name].push({ _id: `generated-${collections[name].length + 1}`, ...data });
      },
    };
    return query;
  }

  const database = {
    collection,
    async runTransaction(callback) {
      return callback({ collection });
    },
  };
  const fakeCloudSdk = {
    DYNAMIC_CURRENT_ENV: 'local-test',
    init() {},
    database() {
      return database;
    },
  };

  const originalLoad = Module._load;
  Module._load = function loadWithFakeSdk(request, parent, isMain) {
    if (request === 'wx-server-sdk') return fakeCloudSdk;
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    delete require.cache[functionPath];
    return { collections, main: require(functionPath).main };
  } finally {
    Module._load = originalLoad;
  }
}

test('replacement requires explicit confirmation', async () => {
  const { collections, main } = loadMigrationWithFakeSdk();
  const result = await main({});
  assert.equal(result.status, 'error');
  assert.equal(collections.bitDayTrivia.length, 1);
});

test('replacement backs up the old bank and installs exactly 30 questions', async () => {
  const { collections, main } = loadMigrationWithFakeSdk();
  const result = await main({ confirm: confirmation });

  assert.equal(result.status, 'success');
  assert.equal(result.previousCount, 1);
  assert.equal(result.newCount, 30);
  assert.equal(collections.bitDayTrivia.length, 30);
  assert.equal(collections.bitDayTriviaBackups.length, 1);
  assert.equal(collections.bitDayTriviaBackups[0].questions[0].questionId, 'OLD-01');
  assert.equal(collections.bitDayTriviaBackups[0].activeEventSettings[0].event, 'moleday');
  assert.equal(collections.settings[0].event, 'bitday');
  assert.equal(result.activeEvent, 'bitday');
});
