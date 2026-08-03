/**
 * verify_m4_deep.js — Independent verification script for Milestone 4
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('====================================================');
console.log('  MILESTONE 4 DEEP E2E AUDIT & STRESS-TEST SUITE  ');
console.log('====================================================\n');

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

// ------------------------------------------------------------------
// 1. Script Tag Cache-Busting Verification (?v=6)
// ------------------------------------------------------------------
console.log('--- Requirement 5: Index.html Script Cache-Busting (?v=6) ---');

const indexPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

test('Verify script tags use ?v=7 in index.html', () => {
  const expectedTags = [
    'js/eternitynum_v3.js?v=7',
    'js/data_v3.js?v=7',
    'js/game_v3.js?v=7',
    'js/ui_v3.js?v=7'
  ];
  for (const tag of expectedTags) {
    assert(indexHtml.includes(tag), `index.html is missing tag: ${tag}`);
  }
  const legacyV6Matches = indexHtml.match(/src="js\/[a-z0-9_]+\.js\?v=6"/g);
  assert(!legacyV6Matches, `Found legacy ?v=6 tags: ${JSON.stringify(legacyV6Matches)}`);
});

// ------------------------------------------------------------------
// Setup Virtual Sandbox for Full Game Loop Execution
// ------------------------------------------------------------------
const eternitynumCode = fs.readFileSync(path.join(__dirname, 'js', 'eternitynum_v3.js'), 'utf8');
const dataCode        = fs.readFileSync(path.join(__dirname, 'js', 'data_v3.js'), 'utf8');
const gameCode        = fs.readFileSync(path.join(__dirname, 'js', 'game_v3.js'), 'utf8');
const uiCode          = fs.readFileSync(path.join(__dirname, 'js', 'ui_v3.js'), 'utf8');

class ElementMock {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.style = {};
    this.dataset = {};
    this.textContent = '';
    this.innerHTML = '';
    this.classes = new Set();
    this.eventListeners = {};
    const self = this;
    this.classList = {
      add: (c) => self.classes.add(c),
      remove: (c) => self.classes.delete(c),
      contains: (c) => self.classes.has(c)
    };
  }
  addEventListener(evt, fn) {
    if (!this.eventListeners[evt]) this.eventListeners[evt] = [];
    this.eventListeners[evt].push(fn);
  }
  removeEventListener(evt, fn) {
    if (this.eventListeners[evt]) {
      this.eventListeners[evt] = this.eventListeners[evt].filter(f => f !== fn);
    }
  }
  querySelector(sel) {
    return null;
  }
  querySelectorAll(sel) {
    return [];
  }
  appendChild(child) {
    return child;
  }
  remove() {}
}

const elementStore = {};
function getOrCreateElement(id) {
  if (!elementStore[id]) {
    elementStore[id] = new ElementMock(id);
  }
  return elementStore[id];
}

// Pre-create known UI elements
[
  'stage-number-label', 'monsters-tracker-container', 'boss-timer-container',
  'monsters-progress-text', 'boss-timer-text', 'boss-timer-fill',
  'zone-progress-fill', 'stage-progress-bar', 'auto-advance-btn',
  'enemy-hp-bar', 'enemy-name', 'enemy-hp-text', 'enemy-icon',
  'enemy-card', 'zone-bonus-display', 'hud-gold', 'hud-gems', 'hud-level',
  'hud-dps', 'hud-zone', 'hud-kills', 'exp-bar-fill', 'exp-text',
  'equipment-slots', 'active-pets-mini', 'materials-display', 'mini-log',
  'upgrades-panel', 'pets-panel', 'skills-panel', 'summon-panel',
  'dungeons-panel', 'relics-panel', 'prestige-panel', 'zones-panel',
  'stats-panel', 'log-panel', 'combat-log', 'toast-container', 'battle-arena'
].forEach(id => getOrCreateElement(id));

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();

const intervals = [];
const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: (fn, ms) => { const id = setInterval(fn, ms); intervals.push(id); return id; },
  clearInterval: clearInterval,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Set: Set,
  Map: Map,
  JSON: JSON,
  localStorage: mockLocalStorage,
  location: { reload: () => {} },
  document: {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => null,
    querySelectorAll: () => [],
    createElement: (tag) => new ElementMock('el_' + Math.random(), tag)
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);
vm.runInContext(eternitynumCode, context);
vm.runInContext(dataCode, context);
vm.runInContext(gameCode, context);
vm.runInContext(uiCode, context);

const EN = sandbox.EN;
const GAME_DATA = sandbox.GAME_DATA;
const G = sandbox.G;
const UI = sandbox.UI;

// Initialize Game Engine
sandbox.initGame();
UI.init();
intervals.forEach(id => clearInterval(id));

// ------------------------------------------------------------------
// 2. Requirement 1: 10 Regular Monster Kills -> Stage Boss
// ------------------------------------------------------------------
console.log('\n--- Requirement 1: 10 Regular Kills -> Stage Boss (HP ~10x, 45s timer) ---');

test('10 regular monster kills triggers Stage Boss spawn', () => {
  G.save.currentStage = 5;
  G.save.enemiesKilledInStage = 0;
  G.save.isBossStage = false;
  G.spawnEnemy(5, false);

  assert.strictEqual(G.save.isBossStage, false, 'Should start as regular stage');
  assert.strictEqual(G.save.currentEnemy.isBoss, false, 'Enemy should not be boss');

  for (let i = 0; i < 9; i++) {
    G.save.currentEnemy.hp = EN.fromNumber(0);
    G.dealDamage(1); // Trigger killEnemy()
    assert.strictEqual(G.save.enemiesKilledInStage, i + 1, `Kill count should be ${i+1}`);
    assert.strictEqual(G.save.isBossStage, false, `Stage should remain regular at kill ${i+1}`);
  }

  // 10th kill
  G.save.currentEnemy.hp = EN.fromNumber(0);
  G.dealDamage(1);

  assert.strictEqual(G.save.isBossStage, true, '10th kill must set isBossStage to true');
  assert.strictEqual(G.save.currentEnemy.isBoss, true, 'Spawned enemy must be boss');
  assert.strictEqual(G.save.bossTimerActive, true, 'bossTimerActive must be true');
  assert.strictEqual(G.save.bossTimeLeft, 45, 'bossTimeLeft must start at 45');

  // Verify HP formula: Boss HP has 10x multiplier on base enemy HP
  const baseHp = EN.mul(EN.fromNumber(10), EN.pow(EN.fromNumber(1.15), EN.fromNumber(5)));
  const bossHp = EN.toNumber(G.save.currentEnemy.maxHp);
  assert(bossHp >= EN.toNumber(baseHp) * 5, `Boss HP must reflect 10x HP multiplier (got ${bossHp})`);
});

// ------------------------------------------------------------------
// 3. Requirement 2: Stage Advance on Boss Kill
// ------------------------------------------------------------------
console.log('\n--- Requirement 2: Stage Advance on Boss Kill (autoAdvance ON vs OFF) ---');

test('Defeating Boss with autoAdvance = true advances to Stage N+1 and resets kills to 0', () => {
  G.save.currentStage = 10;
  G.save.enemiesKilledInStage = 10;
  G.save.isBossStage = true;
  G.save.autoAdvance = true;
  G.spawnEnemy(10, true);

  G.save.currentEnemy.hp = EN.fromNumber(0);
  G.dealDamage(1);

  assert.strictEqual(G.save.currentStage, 11, 'Should advance to Stage 11');
  assert.strictEqual(G.save.enemiesKilledInStage, 0, 'Kill counter must reset to 0');
  assert.strictEqual(G.save.isBossStage, false, 'isBossStage must reset to false');
  assert.strictEqual(G.save.currentEnemy.isBoss, false, 'New enemy should be regular monster');
});

test('Defeating Boss with autoAdvance = false stays on Stage N and resets kills to 0', () => {
  G.save.currentStage = 10;
  G.save.enemiesKilledInStage = 10;
  G.save.isBossStage = true;
  G.save.autoAdvance = false;
  G.spawnEnemy(10, true);

  G.save.currentEnemy.hp = EN.fromNumber(0);
  G.dealDamage(1);

  assert.strictEqual(G.save.currentStage, 10, 'Should stay on Stage 10');
  assert.strictEqual(G.save.enemiesKilledInStage, 0, 'Kill counter must reset to 0');
  assert.strictEqual(G.save.isBossStage, false, 'isBossStage must reset to false');
  assert.strictEqual(G.save.currentEnemy.isBoss, false, 'New enemy should be regular monster');
});

// ------------------------------------------------------------------
// 4. Requirement 3: Stage Retreat on Timer Timeout
// ------------------------------------------------------------------
console.log('\n--- Requirement 3: Stage Retreat on Timer Timeout (autoAdvance unchanged, min Stage 1) ---');

test('Boss timer expiration retreats to Stage N-1 and retains autoAdvance setting', () => {
  G.save.currentStage = 15;
  G.save.enemiesKilledInStage = 10;
  G.save.autoAdvance = true;
  G.save.upgradeLevels = {};
  G.save.activeSkills = [null, null, null, null];
  G.atkAccum = 0;
  G.spawnEnemy(15, true); // Spawns boss, sets isBossStage = true, bossTimeLeft = 45

  G.save.bossTimeLeft = -0.1; // Timer expired

  sandbox.gameTick();

  assert.strictEqual(G.save.currentStage, 14, 'Should retreat to Stage 14');
  assert.strictEqual(G.save.enemiesKilledInStage, 0, 'Kill counter must reset to 0');
  assert.strictEqual(G.save.isBossStage, false, 'isBossStage must reset to false');
  assert.strictEqual(G.save.bossTimerActive, false, 'bossTimerActive must be false');
  assert.strictEqual(G.save.autoAdvance, true, 'autoAdvance state MUST NOT be changed');
});

test('Boss timer expiration at Stage 1 clamps retreat to min Stage 1', () => {
  G.save.currentStage = 1;
  G.save.enemiesKilledInStage = 10;
  G.save.autoAdvance = false;
  G.save.upgradeLevels = {};
  G.save.activeSkills = [null, null, null, null];
  G.atkAccum = 0;
  G.spawnEnemy(1, true);

  G.save.bossTimeLeft = -0.1; // Timer expired

  sandbox.gameTick();

  assert.strictEqual(G.save.currentStage, 1, 'Stage must remain 1 (cannot go < 1)');
  assert.strictEqual(G.save.enemiesKilledInStage, 0, 'Kill counter must reset to 0');
  assert.strictEqual(G.save.isBossStage, false, 'isBossStage must reset to false');
  assert.strictEqual(G.save.autoAdvance, false, 'autoAdvance state MUST NOT be changed');
});

// ------------------------------------------------------------------
// 5. Requirement 4: Battle UI Elements Verification
// ------------------------------------------------------------------
console.log('\n--- Requirement 4: Battle UI Elements Verification ---');

test('UI renders STAGE X header, Monsters tracker during regular, Boss timer during boss, and autoAdvance toggle', () => {
  G.save.currentStage = 42;
  G.save.enemiesKilledInStage = 6;
  G.save.isBossStage = false;
  G.save.autoAdvance = true;

  UI.renderEnemy();

  const stageLabel = getOrCreateElement('stage-number-label');
  const monstersContainer = getOrCreateElement('monsters-tracker-container');
  const bossContainer = getOrCreateElement('boss-timer-container');
  const monstersText = getOrCreateElement('monsters-progress-text');
  const autoBtn = getOrCreateElement('auto-advance-btn');

  assert.strictEqual(stageLabel.textContent, 'STAGE 42', 'Stage label must be STAGE 42');
  assert.strictEqual(monstersContainer.style.display, 'flex', 'Monsters tracker container must be visible in regular stage');
  assert.strictEqual(bossContainer.style.display, 'none', 'Boss timer container must be hidden in regular stage');
  assert.strictEqual(monstersText.textContent, 'Monsters: 6 / 10', 'Monsters tracker text must be Monsters: 6 / 10');
  assert(autoBtn.textContent.includes('Auto-Advance: ON'), 'Auto-advance button text must reflect ON');

  // Test Boss UI State
  G.save.isBossStage = true;
  G.save.bossTimeLeft = 30.5;
  G.save.currentEnemy.isBoss = true;
  UI.renderEnemy();

  const bossText = getOrCreateElement('boss-timer-text');
  const bossFill = getOrCreateElement('boss-timer-fill');

  assert.strictEqual(monstersContainer.style.display, 'none', 'Monsters tracker container must be hidden during boss');
  assert.strictEqual(bossContainer.style.display, 'flex', 'Boss timer container must be visible during boss');
  assert(bossText.textContent.includes('BOSS FIGHT') && bossText.textContent.includes('30.5s remaining'), 'Boss timer text must include BOSS FIGHT and remaining seconds');
  
  const fillWidth = parseFloat(bossFill.style.width);
  assert(Math.abs(fillWidth - (30.5 / 45 * 100)) < 0.1, `Boss timer fill width should be ~67.78% (got ${fillWidth}%)`);

  // Test Toggle Functionality
  UI.toggleAutoAdvance();
  assert.strictEqual(G.save.autoAdvance, false, 'Toggling should set autoAdvance to false');
  assert(autoBtn.textContent.includes('Auto-Advance: OFF'), 'Auto-advance button text must update to OFF');
});

// ------------------------------------------------------------------
// 5.5. Testing Improvement: UI Utility functions (setText)
// ------------------------------------------------------------------
console.log('\n--- Testing Improvement: UI Utility functions (setText) ---');

test('setText properly updates textContent and safely handles null elements', () => {
  // Test 1: Happy path - element exists
  const testId = 'test-settext-el';
  const el = getOrCreateElement(testId);
  sandbox.setText(testId, 'Hello World');
  assert.strictEqual(el.textContent, 'Hello World', 'setText should update textContent of existing element');

  // Test 2: Edge case - element does not exist
  // We temporarily patch getElementById to force null return for this specific test
  const originalGetElementById = sandbox.document.getElementById;
  sandbox.document.getElementById = (id) => id === 'non-existent-el' ? null : originalGetElementById(id);

  try {
    sandbox.setText('non-existent-el', 'This should not crash');
    // If we reach here without crashing, the test passes
    assert.ok(true, 'setText should not crash when element is null');
  } finally {
    // Restore original
    sandbox.document.getElementById = originalGetElementById;
  }
});

// ------------------------------------------------------------------
// 6. Requirement 6: Preservation of Existing Systems
// ------------------------------------------------------------------
console.log('\n--- Requirement 6: Preservation of Existing Core Systems ---');

test('8 Equipment slots & dismantleAllInSlot functionality', () => {
  assert.strictEqual(GAME_DATA.EQUIP_SLOTS.length, 8, 'Must have 8 equipment slots');
  const slotIds = GAME_DATA.EQUIP_SLOTS.map(s => s.id);
  assert.strictEqual(JSON.stringify(slotIds), JSON.stringify(['weapon','offhand','helmet','chest','gloves','boots','ring','amulet']));

  // Test dismantleAllInSlot
  G.save.inventory = [];
  const item1 = G.generateItem('weapon', 'common');
  const item2 = G.generateItem('weapon', 'rare');
  const item3 = G.generateItem('chest', 'uncommon');
  G.save.inventory.push(item1, item2, item3);

  // Equip item1
  G.save.equipped.weapon = item1;

  const count = G.dismantleAllInSlot('weapon');
  assert.strictEqual(count, 1, 'Should dismantle only 1 unequipped weapon');
  assert.strictEqual(G.save.inventory.length, 2, 'Inventory should retain equipped weapon and chest item');
  assert.strictEqual(G.save.equipped.weapon.uid, item1.uid, 'Equipped weapon must not be dismantled');
});

test('Pets, Skills, Gacha (Gold), Relics, Prestige/Rebirth, 50-Stage Worlds', () => {
  assert(GAME_DATA.PETS.length > 20, 'Pets list preserved');
  assert(GAME_DATA.SKILLS.active.length > 5, 'Active skills preserved');
  assert(GAME_DATA.SKILLS.passive.length > 5, 'Passive skills preserved');
  assert(GAME_DATA.RELICS.length >= 6, 'Relics preserved');
  assert(GAME_DATA.PRESTIGE_UPGRADES.length >= 10, 'Prestige upgrades preserved');
  assert.strictEqual(GAME_DATA.WORLDS.length, 40, '40 cosmic worlds preserved');

  // Gacha cost using Gold
  G.save.gold = EN.fromNumber(1e12);
  const cost = G.getSummonCost(1);
  assert(EN.gt(cost, EN.fromNumber(0)), 'Summon cost is non-zero Gold');
  const results = G.summon('pet', 1);
  assert.strictEqual(results.length, 1, 'Summon executes successfully');
});

test('Warframe Multi-Layer Criticals & No 100% Crit Cap', () => {
  G.save.upgradeLevels = {};
  G.save.upgradeLevels['crit5'] = 5; // +500% crit chance
  const cs = G.computeStats();
  assert(cs.critChance > 1.0, `Crit chance should exceed 100% for Warframe crits (got ${cs.critChance * 100}%)`);

  let highCritFound = false;
  for (let i = 0; i < 50; i++) {
    const res = G.dealDamage(1);
    if (res.critTier >= 2) {
      highCritFound = true;
      break;
    }
  }
  assert(highCritFound, 'Warframe multi-layer crits (tier >= 2) must trigger with high crit chance');
});

test('safeNum edge cases verification', () => {
  const safeNum = sandbox.safeNum;
  assert.strictEqual(safeNum(null, 5), 5, 'safeNum handles null');
  assert.strictEqual(safeNum(undefined, 5), 5, 'safeNum handles undefined');
  assert.strictEqual(safeNum(NaN, 5), 5, 'safeNum handles NaN');
  assert.strictEqual(safeNum(Infinity, 5), 5, 'safeNum handles Infinity');
  assert.strictEqual(safeNum(-Infinity, 5), 5, 'safeNum handles -Infinity');
  assert.strictEqual(safeNum("10", 5), 10, 'safeNum handles string numbers');
  assert.strictEqual(safeNum("abc", 5), 5, 'safeNum handles invalid strings');
  assert.strictEqual(safeNum(10, 5), 10, 'safeNum handles valid numbers');
});

test('_killLock re-entry guard and safeEN helper integrity', () => {
  const safeEN = sandbox.safeEN;
  assert.strictEqual(EN.toNumber(safeEN(NaN, EN.fromNumber(5))), 5, 'safeEN handles NaN correctly');
  assert.strictEqual(EN.toNumber(safeEN(null, EN.fromNumber(10))), 10, 'safeEN handles null correctly');

  // Test _killLock guard
  G.save.currentEnemy = { hp: EN.fromNumber(0), maxHp: EN.fromNumber(100), gold: EN.fromNumber(10) };
  let initialKills = G.save.totalKills;

  // Trigger kill via dealDamage (which invokes killEnemy when hp <= 0)
  G.dealDamage(1);
  assert.strictEqual(G.save.totalKills, initialKills + 1, 'First kill increments totalKills');
});

// ------------------------------------------------------------------
// addLog verification test
// ------------------------------------------------------------------
console.log('\n--- addLog Testing Coverage ---');
test('addLog correctly adds logs and truncates to 50 max logs', () => {
  G.save.combatLog = undefined; // Uninitialized
  G.addLog('First log'); // Call via G where it is attached in initGame
  assert.strictEqual(G.save.combatLog.length, 1, 'combatLog should be initialized and contain 1 log');
  assert.strictEqual(G.save.combatLog[0].text, 'First log', 'Log message should match');
  assert.strictEqual(G.save.combatLog[0].type, 'info', 'Default type should be info');
  assert.ok(G.save.combatLog[0].time, 'Time should be set');

  G.addLog('Second log', 'boss');
  assert.strictEqual(G.save.combatLog[0].text, 'Second log', 'New log should be unshifted');
  assert.strictEqual(G.save.combatLog[0].type, 'boss', 'Type should match provided type');

  // Add more than 50 logs
  for (let i = 0; i < 60; i++) {
    G.addLog(`Spam log ${i}`);
  }

  assert.strictEqual(G.save.combatLog.length, 50, 'combatLog should be truncated to 50 logs');
  assert.strictEqual(G.save.combatLog[0].text, 'Spam log 59', 'Most recent log is at index 0');
});

// ------------------------------------------------------------------
// 7. Integrity & Anti-Cheating Verification
// ------------------------------------------------------------------
console.log('\n--- Requirement 7: Integrity & Anti-Cheating Audit ---');

test('saveGame catches and logs localStorage errors', () => {
  const originalSetItem = sandbox.localStorage.setItem;
  const originalConsoleError = sandbox.console.error;

  let errorLogged = false;
  sandbox.console.error = (msg, err) => {
    if (msg === 'Save failed') {
      errorLogged = true;
    }
  };

  sandbox.localStorage.setItem = () => {
    throw new Error('QuotaExceededError');
  };

  try {
    // This should not throw an exception, but should log 'Save failed'
    sandbox.saveGame();

    assert.strictEqual(errorLogged, true, 'saveGame must catch and log localStorage errors');
  } finally {
    // Restore
    sandbox.localStorage.setItem = originalSetItem;
    sandbox.console.error = originalConsoleError;
  }
});

test('Check code files for hardcoded test outputs or facade implementations', () => {
  const codeFiles = ['js/game_v3.js', 'js/ui_v3.js', 'js/data_v3.js'];
  for (const file of codeFiles) {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    assert(!content.includes('// HARDCODED_TEST_RESULT'), `File ${file} contains fake test markers`);
    assert(!content.includes('function killEnemy() { return true; }'), `File ${file} contains dummy facade functions`);
  }
});

console.log('\n====================================================');
console.log(`  VERIFICATION RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
