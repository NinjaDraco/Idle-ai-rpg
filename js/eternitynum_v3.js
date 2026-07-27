/**
 * EternityNum_v3.js
 * Hardened big-number math library for Eternity Idle RPG.
 * Supports numbers up to 10^2^1024 (Arrow notation).
 * Fixed: Stack overflow recursion, infinite loop formatting, NaN checks,
 *        negative subtraction, large scientific/layer notation parsing,
 *        large exponent powers, scientific/layer notation formatting.
 */

"use strict";

// ─── Config ───────────────────────────────────────────────────────────────────
const EXPL = 1e10;
const LDOWN = Math.log10(EXPL);
const MSD = 100;
const ALLOW_OVERFLOW = true;
const SUFFIX_LIMIT_STR = "9e1E14";
const DEFAULT_DIGITS = 2;

// ─── Gamma helpers ────────────────────────────────────────────────────────────
const C_GAMMA = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
];

function F_Gamma(n) {
  if (n > 171.6236) return 1.8e308;
  if (n > 0.5) {
    n -= 1;
    let x = C_GAMMA[0];
    for (let i = 1; i <= 7; i++) x += C_GAMMA[i] / (n + i);
    const t = n + 7.5;
    return x * Math.pow(t, n + 0.5 - 36) * Math.exp(-t) * Math.pow(t, 36) * 2.50662827463100050241576528;
  }
  return Math.PI / (Math.sin(Math.PI * n) * F_Gamma(1 - n));
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TAU = 6.2831853071795864769252842;
const EXPN1 = 0.36787944117144232159553;
const OMEGA = 0.56714329040978387299997;

function f_Lambertw(z) {
  const tol = 1e-10;
  if (z > 1.79e308) return z;
  if (z === 0) return z;
  if (z === 1) return OMEGA;
  let w = z < 10 ? 0 : Math.log(z) - Math.log(Math.log(z));
  for (let i = 0; i < 100; i++) {
    const wn = (z * Math.exp(-w) + w * w) / (w + 1);
    if (Math.abs(wn - w) < tol * Math.abs(wn)) return wn;
    w = wn;
  }
  return w;
}

// ─── Core EN object ──────────────────────────────────────────────────────────
const EN = {};

function Cnew(Sign, Layer, Exp) { return { Sign, Layer, Exp }; }

const ZERO   = Cnew(0, 0, 0);
const ONE    = Cnew(1, 0, 1);
const NaN_EN = Cnew(1, -1, 1);
const Inf_EN = Cnew(1, Infinity, 1);

let SuffixLimit;

// Expose constants on EN object for full compatibility
EN.EXPL = EXPL;
EN.LDOWN = LDOWN;
EN.ZERO = ZERO;
EN.ONE = ONE;
EN.NaN_EN = NaN_EN;
EN.Inf_EN = Inf_EN;

// ─── Checks ──────────────────────────────────────────────────────────────────
EN.IsNaN  = v => !v || typeof v !== 'object' || isNaN(v.Sign) || isNaN(v.Layer) || isNaN(v.Exp) || (v.Sign === NaN_EN.Sign && v.Layer === NaN_EN.Layer && v.Exp === NaN_EN.Exp);
EN.IsInf  = v => !!v && (v.Layer === Infinity || v.Exp === Infinity || !isFinite(v.Layer) || !isFinite(v.Exp));
EN.IsZero = v => !v || v.Sign === 0 || (v.Exp === 0 && v.Layer === 0);

// ─── Correct (Iterative Stack-Overflow Proof) ─────────────────────────────────
EN.correct = function(e) {
  if (!e || typeof e !== 'object') return { ...ZERO };
  if (EN.IsNaN(e))  return { ...NaN_EN };
  if (EN.IsInf(e))  return { ...Inf_EN };
  if (EN.IsZero(e)) return { ...ZERO };

  let Sign = e.Sign;
  let Layer = e.Layer;
  let Exp = e.Exp;

  if (Sign === undefined || Layer === undefined || Exp === undefined) return { ...ZERO };

  let iterations = 0;
  const MAX_ITERATIONS = 10000;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    if (Layer === 0 && Exp < 0) {
      Exp = -Exp;
      Sign = -Sign;
      continue;
    }

    if (Layer >= 1 && Exp < 0) {
      if (Layer === 1 && Exp < -15) {
        break;
      }
      Layer -= 1;
      Exp = Math.pow(10, Exp);
      continue;
    }

    if (Layer >= 1 && Exp >= 0 && Exp < LDOWN) {
      Layer -= 1;
      Exp = Math.pow(10, Exp);
      continue;
    }

    if (Layer >= 2 && Exp > EXPL) {
      Layer += 1;
      Exp = Math.log10(Exp);
      continue;
    }

    if (Layer === 0 && Exp >= EXPL) {
      Layer += 1;
      Exp = Math.log10(Exp);
      continue;
    }

    break;
  }

  if (Sign === 0 || (Exp === 0 && Layer === 0)) return { ...ZERO };
  return Cnew(Sign, Layer, Exp);
};

