import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KEY, readChoice, writeChoice, applyChoice } from '../src/lib/theme.mjs';

const throwing = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
  removeItem() { throw new Error('blocked'); },
};

function memory(init = {}) {
  const map = new Map(Object.entries(init));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    map,
  };
}

test('a storage that throws reads as the system setting', () => {
  assert.equal(readChoice(throwing), '');
});

test('no storage at all reads as the system setting', () => {
  assert.equal(readChoice(undefined), '');
});

test('a saved choice is read back', () => {
  assert.equal(readChoice(memory({ [KEY]: 'dark' })), 'dark');
  assert.equal(readChoice(memory({ [KEY]: 'light' })), 'light');
});

test('an unknown saved value reads as the system setting', () => {
  assert.equal(readChoice(memory({ [KEY]: 'purple' })), '');
});

test('writing to a storage that throws does not throw', () => {
  assert.doesNotThrow(() => writeChoice(throwing, 'dark'));
});

test('writing the system setting forgets the saved choice', () => {
  const s = memory({ [KEY]: 'dark' });
  writeChoice(s, '');
  assert.equal(s.getItem(KEY), null);
});

test('the system setting follows prefers-color-scheme', () => {
  const root = { dataset: {} };
  assert.equal(applyChoice(root, '', true), 'dark');
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(applyChoice(root, '', false), 'light');
  assert.equal(root.dataset.theme, 'light');
});

test('a choice overrides the system setting', () => {
  const root = { dataset: {} };
  assert.equal(applyChoice(root, 'light', true), 'light');
  assert.equal(root.dataset.theme, 'light');
});
