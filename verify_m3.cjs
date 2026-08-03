/**
 * verify_m3.js — Verification script for Milestone 3 Battle UI Feedback & Cache-Busting
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Starting Milestone 3 Verification ===\n');

// 1. Verify index.html cache-busting script tags
const indexPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const requiredScriptTags = [
  'js/eternitynum_v3.js?v=7',
  'js/data_v3.js?v=7',
  'js/game_v3.js?v=7',
  'js/ui_v3.js?v=7'
];

console.log('1. Checking script tags in index.html for ?v=7...');
for (const tag of requiredScriptTags) {
  assert(indexHtml.includes(tag), `Missing expected script tag: ${tag}`);
  console.log(`  ✓ Found script tag: ${tag}`);
}

const v5Tags = indexHtml.match(/src="js\/[a-z0-9_]+\.js\?v=5"/g);
assert(!v5Tags, `Found legacy ?v=5 script tags: ${JSON.stringify(v5Tags)}`);
console.log('  ✓ No legacy ?v=5 script tags remain.\n');

// 2. Verify js/ui_v3.js contains required render logic
const uiPath = path.join(__dirname, 'js', 'ui_v3.js');
const uiCode = fs.readFileSync(uiPath, 'utf8');

console.log('2. Checking js/ui_v3.js code contents...');
assert(uiCode.includes('Monsters:'), 'js/ui_v3.js missing Monsters: text rendering logic');
assert(uiCode.includes('boss-timer-fill') || uiCode.includes('boss-timer-bar'), 'js/ui_v3.js missing boss timer bar rendering logic');
assert(uiCode.includes('bossTimeLeft'), 'js/ui_v3.js missing bossTimeLeft calculation');
assert(uiCode.includes('autoAdvance') && uiCode.includes('toggleAutoAdvance'), 'js/ui_v3.js missing autoAdvance toggle logic');
console.log('  ✓ js/ui_v3.js contains required UI feedback and toggle logic.\n');

// 3. Functional Simulation Test
console.log('3. Running functional simulation of UI rendering and Auto-Advance toggle...');

class ElementMock {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.style = {};
    this.textContent = '';
    this.classes = new Set();
    const self = this;
    this.classList = {
      add: (c) => self.classes.add(c),
      remove: (c) => self.classes.delete(c),
      contains: (c) => self.classes.has(c)
    };
  }
}

const elements = {
  'stage-number-label': new ElementMock('stage-number-label'),
  'monsters-tracker-container': new ElementMock('monsters-tracker-container'),
  'boss-timer-container': new ElementMock('boss-timer-container'),
  'monsters-progress-text': new ElementMock('monsters-progress-text'),
  'boss-timer-text': new ElementMock('boss-timer-text'),
  'boss-timer-fill': new ElementMock('boss-timer-fill'),
  'zone-progress-fill': new ElementMock('zone-progress-fill'),
  'auto-advance-btn': new ElementMock('auto-advance-btn', 'button'),
  'enemy-hp-bar': new ElementMock('enemy-hp-bar'),
  'enemy-name': new ElementMock('enemy-name'),
  'enemy-hp-text': new ElementMock('enemy-hp-text'),
  'enemy-icon': new ElementMock('enemy-icon'),
  'enemy-card': new ElementMock('enemy-card'),
  'zone-bonus-display': new ElementMock('zone-bonus-display')
};

global.document = {
  getElementById: (id) => elements[id] || null,
  querySelector: (sel) => null,
  querySelectorAll: () => []
};

global.window = global;
global.GAME_DATA = {
  WORLDS: [{ name: 'Verdant Forest', accent: '#10b981' }],
  RARITY_INDEX: { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }
};
global.EN = {
  toNumber: (val) => typeof val === 'number' ? val : (val && val.n ? val.n : 100),
  div: (a, b) => ({ n: 100 }),
  fmt: (val) => '100'
};

global.G = {
  save: {
    currentStage: 47,
    enemiesKilledInStage: 3,
    enemiesPerStage: 10,
    isBossStage: false,
    bossTimeLeft: 45,
    autoAdvance: true,
    currentEnemy: {
      name: 'Forest Goblin',
      icon: '👹',
      hp: { n: 100 },
      maxHp: { n: 100 },
      isBoss: false,
      isElite: false
    }
  }
};

const vm = require('vm');
const context = vm.createContext({
  global,
  window: global,
  document: global.document,
  console: global.console,
  GAME_DATA: global.GAME_DATA,
  EN: global.EN,
  G: global.G
});

vm.runInContext(uiCode, context);
const UI = context.window.UI;

// Test 1: Regular Monster Fight UI
G.save.isBossStage = false;
G.save.enemiesKilledInStage = 7;
UI.renderEnemy();

assert.strictEqual(elements['stage-number-label'].textContent, 'STAGE 47');
assert.strictEqual(elements['monsters-tracker-container'].style.display, 'flex');
assert.strictEqual(elements['boss-timer-container'].style.display, 'none');
assert.strictEqual(elements['monsters-progress-text'].textContent, 'Monsters: 7 / 10');
console.log('  ✓ Regular monster fight UI verified (STAGE 47, Monsters: 7 / 10, Boss bar hidden)');

// Test 2: Boss Fight UI with 45s Timer Bar
G.save.isBossStage = true;
G.save.bossTimeLeft = 39.2;
G.save.currentEnemy.isBoss = true;
UI.renderEnemy();

assert.strictEqual(elements['stage-number-label'].textContent, 'STAGE 47');
assert.strictEqual(elements['monsters-tracker-container'].style.display, 'none');
assert.strictEqual(elements['boss-timer-container'].style.display, 'flex');
assert(elements['boss-timer-text'].textContent.includes('BOSS FIGHT') && elements['boss-timer-text'].textContent.includes('39.2s remaining'), 'Boss timer text check');
assert.strictEqual(elements['boss-timer-fill'].style.width, '87.11111111111111%');
console.log('  ✓ Boss fight UI verified (BOSS FIGHT — 39.2s remaining, Red timer bar 87.1%)');

// Test 3: Auto-Advance Toggle Functionality
assert.strictEqual(G.save.autoAdvance, true);
UI.renderAutoAdvanceBtn();
assert(elements['auto-advance-btn'].textContent.includes('Auto-Advance: ON'), 'Auto-advance button text ON check');
assert(elements['auto-advance-btn'].classList.contains('active'));

UI.toggleAutoAdvance();
assert.strictEqual(G.save.autoAdvance, false);
assert(elements['auto-advance-btn'].textContent.includes('Auto-Advance: OFF'), 'Auto-advance button text OFF check');
assert(elements['auto-advance-btn'].classList.contains('disabled'));

UI.toggleAutoAdvance();
assert.strictEqual(G.save.autoAdvance, true);
assert(elements['auto-advance-btn'].textContent.includes('Auto-Advance: ON'), 'Auto-advance button text ON check');
assert(elements['auto-advance-btn'].classList.contains('active'));

console.log('  ✓ Auto-Advance toggle verified (bound to G.save.autoAdvance, text/style updates correctly)\n');

console.log('=== All Milestone 3 Verifications PASSED Successfully! ===');