// ─── Convert ─────────────────────────────────────────────────────────────────
EN.fromNumber = function(n) {
  if (isNaN(n)) return { ...NaN_EN };
  if (!isFinite(n)) return Cnew(Math.sign(n) || 1, Infinity, 1);
  if (n === 0) return { ...ZERO };
  const sign = n < 0 ? -1 : 1;
  n = Math.abs(n);
  if (n < 1e-300) return { ...ZERO };
  return EN.correct(Cnew(sign, 0, n));
};

EN.fromString = function(s) {
  if (typeof s !== 'string') return { ...ZERO };
  s = s.trim();
  if (!s || s === '0') return { ...ZERO };
  if (s === 'NaN' || s === 'nan') return { ...NaN_EN };
  if (s === 'Inf' || s === 'inf' || s === 'Infinity') return { ...Inf_EN };
  if (s === '-Inf' || s === '-inf' || s === '-Infinity') return Cnew(-1, Infinity, 1);

  if (s.startsWith('1 / ') || s.startsWith('1/')) {
    const sub = s.replace(/^1\s*\/\s*/, '');
    const inner = EN.fromString(sub);
    return EN.recip(inner);
  }

  // Layer notation E(n)x or E(n-)x, with optional leading sign
  const layerMatch = s.match(/^(-?)E\((\d+)(-?)\)\s*(.+)$/i);
  if (layerMatch) {
    const sign = layerMatch[1] === '-' ? -1 : 1;
    const layer = parseInt(layerMatch[2], 10);
    const expSign = layerMatch[3] === '-' ? -1 : 1;
    const expVal = parseFloat(layerMatch[4]);
    if (!isNaN(layer) && !isNaN(expVal)) {
      return EN.correct(Cnew(sign, layer, expSign * Math.abs(expVal)));
    }
  }

  // "X;Y" default format
  const semi = s.split(';');
  if (semi.length === 2) {
    const layer = parseInt(semi[0], 10);
    const exp   = parseFloat(semi[1]);
    if (!isNaN(layer) && !isNaN(exp)) {
      return EN.correct(Cnew(exp < 0 ? -1 : 1, layer, Math.abs(exp)));
    }
  }

  // Scientific "XeY"
  const eParts = s.toLowerCase().split('e');
  if (eParts.length === 2) {
    const m = parseFloat(eParts[0]);
    const ex = parseFloat(eParts[1]);
    if (!isNaN(m) && !isNaN(ex)) {
      if (m === 0) return { ...ZERO };
      const sign = m < 0 ? -1 : 1;
      const absM = Math.abs(m);
      if (ex >= 10) {
        const expVal = Math.log10(absM) + ex;
        return EN.correct(Cnew(sign, 1, expVal));
      } else {
        const val = absM * Math.pow(10, ex);
        return EN.correct(Cnew(sign, 0, val));
      }
    }
  }

  const n = parseFloat(s);
  if (!isNaN(n)) return EN.fromNumber(n);
  return { ...NaN_EN };
};

