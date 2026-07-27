import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Evaluate eternitynum_v3.js in our context
const code = readFileSync(join(__dirname, '../js/eternitynum_v3.js'), 'utf-8');
const moduleContent = code + '\nmodule.exports = { EN, CutDigits };\n';
const moduleObj = { exports: {} };
const moduleFn = new Function('module', 'window', moduleContent);
moduleFn(moduleObj, {});
const EN = moduleObj.exports.EN;

describe('CutDigits', () => {
  const CutDigits = EN.CutDigits;

  it('should truncate normal numbers correctly', () => {
    expect(CutDigits(1.23456, 2)).toBe('1.23');
    expect(CutDigits(1.23456, 4)).toBe('1.2346'); // toFixed rounds
  });

  it('should strip trailing zeros', () => {
    expect(CutDigits(1.200, 3)).toBe('1.2');
    expect(CutDigits(1.50, 2)).toBe('1.5');
  });

  it('should strip trailing decimal point if it becomes integer', () => {
    expect(CutDigits(1.000, 3)).toBe('1');
    expect(CutDigits(5.0, 1)).toBe('5');
    expect(CutDigits(123.00, 2)).toBe('123');
  });

  it('should handle zero correctly', () => {
    expect(CutDigits(0, 2)).toBe('0');
    expect(CutDigits(0.000, 3)).toBe('0');
  });

  it('should handle negative numbers correctly', () => {
    expect(CutDigits(-1.234, 2)).toBe('-1.23');
    expect(CutDigits(-5.0, 1)).toBe('-5');
    expect(CutDigits(-0.000, 3)).toBe('0'); // toFixed(3) on -0 gives '0.000', stripped to '0'
  });

  it('should handle large numbers', () => {
    expect(CutDigits(1234567.89, 1)).toBe('1234567.9');
  });

  it('should return string representation for non-numbers', () => {
    expect(CutDigits('1.23', 2)).toBe('1.23');
    expect(CutDigits(null, 2)).toBe('null');
    expect(CutDigits(undefined, 2)).toBe('undefined');
  });

  it('should handle invalid digits gracefully (throws on toFixed, testing exception or non-standard)', () => {
    // toFixed throws RangeError if digits < 0 or digits > 100
    expect(() => CutDigits(1.23, -1)).toThrow(RangeError);
  });

  it('should handle Infinity and NaN', () => {
    // toFixed on Infinity/NaN returns string representation, no '.' unless specified
    expect(CutDigits(Infinity, 2)).toBe('Infinity');
    expect(CutDigits(-Infinity, 2)).toBe('-Infinity');
    expect(CutDigits(NaN, 2)).toBe('NaN');
  });
});
