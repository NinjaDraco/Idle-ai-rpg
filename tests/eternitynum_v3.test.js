import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Evaluate eternitynum_v3.js in our context
const code = readFileSync(join(__dirname, '../js/eternitynum_v3.js'), 'utf-8');
const moduleContent = code + '\nmodule.exports = { EN, CutDigits };\n';
const moduleObj = { exports: {} };
const moduleFn = new Function('module', 'window', moduleContent);
moduleFn(moduleObj, {});
const { EN, CutDigits } = moduleObj.exports;

test('CutDigits should truncate normal numbers correctly', () => {
  assert.strictEqual(CutDigits(1.23456, 2), '1.23');
  assert.strictEqual(CutDigits(1.23456, 4), '1.2346'); // toFixed rounds
});

test('CutDigits should strip trailing zeros', () => {
  assert.strictEqual(CutDigits(1.200, 3), '1.2');
  assert.strictEqual(CutDigits(1.50, 2), '1.5');
});

test('CutDigits should strip trailing decimal point if it becomes integer', () => {
  assert.strictEqual(CutDigits(1.000, 3), '1');
  assert.strictEqual(CutDigits(5.0, 1), '5');
  assert.strictEqual(CutDigits(123.00, 2), '123');
});

test('CutDigits should handle zero correctly', () => {
  assert.strictEqual(CutDigits(0, 2), '0');
  assert.strictEqual(CutDigits(0.000, 3), '0');
});

test('CutDigits should handle negative numbers correctly', () => {
  assert.strictEqual(CutDigits(-1.234, 2), '-1.23');
  assert.strictEqual(CutDigits(-5.0, 1), '-5');
  assert.strictEqual(CutDigits(-0.000, 3), '0'); // toFixed(3) on -0 gives '0.000', stripped to '0'
});

test('CutDigits should handle large numbers', () => {
  assert.strictEqual(CutDigits(1234567.89, 1), '1234567.9');
});

test('CutDigits should return string representation for non-numbers', () => {
  assert.strictEqual(CutDigits('1.23', 2), '1.23');
  assert.strictEqual(CutDigits(null, 2), 'null');
  assert.strictEqual(CutDigits(undefined, 2), 'undefined');
});

test('CutDigits should handle invalid digits gracefully (throws on toFixed)', () => {
  // toFixed throws RangeError if digits < 0 or digits > 100
  assert.throws(() => CutDigits(1.23, -1), RangeError);
});

test('CutDigits should handle Infinity and NaN', () => {
  // toFixed on Infinity/NaN returns string representation, no '.' unless specified
  assert.strictEqual(CutDigits(Infinity, 2), 'Infinity');
  assert.strictEqual(CutDigits(-Infinity, 2), '-Infinity');
  assert.strictEqual(CutDigits(NaN, 2), 'NaN');
});