EN.convert = function(v) {
  if (v === null || v === undefined) return { ...ZERO };
  if (typeof v === 'object' && 'Sign' in v && 'Layer' in v && 'Exp' in v) return v;
  if (typeof v === 'number') return EN.fromNumber(v);
  if (typeof v === 'string') return EN.fromString(v);
  return { ...ZERO };
};

EN.toNumber = function(v) {
  v = EN.convert(v);
  if (EN.IsNaN(v)) return NaN;
  if (EN.IsInf(v)) return v.Sign < 0 ? -Infinity : Infinity;
  if (EN.IsZero(v)) return 0;
  if (v.Layer === 0) return v.Sign * v.Exp;
  if (v.Layer === 1) return v.Sign * Math.pow(10, v.Exp);
  return v.Sign * Infinity;
};

EN.toString = function(v) {
  v = EN.convert(v);
  return v.Layer + ';' + (v.Sign * v.Exp);
};

EN.toScientific = function(v, digits) {
  v = EN.convert(v);
  digits = digits === undefined ? 3 : digits;
  if (EN.IsNaN(v)) return 'NaN';
  if (EN.IsInf(v)) return v.Sign < 0 ? '-Infinity' : 'Infinity';
  if (EN.IsZero(v)) return '0e0';
  if (v.Layer >= 2) return EN.toLayerNotation(v, digits);

  let mantissa, exponent;
  if (v.Layer === 0) {
    if (v.Exp === 0) return '0e0';
    exponent = Math.floor(Math.log10(v.Exp));
    mantissa = v.Sign * (v.Exp / Math.pow(10, exponent));
  } else {
    exponent = Math.floor(v.Exp);
    mantissa = v.Sign * Math.pow(10, v.Exp - exponent);
  }

  return mantissa.toFixed(digits) + 'e' + exponent;
};

// ─── Comparison ──────────────────────────────────────────────────────────────
EN.cmp = function(a, b) {
  a = EN.convert(a); b = EN.convert(b);
  if (a.Sign !== b.Sign) return a.Sign > b.Sign ? 1 : -1;
  if (a.Sign === 0) return 0;
  if (a.Layer !== b.Layer) {
    const flip = a.Sign < 0 ? -1 : 1;
    return a.Layer > b.Layer ? flip : -flip;
  }
  if (a.Exp !== b.Exp) {
    const flip = a.Sign < 0 ? -1 : 1;
    return a.Exp > b.Exp ? flip : -flip;
  }
  return 0;
};
EN.eq   = (a, b) => EN.cmp(a, b) === 0;
EN.le   = (a, b) => EN.cmp(a, b) < 0;
EN.me   = (a, b) => EN.cmp(a, b) > 0;
EN.gt   = (a, b) => EN.cmp(a, b) > 0;
EN.lt   = (a, b) => EN.cmp(a, b) < 0;
EN.leeq = (a, b) => EN.cmp(a, b) <= 0;
EN.lte  = (a, b) => EN.cmp(a, b) <= 0;
EN.meeq = (a, b) => EN.cmp(a, b) >= 0;
EN.gte  = (a, b) => EN.cmp(a, b) >= 0;
EN.between = (v, x, y) => EN.meeq(v, x) && EN.leeq(v, y);

EN.abs  = v => { v = EN.convert(v); return Cnew(Math.abs(v.Sign), v.Layer, v.Exp); };
EN.neg  = v => { v = EN.convert(v); return Cnew(-v.Sign, v.Layer, v.Exp); };
EN.recip = function(v) {
  v = EN.convert(v);
  if (EN.IsZero(v)) return { ...Inf_EN };
  if (v.Layer === 0) return EN.correct(Cnew(v.Sign, 0, 1 / v.Exp));
  if (v.Layer === 1) return EN.correct(Cnew(v.Sign, 1, -v.Exp));
  return EN.correct(Cnew(v.Sign, v.Layer, -v.Exp));
};

