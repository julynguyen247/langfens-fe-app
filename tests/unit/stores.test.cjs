const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createLoader } = require('./load-source.cjs');

for (const [file, name] of [
  ['loading', 'useLoadingStore'],
  ['userStore', 'useUserStore'],
  ['practiceStore', 'usePracticeStore'],
  ['useAttemptStore', 'useAttemptStore'],
]) {
  test(`${name} shares one instance through old and new import paths`, () => {
    const load = createLoader();
    assert.equal(load(`src/app/store/${file}.ts`)[name], load(`src/stores/${file}.ts`)[name]);
  });
}

test('attempt state retains per-attempt answers and submit handlers when another attempt is cleared', () => {
  const load = createLoader();
  const store = load('src/stores/useAttemptStore.ts').useAttemptStore;
  const first = { attemptId: 'first', paper: { sections: [] } };
  const second = { attemptId: 'second', paper: { sections: [] } };
  const submit = async () => {};
  store.getState().setAttempt(first);
  store.getState().setAttempt(second);
  store.getState().setSubmitHandler('second', submit);
  store.getState().clear('first');
  assert.equal(store.getState().getAttempt('first'), undefined);
  assert.equal(store.getState().getAttempt('second'), second);
  assert.equal(store.getState().submitHandlers.second, submit);
  store.getState().clear();
  assert.deepEqual(store.getState().byId, {});
  assert.deepEqual(store.getState().submitHandlers, {});
});
