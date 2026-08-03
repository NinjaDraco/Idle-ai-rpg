/**
 * verify_m4_sublayers.js
 * Verification test suite for Milestone 4 Genuine Sub-Layers Engine
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

// 2. Load data_v3.js
const dataCode = fs.readFileSync(path.join(__dirname, 'js/data_v3.js'), 'utf8');
vm.runInContext(dataCode, sandbox);

// 3. Load game_v3.js
const gameCode = fs.readFileSync(path.join(__dirname, 'js/game_v3.js'), 'utf8');
vm.runInContext(gameCode, sandbox);

// Init game in sandbox
vm.runInContext('initGame()', sandbox);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch(e) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(e);
    failed++;
  }
}

console.log('🧪 Starting Milestone 4 Sub-Layers Engine Verification Tests...\n');

// ── Test Group 1: Data Structures ──────────────────────────────
console.log('--- 1. Data Structures Integrity ---');
test('GAME_DATA contains all required Milestone 4 structures', () => {
  const GD = sandbox.window.GAME_DATA;
  assert(Array.isArray(GD.MINING_NODES) && GD.MINING_NODES.length >= 4, 'MINING_NODES defined');
  assert(Array.isArray(GD.SMELTING_RECIPES) && GD.SMELTING_RECIPES.length >= 4, 'SMELTING_RECIPES defined');
  assert(Array.isArray(GD.FORGE_RECIPES) && GD.FORGE_RECIPES.length >= 3, 'FORGE_RECIPES defined');
  assert(Array.isArray(GD.GEMS) && GD.GEMS.length >= 5, 'GEMS defined');
  assert(Array.isArray(GD.ALCHEMY_RECIPES) && GD.ALCHEMY_RECIPES.length >= 6, 'ALCHEMY_RECIPES defined');
  assert(GD.MASTERY_TREES && GD.MASTERY_TREES.combat && GD.MASTERY_TREES.mining, 'MASTERY_TREES defined');
  assert(Array.isArray(GD.MONUMENTS) && GD.MONUMENTS.length >= 4, 'MONUMENTS defined');
  assert(Array.isArray(GD.SKILL_COMBOS) && GD.SKILL_COMBOS.length >= 3, 'SKILL_COMBOS defined');
  assert(Array.isArray(GD.CONSTELLATION_NODES) && GD.CONSTELLATION_NODES.length >= 6, 'CONSTELLATION_NODES defined');
});

// ── Test Group 2: Mining Engine ───────────────────────────────
console.log('\n--- 2. Mining Node Engine ---');
test('Manual mining & node harvesting', () => {
  const G = sandbox.G;
  G.save.materials.ironOre = 0;
  
  // Mine 5 manual ticks to complete iron_node baseTicks (5)
  for (let i = 0; i < 5; i++) {
    const res = G.mineNodeManual('iron_node');
    assert(res === true, 'mineNodeManual returns true');
  }
  
  assert(G.save.materials.ironOre > 0, 'ironOre material increased after harvesting');
  assert(G.save.mining.exp > 0, 'Mining EXP gained');
});

// ── Test Group 3: Smelting & Forge Engine ────────────────────
console.log('\n--- 3. Smelting & Forge Engine ---');
test('Alloy smelting & mythic forging & gem socketing', () => {
  const G = sandbox.G;
  G.save.materials.ironOre = 20;
  G.save.materials.rubyCrystal = 5;
  
  const smeltRes = G.smeltAlloy('iron_alloy');
  assert(smeltRes === true, 'smeltAlloy succeeds');
  assert(G.save.materials.ironAlloy >= 1, 'ironAlloy produced');
  
  // Provide items for mythic_weapon forge
  G.save.materials.ironAlloy = 10;
  G.save.materials.mithrilIngot = 10;
  G.save.materials.chaosShards = 50;
  G.save.materials.cut_ruby = 2;
  
  const item = G.forgeEquipment('mythic_weapon');
  assert(item !== null && item.rarity === 'mythic', 'forgeEquipment produces mythic item');
  assert(Array.isArray(item.sockets), 'Forged item has socket slots');
  
  const socketRes = G.socketGem(item.uid, 0, 'cut_ruby');
  assert(socketRes === true, 'socketGem successfully sockets Cut Ruby');
  assert.strictEqual(item.sockets[0].gem, 'cut_ruby', 'Gem correctly placed in socket slot');
  
  const unsocketRes = G.unsocketGem(item.uid, 0);
  assert(unsocketRes === true, 'unsocketGem successfully removes gem');
  assert.strictEqual(item.sockets[0].gem, null, 'Socket empty after unsocket');
});

// ── Test Group 4: Alchemy Engine ──────────────────────────────
console.log('\n--- 4. Alchemy & Brewing Engine ---');
test('Brewing cauldron, potion usage & permanent tonics', () => {
  const G = sandbox.G;
  G.save.materials.rubyCrystal = 10;
  G.save.materials.chaosShards = 20;
  
  const brewRes = G.startBrewing('elixir_berserk');
  assert(brewRes === true, 'startBrewing initiates brew');
  assert(G.save.alchemy.activeBrew !== null, 'activeBrew is set');
  
  // Fast-forward brew timer
  G.save.alchemy.activeBrew.secondsLeft = 0;
  const claimRes = G.claimBrewedPotion();
  assert(claimRes === true, 'claimBrewedPotion succeeds');
  assert(G.save.alchemy.inventory.elixir_berserk >= 1, 'Potion added to inventory');
  
  const baseDmgMult = G.computedStats.dmgMult;
  const useRes = G.usePotion('elixir_berserk');
  assert(useRes === true, 'usePotion consumes elixir');
  assert(G.save.alchemy.activePotions.elixir_berserk > 0, 'Active potion timer set');
  assert(G.computedStats.dmgMult > baseDmgMult, 'computeStats applies Berserker Elixir stat bonus');
});

// ── Test Group 5: Masteries & Monuments ─────────────────────
console.log('\n--- 5. Masteries & Monuments ---');
test('Mastery point allocation & Monument construction', () => {
  const G = sandbox.G;
  G.save.masteries.points.combat = 2;
  const preDmg = G.computedStats.dmgMult;
  
  const allocRes = G.allocateMasteryPoint('combat', 'c1');
  assert(allocRes === true, 'allocateMasteryPoint spends point');
  assert.strictEqual(G.save.masteries.allocations.combat.c1, 1, 'Combat mastery c1 allocated');
  assert(G.computedStats.dmgMult > preDmg, 'computeStats applies combat mastery bonus');
  
  // Monuments
  G.save.materials.ironAlloy = 50;
  G.save.materials.voidPlate = 20;
  G.save.materials.chaosShards = 100;
  
  const monRes = G.buildMonument('obelisk_power');
  assert(monRes === true, 'buildMonument succeeds');
  assert.strictEqual(G.save.monuments.obelisk_power, 1, 'Obelisk of Power level 1');
});

// ── Test Group 6: Save / Load Persistence ────────────────────
console.log('\n--- 6. Persistence & State Export/Import ---');
test('saveGame and loadGame persist sub-layer state cleanly', () => {
  const G = sandbox.G;
  G.saveGame();
  
  const loaded = G.loadGame();
  assert(loaded !== null, 'loadGame returns save object');
  assert(loaded.mining && loaded.mining.nodes.iron_node, 'mining state persisted');
  assert(loaded.alchemy && loaded.alchemy.inventory, 'alchemy state persisted');
  assert(loaded.masteries && loaded.masteries.allocations.combat.c1 === 1, 'masteries state persisted');
  assert(loaded.monuments && loaded.monuments.obelisk_power === 1, 'monuments state persisted');
});

console.log('\n═════════════════════════════════════════════════════════════');
console.log(`RESULTS: ${passed}/${passed + failed} tests passed.`);
console.log('═════════════════════════════════════════════════════════════');

if (failed > 0) process.exit(1);
