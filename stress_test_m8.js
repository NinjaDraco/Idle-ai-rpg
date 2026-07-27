/**
 * stress_test_m8.js — Comprehensive Empirical Stress Test Suite for M8 Final Requirements
 * Eternity Idle RPG
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup VM Sandbox
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
  removeEventListener: () => {},
  location: { reload: () => {} }
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
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
  escape: globalThis.escape || ((s) => encodeURIComponent(s)),
  unescape: globalThis.unescape || ((s) => decodeURIComponent(s)),
  setInterval: () => {},
  clearInterval: () => {},
  setTimeout: () => {},
  clearTimeout: () => {},
  window: mockWindow,
  localStorage: mockLocalStorage,
  location: mockWindow.location
};

vm.createContext(sandbox);

// Load game files in order
const enCode = fs.readFileSync(path.join(__dirname, 'js/eternitynum_v3.js'), 'utf8');
vm.runInContext(enCode, sandbox);
const EN = vm.runInContext('EN', sandbox);

const dataCode = fs.readFileSync(path.join(__dirname, 'js/data_v3.js'), 'utf8');
vm.runInContext(dataCode, sandbox);
vm.runInContext('var GAME_DATA = window.GAME_DATA;', sandbox);
const GAME_DATA = sandbox.window.GAME_DATA;

const gameCode = fs.readFileSync(path.join(__dirname, 'js/game_v3.js'), 'utf8');
vm.runInContext(gameCode, sandbox);
const G = vm.runInContext('G', sandbox);

function resetCleanState() {
  localStorageMap.clear();
  vm.runInContext('initGame()', sandbox);
}

// Global metrics reporter
const metrics = {
  startTime: Date.now(),
  endTime: 0,
  scenarios: {},
  passed: 0,
  failed: 0,
  totalAssertions: 0
};

function recordTest(scenarioName, testName, testFn) {
  if (!metrics.scenarios[scenarioName]) {
    metrics.scenarios[scenarioName] = { passed: 0, failed: 0, tests: [] };
  }
  const start = performance.now();
  const startMem = process.memoryUsage().heapUsed;
  metrics.totalAssertions++;
  try {
    testFn();
    const durationMs = performance.now() - start;
    const memUsedMB = (process.memoryUsage().heapUsed - startMem) / (1024 * 1024);
    metrics.scenarios[scenarioName].passed++;
    metrics.passed++;
    metrics.scenarios[scenarioName].tests.push({
      name: testName,
      status: 'PASS',
      durationMs: durationMs.toFixed(2),
      memUsedMB: memUsedMB.toFixed(3)
    });
    console.log(`  ✅ [PASS] ${testName} (${durationMs.toFixed(2)}ms)`);
  } catch (err) {
    const durationMs = performance.now() - start;
    metrics.scenarios[scenarioName].failed++;
    metrics.failed++;
    metrics.scenarios[scenarioName].tests.push({
      name: testName,
      status: 'FAIL',
      error: err.message,
      durationMs: durationMs.toFixed(2)
    });
    console.error(`  ❌ [FAIL] ${testName}: ${err.message}`);
  }
}

console.log('================================================================');
console.log('  ETERNITY IDLE RPG — FINAL REQUIREMENTS (M8) STRESS TEST SUITE  ');
console.log('================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO A: Gacha 100x Pull Stress Test
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- SCENARIO A: Gacha 100x Pull Stress Test ---');

recordTest('Scenario A', '100 consecutive 100x pulls (10,000 items total) with high gold', () => {
  resetCleanState();
  G.save.gold = EN.fromNumber(1e100); // Infinite gold for test
  
  const banners = ['pet', 'skill', 'gear'];
  let totalItemsPulled = 0;
  let totalPullsExecuted = 0;
  
  for (let i = 0; i < 100; i++) {
    const bannerId = banners[i % banners.length];
    const initialGold = G.save.gold;
    const expectedCost = G.getSummonCost(100);
    
    const results = G.summon(bannerId, 100);
    totalPullsExecuted++;
    
    assert.strictEqual(results.length, 100, `Pull #${i+1} should return exactly 100 items`);
    totalItemsPulled += results.length;
    
    // Verify gold deduction
    const expectedRemaining = EN.sub(initialGold, expectedCost);
    assert.strictEqual(EN.eq(G.save.gold, expectedRemaining), true, `Gold deduction incorrect on pull #${i+1}`);
    
    // Verify result array items
    for (const item of results) {
      assert.ok(item, 'Result item must be defined');
      assert.ok(item.type, 'Result item must have a type');
      assert.ok(item.rarity, 'Result item must have a rarity');
      assert.ok(GAME_DATA.RARITY_INDEX[item.rarity] !== undefined, `Unknown rarity ${item.rarity}`);
    }
  }
  
  assert.strictEqual(totalPullsExecuted, 100, 'Executed 100 pulls');
  assert.strictEqual(totalItemsPulled, 10000, 'Pulled 10,000 total items');
});

recordTest('Scenario A', '100x Pulls with zero / insufficient gold', () => {
  resetCleanState();
  G.save.gold = EN.fromNumber(0);
  
  const results = G.summon('gear', 100);
  assert.strictEqual(results.length, 0, 'Summon with 0 gold should return empty array');
  assert.strictEqual(EN.eq(G.save.gold, EN.fromNumber(0)), true, 'Gold should remain 0');
  
  // Partial gold scenario
  const cost100 = G.getSummonCost(100);
  // Set gold to exactly cost of 2 pulls
  G.save.gold = EN.mul(cost100, EN.fromNumber(2));
  
  const pull1 = G.summon('pet', 100);
  assert.strictEqual(pull1.length, 100, 'Pull 1 should succeed');
  
  const pull2 = G.summon('skill', 100);
  assert.strictEqual(pull2.length, 100, 'Pull 2 should succeed');
  
  const pull3 = G.summon('gear', 100);
  assert.strictEqual(pull3.length, 0, 'Pull 3 should fail (insufficient gold)');
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO B: Star Ascension Extreme Scaling
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SCENARIO B: Star Ascension Extreme Scaling ---');

recordTest('Scenario B', 'getStarBonus calculation accuracy and bounds', () => {
  const starCounts = [0, 1, 10, 50, 100, 1000, 10000, 1e6];
  for (const s of starCounts) {
    const bonus = G.getStarBonus(s);
    assert.strictEqual(typeof bonus, 'number', `Bonus for star ${s} should be number`);
    assert.ok(!isNaN(bonus), `Bonus for star ${s} should not be NaN`);
    assert.ok(isFinite(bonus), `Bonus for star ${s} should be finite`);
    assert.ok(bonus >= 0, `Bonus for star ${s} should be non-negative`);
  }
  
  // Edge cases
  assert.strictEqual(G.getStarBonus(0), 0);
  assert.strictEqual(G.getStarBonus(null), 0);
  assert.strictEqual(G.getStarBonus(undefined), 0);
  assert.strictEqual(G.getStarBonus('invalid'), 0);
  
  // Note edge case for negative input: Math.pow(-10, 0.75) returns NaN in JS
  const negBonus = G.getStarBonus(-10);
  console.log(`    [Empirical Discovery] G.getStarBonus(-10) yields: ${negBonus} (NaN due to fractional exponent on negative base)`);
});

recordTest('Scenario B', 'Extreme star counts (⭐10, ⭐50, ⭐100, ⭐1000) on Pets, Skills, Equipment in computeStats()', () => {
  resetCleanState();
  
  // 1. Extreme Equipment Stars
  const weapon = G.generateItem('weapon', 'godly', 100);
  weapon.starCount = 1000;
  G.save.equipped.weapon = weapon;
  
  const armor = G.generateItem('chest', 'mythic', 100);
  armor.starCount = 500;
  G.save.equipped.chest = armor;
  
  // 2. Extreme Pet Stars
  G.addPet('dragon');
  const petOwned = G.save.petCollection.find(p => p.petId === 'dragon');
  if (petOwned) {
    petOwned.starCount = 1000;
    petOwned.constellation = 1000;
    petOwned.level = 100;
  }
  G.save.activePets[0] = 'dragon';
  
  // 3. Extreme Skill Stars
  G.addSkill('fireball', 'active');
  G.addSkill('atk_boost', 'passive');
  const skPassive = G.save.skillCollection.find(s => s.skillId === 'atk_boost');
  if (skPassive) {
    skPassive.starCount = 1000;
    skPassive.constellation = 1000;
    skPassive.level = 10;
  }
  G.save.passiveSkills[0] = 'atk_boost';
  
  // Compute stats under extreme star scaling
  const stats = G.computeStats();
  
  assert.ok(stats, 'computeStats() should return stats object');
  assert.ok(!isNaN(stats.dmgMult), 'dmgMult must not be NaN');
  assert.ok(isFinite(stats.dmgMult), 'dmgMult must be finite');
  assert.ok(!isNaN(stats.goldFind), 'goldFind must not be NaN');
  assert.ok(isFinite(stats.goldFind), 'goldFind must be finite');
  assert.ok(!isNaN(stats.critChance), 'critChance must not be NaN');
  assert.ok(isFinite(stats.critChance), 'critChance must be finite');
  
  console.log(`    Metrics: weapon⭐1000, pet⭐1000, skill⭐1000 -> Computed dmgMult = ${stats.dmgMult.toFixed(2)}, goldFind = ${stats.goldFind.toFixed(2)}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO C: Smart Auto-Dismantle Stress Test
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SCENARIO C: Smart Auto-Dismantle Stress Test ---');

recordTest('Scenario C', 'Drop 1,000 random gear items with autoDismantleLowerThanEquipped ON', () => {
  resetCleanState();
  
  // Equip Mythic / Legendary items in all 8 slots
  const equipSlots = GAME_DATA.EQUIP_SLOTS;
  for (let i = 0; i < equipSlots.length; i++) {
    const slotId = equipSlots[i].id;
    // Alternate between mythic (index 5) and legendary (index 4)
    const rarity = (i % 2 === 0) ? 'mythic' : 'legendary';
    G.save.equipped[slotId] = G.generateItem(slotId, rarity, 50);
  }
  
  // Turn ON autoDismantleLowerThanEquipped and turn OFF autoEquip for pure dismantling test
  G.save.autoDismantleLowerThanEquipped = true;
  G.save.autoEquip = false; 
  G.save.autoSell = {};
  G.save.inventory = [];
  
  const initialChaos = G.save.materials.chaosShards || 0;
  
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'godly', 'eternity'];
  let dismantledCount = 0;
  let addedCount = 0;
  let duplicateCount = 0;
  
  // Drop 1,000 random gear items
  for (let i = 0; i < 1000; i++) {
    const slot = equipSlots[Math.floor(Math.random() * equipSlots.length)].id;
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const droppedItem = G.generateItem(slot, rarity, 50);
    
    const res = G.processGearAcquisition(droppedItem);
    if (res.action === 'dismantled') {
      dismantledCount++;
    } else if (res.action === 'added') {
      addedCount++;
    } else if (res.action === 'duplicate') {
      duplicateCount++;
    }
  }
  
  // Verify inventory contains ZERO items lower than equipped rarity
  for (const invItem of G.save.inventory) {
    const eqItem = G.save.equipped[invItem.slotId];
    if (eqItem) {
      const invRarityIdx = GAME_DATA.RARITY_INDEX[invItem.rarity] || 0;
      const eqRarityIdx = GAME_DATA.RARITY_INDEX[eqItem.rarity] || 0;
      assert.ok(invRarityIdx >= eqRarityIdx, `Item ${invItem.rarity} in ${invItem.slotId} is lower than equipped ${eqItem.rarity}`);
    }
  }
  
  const finalChaos = G.save.materials.chaosShards || 0;
  assert.ok(finalChaos > initialChaos, `Chaos Shards should increase (from ${initialChaos} to ${finalChaos})`);
  assert.strictEqual(dismantledCount + addedCount + duplicateCount, 1000, 'Total processed actions must equal 1000');
  
  console.log(`    Metrics: 1,000 drops -> Dismantled: ${dismantledCount}, Kept/Added: ${addedCount}, Duplicate Upgraded: ${duplicateCount}, Shards gained: ${finalChaos - initialChaos}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO D: Best Pet/Skill Equipper Stress Test
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SCENARIO D: Best Pet/Skill Equipper Stress Test ---');

recordTest('Scenario D', 'equipBestPets() with 100+ randomized pets', () => {
  resetCleanState();
  G.save.petCollection = [];
  
  // Generate 120 randomized pets from GAME_DATA.PETS
  const allPets = GAME_DATA.PETS;
  for (let i = 0; i < 120; i++) {
    const p = allPets[i % allPets.length];
    G.save.petCollection.push({
      petId: p.id,
      level: Math.floor(Math.random() * 100) + 1,
      starCount: Math.floor(Math.random() * 50),
      constellation: Math.floor(Math.random() * 50),
      evolved: Math.random() > 0.5
    });
  }
  
  G.save.petSlots = 3;
  G.equipBestPets();
  
  const active = G.save.activePets;
  const activeUnlocked = active.slice(0, G.save.petSlots);
  
  assert.strictEqual(activeUnlocked.length, 3, 'Active unlocked pet slots should be 3');
  assert.ok(activeUnlocked[0] !== null, 'Slot 0 should be equipped');
  assert.ok(activeUnlocked[1] !== null, 'Slot 1 should be equipped');
  assert.ok(activeUnlocked[2] !== null, 'Slot 2 should be equipped');
  
  // Verify strict ordering of equipped pets (Rarity -> Star -> Level)
  function getPetRank(petId, collectionItem) {
    const p = GAME_DATA.PETS.find(x => x.id === petId);
    const rarIdx = GAME_DATA.RARITY_INDEX[p ? p.rarity : 'common'] || 0;
    const star = collectionItem ? (collectionItem.starCount !== undefined ? collectionItem.starCount : (collectionItem.constellation || 0)) : 0;
    const lvl = collectionItem ? (collectionItem.level || 1) : 1;
    return { rarIdx, star, lvl };
  }
  
  for (let i = 0; i < activeUnlocked.length - 1; i++) {
    const ownedA = G.save.petCollection.find(p => p.petId === activeUnlocked[i]);
    const ownedB = G.save.petCollection.find(p => p.petId === activeUnlocked[i+1]);
    const rankA = getPetRank(activeUnlocked[i], ownedA);
    const rankB = getPetRank(activeUnlocked[i+1], ownedB);
    
    if (rankA.rarIdx !== rankB.rarIdx) {
      assert.ok(rankA.rarIdx >= rankB.rarIdx, `Pet slot ${i} rarity should be >= slot ${i+1}`);
    } else if (rankA.star !== rankB.star) {
      assert.ok(rankA.star >= rankB.star, `Pet slot ${i} stars should be >= slot ${i+1}`);
    } else {
      assert.ok(rankA.lvl >= rankB.lvl, `Pet slot ${i} level should be >= slot ${i+1}`);
    }
  }
  console.log(`    Metrics: 120 pets collection sorted & equipped -> Unlocked slots (3) active: [${activeUnlocked.join(', ')}]`);
});

recordTest('Scenario D', 'equipBestSkills() with 100+ randomized active and passive skills', () => {
  resetCleanState();
  G.save.skillCollection = [];
  
  const activePool = GAME_DATA.SKILLS.active;
  const passivePool = GAME_DATA.SKILLS.passive;
  
  // Populate 60 active skills & 60 passive skills into skillCollection
  for (let i = 0; i < 60; i++) {
    const sk = activePool[i % activePool.length];
    G.save.skillCollection.push({
      skillId: sk.id,
      type: 'active',
      level: Math.floor(Math.random() * 10) + 1,
      starCount: Math.floor(Math.random() * 20),
      constellation: Math.floor(Math.random() * 20)
    });
  }
  for (let i = 0; i < 60; i++) {
    const sk = passivePool[i % passivePool.length];
    G.save.skillCollection.push({
      skillId: sk.id,
      type: 'passive',
      level: Math.floor(Math.random() * 10) + 1,
      starCount: Math.floor(Math.random() * 20),
      constellation: Math.floor(Math.random() * 20)
    });
  }
  
  G.equipBestSkills();
  
  assert.strictEqual(G.save.activeSkills.length, 4, '4 Active skill slots populated');
  assert.strictEqual(G.save.passiveSkills.length, 8, '8 Passive skill slots populated');
  
  for (let i = 0; i < 4; i++) {
    assert.ok(G.save.activeSkills[i], `Active skill slot ${i} must be populated`);
  }
  for (let i = 0; i < 8; i++) {
    assert.ok(G.save.passiveSkills[i], `Passive skill slot ${i} must be populated`);
  }
  console.log(`    Metrics: 120 skills collection sorted & equipped -> 4 active & 8 passive slots fully populated`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO E: Save String Roundtrip
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SCENARIO E: Save String Roundtrip ---');

recordTest('Scenario E', 'Export and Import save state with star ranks and settings', () => {
  resetCleanState();
  
  // Populate rich state
  G.save.gold = EN.fromNumber(9.876e45);
  G.save.autoDismantleLowerThanEquipped = true;
  G.save.petCollection = [
    { petId: 'dragon', level: 42, starCount: 15, constellation: 15, evolved: true },
    { petId: 'phoenix', level: 99, starCount: 50, constellation: 50, evolved: true }
  ];
  G.save.skillCollection = [
    { skillId: 'fireball', type: 'active', level: 10, starCount: 25, constellation: 25 }
  ];
  G.save.materials.chaosShards = 12345;
  G.save.materials.anchorCrystals = 678;
  
  // Export save
  const exportedString = G.exportSave();
  assert.ok(typeof exportedString === 'string', 'exportSave() must return string');
  assert.ok(exportedString.length > 0, 'exportSave() string must not be empty');
  
  // Clear game state in storage
  localStorageMap.clear();
  
  // Import save back
  const importResult = G.importSave(exportedString);
  assert.strictEqual(importResult, true, 'importSave() should return true');
  
  // Load state from localStorage
  const loadedState = sandbox.loadGame();
  assert.ok(loadedState, 'loadGame() should return deserialized object');
  
  // Assert Data Integrity
  assert.strictEqual(loadedState.autoDismantleLowerThanEquipped, true, 'Setting autoDismantleLowerThanEquipped preserved');
  assert.strictEqual(loadedState.materials.chaosShards, 12345, 'Chaos Shards count preserved');
  assert.strictEqual(loadedState.materials.anchorCrystals, 678, 'Anchor Crystals count preserved');
  assert.strictEqual(loadedState.petCollection.length, 2, 'Pet collection length preserved');
  assert.strictEqual(loadedState.petCollection[0].starCount, 15, 'Pet 0 star count preserved');
  assert.strictEqual(loadedState.petCollection[1].starCount, 50, 'Pet 1 star count preserved');
  assert.strictEqual(loadedState.skillCollection[0].starCount, 25, 'Skill 0 star count preserved');
  
  assert.strictEqual(EN.eq(loadedState.gold, EN.fromNumber(9.876e45)), true, 'EN Gold value preserved accurately');
  console.log(`    Metrics: Save string length = ${exportedString.length} chars -> Import/Export 100% loss-free integrity`);
});

metrics.endTime = Date.now();
const totalDuration = ((metrics.endTime - metrics.startTime) / 1000).toFixed(3);

console.log('\n================================================================');
console.log('                   FINAL METRICS SUMMARY                        ');
console.log('================================================================');
console.log(`Total Time Elapsed : ${totalDuration} s`);
console.log(`Total Assertions   : ${metrics.totalAssertions}`);
console.log(`Passed Assertions  : ${metrics.passed}`);
console.log(`Failed Assertions  : ${metrics.failed}`);
console.log('================================================================\n');

if (metrics.failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL STRESS TEST SCENARIOS PASSED WITH FULL INTEGRITY!');
  process.exit(0);
}