// ─── Arithmetic ──────────────────────────────────────────────────────────────
EN.add = function(a, b) {
  a = EN.convert(a); b = EN.convert(b);
  if (EN.IsNaN(a) || EN.IsNaN(b)) return { ...NaN_EN };
  if (EN.IsZero(a)) return b;
  if (EN.IsZero(b)) return a;

  if (a.Layer === 0 && b.Layer === 0) {
    const val = a.Sign * a.Exp + b.Sign * b.Exp;
    if (val === 0) return { ...ZERO };
    return EN.correct(Cnew(val < 0 ? -1 : 1, 0, Math.abs(val)));
  }

  const cmp = EN.cmp(EN.abs(a), EN.abs(b));
  const big = cmp >= 0 ? a : b;
  const small = cmp >= 0 ? b : a;

  if (big.Layer >= 2) {
    if (big.Layer - small.Layer >= 2) return big;
    return big;
  }

  if (big.Layer === 1) {
    const diff = big.Exp - small.Exp;
    if (diff > 15) return big;
    const valA = a.Sign * (a.Layer === 1 ? Math.pow(10, a.Exp) : a.Exp);
    const valB = b.Sign * (b.Layer === 1 ? Math.pow(10, b.Exp) : b.Exp);
    const res = valA + valB;
    if (res === 0) return { ...ZERO };
    const resSign = res < 0 ? -1 : 1;
    const resAbs = Math.abs(res);
    if (resAbs < EXPL) return EN.correct(Cnew(resSign, 0, resAbs));
    return EN.correct(Cnew(resSign, 1, Math.log10(resAbs)));
  }

  return big;
};

EN.sub = (a, b) => EN.add(a, EN.neg(b));

EN.mul = function(a, b) {
  a = EN.convert(a); b = EN.convert(b);
  if (EN.IsNaN(a) || EN.IsNaN(b)) return { ...NaN_EN };
  if (EN.IsZero(a) || EN.IsZero(b)) return { ...ZERO };
  const sign = a.Sign * b.Sign;
  if (a.Layer === 0 && b.Layer === 0) return EN.correct(Cnew(sign, 0, a.Exp * b.Exp));
  if (a.Layer === 1 && b.Layer === 0) return EN.correct(Cnew(sign, 1, a.Exp + Math.log10(b.Exp)));
  if (a.Layer === 0 && b.Layer === 1) return EN.correct(Cnew(sign, 1, b.Exp + Math.log10(a.Exp)));
  if (a.Layer === 1 && b.Layer === 1) return EN.correct(Cnew(sign, 1, a.Exp + b.Exp));

  const maxLayer = Math.max(a.Layer, b.Layer);
  return EN.correct(Cnew(sign, maxLayer, a.Layer === maxLayer ? a.Exp + Math.log10(Math.max(b.Exp, 1e-300)) : b.Exp + Math.log10(Math.max(a.Exp, 1e-300))));
};

EN.div = (a, b) => EN.mul(a, EN.recip(b));

EN.pow = function(a, b) {
  a = EN.convert(a); b = EN.convert(b);
  if (EN.IsNaN(a) || EN.IsNaN(b)) return { ...NaN_EN };
  if (EN.IsZero(b)) return { ...ONE };
  if (EN.IsZero(a)) return { ...ZERO };
  if (EN.eq(b, ONE)) return a;

  const bNum = EN.toNumber(b);

  if (a.Layer === 0 && isFinite(bNum) && Math.abs(bNum) < 1e6) {
    const val = Math.pow(a.Exp, bNum);
    if (isFinite(val) && val > 0) {
      const sign = a.Sign < 0 ? (Math.round(bNum) % 2 !== 0 ? -1 : 1) : 1;
      return EN.correct(Cnew(sign, 0, val));
    }
  }

  const absA = EN.abs(a);
  const logA = EN.log10(absA);
  const logRes = EN.mul(b, logA);
  const res = EN.pow10(logRes);

  if (a.Sign < 0 && isFinite(bNum)) {
    const isOdd = Math.round(bNum) % 2 !== 0;
    return Cnew(isOdd ? -1 : 1, res.Layer, res.Exp);
  }

  return res;
};

