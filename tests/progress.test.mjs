import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/guide-progress.js', import.meta.url), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context, { filename: 'guide-progress.js' });
const progress = context.window.MenuConnectProgress;

// Model the live curriculum: lesson count and setup stages come from guide.html.
const guide = await readFile(new URL('../guide.html', import.meta.url), 'utf8');
const total = (guide.match(/<section class="lesson"/g) || []).length - 1;
const stages = JSON.parse(guide.match(/var setupStages=(\[\[[\d,\[\]]+\]\]);/)[1]);

function storageWith(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    value(key) { return values.get(key); },
  };
}

const options = {
  total,
  stages,
  now: () => '2026-09-22T12:00:00.000Z',
};

test('viewed lessons and the resume lesson persist across store instances', () => {
  const storage = storageWith();
  const first = progress.createStore(storage, options);

  first.markViewed(1);
  first.markViewed(2);
  first.markViewed(2);

  const resumed = progress.createStore(storage, options).snapshot();
  assert.deepEqual(Array.from(resumed.viewed), [1, 2]);
  assert.equal(resumed.lastLesson, 2);
  assert.equal(resumed.nextLesson, 3);
  assert.equal(resumed.viewedCount, 2);
  assert.equal(resumed.completedStages, 1);
});

test('reports each stage independently and requires the quick check for stage five', () => {
  const store = progress.createStore(storageWith(), options);

  for (const lesson of [...stages[3], ...stages[4]]) store.markViewed(lesson);

  const beforeQuiz = store.snapshot();
  assert.deepEqual(Array.from(beforeQuiz.stageComplete), [false, false, false, true, false]);
  assert.equal(beforeQuiz.completedStages, 1);

  const afterQuiz = store.finishQuickCheck(10, 15);
  assert.deepEqual(Array.from(afterQuiz.stageComplete), [false, false, false, true, true]);
  assert.equal(afterQuiz.completedStages, 2);
});

test('storage selection probes writes and exposes whether progress is persistent', () => {
  const persistentStorage = storageWith();
  const persistent = progress.selectStorage({ localStorage: persistentStorage });
  assert.equal(persistent.persistent, true);
  assert.equal(persistentStorage.value('menuconnect-owner-setup-probe'), undefined);

  const unavailable = progress.selectStorage({
    localStorage: {
      getItem() { throw new Error('blocked'); },
      setItem() { throw new Error('blocked'); },
      removeItem() { throw new Error('blocked'); },
    },
  });
  assert.equal(unavailable.persistent, false);
  const store = progress.createStore(unavailable.storage, { ...options, persistent: unavailable.persistent });
  store.markViewed(3);
  assert.deepEqual(Array.from(store.snapshot().viewed), [3]);
  assert.equal(store.snapshot().persistent, false);
});

test('all lessons viewed without the quick check resumes at the quick check', () => {
  const storage = storageWith();
  const store = progress.createStore(storage, options);
  for (let lesson = 1; lesson <= total; lesson += 1) store.markViewed(lesson);

  const state = store.snapshot();
  assert.equal(state.complete, false);
  assert.equal(state.nextLesson, total);
});

test('setup completes only after every lesson is viewed and the quick check is finished', () => {
  const storage = storageWith();
  const store = progress.createStore(storage, options);

  store.finishQuickCheck(12, 15);
  assert.equal(store.snapshot().complete, false);
  assert.equal(store.snapshot().completedAt, null);

  for (let lesson = 1; lesson <= total; lesson += 1) store.markViewed(lesson);

  const completed = store.snapshot();
  assert.equal(completed.complete, true);
  assert.equal(completed.completedAt, options.now());
  assert.equal(completed.quizScore, 12);
  assert.equal(completed.quizTotal, 15);
  assert.equal(completed.completedStages, 5);
});

test('malformed or out-of-range saved progress is safely normalized', () => {
  const storage = storageWith({
    'menuconnect-owner-setup-v1': JSON.stringify({
      viewed: [0, 1, 1, total + 1, '2', 7],
      lastLesson: 99,
      quizComplete: 'yes',
      completedAt: 42,
    }),
  });

  const state = progress.createStore(storage, options).snapshot();
  assert.deepEqual(Array.from(state.viewed), [1, 7]);
  assert.equal(state.lastLesson, 7);
  assert.equal(state.nextLesson, 2);
  assert.equal(state.quizComplete, false);
  assert.equal(state.completedAt, null);
});

test('the curriculum matches the guide and the default lesson count', () => {
  assert.equal(total, 19);
  assert.deepEqual(stages.flat(), Array.from({ length: total }, (_, i) => i + 1));
  const byDefault = progress.createStore(storageWith());
  byDefault.markViewed(total);
  assert.deepEqual(Array.from(byDefault.snapshot().viewed), [total], 'default lesson count must cover the whole curriculum');
});

test('reset clears persisted progress and returns to the first lesson', () => {
  const storage = storageWith();
  const store = progress.createStore(storage, options);
  store.markViewed(4);
  store.finishQuickCheck(15, 15);

  const reset = store.reset();
  assert.deepEqual(Array.from(reset.viewed), []);
  assert.equal(reset.lastLesson, 0);
  assert.equal(reset.nextLesson, 1);
  assert.equal(storage.value('menuconnect-owner-setup-v1'), undefined);
});
