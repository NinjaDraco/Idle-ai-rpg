const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('====================================================');
console.log('  F_Gamma UNIT TESTS');
console.log('====================================================\n');

// Load script context
const jsPath = path.join(__dirname, 'js/eternitynum_v3.js');
const jsCode = fs.readFileSync(jsPath, 'utf8');
const context = vm.createContext({});
vm.runInContext(jsCode, context);

const F_Gamma = context.F_Gamma;
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failCount++;
  }
}

// Float equality helper
function assertCloseTo(actual, expected, tolerance = 1e-5) {
  assert(
    Math.abs(actual - expected) < tolerance,
    `Expected ${actual} to be close to ${expected} (tolerance: ${tolerance})`
  );
}

test('F_Gamma(0.5) boundary condition matches sqrt(PI)', () => {
  const result = F_Gamma(0.5);
  const expected = Math.sqrt(Math.PI);
  assertCloseTo(result, expected);
});

test('F_Gamma(1) returns roughly 1', () => {
  assertCloseTo(F_Gamma(1), 1);
});

test('F_Gamma(2) returns roughly 1', () => {
  assertCloseTo(F_Gamma(2), 1);
});

test('F_Gamma(3) returns roughly 2', () => {
  assertCloseTo(F_Gamma(3), 2);
});

test('F_Gamma(5) returns roughly 24', () => {
  assertCloseTo(F_Gamma(5), 24);
});

test('F_Gamma for values > 171.6236 returns 1.8e308', () => {
  const result = F_Gamma(172);
  assert.strictEqual(result, 1.8e308);
});

test('F_Gamma(-0.5) returns roughly -2 * sqrt(PI)', () => {
  const result = F_Gamma(-0.5);
  const expected = -2 * Math.sqrt(Math.PI);
  assertCloseTo(result, expected);
});

test('F_Gamma(0) returns Infinity or handles properly', () => {
  const result = Math.abs(F_Gamma(0));
  assert.strictEqual(result, Infinity);
});

test('F_Gamma(-1) returns Infinity or handles properly', () => {
  // It diverges at negative integers. Depending on precision, it can be extremely large
  const result = Math.abs(F_Gamma(-1));
  assert(result > 1e10, `Expected result to be very large, got ${result}`);
});

console.log('\n====================================================');
console.log(`  VERIFICATION RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
}