EN.log10 = function(v) {
  v = EN.convert(v);
  if (EN.IsZero(v) || v.Sign <= 0) return { ...NaN_EN };
  if (v.Layer === 0) return EN.fromNumber(Math.log10(v.Exp));
  if (v.Layer === 1) return EN.fromNumber(v.Exp);
  return EN.correct(Cnew(1, v.Layer - 1, v.Exp));
};

EN.log = function(v, base) {
  v = EN.convert(v);
  if (base === undefined) return EN.mul(EN.log10(v), EN.fromNumber(Math.LOG10E));
  return EN.div(EN.log10(v), EN.log10(EN.convert(base)));
};

EN.exp = function(v) {
  v = EN.convert(v);
  const vNum = EN.toNumber(v);
  if (isFinite(vNum)) return EN.fromNumber(Math.exp(vNum));
  return EN.correct(Cnew(1, 1, vNum / Math.LN10));
};

EN.pow10 = function(v) {
  v = EN.convert(v);
  if (v.Layer === 0) return EN.correct(Cnew(1, 1, v.Exp));
  return EN.correct(Cnew(1, v.Layer + 1, v.Exp));
};

EN.sqrt = function(v) {
  return EN.pow(v, EN.fromNumber(0.5));
};

EN.root = (v, r) => EN.pow(v, EN.recip(EN.convert(r)));

EN.max = (a, b) => EN.me(a, b) ? EN.convert(a) : EN.convert(b);
EN.min = (a, b) => EN.le(a, b) ? EN.convert(a) : EN.convert(b);

EN.floor = function(v) {
  v = EN.convert(v);
  if (v.Layer > 0) return v;
  return EN.fromNumber(Math.floor(v.Sign * v.Exp));
};

// ─── Display ─────────────────────────────────────────────────────────────────
const SUFFIX_ONES  = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
const SUFFIX_TENS  = ['', 'Dc', 'Vg', 'Tg', 'Qag', 'Qig', 'Sxg', 'Spg', 'Ocg', 'Nog'];
const SUFFIX_HUNDS = ['', 'Ce', 'De', 'Te', 'Qae', 'Qie', 'Sxe', 'Spe', 'Oce', 'Noe'];

