import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import vm from 'node:vm';

// Load data_v3.js into a sandbox
const dataCode = fs.readFileSync('./js/data_v3.js', 'utf8');
const sandbox = { Math, window: {} };
vm.createContext(sandbox);
vm.runInContext(dataCode, sandbox);

const GAME_DATA = sandbox.window.GAME_DATA;
const getRarityById = GAME_DATA.getRarityById;

test('getRarityById works correctly - valid IDs', () => {
  const mythic = getRarityById('mythic');
  assert.strictEqual(mythic.id, 'mythic');
  assert.strictEqual(mythic.name, 'Mythic');

  const common = getRarityById('common');
  assert.strictEqual(common.id, 'common');
  assert.strictEqual(common.name, 'Common');
});

test('getRarityById works correctly - handles invalid ID edge case by returning common', () => {
  const invalid = getRarityById('invalid_id');
  assert.strictEqual(invalid.id, 'common');
  assert.strictEqual(invalid.name, 'Common');
});
