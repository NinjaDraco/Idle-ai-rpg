/**
 * verify_m6_engine.js
 * Verification script for Worker M6 engine requirements.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock browser environment
const localStorageMap = new Map();
const mockLocalStorage = {
  getItem: key => localStorageMap.get(key) || null,
  setItem: (key, val) => localStorageMap.set(key, String(val)),
  removeItem: key => localStorageMap.delete(key),
  clear: () => localStorageMap.clear()
};

const mockWindow = {
  localStorage: mockLocalStorage,
  addEventListener: () => {},
  removeEventListener: () => {}
};

const sandbox = {
  console,
  Math,
  Date,
  Number,
  String,
  Boolean,
  Array,
  Object,
  Map,
  Set,
  RegExp,
  Error,
  setInterval: () => {},
  clearInterval: () => {},
  setTimeout: () => {},
  clearTimeout: () => {},
  window: mockWindow,
  localStorage: mockLocalStorage
};

vm.createContext(sandbox);

// 1. Load eternitynum_v3.js
const enCode = fs.readFileSync(path.join(__dirname, 'js/eternitynum_v3.js'), 'utf8');
vm.runInContext(enCode, sandbox);
const EN = vm.runInContext('EN', sandbox);

// 2. Load data_v3.js
const dataCode = fs.readFileSync(path.join(__dirname, 'js/data_v3.js'), 'utf8');
vm.runInContext(dataCode, sandbox);
vm.runInContext('var GAME_DATA = window.GAME_DATA;', sandbox);
const GAME_DATA = sandbox.window.GAME_DATA;

// 3. Load game_v3.js
const gameCode = fs.readFileSync(path.join(__dirname, 'js/game_v3.js'), 'utf8');
vm.runInContext(gameCode, sandbox);
const G = vm.runInContext('G', sandbox);

// Initialize game state
vm.runInContext('initGame()', sandbox);

console.log('🧪 Starting Worker M6 Verification Tests...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 1: 100x Gacha Affordability Check & EN comparison fix
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Feature 1: 100x Gacha Affordability Check & EN Fix ---');

runTest('EN.le & EN.lte comparison fix (equal values return true)', () => {
  const a = EN.fromNumber(100);
  const b = EN.fromNumber(100);
  assert.strictEqual(EN.le(a, b), true, 'EN.le(100, 100) should be true');
  assert.strictEqual(EN.lte(a, b), true, 'EN.lte(100, 100) should be true');
  assert.strictEqual(EN.lt(a, b), false, 'EN.lt(100, 100) should be false');
});

runTest('getSummonCost(100) applies 15 free pulls discount (pulls = 85)', () => {
  const cost1 = G.getSummonCost(1);
  const cost100 = G.getSummonCost(100);
  // cost100 should equal cost1 * 85
  const expectedCost = EN.mul(cost1, EN.fromNumber(85));
  assert.strictEqual(EN.eq(cost100, expectedCost), true, 'Summon cost for 100 should be 85x base pull cost');
});

runTest('summon executes cleanly when gold == cost', () => {
  const cost100 = G.getSummonCost(100);
  G.save.gold = cost100;
  const results = G.summon('pet', 100);
  assert.strictEqual(results.length, 100, 'Should return 100 gacha results when gold == cost');
  assert.strictEqual(EN.eq(G.save.gold, EN.fromNumber(0)), true, 'Gold should be cleanly spent');
});

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 2: Infinite Star Ascension System & StarBonus Formula
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Feature 2: Infinite Star Ascension System & StarBonus ---');

runTest('getStarBonus formula Math.pow(safeNum(starCount), 0.75) * 0.25', () => {
  assert.strictEqual(G.getStarBonus(0), 0, 'StarBonus(0) should be 0');
  assert.strictEqual(G.getStarBonus(1), 0.25, 'StarBonus(1) should be 0.25');
  assert.strictEqual(G.getStarBonus(16), Math.pow(16, 0.75) * 0.25, 'StarBonus(16) should match formula');
});

runTest('addPet uncapped starCount ascension (> 6 stars)', () => {
  G.save.petCollection = [];
  G.addPet('ember_fox'); // initial: starCount = 0
  for (let i = 0; i < 10; i++) {
    G.addPet('ember_fox');
  }
  const pet = G.save.petCollection.find(p => p.petId === 'ember_fox');
  assert.ok(pet, 'Pet should exist');
  assert.strictEqual(pet.starCount, 10, 'starCount should be 10 (uncapped)');
  assert.strictEqual(pet.constellation, 10, 'constellation should mirror starCount');
});

runTest('addSkill uncapped starCount ascension (> 6 stars)', () => {
  G.save.skillCollection = [];
  G.addSkill('blade_storm', 'active'); // initial: starCount = 0
  for (let i = 0; i < 12; i++) {
    G.addSkill('blade_storm', 'active');
  }
  const skill = G.save.skillCollection.find(s => s.skillId === 'blade_storm');
  assert.ok(skill, 'Skill should exist');
  assert.strictEqual(skill.starCount, 12, 'starCount should be 12 (uncapped)');
  assert.strictEqual(skill.constellation, 12, 'constellation should mirror starCount');
});

runTest('Equipment duplicate stack handling in inventory/equipped', () => {
  G.save.inventory = [];
  G.save.equipped = { weapon: null, offhand: null, helmet: null, chest: null, gloves: null, boots: null, ring: null, amulet: null };

  const item1 = G.generateItem('weapon', 'rare');
  item1.baseId = 'iron_sword';
  G.save.inventory.push(item1);

  // Acquire duplicate item with same slotId, baseId, rarity
  const dupItem = { ...G.generateItem('weapon', 'rare'), baseId: 'iron_sword', rarity: 'rare', slotId: 'weapon' };
  const res = G.processGearAcquisition(dupItem);

  assert.strictEqual(res.action, 'duplicate', 'Should detect gear duplicate');
  assert.strictEqual(item1.starCount, 1, 'Existing item starCount should increment to 1');
  assert.strictEqual(G.save.inventory.length, 1, 'Duplicate should not be added to inventory');
});

runTest('Stat integration applies getStarBonus scalar in computeStats', () => {
  G.save.equipped.weapon = {
    uid: 'w1', slotId: 'weapon', baseId: 'sword', rarity: 'rare',
    affixes: [{ id: 'atk_mult', stat: 'dmgMult', tierVal: 0.50 }],
    starCount: 16 // getStarBonus(16) = Math.pow(16, 0.75)*0.25 = 8 * 0.25 = 2.0 -> scalar = 1 + 2.0 = 3.0
  };

  const cs = G.computeStats();
  // Base lvl 1 dmgMult is 1.0. Affix tierVal 0.50 * 3.0 = 1.50. Total dmgMult should include 1.50
  assert.ok(cs.dmgMult >= 2.50, `dmgMult should reflect star bonus (actual: ${cs.dmgMult})`);
});

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3: Smart Auto-Dismantle by Equipped Rarity
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Feature 3: Smart Auto-Dismantle by Equipped Rarity ---');

runTest('default setting autoDismantleLowerThanEquipped is false', () => {
  assert.strictEqual(G.save.autoDismantleLowerThanEquipped, false, 'Default autoDismantleLowerThanEquipped should be false');
});

runTest('autoDismantleLowerThanEquipped dismantles lower rarity gear', () => {
  G.save.inventory = [];
  G.save.autoSell = { common: false, uncommon: false };
  G.save.autoDismantleLowerThanEquipped = true;
  G.save.materials.chaosShards = 0;

  // Equip rare item (index 2) in helmet slot
  G.save.equipped.helmet = G.generateItem('helmet', 'rare');

  // Drop an uncommon item (index 1) in helmet slot
  const itemUncommon = G.generateItem('helmet', 'uncommon');
  const res = G.processGearAcquisition(itemUncommon);

  assert.strictEqual(res.action, 'dismantled', 'Lower rarity item should be dismantled');
  assert.strictEqual(G.save.inventory.length, 0, 'Dismantled item should not be added to inventory');
  assert.ok(G.save.materials.chaosShards > 0, 'Should gain Chaos Shards from disenchanting');
});

runTest('autoDismantleLowerThanEquipped keeps higher or equal rarity gear', () => {
  G.save.inventory = [];
  G.save.autoDismantleLowerThanEquipped = true;

  // Equip rare item (index 2) in helmet slot
  G.save.equipped.helmet = G.generateItem('helmet', 'rare');

  // Drop an epic item (index 3) in helmet slot
  const itemEpic = G.generateItem('helmet', 'epic');
  const res = G.processGearAcquisition(itemEpic);

  assert.strictEqual(res.action, 'added', 'Higher rarity item should be kept and added/equipped');
});

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 4: One-Click Best Pet & Best Skill Auto-Equippers
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Feature 4: One-Click Best Pet & Best Skill Auto-Equippers ---');

runTest('equipBestPets sorts by RARITY_INDEX -> starCount -> level', () => {
  G.save.petSlots = 3;
  G.save.petCollection = [
    { petId: 'ember_fox', level: 10, starCount: 1, constellation: 1 },       // common
    { petId: 'crystal_wolf', level: 1, starCount: 5, constellation: 5 },     // uncommon
    { petId: 'arcane_owl', level: 5, starCount: 2, constellation: 2 },       // rare
    { petId: 'void_phoenix', level: 20, starCount: 10, constellation: 10 },  // legendary
  ];

  G.equipBestPets();

  // Top 3 should be: void_phoenix (legendary), arcane_owl (rare), crystal_wolf (uncommon)
  assert.strictEqual(G.save.activePets[0], 'void_phoenix', 'Slot 0 should be void_phoenix');
  assert.strictEqual(G.save.activePets[1], 'arcane_owl', 'Slot 1 should be arcane_owl');
  assert.strictEqual(G.save.activePets[2], 'crystal_wolf', 'Slot 2 should be crystal_wolf');
});

runTest('equipBestSkills populates top active & passive skills', () => {
  G.save.skillCollection = [
    // Actives
    { skillId: 'blade_storm', type: 'active', level: 5, starCount: 1 },      // common
    { skillId: 'fire_bomb', type: 'active', level: 1, starCount: 2 },        // uncommon
    { skillId: 'mana_burst', type: 'active', level: 2, starCount: 0 },       // rare
    { skillId: 'void_rift', type: 'active', level: 1, starCount: 0 },        // epic
    { skillId: 'starfall', type: 'active', level: 10, starCount: 5 },        // legendary

    // Passives
    { skillId: 'iron_skin', type: 'passive', level: 1, starCount: 0 },       // common
    { skillId: 'sharp_eyes', type: 'passive', level: 5, starCount: 1 },      // common
    { skillId: 'quick_hands', type: 'passive', level: 2, starCount: 0 },     // uncommon
    { skillId: 'crit_mastery', type: 'passive', level: 10, starCount: 3 },   // rare
  ];

  G.equipBestSkills();

  // Top 4 active skills should be: starfall (legendary), void_rift (epic), mana_burst (rare), fire_bomb (uncommon)
  assert.strictEqual(G.save.activeSkills[0], 'starfall', 'Active 0 should be starfall');
  assert.strictEqual(G.save.activeSkills[1], 'void_rift', 'Active 1 should be void_rift');
  assert.strictEqual(G.save.activeSkills[2], 'mana_burst', 'Active 2 should be mana_burst');
  assert.strictEqual(G.save.activeSkills[3], 'fire_bomb', 'Active 3 should be fire_bomb');

  // Top passive skills should start with crit_mastery (rare), quick_hands (uncommon), sharp_eyes (common star 1), iron_skin (common star 0)
  assert.strictEqual(G.save.passiveSkills[0], 'crit_mastery', 'Passive 0 should be crit_mastery');
  assert.strictEqual(G.save.passiveSkills[1], 'quick_hands', 'Passive 1 should be quick_hands');
  assert.strictEqual(G.save.passiveSkills[2], 'sharp_eyes', 'Passive 2 should be sharp_eyes');
  assert.strictEqual(G.save.passiveSkills[3], 'iron_skin', 'Passive 3 should be iron_skin');
});

runTest('G exposes equipBestPets and equipBestSkills', () => {
  assert.strictEqual(typeof G.equipBestPets, 'function', 'G.equipBestPets should be a function');
  assert.strictEqual(typeof G.equipBestSkills, 'function', 'G.equipBestSkills should be a function');
  assert.strictEqual(typeof G.getStarBonus, 'function', 'G.getStarBonus should be a function');
});

// Summary
console.log(`\n═════════════════════════════════════════════════════════════`);
console.log(`RESULTS: ${passedTests}/${totalTests} tests passed.`);
console.log(`═════════════════════════════════════════════════════════════`);

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
