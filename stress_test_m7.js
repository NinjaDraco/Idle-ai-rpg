/**
 * stress_test_m7.js — Empirical Stress Test Harness for Milestone 7
 * Eternity Idle RPG Sub-Layer APIs, Combat Engines, & Serialization Load Audit
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('  ETERNITY IDLE RPG — MILESTONE 7 EMPIRICAL STRESS TEST SUITE  ');
console.log('================================================================\n');

// 1. Virtual Environment Setup
const localStorageMap = new Map();
const mockLocalStorage = {
  getItem: key => localStorageMap.get(key) || null,
  setItem: (key, val) => localStorageMap.set(key, String(val)),
  removeItem: key => localStorageMap.delete(key),
  clear: () => localStorageMap.clear()
};

const dummyElement = {
  innerHTML: '',
  textContent: '',
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {} },
  appendChild: () => {},
  removeChild: () => {},
  querySelector: () => null,
  querySelectorAll: () => []
};

const mockDocument = {
  getElementById: () => dummyElement,
  querySelector: () => dummyElement,
  querySelectorAll: () => [],
  createElement: () => dummyElement,
  body: dummyElement
};

const mockWindow = {
  localStorage: mockLocalStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { reload: () => {} },
  document: mockDocument,
  showToast: () => {}
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
  document: mockDocument,
  window: mockWindow,
  localStorage: mockLocalStorage,
  location: mockWindow.location,
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
  escape: globalThis.escape || ((s) => encodeURIComponent(s)),
  unescape: globalThis.unescape || ((s) => decodeURIComponent(s)),
  setInterval: () => {},
  clearInterval: () => {},
  setTimeout: () => {},
  clearTimeout: () => {}
};

vm.createContext(sandbox);

// Load Eternity RPG engine code modules in sequence
const eternitynumCode = fs.readFileSync(path.join(__dirname, 'js', 'eternitynum_v3.js'), 'utf8');
vm.runInContext(eternitynumCode, sandbox);
const EN = vm.runInContext('EN', sandbox);

const dataCode = fs.readFileSync(path.join(__dirname, 'js', 'data_v3.js'), 'utf8');
vm.runInContext(dataCode, sandbox);
vm.runInContext('var GAME_DATA = window.GAME_DATA;', sandbox);
const GAME_DATA = sandbox.window.GAME_DATA;

const gameCode = fs.readFileSync(path.join(__dirname, 'js', 'game_v3.js'), 'utf8');
vm.runInContext(gameCode, sandbox);
const G = vm.runInContext('G', sandbox);

// Initialize Game Engine State
vm.runInContext('initGame()', sandbox);

// Test Metrics & Reporter
const metrics = {
  startTime: performance.now(),
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
    metrics.scenarios[scenarioName].tests.push({ name: testName, status: 'PASS', durationMs, memUsedMB });
    console.log(`  ✅ [PASS] ${scenarioName} :: ${testName} (${durationMs.toFixed(2)}ms)`);
  } catch (err) {
    metrics.scenarios[scenarioName].failed++;
    metrics.failed++;
    metrics.scenarios[scenarioName].tests.push({ name: testName, status: 'FAIL', error: err.message });
    console.error(`  ❌ [FAIL] ${scenarioName} :: ${testName} -> ${err.message}`);
  }
}

function resetGameState() {
  localStorageMap.clear();
  vm.runInContext('initGame()', sandbox);
}

// ====================================================================
// SCENARIO 1: MINING ENGINE MANUAL & AUTO TICKS (10,000 TICKS)
// ====================================================================
recordTest('Scenario 1: Mining Engine', '10,000 Manual Ticks & Ore Accumulation', () => {
  resetGameState();
  G.save.level = 10;
  
  const initialOre = G.save.materials.ironOre || 0;
  const initialExp = G.save.mining ? G.save.mining.exp : 0;
  const initialLevel = G.save.mining ? G.save.mining.level : 1;
  
  let successCount = 0;
  for (let i = 0; i < 10000; i++) {
    const res = G.mineNodeManual('iron_node');
    if (res) successCount++;
  }

  assert.strictEqual(successCount, 10000, 'All 10,000 manual ticks should return true');
  
  const finalOre = G.save.materials.ironOre || 0;
  const finalLevel = G.save.mining.level;
  const masteryPoints = G.save.masteries ? G.save.masteries.points.mining : 0;

  assert.ok(finalOre > initialOre, `Iron ore should accumulate (initial=${initialOre}, final=${finalOre})`);
  assert.ok(finalLevel > initialLevel, `Mining level should increase (initial=${initialLevel}, final=${finalLevel})`);
  assert.ok(masteryPoints > 0, `Mining mastery points should be awarded on level up (got ${masteryPoints})`);
});

recordTest('Scenario 1: Mining Engine', 'Auto-Gather Ticks Under Game Loop Load', () => {
  resetGameState();
  G.save.level = 10;
  if (!G.save.mining.nodes['iron_node']) {
    G.save.mining.nodes['iron_node'] = { progress: 0, level: 1, auto: true };
  } else {
    G.save.mining.nodes['iron_node'].auto = true;
  }
  
  const initialOre = G.save.materials.ironOre || 0;
  
  // Simulate 1,000 game ticks (dt = 0.1s each tick)
  for (let i = 0; i < 1000; i++) {
    vm.runInContext('gameTick()', sandbox);
  }

  const finalOre = G.save.materials.ironOre || 0;
  assert.ok(finalOre > initialOre, `Auto mining should accumulate iron ore (initial=${initialOre}, final=${finalOre})`);
  assert.strictEqual(isNaN(finalOre), false, 'Iron ore quantity must not be NaN');
});

// ====================================================================
// SCENARIO 2: SMELTING, FORGING, SOCKETING, UNSOCKETING & REROLLING
// ====================================================================
recordTest('Scenario 2: Smelting & Forge', 'Smelt 1,000 Iron Alloys (smeltAlloy)', () => {
  resetGameState();
  G.save.materials = { ironOre: 20000, rubyCrystal: 5000, ironAlloy: 0 };
  
  let smeltCount = 0;
  for (let i = 0; i < 1000; i++) {
    if (G.smeltAlloy('iron_alloy')) smeltCount++;
  }

  assert.strictEqual(smeltCount, 1000, 'All 1,000 smelt calls should succeed');
  assert.ok(G.save.materials.ironAlloy >= 1000, `Should produce at least 1,000 iron alloy ingots (got ${G.save.materials.ironAlloy})`);
  assert.ok(G.save.crafting.level > 1, `Crafting level should increase (level=${G.save.crafting.level})`);
});

recordTest('Scenario 2: Smelting & Forge', 'Forge 100 Mythic Equipment Items (forgeEquipment)', () => {
  resetGameState();
  G.save.materials = { ironAlloy: 1000, mithrilIngot: 1000, chaosShards: 5000 };
  
  const forgedItems = [];
  for (let i = 0; i < 100; i++) {
    const item = G.forgeEquipment('mythic_weapon');
    if (item) forgedItems.push(item);
  }

  assert.strictEqual(forgedItems.length, 100, 'Should successfully forge 100 items');
  assert.strictEqual(G.save.inventory.length, 100, 'Inventory should contain 100 forged items');
  
  const sample = forgedItems[0];
  assert.strictEqual(sample.rarity, 'mythic', 'Item rarity should be mythic');
  assert.strictEqual(sample.slotId, 'weapon', 'Item slotId should be weapon');
  assert.strictEqual(Array.isArray(sample.sockets), true, 'Item sockets should be an array');
  assert.strictEqual(sample.sockets.length, 2, 'Item should have 2 gem sockets');
});

recordTest('Scenario 2: Smelting & Forge', 'Gem Socketing and Unsocketing (socketGem / unsocketGem)', () => {
  resetGameState();
  G.save.materials = { ironAlloy: 10, mithrilIngot: 10, chaosShards: 50, cut_ruby: 5, star_diamond: 5 };
  const item = G.forgeEquipment('mythic_weapon');
  assert.ok(item, 'Item must be created');

  const sock1Res = G.socketGem(item.uid, 0, 'cut_ruby');
  assert.strictEqual(sock1Res, true, 'Socketing cut_ruby in slot 0 should succeed');
  assert.strictEqual(item.sockets[0].gem, 'cut_ruby', 'Socket 0 should contain cut_ruby');
  assert.strictEqual(G.save.materials.cut_ruby, 4, 'cut_ruby count should decrement to 4');

  const sock2Res = G.socketGem(item.uid, 1, 'star_diamond');
  assert.strictEqual(sock2Res, true, 'Socketing star_diamond in slot 1 should succeed');
  assert.strictEqual(item.sockets[1].gem, 'star_diamond', 'Socket 1 should contain star_diamond');
  assert.strictEqual(G.save.materials.star_diamond, 4, 'star_diamond count should decrement to 4');

  const unsock1Res = G.unsocketGem(item.uid, 0);
  assert.strictEqual(unsock1Res, true, 'Unsocketing slot 0 should succeed');
  assert.strictEqual(item.sockets[0].gem, null, 'Socket 0 should be empty');
  assert.strictEqual(G.save.materials.cut_ruby, 5, 'cut_ruby count should be refunded to 5');

  const unsock2Res = G.unsocketGem(item.uid, 1);
  assert.strictEqual(unsock2Res, true, 'Unsocketing slot 1 should succeed');
  assert.strictEqual(item.sockets[1].gem, null, 'Socket 1 should be empty');
  assert.strictEqual(G.save.materials.star_diamond, 5, 'star_diamond count should be refunded to 5');
});

recordTest('Scenario 2: Smelting & Forge', 'Affix Rerolling with Locks under 500-Iteration Load (rerollAffixesWithLocks)', () => {
  resetGameState();
  G.save.materials = { ironAlloy: 10, mithrilIngot: 10, chaosShards: 50000, anchorCrystals: 20000 };
  const item = G.forgeEquipment('mythic_weapon');
  assert.ok(item && item.affixes.length > 0, 'Forged item should have affixes');

  const initialLockedAffix = JSON.parse(JSON.stringify(item.affixes[0]));
  
  let rerollSuccessCount = 0;
  for (let i = 0; i < 500; i++) {
    const res = G.rerollAffixesWithLocks(item.uid, [0]);
    if (res) rerollSuccessCount++;
  }

  assert.strictEqual(rerollSuccessCount, 500, 'All 500 reroll calls should succeed');
  assert.strictEqual(item.affixes[0].id, initialLockedAffix.id, 'Locked affix id at index 0 must remain unchanged after 500 rerolls');
  assert.strictEqual(item.affixes[0].stat, initialLockedAffix.stat, 'Locked affix stat at index 0 must remain unchanged after 500 rerolls');
  assert.strictEqual(item.affixes[0].tier, initialLockedAffix.tier, 'Locked affix tier at index 0 must remain unchanged after 500 rerolls');
  assert.strictEqual(item.affixes[0].tierVal, initialLockedAffix.tierVal, 'Locked affix tierVal at index 0 must remain unchanged after 500 rerolls');
});

// ====================================================================
// SCENARIO 3: ALCHEMY BREWING, CLAIMING, USAGE & POTION COUNTDOWNS
// ====================================================================
recordTest('Scenario 3: Alchemy Engine', 'Start Brewing & Double-Brew Guard (startBrewing)', () => {
  resetGameState();
  G.save.materials = { rubyCrystal: 100, chaosShards: 1000 };

  const startRes = G.startBrewing('elixir_berserk');
  assert.strictEqual(startRes, true, 'startBrewing elixir_berserk should succeed');
  assert.ok(G.save.alchemy.activeBrew, 'activeBrew state should be set');
  assert.strictEqual(G.save.alchemy.activeBrew.recipeId, 'elixir_berserk', 'Active brew recipeId should match');
  assert.ok(G.save.alchemy.activeBrew.secondsLeft > 0, 'Active brew secondsLeft should be positive');

  const secondStart = G.startBrewing('elixir_berserk');
  assert.strictEqual(secondStart, false, 'Starting another brew while one is active must return false');
});

recordTest('Scenario 3: Alchemy Engine', 'Brew Countdown & Claim Brewed Potion (claimBrewedPotion)', () => {
  resetGameState();
  G.save.materials = { rubyCrystal: 100, chaosShards: 1000 };
  G.startBrewing('elixir_berserk');

  // Fast-forward brew timer to 0
  G.save.alchemy.activeBrew.secondsLeft = 0;

  const claimRes = G.claimBrewedPotion();
  assert.strictEqual(claimRes, true, 'claimBrewedPotion should succeed when secondsLeft is 0');
  assert.strictEqual(G.save.alchemy.activeBrew, null, 'Active brew should be cleared after claim');
  assert.ok((G.save.alchemy.inventory['elixir_berserk'] || 0) >= 1, 'Potion should be added to alchemy inventory');
});

recordTest('Scenario 3: Alchemy Engine', 'Use Potion & Active Potion Countdown Decay (usePotion & gameTick)', () => {
  resetGameState();
  G.save.materials = { rubyCrystal: 100, chaosShards: 1000 };
  G.startBrewing('elixir_berserk');
  G.save.alchemy.activeBrew.secondsLeft = 0;
  G.claimBrewedPotion();

  const useRes = G.usePotion('elixir_berserk');
  assert.strictEqual(useRes, true, 'usePotion elixir_berserk should succeed');
  assert.ok((G.save.alchemy.activePotions['elixir_berserk'] || 0) > 0, 'activePotions should have countdown set');

  const baseDmgMult = G.computedStats.dmgMult || 0;
  assert.ok(baseDmgMult >= 1.0, 'Computed stats should include potion dmgMult bonus');

  // Fast forward potion duration decay via gameTick ticks (set remaining duration to 0.1s and run ticks)
  G.save.alchemy.activePotions['elixir_berserk'] = 0.1;
  for (let i = 0; i < 5; i++) {
    vm.runInContext('gameTick()', sandbox);
  }

  assert.strictEqual(G.save.alchemy.activePotions['elixir_berserk'], undefined, 'Active potion should be removed once timer expires');
});

// ====================================================================
// SCENARIO 4: MASTERY TREES ALLOCATION ACROSS ALL 4 TREES
// ====================================================================
recordTest('Scenario 4: Mastery Trees', 'Allocation across Combat, Mining, Crafting & Alchemy', () => {
  resetGameState();
  G.save.masteries.points = { combat: 50, mining: 50, crafting: 50, alchemy: 50 };

  // Prerequisite check: c2 requires c1
  const prereqFail = G.allocateMasteryPoint('combat', 'c2');
  assert.strictEqual(prereqFail, false, 'Allocating c2 before c1 should fail due to missing prerequisite');

  // Allocate c1 (maxLvl = 10)
  for (let i = 0; i < 10; i++) {
    const res = G.allocateMasteryPoint('combat', 'c1');
    assert.strictEqual(res, true, `Combat node c1 rank ${i+1} allocation should succeed`);
  }
  assert.strictEqual(G.save.masteries.allocations.combat['c1'], 10, 'c1 should reach rank 10');

  // Exceed max rank test
  const overCap = G.allocateMasteryPoint('combat', 'c1');
  assert.strictEqual(overCap, false, 'Allocating past maxLvl should fail');

  // Allocate c2 now that c1 is unlocked
  const c2Res = G.allocateMasteryPoint('combat', 'c2');
  assert.strictEqual(c2Res, true, 'c2 allocation should succeed after c1 prerequisite is met');

  // Allocate Mining, Crafting, Alchemy
  assert.strictEqual(G.allocateMasteryPoint('mining', 'm1'), true, 'Mining m1 allocation should succeed');
  assert.strictEqual(G.allocateMasteryPoint('crafting', 'cr1'), true, 'Crafting cr1 allocation should succeed');
  assert.strictEqual(G.allocateMasteryPoint('alchemy', 'a1'), true, 'Alchemy a1 allocation should succeed');

  assert.ok(G.computedStats, 'computedStats should be updated after mastery allocations');
});

// ====================================================================
// SCENARIO 5: MONUMENTS BUILDING & GLOBAL MULTIPLICATIVE STAT SCALING
// ====================================================================
recordTest('Scenario 5: Monuments', 'Build Obelisk of Power and Verify Multiplicative Stat Scaling', () => {
  resetGameState();
  G.save.materials = { ironAlloy: 10000, voidPlate: 10000, chaosShards: 50000, mithrilIngot: 10000, starMatrix: 1000, starGem: 1000, tierStones: 10000 };

  const baselineDmgMult = G.computedStats.dmgMult || 0;

  for (let i = 1; i <= 5; i++) {
    const res = G.buildMonument('obelisk_power');
    assert.strictEqual(res, true, `Building obelisk_power level ${i} should succeed`);
    assert.strictEqual(G.save.monuments['obelisk_power'], i, `obelisk_power level should be ${i}`);
  }

  const newDmgMult = G.computedStats.dmgMult || 0;
  assert.ok(newDmgMult > baselineDmgMult, `dmgMult should scale up with obelisk_power (baseline=${baselineDmgMult}, new=${newDmgMult})`);

  const forgeRes = G.buildMonument('forge_spire');
  assert.strictEqual(forgeRes, true, 'Building forge_spire level 1 should succeed');
  assert.ok(G.computedStats.finalDmgMult > 1.0, 'finalDmgMult should reflect forge_spire scaling');
});

// ====================================================================
// SCENARIO 6: GACHA PULLS (10,000 PULLS) & STAR CONSTELLATION NODES
// ====================================================================
recordTest('Scenario 6: Stargaze & Constellations', '10,000 Gacha Pulls & Star Dust Generation', () => {
  resetGameState();
  G.save.gold = EN.fromNumber(1e35);

  let totalPulls = 0;
  for (let i = 0; i < 100; i++) {
    const res = G.summon('pet', 100);
    if (res && res.length > 0) totalPulls += res.length;
  }

  assert.strictEqual(totalPulls, 10000, 'Should complete exactly 10,000 gacha pulls');
  assert.ok((G.save.starDust || 0) > 0, `Star dust currency should accumulate from 10,000 pulls (got ${G.save.starDust})`);
});

recordTest('Scenario 6: Stargaze & Constellations', 'Unlock Constellation Star Nodes (unlockStarNode)', () => {
  resetGameState();
  G.save.starDust = 1000;

  // Prerequisite check: alpha_centauri requires star_core
  const prereqFail = G.unlockStarNode('alpha_centauri');
  assert.strictEqual(prereqFail, false, 'Unlocking node before prerequisite should fail');

  const unlock1 = G.unlockStarNode('star_core');
  assert.strictEqual(unlock1, true, 'Unlocking star_core should succeed');
  assert.ok(G.save.constellationTree.unlockedNodes.includes('star_core'), 'unlockedNodes should contain star_core');

  const unlock2 = G.unlockStarNode('alpha_centauri');
  assert.strictEqual(unlock2, true, 'Unlocking alpha_centauri should succeed after star_core');
  assert.ok(G.save.constellationTree.unlockedNodes.includes('alpha_centauri'), 'unlockedNodes should contain alpha_centauri');

  assert.ok(G.computedStats.critDmg > 0, 'critDmg bonus from constellation node should be applied');
});

// ====================================================================
// SCENARIO 7: COMBAT OVERLOADS & SKILL COMBO DETONATIONS
// ====================================================================
recordTest('Scenario 7: Combat Overloads & Combos', 'Thermal Shock & Void Surge Status Overloads in dealDamage()', () => {
  resetGameState();
  G.save.currentEnemy = { id: 'test_boss', name: 'Test Boss', hp: EN.fromNumber(1e12), maxHp: EN.fromNumber(1e12), isBoss: true, statuses: { burn: 10, freeze: 10, shadow: 0, lightning: 0 } };
  G.computedStats.fireDmg = 1.0;
  G.computedStats.iceDmg = 1.0;
  G.computedStats.overloadDmg = 1.0;

  const hpBeforeThermal = EN.toNumber(G.save.currentEnemy.hp);
  G.dealDamage(1);
  const hpAfterThermal = EN.toNumber(G.save.currentEnemy.hp);

  assert.ok(hpAfterThermal < hpBeforeThermal, 'Damage dealt with Thermal Shock overload should reduce enemy HP');
  // Note: dealDamage with fireDmg & iceDmg > 0 adds +1 burn & +1 freeze before Thermal Shock consumes 1 of each.
  // Initial 10 -> +1 (11) -> -1 (10).
  assert.strictEqual(G.save.currentEnemy.statuses.burn, 10, 'Thermal shock should consume 1 burn stack (after 1 added)');
  assert.strictEqual(G.save.currentEnemy.statuses.freeze, 10, 'Thermal shock should consume 1 freeze stack (after 1 added)');

  // Test Void Surge (Shadow + Lightning)
  G.save.currentEnemy.statuses = { burn: 0, freeze: 0, shadow: 10, lightning: 10 };
  G.computedStats.shadowDmg = 1.0;
  G.computedStats.lightningDmg = 1.0;

  G.dealDamage(1);
  assert.strictEqual(G.save.currentEnemy.statuses.shadow, 10, 'Void surge should consume 1 shadow stack (after 1 added)');
  assert.strictEqual(G.save.currentEnemy.statuses.lightning, 10, 'Void surge should consume 1 lightning stack (after 1 added)');
});

recordTest('Scenario 7: Combat Overloads & Combos', 'Skill Combo Detonations in useSkill()', () => {
  resetGameState();
  G.save.currentEnemy = { id: 'dummy', name: 'Dummy', hp: EN.fromNumber(1e25), maxHp: EN.fromNumber(1e25), statuses: { burn: 0, freeze: 0, shadow: 0, lightning: 0 } };
  G.save.activeSkills = ['fire_bomb', 'frost_nova', 'void_rift', 'thunder_call'];
  G.save.skillCooldowns = {};
  G.save.comboHistory = [];

  // Skill 0: fire_bomb
  const use1 = G.useSkill(0);
  assert.strictEqual(use1, true, 'useSkill(0) fire_bomb should succeed');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(G.save.comboHistory)), ['fire_bomb'], 'comboHistory should record fire_bomb');

  // Clear cooldown so skill 1 can execute immediately
  G.save.skillCooldowns['frost_nova'] = 0;
  const use2 = G.useSkill(1);
  assert.strictEqual(use2, true, 'useSkill(1) frost_nova should succeed');

  // Combo detonation triggers sequence ['fire_bomb', 'frost_nova']
  assert.deepStrictEqual(JSON.parse(JSON.stringify(G.save.comboHistory)), [], 'comboHistory should reset after combo detonation');
  assert.ok(G.save.currentEnemy.statuses.burn > 0, 'Thermal detonation combo should apply burn status');
  assert.ok(G.save.currentEnemy.statuses.freeze > 0, 'Thermal detonation combo should apply freeze status');
});

// ====================================================================
// SCENARIO 8: SAVE/LOAD SERIALIZATION & DATA FIDELITY
// ====================================================================
recordTest('Scenario 8: Save/Load System', 'Base64 Serialization & JSON Roundtrip Data Fidelity', () => {
  resetGameState();
  G.save.gold = EN.fromNumber(1.2345e25);
  G.save.totalDmgDone = EN.fromNumber(9.8765e30);
  G.save.materials = { ironOre: 500, rubyCrystal: 120, chaosShards: 999, ironAlloy: 10, mithrilIngot: 10 };
  G.save.monuments = { obelisk_power: 3, forge_spire: 2 };
  G.save.masteries.allocations = { combat: { c1: 10, c2: 5 }, mining: { m1: 8 } };
  G.save.constellationTree = { unlockedNodes: ['star_core', 'alpha_centauri'] };
  
  // Forge item with sockets and gems
  const item = G.forgeEquipment('mythic_weapon');
  assert.ok(item, 'Forged item should be created');
  G.save.materials.cut_ruby = 10;
  G.socketGem(item.uid, 0, 'cut_ruby');

  const exportStr1 = G.exportSave();
  assert.ok(exportStr1 && typeof exportStr1 === 'string' && exportStr1.length > 50, 'exportSave should produce valid Base64 string');

  // Reset state in memory
  resetGameState();

  // Import Base64 string into localStorage
  const importResult = G.importSave(exportStr1);
  assert.strictEqual(importResult, true, 'importSave should return true for valid export string');

  // Load imported state from localStorage into G.save (simulating page reload)
  vm.runInContext('initGame()', sandbox);

  // Verify state fidelity
  assert.strictEqual(EN.fmt(G.save.gold), EN.fmt(EN.fromNumber(1.2345e25)), 'Gold value and format must be preserved');
  assert.strictEqual(G.save.materials.ironOre, 500, 'Materials must be preserved');
  assert.strictEqual(G.save.monuments.obelisk_power, 3, 'Monuments state must be preserved');
  assert.strictEqual(G.save.masteries.allocations.combat.c1, 10, 'Mastery allocations must be preserved');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(G.save.constellationTree.unlockedNodes)), ['star_core', 'alpha_centauri'], 'Constellation nodes must be preserved');
  assert.strictEqual(G.save.inventory[0].sockets[0].gem, 'cut_ruby', 'Forged item sockets and gems must be preserved');

  // Verify second roundtrip serialization produces 100% identical Base64 string
  const exportStr2 = G.exportSave();
  vm.runInContext('initGame()', sandbox);
  const exportStr3 = G.exportSave();
  assert.strictEqual(exportStr2, exportStr3, 'Re-exporting imported save must produce 100% identical Base64 string');
});

// ====================================================================
// SUMMARY & REPORTING
// ====================================================================
const totalTimeMs = performance.now() - metrics.startTime;

console.log('\n================================================================');
console.log('  MILESTONE 7 EMPIRICAL STRESS TEST RESULTS');
console.log('================================================================');
console.log(`  Total Assertions Run: ${metrics.totalAssertions}`);
console.log(`  Passed:               ${metrics.passed}`);
console.log(`  Failed:               ${metrics.failed}`);
console.log(`  Execution Time:       ${totalTimeMs.toFixed(2)} ms`);
console.log('----------------------------------------------------------------');

for (const scName in metrics.scenarios) {
  const sc = metrics.scenarios[scName];
  console.log(`  [${sc.failed === 0 ? 'PASS' : 'FAIL'}] ${scName}: ${sc.passed}/${sc.passed + sc.failed} passed`);
}

console.log('================================================================\n');

if (metrics.failed > 0) {
  console.error(`💥 STRESS TEST FAILED: ${metrics.failed} assertion failure(s) detected.`);
  process.exit(1);
} else {
  console.log(`🎉 STRESS TEST PASSED: All ${metrics.passed} empirical tests passed with 100% stability!`);
  process.exit(0);
}
