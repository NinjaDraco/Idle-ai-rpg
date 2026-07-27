/**
 * ui.js — DOM rendering, panels, modal dialogs, animations, toasts
 */
"use strict";

const UI = {};
let currentTab     = 'upgrades';
let currentUpgTab  = 'combat';
let selectedSlot   = null;
let selectedItem   = null;
let currentBanner  = 'pet';
let lockedAffixes  = new Set();

// ══════════════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════════════
UI.init = function() {
  UI.bindEvents();
  UI.startRenderLoop();

  G.events.on('kill',         d  => UI.renderHUD());
  G.events.on('levelup',      lv => showToast(`🎉 Level Up! Now Lv.${lv}`, 'success'));
  G.events.on('itemDrop',     it => UI.onItemDrop(it));
  G.events.on('equip',        () => { UI.renderEquipment(); UI.renderRightPanel(); });
  G.events.on('petAdded',     () => { UI.renderPets(); UI.renderRightPanel(); });
  G.events.on('skillAdded',   () => UI.renderSkills());
  G.events.on('summonResult', d  => UI.showSummonResult(d));
  G.events.on('upgradeBought',() => UI.renderUpgrades());
  G.events.on('rebirth',      d  => UI.onRebirth(d));
  G.events.on('dmgFloat',     d  => UI.spawnDmgFloat(d));
  G.events.on('tick',         () => { UI.renderHUD(); UI.renderEnemy(); UI.renderRightPanel(); });
  G.events.on('stageClear',   d  => UI.onStageClear(d));
  G.events.on('zoneClear',    d  => { showToast(`🏆 Zone Mastered! ×${d.zonesMastered} — All stats +${(d.zonesMastered * 3).toFixed(0)}%`, 'success'); });
  G.events.on('zoneUnlocked', id => { const z = GAME_DATA.ZONES[id]; if(z) showToast(`🗺️ New Zone: ${z.name}!`, 'success'); });
};

UI.onStageClear = function({ stageNumber, bonusPct }) {
  // flash the stage bar briefly
  const bar = document.getElementById('stage-progress-bar');
  if (bar) {
    bar.classList.add('stage-flash');
    setTimeout(() => bar.classList.remove('stage-flash'), 400);
  }
};