const FIRST_ONES  = ['', 'U', 'D', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
const SECOND_ONES = ['', 'De', 'Vg', 'Tg', 'Qag', 'Qig', 'Sxg', 'Spg', 'Ocg', 'Nog'];
const THIRD_ONES  = ['', 'Ce', 'Dce', 'Tce', 'Qace', 'Qice', 'Sxce', 'Spce', 'Occe', 'Noce'];
const MULT_ONES   = ['', 'Mi', 'Bi', 'Tri', 'Quad', 'Quint', 'Hex', 'Hep', 'Oct', 'Non'];

function CutDigits(n, digits) {
  if (typeof n !== 'number') return String(n);
  let s = n.toFixed(digits);
  // Strip trailing zeros if decimal point exists
  if (s.indexOf('.') !== -1) {
    s = s.replace(/0+$/, '').replace(/\.$/, '');
  }
  return s;
}

EN.CutDigits = CutDigits;

EN.toSuffix = function(v, digits) {
  v = EN.convert(v);
  digits = digits === undefined ? DEFAULT_DIGITS : digits;

  if (EN.IsNaN(v)) return 'NaN';
  if (EN.IsInf(v) || !isFinite(v.Exp)) return v.Sign < 0 ? '-Infinity' : 'Infinity';
  if (EN.IsZero(v)) return '0';
  if (v.Sign < 0) return '-' + EN.toSuffix(EN.abs(v), digits);
  if (v.Layer >= 2) return EN.toLayerNotation(v, digits);

  let Mantissa, Exponent;
  if (v.Layer === 0) {
    Mantissa = v.Exp;
    Exponent = 0;
    if (Mantissa >= 1) {
      Exponent = Math.floor(Math.log10(Mantissa));
      Mantissa = Mantissa / Math.pow(10, Exponent);
    }
  } else {
    Exponent = Math.floor(v.Exp);
    Mantissa = Math.pow(10, v.Exp - Exponent);
  }

  if (!isFinite(Exponent) || !isFinite(Mantissa)) return 'Infinity';

  if (Exponent < 3) return CutDigits(v.Sign * v.Exp, digits);
  if (Exponent < 33) {
    const grp = Math.floor(Exponent / 3) - 1;
    const mod = Exponent % 3;
    const suf = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No'];
    return CutDigits(Mantissa * Math.pow(10, mod), digits) + (suf[grp] || '?');
  }

  const Modulus3 = Exponent % 3;
  let OutString = '';

  function SuffixPartOne(n) {
    n = Math.floor(n);
    const Hundreds = Math.floor(n / 100);
    n = n % 100;
    const Tens = Math.floor(n / 10);
    const Ones = n % 10;
    OutString = FIRST_ONES[Ones] + SECOND_ONES[Tens] + THIRD_ONES[Hundreds] + OutString;
  }

  function SuffixPartTwo(n) {
    if (n > 0) n += 1;
    if (n > 1000) n = n % 1000;
    SuffixPartOne(n);
  }

  if (Exponent < 1000) {
    SuffixPartOne(Math.floor(Exponent / 3));
    return CutDigits(Mantissa * Math.pow(10, Modulus3), digits) + OutString;
  }

  const logE = Math.floor(Math.log10(Exponent) / 3);
  if (!isFinite(logE) || logE < 0) {
    return CutDigits(Mantissa * Math.pow(10, Modulus3), digits) + OutString;
  }

  for (let i = logE; i >= 0; i--) {
    if (Exponent >= Math.pow(10, i * 3)) {
      SuffixPartTwo(Math.floor(Exponent / Math.pow(10, i * 3)) - 1);
      OutString = OutString + (MULT_ONES[i] || 'X' + i);
      Exponent = Exponent % Math.pow(10, i * 3);
    }
  }

  return CutDigits(Mantissa * Math.pow(10, Modulus3), digits) + OutString;
};

EN.toLayerNotation = function(v, digits) {
  v = EN.convert(v);
  digits = digits === undefined ? DEFAULT_DIGITS : digits;

  if (EN.IsNaN(v)) return 'NaN';
  if (EN.IsInf(v)) return v.Sign < 0 ? '-Infinity' : 'Infinity';
  if (EN.IsZero(v) || v.Sign === 0) return '0';

  if (v.Sign < 0) return '-' + EN.toLayerNotation(EN.abs(v), digits);

  if (EN.gt(v, ZERO) && EN.lt(v, ONE)) {
    return '1 / ' + EN.short(EN.div(ONE, v), digits);
  }

  if (v.Exp < 0) return 'E(' + v.Layer + '-)' + CutDigits(Math.abs(v.Exp), digits);
  return 'E(' + v.Layer + ')' + CutDigits(v.Exp, digits);
};

EN.short = function(v, digits) {
  v = EN.convert(v);
  if (!SuffixLimit) SuffixLimit = EN.fromString('9e1E14');
  if (EN.leeq(v, SuffixLimit)) return EN.toSuffix(v, digits);
  return EN.toLayerNotation(v, digits);
};

SuffixLimit = EN.fromString('9e999');

// ─── Formatting helpers ──────────────────────────────────────────────────────
EN.fmt = v => EN.short(EN.convert(v));
EN.fmtFull = v => EN.toSuffix(EN.convert(v), 3);

// Global Exports for Browser & Node environment
if (typeof window !== 'undefined') {
  window.EN = EN;
  window.ENfmt = EN.fmt;
  window.EternityNum = EN;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EN;
}
