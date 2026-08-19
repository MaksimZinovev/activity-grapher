// Tests for the newBoard / renameBoard split.
// Run: bun test
//
// These tests exercise the VFS data patterns that newBoard() and renameBoard()
// use in src/app.js. The app functions live inside an IIFE and can't be imported
// directly, so we replicate their core logic against a mock VFS. If the logic in
// app.js changes, update the replicated functions here to match.

import { test } from 'bun:test';
import assert from 'node:assert/strict';

// --- mock VFS (in-memory, mirrors fetch/save interface from vfs.js) ---
function mockVFS() {
  const store = {};
  return {
    async fetch(f) { return store[f] ? structuredClone(store[f]) : {}; },
    async save(f, data) { store[f] = structuredClone(data); },
    _store: store,
  };
}

// --- replicated logic from app.js ---

// newBoard: creates empty entry in current month, preserves existing data
async function newBoard(VFS, curSelected, name) {
  const f = curSelected.substring(0, 7) + '.data.yaml';
  const db = await VFS.fetch(f);
  if (!db[name]) db[name] = {};
  await VFS.save(f, db);
}

// renameBoard: moves data across all 12 months, deletes old name
async function renameBoard(VFS, curYear, oldName, newName) {
  for (let m = 0; m < 12; m++) {
    const f = curYear + '-' + String(m + 1).padStart(2, '0') + '.data.yaml';
    const db = await VFS.fetch(f);
    if (db[oldName]) {
      db[newName] = db[oldName];
      delete db[oldName];
      await VFS.save(f, db);
    }
  }
}

// --- tests ---

test('newBoard: creates empty board without removing current board data', async () => {
  const VFS = mockVFS();
  const f = '2026-08.data.yaml';
  await VFS.save(f, { default: { '2026-08-19': [{ description: 'task', done: false }] } });

  await newBoard(VFS, '2026-08-19', 'board1');

  const db = await VFS.fetch(f);
  assert.ok(db.default, 'default board preserved');
  assert.ok(db.board1, 'new board created');
  assert.deepEqual(db.board1, {}, 'new board is empty');
  assert.equal(db.default['2026-08-19'].length, 1, 'default data intact');
});

test('newBoard: can create multiple boards from same source (regression — the original bug)', async () => {
  const VFS = mockVFS();
  const f = '2026-08.data.yaml';
  await VFS.save(f, { default: { '2026-08-19': [{ description: 'task', done: false }] } });

  // The original bug: second newBoard from "default" was a silent no-op
  // because renameBoard (the old combined function) moved+deleted default's data.
  await newBoard(VFS, '2026-08-19', 'board1');
  await newBoard(VFS, '2026-08-19', 'board2');
  await newBoard(VFS, '2026-08-19', 'board3');

  const db = await VFS.fetch(f);
  assert.ok(db.default, 'default still has data');
  assert.ok(db.board1, 'board1 exists');
  assert.ok(db.board2, 'board2 exists');
  assert.ok(db.board3, 'board3 exists');
  assert.deepEqual(db.board1, {}, 'board1 empty');
  assert.deepEqual(db.board2, {}, 'board2 empty');
  assert.deepEqual(db.board3, {}, 'board3 empty');
});

test('renameBoard: moves data across months and deletes old name', async () => {
  const VFS = mockVFS();
  await VFS.save('2026-01.data.yaml', { default: { '2026-01-15': [{ description: 'jan', done: true }] } });
  await VFS.save('2026-08.data.yaml', { default: { '2026-08-19': [{ description: 'aug', done: false }] } });

  await renameBoard(VFS, 2026, 'default', 'renamed');

  const jan = await VFS.fetch('2026-01.data.yaml');
  const aug = await VFS.fetch('2026-08.data.yaml');
  assert.ok(!('default' in jan), 'old name gone from January');
  assert.ok(!('default' in aug), 'old name gone from August');
  assert.equal(jan.renamed['2026-01-15'][0].description, 'jan', 'January data migrated');
  assert.equal(aug.renamed['2026-08-19'][0].description, 'aug', 'August data migrated');
});