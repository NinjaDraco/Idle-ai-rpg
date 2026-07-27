/**
 * EternityNum.js
 * JavaScript port of EternityNum.luau by @FoundForces
 * Handles numbers up to 10^2^1024 (Arrow notation)
 * Ported: Sign/Layer/Exp structure preserved exactly.
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

const ZERO = Cnew(0, 0, 0);
const ONE  = Cnew(1, 0, 1);
const NaN_EN = Cnew(1, -1, 1);
const Inf_EN = Cnew(1, Infinity, 1);

let SuffixLimit; // set after EN.fromString is defined

// ─── Checks ──────────────────────────────────────────────────────────────────
EN.IsNaN  = v => v.Sign === NaN_EN.Sign && v.Layer === NaN_EN.Layer && v.Exp === NaN_EN.Exp;
EN.IsInf  = v => v.Layer === Infinity || v.Exp === Infinity;
EN.IsZero = v => v.Sign === 0 || (v.Exp === 0 && v.Layer === 0);

// ─── Correct ─────────────────────────────────────────────────────────────────
EN.correct = function(e) {
  if (EN.IsNaN(e))  return NaN_EN;
  if (EN.IsInf(e))  return Inf_EN;
  if (EN.IsZero(e)) return { ...ZERO };
  let { Sign, Layer, Exp } = e;
  if (Layer === 0 && Exp < 0) { Exp = -Exp; Sign = -Sign; }
  if (Layer >= 1 && Exp < 0) { Layer -= 1; Exp = Math.pow(10, Exp); return EN.correct(Cnew(Sign, Layer, Exp)); }
  if (Layer >= 1 && Exp > 0 && Exp < LDOWN) { Layer -= 1; Exp = Math.pow(10, Exp); return EN.correct(Cnew(Sign, Layer, Exp)); }
  if (Layer >= 1 && Exp >= LDOWN) {
    if (Layer >= 2 && Exp > EXPL) { Layer += 1; Exp = Math.log10(Exp); return EN.correct(Cnew(Sign, Layer, Exp)); }
  }
  if (Layer === 0 && Exp >= EXPL) { Layer += 1; Exp = Math.log10(Exp); return EN.correct(Cnew(Sign, Layer, Exp)); }
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
  const exp = Math.log10(n);
  return EN.correct(Cnew(sign, 0, n));
};

EN.fromString = function(s) {
  s = s.trim();
  if (s === 'NaN' || s === 'nan') return { ...NaN_EN };
  if (s === 'Inf' || s === 'inf' || s === 'Infinity') return { ...Inf_EN };
  // "X;Y" default format
  const semi = s.split(';');
  if (semi.length === 2) {
    const layer = parseInt(semi[0]);
    const exp   = parseFloat(semi[1]);
    return EN.correct(Cnew(exp < 0 ? -1 : 1, layer, Math.abs(exp)));
  }
  // Scientific "XeY"
  const eParts = s.toLowerCase().split('e');
  if (eParts.length === 2) {
    const m = parseFloat(eParts[0]);
    const ex = parseFloat(eParts[1]);
    if (!isNaN(m) && !isNaN(ex)) return EN.correct(Cnew(m < 0 ? -1 : 1, 0, Math.abs(m) * Math.pow(10, ex > 300 ? 300 : ex)));
  }
  const n = parseFloat(s);
  if (!isNaN(n)) return EN.fromNumber(n);
  return { ...NaN_EN };
};

EN.convert = function(v) {
  if (v === null || v === undefined) return { ...ZERO };
  if (typeof v === 'object' && 'Sign' in v) return v;
  if (typeof v === 'number') return EN.fromNumber(v);
  if (typeof v === 'string') return EN.fromString(v);
  return { ...ZERO };
};

EN.toNumber = function(v) {
  v = EN.convert(v);
  if (EN.IsNaN(v)) return NaN;
  if (EN.IsInf(v)) return Infinity;
  if (EN.IsZero(v)) return 0;
  if (v.Layer === 0) return v.Sign * v.Exp;
  if (v.Layer === 1) return v.Sign * Math.pow(10, v.Exp);
  return v.Sign * Infinity;
};

EN.toString = function(v) {
  v = EN.convert(v);
  return v.Layer + ';' + (v.Sign * v.Exp);
};

EN.toScientific = function(v) {
  v = EN.convert(v);
  if (EN.IsZero(v)) return '0e0';
  const m = v.Sign * Math.pow(10, v.Exp - Math.floor(v.Exp));
  return m.toFixed(3) + 'e' + Math.floor(v.Exp);
};

// ─── Comparison ──────────────────────────────────────────────────────────────
EN.cmp = function(a, b) {
  a = EN.convert(a); b = EN.convert(b);
  if (a.Sign !== b.Sign) return a.Sign > b.Sign ? 1 : -1;
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
EN.leeq = (a, b) => EN.cmp(a, b) <= 0;
EN.meeq = (a, b) => EN.cmp(a, b) >= 0;
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
    return EN.correct(Cnew(1, 0, a.Sign * a.Exp + b.Sign * b.Exp));
  }
  // For large numbers, larger dominates
  const cmp = EN.cmp(EN.abs(a), EN.abs(b));
  const big = cmp >= 0 ? a : b;
  const small = cmp >= 0 ? b : a;
  if (big.Layer >= 2) return big;
  if (big.Layer === 1) {
    const diff = big.Exp - small.Exp;
    if (diff > 15) return big;
    const bv = big.Sign * Math.pow(10, big.Exp - Math.floor(big.Exp)) * Math.pow(10, Math.floor(big.Exp) % 1);
    const sv = small.Layer === 0
      ? small.Sign * Math.log10(Math.max(small.Exp, 1e-300))
      : small.Sign * small.Exp;
    const res = big.Sign * Math.pow(10, big.Exp) + (small.Layer === 1 ? small.Sign * Math.pow(10, small.Exp) : small.Sign * small.Exp);
    if (res <= 0) return { ...ZERO };
    return EN.correct(Cnew(1, 1, Math.log10(res)));
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
  // higher layers: add exponents in log space
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
  if (a.Layer === 0) {
    if (isFinite(bNum)) {
      const logRes = Math.log10(a.Exp) * bNum;
      if (logRes >= LDOWN) return EN.correct(Cnew(a.Sign > 0 ? 1 : (bNum % 2 === 0 ? 1 : -1), 1, logRes));
      return EN.correct(Cnew(a.Sign > 0 ? 1 : (bNum % 2 === 0 ? 1 : -1), 0, Math.pow(a.Exp, bNum)));
    }
    return EN.correct(Cnew(1, 1, Math.log10(a.Exp) * bNum));
  }
  if (a.Layer === 1) return EN.correct(Cnew(1, 1, a.Exp * bNum));
  return EN.correct(Cnew(1, a.Layer, a.Exp * bNum));
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

// Full suffix strings for groups of 3 digits
const FIRST_ONES  = ['', 'U', 'D', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
const SECOND_ONES = ['', 'De', 'Vg', 'Tg', 'Qag', 'Qig', 'Sxg', 'Spg', 'Ocg', 'Nog'];
const THIRD_ONES  = ['', 'Ce', 'Dce', 'Tce', 'Qace', 'Qice', 'Sxce', 'Spce', 'Occe', 'Noce'];
const MULT_ONES   = ['', 'Mi', 'Bi', 'Tri', 'Quad', 'Quint', 'Hex', 'Hep', 'Oct', 'Non'];

function CutDigits(n, digits) {
  if (digits < 0) return n.toString();
  if (!isFinite(n)) return n.toString();
  return parseFloat(n.toFixed(digits)).toString();
}

EN.toSuffix = function(v, digits) {
  v = EN.convert(v);
  digits = digits === undefined ? DEFAULT_DIGITS : digits;
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
  if (EN.between(v, ZERO, ONE)) return '1 / ' + EN.short(EN.div(ONE, v));
  if (v.Sign === 1) {
    if (v.Exp < 0) return 'E(' + v.Layer + '-)' + CutDigits(Math.abs(v.Exp), digits);
    return 'E(' + v.Layer + ')' + CutDigits(v.Exp, digits);
  }
  if (v.Sign === 0) return 'E(0)0';
  return EN.toLayerNotation(EN.abs(v), digits);
};

EN.short = function(v, digits) {
  v = EN.convert(v);
  if (!SuffixLimit) SuffixLimit = EN.fromString('9e1E14');
  if (EN.leeq(v, SuffixLimit)) return EN.toSuffix(v, digits);
  return EN.toLayerNotation(v, digits);
};

// Initialize SuffixLimit
SuffixLimit = EN.fromString('9e999');

// ─── Formatting helpers used by the game ─────────────────────────────────────
EN.fmt = v => EN.short(EN.convert(v));
EN.fmtFull = v => EN.toSuffix(EN.convert(v), 3);

// Expose globally
window.EN = EN;
window.ENfmt = EN.fmt;
