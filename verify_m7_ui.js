/**
 * verify_m7_ui.js — UI & Asset Cache Verification Script for Worker M7
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;
const indexPath = path.join(rootDir, 'index.html');
const uiPath    = path.join(rootDir, 'js', 'ui_v3.js');
const cssPath   = path.join(rootDir, 'css', 'style.css');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('=== WORKER M7 VERIFICATION START ===\n');

// 1. Verify index.html Cache Buster tags
console.log('--- 1. Cache Buster Tags (index.html) ---');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

assert(indexHtml.includes('css/style.css?v=7'), 'style.css tag updated to ?v=7');
assert(indexHtml.includes('js/eternitynum_v3.js?v=7'), 'eternitynum_v3.js tag updated to ?v=7');
assert(indexHtml.includes('js/data_v3.js?v=7'), 'data_v3.js tag updated to ?v=7');
assert(indexHtml.includes('js/game_v3.js?v=7'), 'game_v3.js tag updated to ?v=7');
assert(indexHtml.includes('js/ui_v3.js?v=7'), 'ui_v3.js tag updated to ?v=7');
assert(!indexHtml.includes('?v=6'), 'No old ?v=6 tags remain in index.html');

// 2. Verify js/ui_v3.js logic
console.log('\n--- 2. UI Functions (js/ui_v3.js) ---');
const uiJs = fs.readFileSync(uiPath, 'utf8');

// 2a. 100x Gacha Summary Grid in UI.showSummonResult
assert(uiJs.includes('UI.showSummonResult = function'), 'UI.showSummonResult function exists');
assert(uiJs.includes('summon-summary-bar'), 'Rarity summary bar element class exists in showSummonResult');
assert(uiJs.includes('summon-showcase') || uiJs.includes('HIGH RARITY HIGHLIGHTS'), 'High rarity showcase section exists in showSummonResult');
assert(uiJs.includes('id="summon-grid-container"'), '#summon-grid-container element ID present');
assert(uiJs.includes('max-height: 380px;') || uiJs.includes('max-height:380px;'), '#summon-grid-container inline style max-height: 380px present');
assert(uiJs.includes('summon-card-mini'), '.summon-card-mini class used in pull items');

// 2b. Star Badges
assert(uiJs.includes('class="star-badge"'), 'star-badge CSS class rendered in ui_v3.js');
assert(uiJs.includes('⭐${starCount}') || uiJs.includes('⭐${item.starCount}'), 'star-badge string formatted with ⭐ icon and starCount');
assert(uiJs.includes('UI.getItemTooltipHtml = function'), 'getItemTooltipHtml function defined');

// 2c. Auto-Dismantle < Equipped Rarity Toggle
assert(uiJs.includes('id="as-lower-equipped"'), 'Checkbox id="as-lower-equipped" present in renderEquipment');
assert(uiJs.includes('G.save.autoDismantleLowerThanEquipped'), 'Checkbox bound to G.save.autoDismantleLowerThanEquipped');
assert(uiJs.includes('Auto-Dismantle &lt; Equipped Rarity') || uiJs.includes('Auto-Dismantle < Equipped Rarity'), 'Auto-Dismantle label text present');

// 2d. Equip Best Pets & Equip Best Skills buttons
assert(uiJs.includes('⚡ EQUIP BEST PETS'), '"⚡ EQUIP BEST PETS" button text present');
assert(uiJs.includes('onclick="if(G.equipBestPets){G.equipBestPets();UI.showToast(\'Equipped Best Pets!\',\'success\');UI.renderPets();}"'), 'Equip Best Pets button handler exact match');
assert(uiJs.includes('⚡ EQUIP BEST SKILLS'), '"⚡ EQUIP BEST SKILLS" button text present');
assert(uiJs.includes('onclick="if(G.equipBestSkills){G.equipBestSkills();UI.showToast(\'Equipped Best Skills!\',\'success\');UI.renderSkills();}"'), 'Equip Best Skills button handler exact match');

// 3. Verify css/style.css rules
console.log('\n--- 3. CSS Rules (css/style.css) ---');
const styleCss = fs.readFileSync(cssPath, 'utf8');

assert(styleCss.includes('.star-badge'), '.star-badge rule present in style.css');
assert(styleCss.includes('.summon-summary-bar'), '.summon-summary-bar rule present in style.css');
assert(styleCss.includes('.summon-grid-container'), '.summon-grid-container rule present in style.css');
assert(styleCss.includes('.summon-card-mini'), '.summon-card-mini rule present in style.css');

console.log('\n=== VERIFICATION SUMMARY ===');
console.log(`Passed: ${passCount} | Failed: ${failCount}`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL WORKER M7 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