// ══════════════════════════════════════════════════════════════════
// RENDER LOOP
// ══════════════════════════════════════════════════════════════════
UI.startRenderLoop = function() {
  let lastRender = 0;
  function loop(ts) {
    if (ts - lastRender > 150) {
      UI.renderHUD();
      UI.renderEnemy();
      UI.renderSkillCooldowns();
      lastRender = ts;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
};

// ══════════════════════════════════════════════════════════════════
// HUD
// ══════════════════════════════════════════════════════════════════
UI.renderHUD = function() {
  const s  = G.save;
  if (!s) return;
  setText('hud-gold',  '💰 ' + EN.fmt(s.gold));
  setText('hud-gems',  '💎 ' + s.gems);
  setText('hud-level', '⭐ Lv.' + s.level);
  setText('hud-dps',   '⚔️ DPS: ' + EN.fmt(G.getDPS()));
  const zoneName = GAME_DATA.ZONES[s.currentZone] ? GAME_DATA.ZONES[s.currentZone].name : 'Forest';
  setText('hud-zone',  '🗺️ ' + zoneName);
  setText('hud-kills', '💀 ' + s.totalKills.toLocaleString() + ' kills');

  const expNeeded = EN.mul(EN.fromNumber(10), EN.pow(EN.fromNumber(s.level), EN.fromNumber(1.8)));
  const expPct    = Math.min(100, EN.toNumber(EN.div(s.exp, expNeeded)) * 100);
  const expBar    = document.getElementById('exp-bar-fill');
  if (expBar) expBar.style.width = expPct + '%';
  setText('exp-text', EN.fmt(s.exp) + ' / ' + EN.fmt(expNeeded) + ' EXP');
};

// ══════════════════════════════════════════════════════════════════
// ENEMY & STAGE ARENA
// ══════════════════════════════════════════════════════════════════
UI.renderEnemy = function() {
  const enemy = G.save.currentEnemy;
  if (!enemy) return;

  const hpPct = Math.max(0, Math.min(100,
    EN.toNumber(EN.div(enemy.hp, enemy.maxHp)) * 100
  ));

  const bar = document.getElementById('enemy-hp-bar');
  if (bar) {
    bar.style.width = hpPct + '%';
    if (hpPct > 60)      bar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    else if (hpPct > 30) bar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    else                 bar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
  }

  // Enemy name with stage prefix
  const stageNum = G.save.currentStage || 1;
  const worldIdx = Math.floor((stageNum - 1) / 50) % GAME_DATA.WORLDS.length;
  const worldData = GAME_DATA.WORLDS[worldIdx] || GAME_DATA.WORLDS[0];

  let namePrefix = '';
  if (enemy.isBoss)       namePrefix = '👹 BOSS ';
  else if (enemy.isElite) namePrefix = '⚡ ELITE ';

  setText('enemy-name', namePrefix + enemy.name);
  setText('enemy-hp-text', EN.fmt(enemy.hp) + ' / ' + EN.fmt(enemy.maxHp));
  setText('enemy-icon', enemy.icon);

  const enemyCard = document.getElementById('enemy-card');
  if (enemyCard) {
    enemyCard.style.borderColor = enemy.isBoss ? '#f59e0b' : (enemy.isElite ? '#a855f7' : worldData.accent);
    enemyCard.style.boxShadow   = enemy.isBoss ? '0 0 30px rgba(245,158,11,0.5)' : (enemy.isElite ? '0 0 20px rgba(168,85,247,0.4)' : '');
  }

  // Stage progress bar (Tap Titans style: 10 enemies per stage, boss every 5th stage)
  const stageFill = document.getElementById('zone-progress-fill');
  const stageText = document.getElementById('zone-kill-text');
  const stageLabel = document.getElementById('stage-number-label');

  const kills = G.save.enemiesKilledInStage || 0;
  const req   = G.save.enemiesPerStage || 10;
  let stagePct = enemy.isBoss ? ((G.save.bossTimeLeft || 30) / 30) * 100 : Math.min(100, (kills / req) * 100);

  if (stageFill) {
    stageFill.style.width = stagePct + '%';
    if (enemy.isBoss) {
      stageFill.style.background = 'linear-gradient(90deg, #ef4444, #f59e0b)';
    } else {
      stageFill.style.background = `linear-gradient(90deg, ${worldData.accent}, #a78bfa)`;
    }
  }
  if (stageText) {
    if (enemy.isBoss) {
      const timeRemaining = Math.max(0, G.save.bossTimeLeft || 30).toFixed(1);
      stageText.textContent = `⏰ BOSS FIGHT — ${timeRemaining}s Remaining!`;
    } else {
      stageText.textContent = `Enemy ${kills + 1} / ${req} — ${worldData.name}`;
    }
  }
  if (stageLabel) {
    stageLabel.textContent = `STAGE ${stageNum}`;
    stageLabel.style.color = enemy.isBoss ? '#f59e0b' : '#a78bfa';
  }

  // Zone mastery & stage bonus display
  const bonusEl = document.getElementById('zone-bonus-display');
  if (bonusEl) {
    const maxStg = G.save.maxStage || 1;
    const bossesDefeated = Math.floor((maxStg - 1) / 5);
    const goldBonus = ((maxStg - 1) * 2).toFixed(0);
    const statBonus = (bossesDefeated * 5).toFixed(0);
    bonusEl.innerHTML = bossesDefeated > 0
      ? `👑 Titan Slayer ×${bossesDefeated} (+${statBonus}% all stats) &nbsp;|&nbsp; 💰 Stage Mastery (+${goldBonus}% gold)`
      : `💰 Stage Mastery (+${goldBonus}% gold)`;
  }
};

// ══════════════════════════════════════════════════════════════════
// EQUIPMENT PANEL (LEFT 8 SLOTS)
// ══════════════════════════════════════════════════════════════════
UI.renderEquipment = function() {
  const container = document.getElementById('equipment-slots');
  if (!container) return;
  container.innerHTML = '';

  for (const slot of GAME_DATA.EQUIP_SLOTS) {
    const item = G.save.equipped[slot.id];
    const el   = document.createElement('div');
    el.className = 'equip-slot' + (item ? ' has-item' : ' empty');
    el.dataset.slot = slot.id;

    if (item) {
      const rar = GAME_DATA.getRarityById(item.rarity);
      el.style.borderColor = rar.color;
      el.style.boxShadow   = rar.glow;
      el.innerHTML = `
        <div class="slot-header">
          <span class="slot-type-icon">${slot.icon}</span>
          <span class="item-icon">${item.icon}</span>
          <span class="item-rarity" style="color:${rar.color}">${rar.name}</span>
          <span class="item-upgrade-badge">+${item.upgradeLevel}</span>
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-affixes">
          ${(item.affixes || []).slice(0, 3).map(af => `
            <div class="affix-line" title="${af.desc.replace('{v}', (af.tierVal * 100).toFixed(1) + '%')}">
              <span class="affix-tier tier-${af.tier}">${'★'.repeat(af.tier + 1)}</span>
              <span class="affix-name">${af.name}</span>
              <span class="affix-val">+${(af.tierVal * 100).toFixed(1)}%</span>
            </div>
          `).join('')}
          ${item.affixes.length > 3 ? `<div class="affix-more">+${item.affixes.length - 3} more...</div>` : ''}
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="slot-header">
          <span class="slot-type-icon">${slot.icon}</span>
          <span class="slot-name">${slot.name}</span>
        </div>
        <div class="slot-empty-hint">${slot.desc}</div>
      `;
    }

    el.addEventListener('click', () => UI.openEquipPanel(slot.id));
    container.appendChild(el);
  }

  // Render Auto-Sell filters at bottom of equipment panel
  const filterBox = document.createElement('div');
  filterBox.className = 'auto-sell-box';
  filterBox.innerHTML = `
    <div class="auto-sell-title">⚙️ Auto-Dismantle Filter</div>
    <div class="auto-sell-options">
      <label><input type="checkbox" id="as-common" ${G.save.autoSell.common?'checked':''} onchange="G.save.autoSell.common=this.checked"> Common</label>
      <label><input type="checkbox" id="as-uncommon" ${G.save.autoSell.uncommon?'checked':''} onchange="G.save.autoSell.uncommon=this.checked"> Uncommon</label>
    </div>
  `;
  container.appendChild(filterBox);
};

UI.openEquipPanel = function(slotId) {
  selectedSlot = slotId;
  const overlay = document.getElementById('equip-modal');
  if (!overlay) return;
  const modal = overlay.querySelector('.modal-content') || overlay;

  const slot  = GAME_DATA.EQUIP_SLOTS.find(s => s.id === slotId);
  const equip = G.save.equipped[slotId];
  const inv   = G.save.inventory.filter(i => i.slotId === slotId);

  let html = `<div class="modal-header"><h2>${slot.icon} ${slot.name}</h2><button onclick="UI.closeModal('equip-modal')" class="close-btn">✕</button></div>`;

  html += `<div class="modal-section"><h3>Equipped Item</h3>`;
  if (equip) {
    html += UI.itemCardHTML(equip, true) + `<div class="item-actions">
      <button onclick="UI.openRerollPanel('${equip.uid}')" class="btn-primary">🔄 Reroll Affixes</button>
      <button onclick="G.upgradeItem(G.save.equipped['${slotId}']); UI.renderEquipment(); UI.openEquipPanel('${slotId}')" class="btn-secondary">⬆️ Upgrade (+${equip.upgradeLevel})</button>
      <button onclick="G.unequipItem('${slotId}'); UI.renderEquipment(); UI.openEquipPanel('${slotId}')" class="btn-danger">Unequip</button>
    </div>`;
  } else {
    html += `<div class="empty-slot-hint">No item equipped in this slot</div>`;
  }
  html += `</div>`;

  html += `<div class="modal-section"><h3>Inventory Items (${inv.length})</h3><div class="inventory-grid">`;
  if (inv.length === 0) {
    html += `<div class="empty-hint">No items found for this slot. Kill monsters to get gear drops!</div>`;
  }
  for (const item of inv) {
    html += `<div class="inv-item" onclick="G.equipItem(G.save.inventory.find(i=>i.uid==='${item.uid}')); UI.renderEquipment(); UI.openEquipPanel('${slotId}')">
      ${UI.itemCardHTML(item, false)}
    </div>`;
  }
  html += `</div></div>`;

  modal.innerHTML = html;
  overlay.classList.add('open');
};

UI.openRerollPanel = function(uid) {
  const item = G.save.inventory.find(i => i.uid === uid)
    || Object.values(G.save.equipped).find(i => i && i.uid === uid);
  if (!item) return;
  selectedItem = item;
  lockedAffixes = new Set();

  const overlay = document.getElementById('reroll-modal');
  if (!overlay) return;
  UI.renderRerollPanel(item);
  overlay.classList.add('open');
};

UI.renderRerollPanel = function(item) {
  const overlay = document.getElementById('reroll-modal');
  if (!overlay) return;
  const modal = overlay.querySelector('.modal-content') || overlay;
  const rar   = GAME_DATA.getRarityById(item.rarity);
  const mats  = G.save.materials;

  let html = `<div class="modal-header">
    <h2>🔄 Reroll Affixes — ${item.icon} ${item.name}</h2>
    <button onclick="UI.closeModal('reroll-modal')" class="close-btn">✕</button>
  </div>
  <div class="reroll-item-card" style="border-color:${rar.color}">
    <div class="reroll-affixes">`;

  for (let i = 0; i < item.affixes.length; i++) {
    const af     = item.affixes[i];
    const locked = lockedAffixes.has(i);
    const tierNames  = ['Basic','Enhanced','Superior','Perfect','Transcendent'];
    const tierColors = ['#9e9e9e','#4caf50','#2196f3','#9c27b0','#ff9800'];
    html += `<div class="reroll-affix ${locked ? 'locked' : ''}">
      <button class="lock-btn ${locked ? 'active' : ''}" onclick="UI.toggleAffix(${i})">🔒</button>
      <div class="af-info">
        <span class="af-tier" style="color:${tierColors[af.tier]}">${tierNames[af.tier]}</span>
        <span class="af-name">${af.name}</span>
        <span class="af-value">+${(af.tierVal * 100).toFixed(2)}%</span>
      </div>
      <button class="af-upgrade-btn" onclick="UI.upgradeAffix(${i})" title="Upgrade tier (${mats.tierStones} tier stones)">⬆️</button>
    </div>`;
  }

  html += `</div></div>
  <div class="reroll-actions">
    <div class="mat-display">
      <span class="mat">🔴 Chaos: ${mats.chaosShards}</span>
      <span class="mat">⚓ Anchor: ${mats.anchorCrystals}</span>
      <span class="mat">💎 Tier Stone: ${mats.tierStones}</span>
    </div>
    <div class="reroll-btns">
      <button onclick="UI.doReroll('chaos')" class="btn-chaos" ${mats.chaosShards < 1 ? 'disabled' : ''}>
        🔴 Chaos Roll (1 Chaos Shard)<br><small>Reroll ALL affixes</small>
      </button>
      <button onclick="UI.doReroll('targeted')" class="btn-targeted" ${mats.anchorCrystals < 1 ? 'disabled' : ''}>
        ⚓ Targeted Roll (1 Anchor Crystal)<br><small>Keep locked affixes</small>
      </button>
    </div>
  </div>`;

  modal.innerHTML = html;
};

UI.toggleAffix = function(i) {
  if (lockedAffixes.has(i)) lockedAffixes.delete(i);
  else lockedAffixes.add(i);
  UI.renderRerollPanel(selectedItem);
};

UI.upgradeAffix = function(i) {
  if (!selectedItem) return;
  G.upgradeAffix(selectedItem, i);
  UI.renderRerollPanel(selectedItem);
  UI.renderEquipment();
};

UI.doReroll = function(mode) {
  if (!selectedItem) return;
  const locked = [...lockedAffixes];
  const result = G.rerollItem(selectedItem, mode, locked);
  if (result) {
    lockedAffixes = new Set();
    UI.renderRerollPanel(selectedItem);
    UI.renderEquipment();
    G.addLog(`🔄 Rerolled ${selectedItem.name} (${mode})`, 'loot');
  } else {
    showToast('Not enough materials!', 'error');
  }
};

UI.itemCardHTML = function(item, showFull) {
  const rar = GAME_DATA.getRarityById(item.rarity);
  const tierColors = ['#9e9e9e','#4caf50','#2196f3','#9c27b0','#ff9800'];
  const tierNames  = ['B','E','S','P','T'];
  let affixHtml = '';
  const showCount = showFull ? item.affixes.length : Math.min(3, item.affixes.length);
  for (let i = 0; i < showCount; i++) {
    const af = item.affixes[i];
    affixHtml += `<div class="icard-affix" style="color:${tierColors[af.tier]}">
      [${tierNames[af.tier]}] ${af.name} +${(af.tierVal * 100).toFixed(1)}%
    </div>`;
  }
  if (item.affixes.length > showCount) {
    affixHtml += `<div class="icard-more">+${item.affixes.length - showCount} more</div>`;
  }
  return `<div class="item-card" style="border-color:${rar.color};box-shadow:${rar.glow}">
    <div class="icard-header">
      <span class="icard-icon">${item.icon}</span>
      <div>
        <div class="icard-name">${item.name}</div>
        <div class="icard-rarity" style="color:${rar.color}">${rar.name} ${item.upgradeLevel > 0 ? '+' + item.upgradeLevel : ''}</div>
      </div>
    </div>
    <div class="icard-affixes">${affixHtml}</div>
  </div>`;
};

// ══════════════════════════════════════════════════════════════════
// RIGHT PANEL (ACTIVE PETS, MATERIALS, COMBAT LOG)
// ══════════════════════════════════════════════════════════════════
UI.renderRightPanel = function() {
  const s = G.save;
  if (!s) return;

  // Active Pets
  const apEl = document.getElementById('active-pets-mini');
  if (apEl) {
    let html = '<div class="rp-pets-grid">';
    for (let i = 0; i < s.petSlots; i++) {
      const pid  = s.activePets[i];
      const pet  = pid ? GAME_DATA.PETS.find(p => p.id === pid) : null;
      const rar  = pet ? GAME_DATA.getRarityById(pet.rarity) : null;
      const owned= pid ? s.petCollection.find(p => p.petId === pid) : null;
      html += `<div class="rp-pet-card ${pet ? 'active' : 'empty'}" style="${rar ? 'border-color:'+rar.color : ''}">
        <div class="rp-pet-icon">${pet ? pet.icon : '❓'}</div>
        <div class="rp-pet-name" style="color:${rar ? rar.color : 'var(--text-dim)'}">${pet ? pet.name : 'Empty'}</div>
        ${owned ? `<div class="rp-pet-level">Lv.${owned.level}</div>` : ''}
        ${pet ? `<button class="rp-pet-btn" onclick="G.save.activePets[${i}]=null;G.computeStats();UI.renderPets();UI.renderRightPanel()">Unequip</button>` : ''}
      </div>`;
    }
    html += '</div>';
    apEl.innerHTML = html;
  }

  // Materials
  const md = document.getElementById('materials-display');
  if (md) {
    const m = s.materials;
    md.innerHTML = `
      <div class="rp-mat-item"><span>🔴 Chaos Shards</span><span>${m.chaosShards}</span></div>
      <div class="rp-mat-item"><span>⚓ Anchor Crystals</span><span>${m.anchorCrystals}</span></div>
      <div class="rp-mat-item"><span>💎 Tier Stones</span><span>${m.tierStones}</span></div>
      <div class="rp-mat-item"><span>🌑 Void Essence</span><span>${m.voidEssence}</span></div>
      <div class="rp-mat-item"><span>🧪 Pet Essence</span><span>${m.petEssence}</span></div>
      <div class="rp-mat-item"><span>🏛️ Relic Dust</span><span>${s.relicDust || 0}</span></div>
    `;
  }

  // Recent Log
  const ml = document.getElementById('mini-log');
  if (ml) {
    const logs = (s.combatLog || []).slice(0, 10);
    if (logs.length === 0) {
      ml.innerHTML = `<div style="color:var(--text-dim);font-style:italic;padding:6px">No combat logs yet...</div>`;
    } else {
      ml.innerHTML = logs.map(l => {
        const text = typeof l === 'string' ? l : l.text;
        const type = typeof l === 'object' ? l.type : 'info';
        const colorMap = { kill: '#94a3b8', boss: '#fbbf24', loot: '#a855f7', level: '#10b981', skill: '#60a5fa' };
        return `<div class="rp-log-line" style="color:${colorMap[type] || '#94a3b8'}">${text}</div>`;
      }).join('');
    }
  }
};

// ══════════════════════════════════════════════════════════════════
// PETS TAB
// ══════════════════════════════════════════════════════════════════
UI.renderPets = function() {
  const el = document.getElementById('pets-panel');
  if (!el) return;

  let html = `<div class="panel-header"><h3>🐾 Active Pets (${G.save.petSlots} slots)</h3></div>
  <div class="active-pets-row">`;

  for (let i = 0; i < G.save.petSlots; i++) {
    const pid   = G.save.activePets[i];
    const pet   = pid ? GAME_DATA.PETS.find(p => p.id === pid) : null;
    const owned = pid ? G.save.petCollection.find(p => p.petId === pid) : null;
    const rar   = pet ? GAME_DATA.getRarityById(pet.rarity) : null;
    html += `<div class="pet-slot ${pet ? 'active' : 'empty'}" style="${rar ? 'border-color:'+rar.color+';box-shadow:'+rar.glow : ''}">
      ${pet ? `
        <div class="pet-icon">${pet.icon}</div>
        <div class="pet-name" style="color:${rar.color}">${pet.name}</div>
        <div class="pet-level">Lv.${owned ? owned.level : 1}${owned && owned.evolved ? ' ✨' : ''}</div>
        <div class="pet-passive">${pet.passive}</div>
        <button onclick="G.save.activePets[${i}]=null;G.computeStats();UI.renderPets();UI.renderRightPanel()" class="pet-remove">Unequip</button>
      ` : `<div class="pet-empty">Slot ${i+1}<br><small>Empty</small></div>`}
    </div>`;
  }
  html += `</div>`;

  html += `<div class="panel-subheader"><h3>📦 Owned Pet Collection (${G.save.petCollection.length})</h3></div>
  <div class="pet-collection">`;

  if (G.save.petCollection.length === 0) {
    html += `<div class="empty-hint">No pets yet. Use the Summon tab to hatch pets!</div>`;
  }

  for (const owned of G.save.petCollection) {
    const pet = GAME_DATA.PETS.find(p => p.id === owned.petId);
    if (!pet) continue;
    const rar = GAME_DATA.getRarityById(pet.rarity);
    const evolveable = owned.level >= 50 && !owned.evolved && G.save.materials.petEssence >= 100;
    const isActive   = G.save.activePets.includes(pet.id);
    html += `<div class="pet-card ${isActive ? 'pet-active-card' : ''}" style="border-color:${rar.color}">
      <div class="petc-top">
        <span class="petc-icon">${pet.icon}</span>
        <div>
          <div class="petc-name" style="color:${rar.color}">${pet.name}</div>
          <div class="petc-rar">${rar.name}${owned.evolved ? ' ✨ Evolved' : ''}</div>
        </div>
      </div>
      <div class="petc-stats">
        <span>💥 +${(pet.dmgAura * 100 * (1 + owned.level * 0.03)).toFixed(1)}% Dmg</span>
        <span>💰 +${(pet.goldAura * 100 * (1 + owned.level * 0.03)).toFixed(1)}% Gold</span>
      </div>
      <div class="petc-passive">${pet.passive}</div>
      <div class="petc-level">
        <span>Lv.${owned.level}</span>
        <button onclick="G.levelPet('${pet.id}');UI.renderPets();UI.renderRightPanel()" class="btn-lvl" ${G.save.materials.petEssence < owned.level * 5 ? 'disabled':''}>
          Level Up (${owned.level * 5} 🧪)
        </button>
      </div>
      <div class="petc-equip">
        ${[0,1,2,3,4].slice(0,G.save.petSlots).map(s =>
          `<button onclick="G.setPetActive('${pet.id}',${s});UI.renderPets();UI.renderRightPanel()" class="btn-slot ${G.save.activePets[s]===pet.id?'active':''}">${s+1}</button>`
        ).join('')}
      </div>
    </div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
};

// ══════════════════════════════════════════════════════════════════
// SKILLS TAB
// ══════════════════════════════════════════════════════════════════
UI.renderSkills = function() {
  const el = document.getElementById('skills-panel');
  if (!el) return;

  let html = `<div class="panel-header"><h3>⚡ Active Skill Slots (4)</h3></div><div class="skill-slots-row">`;
  for (let i = 0; i < 4; i++) {
    const sid   = G.save.activeSkills[i];
    const skill = sid ? GAME_DATA.SKILLS.active.find(s => s.id === sid) : null;
    const rar   = skill ? GAME_DATA.getRarityById(skill.rarity) : null;
    const owned = sid ? G.save.skillCollection.find(s => s.skillId === sid) : null;
    const cs    = G.computedStats;
    const cdms  = skill ? (skill.cooldown * (1 - cs.cdReduction) * 1000) : 0;
    const remaining = skill ? Math.max(0, cdms - (Date.now() - (G.save.skillCooldowns[skill.id] || 0))) / 1000 : 0;

    html += `<div class="skill-slot-btn ${skill?'has-skill':'empty'}" onclick="UI.useActiveSkill(${i})" 
      style="${rar?'border-color:'+rar.color:''}" data-skill-slot="${i}">
      ${skill ? `
        <div class="sk-icon">${skill.icon}</div>
        <div class="sk-name">${skill.name}</div>
        <div class="sk-lv">Lv.${owned?owned.level:1}</div>
        ${remaining > 0 ? `<div class="sk-cd-overlay">${remaining.toFixed(1)}s</div>` : '<div class="sk-ready">READY</div>'}
      ` : `<div class="sk-empty">Slot ${i+1}<br><small>Empty</small></div>`}
    </div>`;
  }
  html += `</div>`;

  html += `<div class="panel-header"><h3>🌀 Passive Skill Slots (8)</h3></div><div class="passive-slots-row">`;
  for (let i = 0; i < 8; i++) {
    const sid   = G.save.passiveSkills[i];
    const skill = sid ? GAME_DATA.SKILLS.passive.find(s => s.id === sid) : null;
    const rar   = skill ? GAME_DATA.getRarityById(skill.rarity) : null;
    html += `<div class="passive-slot ${skill?'has-skill':'empty'}" style="${rar?'border-color:'+rar.color:''}">
      ${skill ? `<span>${skill.icon}</span> <span>${skill.name}</span>` : `<span class="ps-empty">Slot ${i+1}</span>`}
    </div>`;
  }
  html += `</div>`;

  html += `<div class="panel-header"><h3>📖 Skill Library (${G.save.skillCollection.length})</h3></div><div class="skill-collection">`;
  for (const owned of G.save.skillCollection) {
    const skill = [...GAME_DATA.SKILLS.active, ...GAME_DATA.SKILLS.passive].find(s => s.id === owned.skillId);
    if (!skill) continue;
    const rar  = GAME_DATA.getRarityById(skill.rarity);
    const type = owned.type;
    html += `<div class="skill-card" style="border-color:${rar.color}">
      <div class="skc-icon">${skill.icon}</div>
      <div class="skc-info">
        <div class="skc-name" style="color:${rar.color}">${skill.name} Lv.${owned.level}</div>
        <div class="skc-type">${type.toUpperCase()} | ${rar.name}</div>
        <div class="skc-desc">${skill.desc}</div>
      </div>
      <div class="skc-equip-btns">
        ${type === 'active' ? [0,1,2,3].map(s=>`<button onclick="G.save.activeSkills[${s}]='${skill.id}';UI.renderSkills()" class="btn-eq-slot">Slot ${s+1}</button>`).join('') : ''}
        ${type === 'passive' ? [0,1,2,3,4,5,6,7].map(s=>`<button onclick="G.save.passiveSkills[${s}]='${skill.id}';G.computeStats();UI.renderSkills()" class="btn-eq-slot">P${s+1}</button>`).join('') : ''}
      </div>
    </div>`;
  }
  if (G.save.skillCollection.length === 0) html += `<div class="empty-hint">No skills unlocked. Use the Summon tab!</div>`;
  html += `</div>`;

  el.innerHTML = html;
};

UI.useActiveSkill = function(slot) {
  G.useSkill(slot);
  UI.renderSkills();
};

UI.renderSkillCooldowns = function() {
  for (let i = 0; i < 4; i++) {
    const sid = G.save.activeSkills[i];
    if (!sid) continue;
    const skill = GAME_DATA.SKILLS.active.find(s => s.id === sid);
    if (!skill) continue;
    const cs    = G.computedStats;
    const cdms  = skill.cooldown * (1 - cs.cdReduction) * 1000;
    const elapsed = Date.now() - (G.save.skillCooldowns[skill.id] || 0);
    const rem    = Math.max(0, cdms - elapsed) / 1000;
    const btn    = document.querySelector(`[data-skill-slot="${i}"] .sk-cd-overlay`);
    const ready  = document.querySelector(`[data-skill-slot="${i}"] .sk-ready`);
    if (btn)   btn.textContent = rem.toFixed(1) + 's';
    if (ready && rem > 0) {
      ready.style.display = 'none';
      if (btn) btn.style.display = 'flex';
    } else if (ready && rem <= 0) {
      ready.style.display = 'flex';
      if (btn) btn.style.display = 'none';
    }
  }
};

// ══════════════════════════════════════════════════════════════════
// UPGRADES TAB
// ══════════════════════════════════════════════════════════════════
UI.renderUpgrades = function() {
  const el = document.getElementById('upgrades-panel');
  if (!el) return;

  const tabs = ['combat','wealth','mastery','arcane','petbond'];
  const tabNames = { combat:'⚔️ Combat', wealth:'💰 Wealth', mastery:'📚 Mastery', arcane:'🔮 Arcane', petbond:'🐾 Pet Bond' };

  let html = `<div class="sub-tabs-row" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
    <div class="sub-tabs" style="margin-bottom:0;">` + tabs.map(t =>
    `<button class="sub-tab ${currentUpgTab===t?'active':''}" onclick="currentUpgTab='${t}';UI.renderUpgrades()">${tabNames[t]}</button>`
  ).join('') + `</div>
    <button class="btn-buy-all" onclick="G.buyAllUpgrades(currentUpgTab);UI.renderUpgrades()">⚡ BUY ALL (${currentUpgTab.toUpperCase()})</button>
  </div><div class="upgrades-grid">`;

  const visible = GAME_DATA.UPGRADES.filter(u => u.tab === currentUpgTab);
  for (const up of visible) {
    const lvl      = G.save.upgradeLevels[up.id] || 0;
    const bought   = up.oneTime && lvl >= 1;
    const cost     = EN.mul(EN.convert(up.baseCost), EN.pow(EN.fromNumber(up.costScale), EN.fromNumber(lvl)));
    const canAfford= EN.meeq(G.save.gold, cost);
    html += `<div class="upgrade-card ${bought ? 'maxed' : ''} ${canAfford && !bought ? 'affordable' : ''}">
      <div class="upg-header">
        <span class="upg-icon">${up.icon}</span>
        <div>
          <div class="upg-name">${up.name}</div>
          <div class="upg-desc">${up.desc}</div>
        </div>
        ${!up.oneTime ? `<div class="upg-level">Lv.${lvl}</div>` : ''}
      </div>
      <button onclick="G.buyUpgrade('${up.id}');UI.renderUpgrades()" class="upg-buy-btn" ${bought || !canAfford ? 'disabled' : ''}>
        ${bought ? '✅ Unlocked' : '💰 ' + EN.fmt(cost)}
      </button>
    </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
};

// ══════════════════════════════════════════════════════════════════
// SUMMON TAB
// ══════════════════════════════════════════════════════════════════
UI.renderSummon = function() {
  const el = document.getElementById('summon-panel');
  if (!el) return;

  const rarityRates = [
    { name:'Common',    rate:'60%',  color:'#9e9e9e' },
    { name:'Uncommon',  rate:'25%',  color:'#4caf50' },
    { name:'Rare',      rate:'10%',  color:'#2196f3' },
    { name:'Epic',      rate:'4%',   color:'#9c27b0' },
    { name:'Legendary', rate:'0.8%', color:'#ff9800' },
  ];

  const animOn = G.save.showSummonAnim !== false;
  const cost1  = G.getSummonCost ? G.getSummonCost(1) : EN.fromNumber(5000);
  const cost10 = G.getSummonCost ? G.getSummonCost(10) : EN.fromNumber(45000);
  const canAfford1  = EN.meeq(G.save.gold, cost1);
  const canAfford10 = EN.meeq(G.save.gold, cost10);

  let html = `<div class="panel-header">
    <h3>🎰 Gacha Summon</h3>
    <div style="display:flex;gap:10px;align-items:center">
      <span class="gold-display" style="font-weight:700;color:var(--gold)">💰 ${EN.fmt(G.save.gold)} Gold</span>
      <button class="anim-toggle-btn ${animOn ? 'active' : ''}" onclick="G.save.showSummonAnim=!G.save.showSummonAnim;UI.renderSummon()" title="Toggle reveal animation">
        ${animOn ? '✨ Anim ON' : '💨 Anim OFF'}
      </button>
    </div>
  </div>
  <div class="banner-tabs">`;

  for (const b of GAME_DATA.BANNERS) {
    html += `<button class="banner-tab ${currentBanner===b.id?'active':''}" onclick="currentBanner='${b.id}';UI.renderSummon()">${b.icon} ${b.name}</button>`;
  }
  html += `</div>`;

  const pity = G.save.gachaPity[currentBanner] || 0;

  html += `<div class="banner-info">
    <div class="pity-bar">
      <div class="pity-label">Pity Progress: ${pity}/100</div>
      <div class="pity-track"><div class="pity-fill" style="width:${pity}%"></div></div>
      <div class="pity-label">Guaranteed Legendary at 100 pulls!</div>
    </div>
    <div class="rate-table">
      ${rarityRates.map(r => `<div class="rate-row"><span style="color:${r.color}">${r.name}</span><span>${r.rate}</span></div>`).join('')}
    </div>
  </div>
  <div class="summon-buttons">
    <button onclick="UI.doSummon('${currentBanner}',1)" class="btn-summon-1" ${!canAfford1 ? 'disabled':''}>
      × 1 Pull<br><small>💰 ${EN.fmt(cost1)}</small>
    </button>
    <button onclick="UI.doSummon('${currentBanner}',10)" class="btn-summon-10" ${!canAfford10 ? 'disabled':''}>
      × 10 Pull<br><small>💰 ${EN.fmt(cost10)} (1 free!)</small>
    </button>
  </div>
  <div id="summon-result-area"></div>`;

  el.innerHTML = html;
};

UI.doSummon = function(bannerId, count) {
  const cost = G.getSummonCost ? G.getSummonCost(count) : EN.fromNumber(5000);
  if (!EN.meeq(G.save.gold, cost)) { showToast('Not enough Gold!', 'error'); return; }
  const results = G.summon(bannerId, count);
  if (!results || results.length === 0) { showToast('Summon failed!', 'error'); return; }
  UI.showSummonResult({ bannerId, results });
  UI.renderSummon();
  UI.renderPets();
  UI.renderSkills();
  UI.renderHeader();
  UI.renderRightPanel();
};

UI.showSummonResult = function({ bannerId, results }) {
  const area = document.getElementById('summon-result-area');
  if (!area || !results) return;

  const useAnim = G.save.showSummonAnim !== false;

  let html = `<div class="summon-results ${useAnim ? 'anim-on' : ''}">` ;
  results.forEach((r, idx) => {
    let rar, name, icon;
    if (r.type === 'pet') {
      const pet = GAME_DATA.PETS.find(p => p.id === r.id);
      rar  = GAME_DATA.getRarityById(r.rarity);
      name = pet ? pet.name : r.id;
      icon = pet ? pet.icon : '🐾';
    } else if (r.type === 'skill') {
      const sk = [...GAME_DATA.SKILLS.active, ...GAME_DATA.SKILLS.passive].find(s => s.id === r.id);
      rar  = GAME_DATA.getRarityById(r.rarity);
      name = sk ? sk.name : r.id;
      icon = sk ? sk.icon : '⭐';
    } else {
      rar  = GAME_DATA.getRarityById(r.rarity);
      name = r.item ? r.item.name : 'Item';
      icon = r.item ? r.item.icon : '⚔️';
    }

    const delay = useAnim ? `style="animation-delay:${idx * 0.08}s"` : '';
    const isHigh = ['epic','legendary','mythic','divine','eternal','transcendent','infinite','absolute','primordial'].includes(r.rarity);
    html += `<div class="summon-result-card ${useAnim ? 'summon-reveal' : ''} ${isHigh ? 'high-rarity' : ''}" style="border-color:${rar.color};${useAnim ? `animation-delay:${idx * 0.10}s` : ''}">
      <div class="src-face">
        <div class="src-icon">${icon}</div>
        <div class="src-name">${name}</div>
        <div class="src-rar" style="color:${rar.color}">${rar.name}</div>
        ${isHigh ? `<div class="src-shine"></div>` : ''}
      </div>
    </div>`;
  });
  html += `</div>`;
  area.innerHTML = html;
};

// ══════════════════════════════════════════════════════════════════
// DUNGEONS TAB
// ══════════════════════════════════════════════════════════════════
UI.renderDungeons = function() {
  const el = document.getElementById('dungeons-panel');
  if (!el) return;

  let html = `<div class="panel-header"><h3>🏰 Ancient Dungeons</h3></div><div class="dungeon-list">`;
  for (const d of GAME_DATA.DUNGEONS) {
    html += `<div class="dungeon-card">
      <div class="d-icon">${d.icon}</div>
      <div class="d-info">
        <div class="d-name">${d.name}</div>
        <div class="d-desc">${d.desc}</div>
        <div class="d-reward">Reward: +${d.tokenReward} Tokens & Materials</div>
      </div>
      <button onclick="showToast('⚔️ Entered ${d.name}! Boss defeated!', 'success')" class="btn-dungeon">Enter Dungeon</button>
    </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
};

// ══════════════════════════════════════════════════════════════════
// RELICS TAB
// ══════════════════════════════════════════════════════════════════
UI.renderRelics = function() {
  const el = document.getElementById('relics-panel');
  if (!el) return;

  let html = `<div class="panel-header"><h3>🏛️ Ancient Relics</h3><span style="color:var(--text-sec);font-size:0.8rem">Dust: ${G.save.relicDust || 0} 🏛️</span></div>
  <div class="relics-grid">`;
  for (const r of GAME_DATA.RELICS) {
    const lvl = G.save.relicLevels[r.id] || 0;
    const cost = r.costBase * (lvl + 1);
    const canAfford = (G.save.relicDust || 0) >= cost;
    html += `<div class="relic-card ${lvl > 0 ? 'active' : ''}">
      <div class="r-icon">${r.icon}</div>
      <div class="r-name">${r.name}</div>
      <div class="r-desc">${r.desc.replace('{v}', (r.val * 100).toFixed(0))}</div>
      <div class="r-level">Lv.${lvl}</div>
      <button onclick="G.upgradeRelic('${r.id}');UI.renderRelics();UI.renderRightPanel()" class="r-btn" ${!canAfford ? 'disabled':''}>
        Upgrade (${cost} 🏛️)
      </button>
    </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
};

// ══════════════════════════════════════════════════════════════════
// PRESTIGE TAB
// ══════════════════════════════════════════════════════════════════
UI.renderPrestige = function() {
  const el = document.getElementById('prestige-panel');
  if (!el) return;
  const s = G.save;
  const shardsGain = G.getSoulShardsGain();

  let html = `<div class="prestige-header">
    <div class="prestige-stat">🔮 Rebirths: ${s.rebirths}</div>
    <div class="prestige-stat">💠 Soul Shards: ${s.soulShards}</div>
  </div>
  <div class="rebirth-action">
    <div class="rebirth-preview">
      Rebirth now to gain: <strong>${shardsGain} Soul Shards</strong><br>
      <small>Resets gold, EXP, and zone, but keeps Soul Shards & Prestige Upgrades!</small>
    </div>
    <button onclick="UI.confirmRebirth()" class="btn-rebirth">🌟 REBIRTH NOW (+${shardsGain} shards)</button>
  </div>
  <div class="prestige-upgrades-grid">
    <h3>💠 Soul Shards Upgrades</h3>
    <div class="pup-grid">`;

  for (const pu of GAME_DATA.PRESTIGE_UPGRADES) {
    const bought = s.prestigeUpgrades[pu.id] || 0;
    const canAfford = s.soulShards >= pu.cost;
    html += `<div class="pup-card ${bought ? 'pup-maxed' : ''} ${canAfford && !bought ? 'pup-affordable' : ''}">
      <div class="pup-icon">${pu.icon}</div>
      <div class="pup-name">${pu.name}</div>
      <div class="pup-desc">${pu.desc}</div>
      <button onclick="G.buyPrestigeUpgrade('${pu.id}');UI.renderPrestige()" class="pup-btn" ${bought || !canAfford ? 'disabled':''}>
        ${bought ? '✅ Unlocked' : `${pu.cost} 💠`}
      </button>
    </div>`;
  }

  html += `</div></div>`;
  el.innerHTML = html;
};

UI.confirmRebirth = function() {
  if (confirm(`Rebirth now for ${G.getSoulShardsGain()} Soul Shards?`)) {
    G.rebirth();
    UI.renderAll();
  }
};

// ══════════════════════════════════════════════════════════════════
// ZONES TAB
// ══════════════════════════════════════════════════════════════════
UI.renderZones = function() {
  const el = document.getElementById('zones-panel');
  if (!el) return;
  const maxStg = G.save.maxStage || 1;
  const currStg = G.save.currentStage || 1;
  let html = `<div class="panel-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
    <h3>🗺️ Cosmic Worlds (Tap Titans Progression)</h3>
    <div style="font-size:0.95rem;color:var(--legendary);background:rgba(245,158,11,0.15);padding:6px 12px;border-radius:20px;border:1px solid var(--legendary)">Max Stage Reached: <strong>STAGE ${maxStg}</strong></div>
  </div>
  <div class="stage-jump-box" style="display:flex;align-items:center;gap:12px;background:var(--bg-card);padding:14px;border-radius:12px;border:1px solid var(--border);margin-bottom:16px;">
    <span style="font-weight:600;color:var(--text-main);">🚀 Quick Warp to Stage:</span>
    <input type="number" id="stage-jump-input" min="1" max="${maxStg}" value="${currStg}" style="width:100px;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--bg-main);color:var(--text-main);font-weight:700;text-align:center;">
    <button onclick="const val = parseInt(document.getElementById('stage-jump-input').value); if(G.travelToZone(val)){ UI.renderZones(); UI.renderEnemy(); showToast('Warped to Stage ' + val, 'success'); } else { showToast('Invalid stage or higher than Max Stage!', 'error'); }" class="btn-jump" style="background:var(--accent);color:#fff;padding:8px 16px;border:none;border-radius:6px;font-weight:700;cursor:pointer;">Warp Now</button>
  </div>
  <div class="zones-grid">`;

  for (let i = 0; i < GAME_DATA.WORLDS.length; i++) {
    const world = GAME_DATA.WORLDS[i];
    const minStg = i * 50 + 1;
    const maxWorldStg = (i + 1) * 50;
    const unlocked = maxStg >= minStg;
    const isCurrentWorld = currStg >= minStg && currStg <= maxWorldStg;

    html += `<div class="zone-card ${isCurrentWorld ? 'zone-current' : ''} ${unlocked ? '' : 'zone-locked'}"
      style="background:${world.bg};border-color:${unlocked ? world.accent : '#333'}" 
      onclick="${unlocked ? `G.travelToZone(${minStg});UI.renderZones();UI.renderEnemy();showToast('Warped to Stage ${minStg}', 'success')` : ''}">
      <div class="zone-icon">${world.icon}</div>
      <div class="zone-name">${world.name}</div>
      <div style="font-size:0.85rem;color:var(--text-sec);margin:6px 0;font-weight:600;">Stages ${minStg} - ${maxWorldStg}</div>
      ${isCurrentWorld ? '<div class="zone-badge">ACTIVE WORLD</div>' : ''}
      ${!unlocked ? `<div class="zone-locked-info">Reach Stage ${minStg}</div>` : `<div style="margin-top:8px;font-size:0.8rem;color:var(--accent);font-weight:700;">Click to Warp ➔</div>`}
    </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
};

// ══════════════════════════════════════════════════════════════════
// STATS TAB
// ══════════════════════════════════════════════════════════════════
UI.renderStats = function() {
  const el = document.getElementById('stats-panel');
  if (!el) return;
  const s  = G.save;
  const cs = G.computedStats;
  const seconds = Math.floor(s.timePlayed);
  const h = Math.floor(seconds/3600), m = Math.floor((seconds%3600)/60), sec = seconds%60;

  const critTiers = Math.floor(cs.critChance);
  const critDesc  = critTiers >= 5 ? '🌌 Cosmic Blue Crits!' : (critTiers === 4 ? '💜 Purple Crits!' : (critTiers === 3 ? '☄️ Red Crits!' : (critTiers === 2 ? '🔥 Orange Crits!' : (cs.critChance >= 1 ? '💛 Yellow Crits Guaranteed!' : 'Normal Crits'))));

  const html = `<div class="stats-grid">
    <div class="stat-row"><span>⚔️ Total Damage</span><span>${EN.fmt(s.totalDmgDone)}</span></div>
    <div class="stat-row"><span>💀 Total Kills</span><span>${s.totalKills.toLocaleString()}</span></div>
    <div class="stat-row"><span>👹 Boss Kills</span><span>${s.bossKills.toLocaleString()}</span></div>
    <div class="stat-row"><span>⚡ Elite Kills</span><span>${s.stats.eliteKills.toLocaleString()}</span></div>
    <div class="stat-row"><span>💰 Gold Earned</span><span>${EN.fmt(s.totalGoldEarned)}</span></div>
    <div class="stat-row"><span>⏱️ Time Played</span><span>${h}h ${m}m ${sec}s</span></div>
    <div class="stat-row"><span>🚀 Highest Stage</span><span>Stage ${s.maxStage || 1}</span></div>
    <div class="stat-row divider"></div>
    <div class="stat-row"><span>⚔️ Current DPS</span><span>${EN.fmt(G.getDPS())}</span></div>
    <div class="stat-row"><span>💥 Crit Chance</span><span>${(cs.critChance*100).toFixed(1)}% (${critDesc})</span></div>
    <div class="stat-row"><span>💥 Crit Damage</span><span>${(cs.critDmg*100).toFixed(0)}%</span></div>
    <div class="stat-row"><span>⚡ Atk Speed</span><span>${cs.atkSpeed.toFixed(2)}×</span></div>
    <div class="stat-row"><span>💰 Gold Find</span><span>${(cs.goldFind*100).toFixed(0)}%</span></div>
    <div class="stat-row"><span>🐾 Pet Dmg</span><span>+${(cs.petDmg*100).toFixed(0)}%</span></div>
    <div class="stat-row"><span>🔮 Skill Power</span><span>+${(cs.skillDmg*100).toFixed(0)}%</span></div>
  </div>`;
  el.innerHTML = html;
};

// ══════════════════════════════════════════════════════════════════
// COMBAT LOG TAB
// ══════════════════════════════════════════════════════════════════
UI.renderCombatLog = function() {
  const el = document.getElementById('combat-log');
  if (!el) return;
  const logs = G.save.combatLog || [];
  el.innerHTML = logs.slice(0, 30).map(l => {
    const text = typeof l === 'string' ? l : l.text;
    const type = typeof l === 'object' ? l.type : 'info';
    return `<div class="log-entry log-${type}">${text}</div>`;
  }).join('');
};

// ══════════════════════════════════════════════════════════════════
// FLOATING DAMAGE NUMBERS
// ══════════════════════════════════════════════════════════════════
UI.spawnDmgFloat = function({ text, isCrit, isClick, critTier = 0 }) {
  const arena = document.getElementById('battle-arena');
  if (!arena) return;
  const el  = document.createElement('div');
  let tierClass = '';
  if (critTier === 1) tierClass = ' crit crit-yellow';
  else if (critTier === 2) tierClass = ' crit crit-orange';
  else if (critTier === 3) tierClass = ' crit crit-red';
  else if (critTier === 4) tierClass = ' crit crit-purple';
  else if (critTier >= 5) tierClass = ' crit crit-blue';
  else if (isCrit) tierClass = ' crit crit-yellow';

  el.className = 'dmg-float' + tierClass + (isClick ? ' click' : '');
  const prefix = critTier >= 5 ? '🌌 ' : (critTier === 4 ? '💜 ' : (critTier === 3 ? '☄️ ' : (critTier === 2 ? '🔥 ' : (isCrit ? '💥 ' : ''))));
  el.textContent = prefix + text + (critTier > 1 ? ` (${critTier}x Crit!)` : '');
  const x = 30 + Math.random() * 40;
  const y = 30 + Math.random() * 30;
  el.style.left = x + '%';
  el.style.top  = y + '%';
  arena.appendChild(el);
  setTimeout(() => el.remove(), 1000);
};

// ══════════════════════════════════════════════════════════════════
// TAB SWITCHING
// ══════════════════════════════════════════════════════════════════
UI.switchTab = function(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(tabId + '-panel');
  if (panel) panel.classList.add('active');
  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');

  if (tabId === 'upgrades')  UI.renderUpgrades();
  if (tabId === 'pets')      UI.renderPets();
  if (tabId === 'skills')    UI.renderSkills();
  if (tabId === 'summon')    UI.renderSummon();
  if (tabId === 'dungeons')  UI.renderDungeons();
  if (tabId === 'relics')    UI.renderRelics();
  if (tabId === 'prestige')  UI.renderPrestige();
  if (tabId === 'zones')     UI.renderZones();
  if (tabId === 'stats')     UI.renderStats();
  if (tabId === 'log')       UI.renderCombatLog();
};

UI.onItemDrop = function(item) {
  const rar = GAME_DATA.getRarityById(item.rarity);
  if (GAME_DATA.RARITY_INDEX[item.rarity] >= 3) {
    showToast(`🎁 [${rar.name}] ${item.name} dropped!`, 'loot');
  }
  UI.renderEquipment();
};

UI.onRebirth = function({ shards }) {
  showToast(`🌟 Rebirth! +${shards} Soul Shards`, 'prestige');
  UI.renderAll();
};

UI.bindEvents = function() {
  const arena = document.getElementById('battle-arena');
  if (arena) {
    arena.addEventListener('click', (e) => {
      if (e.target.closest('.skill-slot-btn') || e.target.closest('.btn-toggle-auto')) return;
      G.dealDamage(1, true);
      G.save.stats.totalClicks = (G.save.stats.totalClicks || 0) + 1;
    });
  }

  document.querySelectorAll('.main-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => UI.switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('open');
    });
  });

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) saveBtn.addEventListener('click', () => { G.saveGame(); showToast('Game Saved!', 'success'); });

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm('⚠️ Reset all progress? This cannot be undone!')) {
      localStorage.removeItem('eternityRPGSave');
      location.reload();
    }
  });
};

UI.closeModal = function(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
};

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3000);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

UI.renderAll = function() {
  UI.renderHUD();
  UI.renderEnemy();
  UI.renderEquipment();
  UI.renderRightPanel();
  UI.renderUpgrades();
  UI.renderPets();
  UI.renderSkills();
  UI.renderSummon();
  UI.renderPrestige();
  UI.renderZones();
  UI.renderStats();
  UI.renderCombatLog();
};

window.UI = UI;
window.showToast = showToast;
