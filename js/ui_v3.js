/**
 * ui_v3.js — Visual Art & Modern 3-Column Glassmorphism Layout (v7)
 * Implements 6 Master Sub-Layer Tabs, Emoji Elimination, RPG Flavor Text,
 * Status Effect Badges, Combo Burst Triggers, and Smooth Glass Tooltips.
 */
"use strict";

const UI = {};
let currentMasterTab = 'battle';
let currentTab       = 'upgrades';
let currentUpgTab    = 'combat';
let selectedSlot     = null;
let selectedItem     = null;
let currentBanner    = 'pet';
let lockedAffixes    = new Set();

let globalPetLookup  = null;
UI.comboStreak       = 0;
UI.comboTimeout      = null;

// ══════════════════════════════════════════════════════════════════
// 6 MASTER SUB-LAYER TABS CONFIGURATION
// ══════════════════════════════════════════════════════════════════
UI.MASTER_TABS = {
  battle: {
    id: 'battle',
    name: 'Battle',
    icon: '<svg class="master-tab-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M7 2l-4 4 11 11 4-4zm10 12l-2 2 4 4 2-2zm-6-2l-4-4 2-2 4 4z"/></svg>',
    subTabs: [
      { id: 'upgrades', name: 'Upgrades' },
      { id: 'dungeons', name: 'Dungeons Raid' },
      { id: 'stats',    name: 'Combat Stats' },
      { id: 'log',      name: 'Combat Log' }
    ]
  },
  mining: {
    id: 'mining',
    name: 'Mining',
    icon: '<svg class="master-tab-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M14.7 6.3l-2.1-2.1c-.4-.4-1-.4-1.4 0l-7.1 7.1c-.4.4-.4 1 0 1.4l2.1 2.1c.4.4 1 .4 1.4 0l7.1-7.1c.4-.4.4-1 0-1.4zM20.7 2.3c-.4-.4-1-.4-1.4 0l-3.5 3.5 2.8 2.8 3.5-3.5c.4-.4.4-1 0-1.4z"/></svg>',
    subTabs: [
      { id: 'mining-ores',      name: 'Deep Ore Nodes' },
      { id: 'mining-refinery',  name: 'Void Refinery' },
      { id: 'mining-resources', name: 'Materials & Shards' }
    ]
  },
  forge: {
    id: 'forge',
    name: 'Forge',
    icon: '<svg class="master-tab-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.4-2.4c.4-.4.4-1 0-1.3z"/></svg>',
    subTabs: [
      { id: 'forge-smelter',   name: 'Alloy Smelter' },
      { id: 'forge-equipment', name: 'Mythic Gear Forge' },
      { id: 'forge-gems',      name: 'Gem Socketing' },
      { id: 'forge-reroll',    name: 'Affix Enchanter' }
    ]
  },
  alchemy: {
    id: 'alchemy',
    name: 'Alchemy',
    icon: '<svg class="master-tab-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M19 19L14 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H9c-.55 0-1 .45-1 1s.45 1 1 1h1v5L5 19c-.77.94-.09 2.34 1.13 2.34h11.75c1.22 0 1.9-1.4 1.12-2.34z"/></svg>',
    subTabs: [
      { id: 'alchemy-brew',    name: 'Brewing Cauldron' },
      { id: 'alchemy-potions', name: 'Potion Bag & Buffs' },
      { id: 'alchemy-tonics',  name: 'Permanent Tonics' },
      { id: 'summon',          name: 'Gacha Summon' }
    ]
  },
  skilltrees: {
    id: 'skilltrees',
    name: 'Skill Trees',
    icon: '<svg class="master-tab-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
    subTabs: [
      { id: 'skills',    name: 'Active & Passive Skills' },
      { id: 'pets',      name: 'Pet Companions' },
      { id: 'masteries', name: 'Skill Masteries' }
    ]
  },
  monuments: {
    id: 'monuments',
    name: 'Monuments',
    icon: '<svg class="master-tab-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M4 22h16V20H4v2zM6 4h3v14H6V4zm6 0h3v14h-3V4zM2 2h20v2H2V2z"/></svg>',
    subTabs: [
      { id: 'monuments-shrine', name: 'Sacred Monuments' },
      { id: 'constellation',    name: 'Constellation Tree' },
      { id: 'relics',           name: 'Ancient Relics' },
      { id: 'prestige',         name: 'Soul Rebirth' }
    ]
  }
};

// RPG Flavor Generator for Rich Tooltips & Item Lore
UI.FLAVOR_TEXTS = [
  "Forged in cosmic starfire, this artifact reverberates with celestial power.",
  "An ancient relic carved from obsidian, thirsting for victorious battle.",
  "Imbued with primordial elemental energy, amplifying the wielder's soul.",
  "Discovered deep within the Titan's Vault, glowing with eternal aura.",
  "Tempered by heroic combat, granting unyielding tactical advantage.",
  "Crafted by ancient alchemists using rare chaos shards and starlight."
];

UI.getFlavorText = function(seedStr = '') {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) hash = (hash << 5) - hash + seedStr.charCodeAt(i);
  const idx = Math.abs(hash) % UI.FLAVOR_TEXTS.length;
  return UI.FLAVOR_TEXTS[idx];
};

// Clean Icon Helper: Converts emoji strings to SVG icons or Generated Image Artwork
UI.cleanIcon = function(iconStr, altText = '') {
  if (!iconStr) return '<span class="icon-badge">★</span>';

  if (iconStr.includes('👹') || iconStr.includes('boss')) {
    return `<img src="images/boss_titan.jpg" class="art-icon" alt="Boss Titan">`;
  }
  if (iconStr.includes('🐉') || iconStr.includes('dragon') || iconStr.includes('🐾') || iconStr.includes('pet')) {
    return `<img src="images/cosmic_dragon.jpg" class="art-icon" alt="Cosmic Dragon">`;
  }
  if (iconStr.includes('⚔️') || iconStr.includes('sword') || iconStr.includes('weapon')) {
    return `<img src="images/legendary_sword.jpg" class="art-icon" alt="Legendary Sword">`;
  }
  if (iconStr.includes('💰') || iconStr.includes('gold') || iconStr.includes('💎') || iconStr.includes('gem') || iconStr.includes('resources')) {
    return `<img src="images/resources_art.jpg" class="art-icon" alt="Resources">`;
  }
  if (iconStr.includes('🛡️') || iconStr.includes('equip') || iconStr.includes('armor')) {
    return `<img src="images/equipment_art.jpg" class="art-icon" alt="Equipment">`;
  }

  // Common SVG Icon Mappings
  if (iconStr.includes('⭐') || iconStr.includes('star')) {
    return `<svg class="ui-icon icon-star" viewBox="0 0 24 24"><polygon fill="#fbbf24" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>`;
  }
  if (iconStr.includes('✨') || iconStr.includes('magic')) {
    return `<svg class="ui-icon icon-magic" viewBox="0 0 24 24"><path fill="#a78bfa" d="M12 2L9.19 8.63 2 12l7.19 3.37L12 22l2.81-6.63L22 12l-7.19-3.37z"/></svg>`;
  }
  if (iconStr.includes('⚡') || iconStr.includes('bolt')) {
    return `<svg class="ui-icon icon-bolt" viewBox="0 0 24 24"><path fill="#f59e0b" d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`;
  }
  if (iconStr.includes('🔮') || iconStr.includes('orb')) {
    return `<svg class="ui-icon icon-orb" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#a855f7"/></svg>`;
  }
  if (iconStr.includes('🏛️') || iconStr.includes('relic')) {
    return `<svg class="ui-icon icon-relic" viewBox="0 0 24 24"><path fill="#eab308" d="M4 22h16V20H4v2zM6 4h3v14H6V4zm6 0h3v14h-3V4zm6 0h3v14h-3V4zM2 2h20v2H2V2z"/></svg>`;
  }
  if (iconStr.includes('📜') || iconStr.includes('scroll')) {
    return `<svg class="ui-icon icon-scroll" viewBox="0 0 24 24"><path fill="#94a3b8" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;
  }

  // Strip raw emoji Unicode characters if any remain
  const cleanStr = iconStr.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
  if (cleanStr.length > 0) return `<span class="icon-badge">${cleanStr}</span>`;
  return `<span class="icon-badge">★</span>`;
};

// ══════════════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════════════
UI.init = function() {
  UI.bindEvents();
  UI.startRenderLoop();
  UI.renderAutoAdvanceBtn();
  UI.switchMasterTab('battle');

  G.events.on('kill',         d  => { UI.renderHUD(); UI.registerHitCombo(); });
  G.events.on('levelup',      lv => showToast(`Level Up! Now Lv.${lv}`, 'success'));
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
  G.events.on('zoneClear',    d  => { showToast(`Zone Mastered! ×${d.zonesMastered} — All stats +${(d.zonesMastered * 3).toFixed(0)}%`, 'success'); });
  G.events.on('zoneUnlocked', id => { const z = GAME_DATA.ZONES[id]; if(z) showToast(`New Zone: ${z.name}!`, 'success'); });
};

UI.onStageClear = function({ stageNumber, bonusPct }) {
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
    // Live-refresh mining sub-panels so auto-mining progress bars update in real time
    if (currentMasterTab === 'mining') {
      if (UI._miningRefreshTs === undefined) UI._miningRefreshTs = 0;
      if (ts - UI._miningRefreshTs > 600) {
        UI._miningRefreshTs = ts;
        UI.renderMiningPanel();
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
};

// ══════════════════════════════════════════════════════════════════
// HUD (No Emojis)
// ══════════════════════════════════════════════════════════════════
UI.renderHUD = function() {
  const s = G.save;
  if (!s) return;
  setHudVal('hud-gold',  EN.fmt(s.gold));
  setHudVal('hud-gems',  s.gems);
  setHudVal('hud-level', 'Lv.' + s.level);
  setHudVal('hud-dps',   'DPS: ' + EN.fmt(G.getDPS()));
  const zoneName = GAME_DATA.ZONES[s.currentZone] ? GAME_DATA.ZONES[s.currentZone].name : 'Forest';
  setHudVal('hud-zone',  zoneName);
  setHudVal('hud-kills', s.totalKills.toLocaleString() + ' kills');

  const expNeeded = EN.mul(EN.fromNumber(10), EN.pow(EN.fromNumber(s.level), EN.fromNumber(1.8)));
  const expPct    = Math.min(100, EN.toNumber(EN.div(s.exp, expNeeded)) * 100);
  const expBar    = document.getElementById('exp-bar-fill');
  if (expBar) expBar.style.width = expPct + '%';
  setText('exp-text', EN.fmt(s.exp) + ' / ' + EN.fmt(expNeeded) + ' EXP');
};

// ══════════════════════════════════════════════════════════════════
// ENEMY & BATTLE ARENA (Status Badges, Boss Titan Art, Combo Burst)
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

  const stageNum = G.save.currentStage || 1;
  const worldIdx = Math.floor((stageNum - 1) / 50) % GAME_DATA.WORLDS.length;
  const worldData = GAME_DATA.WORLDS[worldIdx] || GAME_DATA.WORLDS[0];

  let namePrefix = '';
  if (enemy.isBoss)       namePrefix = 'BOSS ';
  else if (enemy.isElite) namePrefix = 'ELITE ';

  setText('enemy-name', namePrefix + enemy.name);
  setText('enemy-hp-text', EN.fmt(enemy.hp) + ' / ' + EN.fmt(enemy.maxHp));

  // Enemy Avatar / Artwork
  const iconContainer = document.getElementById('enemy-icon');
  if (iconContainer) {
    if (enemy.isBoss || G.save.isBossStage) {
      iconContainer.innerHTML = `<img src="images/boss_titan.jpg" class="enemy-art-img" alt="${enemy.name}">`;
    } else {
      iconContainer.innerHTML = `<img src="images/cosmic_dragon.jpg" class="enemy-art-img" alt="${enemy.name}">`;
    }
  }

  const enemyCard = document.getElementById('enemy-card');
  if (enemyCard) {
    enemyCard.style.borderColor = enemy.isBoss ? '#f59e0b' : (enemy.isElite ? '#a855f7' : worldData.accent);
    enemyCard.style.boxShadow   = enemy.isBoss ? '0 0 30px rgba(245,158,11,0.5)' : (enemy.isElite ? '0 0 20px rgba(168,85,247,0.4)' : '');

    // Add Status Effect Badges
    let badgesEl = (enemyCard.querySelector ? enemyCard.querySelector('.status-badges') : null);
    if (!badgesEl && enemyCard.appendChild && document.createElement) {
      badgesEl = document.createElement('div');
      badgesEl.className = 'status-badges';
      enemyCard.appendChild(badgesEl);
    }
    if (badgesEl) {
      badgesEl.innerHTML = `
        <span class="status-badge badge-burn">BURN</span>
        <span class="status-badge badge-bleed">BLEED</span>
        <span class="status-badge badge-empower">EMPOWERED</span>
      `;
    }
  }

  // Stage Header & Battle Progress Tracker vs Boss 45s Timer Bar
  const stageLabel = document.getElementById('stage-number-label');
  if (stageLabel) {
    stageLabel.textContent = G.save.activeDungeon ? `RAID: ${G.save.activeDungeon.name.toUpperCase()} (LV.${G.save.activeDungeon.level})` : `STAGE ${stageNum}`;
    stageLabel.style.color = G.save.activeDungeon ? '#f59e0b' : (G.save.isBossStage ? '#ef4444' : '#a78bfa');
  }

  const monstersContainer = document.getElementById('monsters-tracker-container');
  const bossContainer     = document.getElementById('boss-timer-container');
  const monstersText      = document.getElementById('monsters-progress-text');
  const fallbackStageText = document.getElementById('zone-kill-text');
  const stageFill         = document.getElementById('zone-progress-fill');

  const kills = G.save.enemiesKilledInStage || 0;
  const req   = G.save.enemiesPerStage || 10;

  if (G.save.isBossStage) {
    if (monstersContainer) monstersContainer.style.display = 'none';
    if (bossContainer)     bossContainer.style.display     = 'flex';

    const timeLeft = Math.max(0, G.save.bossTimeLeft !== undefined ? G.save.bossTimeLeft : 45);
    const bossTimerText = document.getElementById('boss-timer-text');
    const labelText = G.save.activeDungeon ? `RAID TITAN FIGHT — ${timeLeft.toFixed(1)}s remaining` : `BOSS FIGHT — ${timeLeft.toFixed(1)}s remaining`;
    if (bossTimerText) {
      bossTimerText.textContent = labelText;
    } else if (fallbackStageText) {
      fallbackStageText.textContent = labelText;
    }

    const bossFill = document.getElementById('boss-timer-fill');
    const bossPct  = Math.max(0, Math.min(100, (timeLeft / (G.save.activeDungeon ? 30 : 45)) * 100));
    if (bossFill) {
      bossFill.style.width = bossPct + '%';
    }
    if (stageFill) {
      stageFill.style.width = bossPct + '%';
      stageFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    }
  } else {
    if (bossContainer)     bossContainer.style.display     = 'none';
    if (monstersContainer) monstersContainer.style.display = 'flex';

    const monstersString = `Monsters: ${kills} / ${req}`;
    if (monstersText) {
      monstersText.textContent = monstersString;
    }
    if (fallbackStageText) {
      fallbackStageText.textContent = monstersString;
    }

    const killPct = Math.min(100, (kills / req) * 100);
    if (stageFill) {
      stageFill.style.width = killPct + '%';
      stageFill.style.background = `linear-gradient(90deg, ${worldData.accent}, #a78bfa)`;
    }
  }

  UI.renderAutoAdvanceBtn();

  // Zone mastery display
  const bonusEl = document.getElementById('zone-bonus-display');
  if (bonusEl) {
    if (G.save.activeDungeon) {
      bonusEl.innerHTML = `<button onclick="G.exitDungeon(false);UI.renderEnemy();UI.renderDungeons();UI.renderRightPanel()" style="padding:5px 16px;background:linear-gradient(90deg,#ef4444,#b91c1c);color:#fff;border:none;border-radius:6px;font-weight:800;cursor:pointer;box-shadow:0 0 12px rgba(239,68,68,0.5);font-size:0.85rem;">ABORT RAID &amp; RETURN TO NORMAL STAGE</button>`;
    } else {
      const maxStg = G.save.maxStage || 1;
      const bigZones = Math.floor((maxStg - 1) / 10);
      const stageBonusPct = ((maxStg - 1) * 5).toFixed(0);
      const zoneBonusPct  = (bigZones * 20).toFixed(0);
      bonusEl.innerHTML = bigZones > 0
        ? `Big Zone Mastery ×${bigZones} (+${zoneBonusPct}% ALL STATS) &nbsp;|&nbsp; Stage Pass (+${stageBonusPct}% Gold/EXP)`
        : `Stage Pass (+${stageBonusPct}% Gold/EXP)`;
    }
  }
};

UI.toggleAutoAdvance = function() {
  if (!G.save) return;
  G.save.autoAdvance = !G.save.autoAdvance;
  G.save.autoAdvanceZone = G.save.autoAdvance;
  UI.renderAutoAdvanceBtn();
};

UI.renderAutoAdvanceBtn = function() {
  const btn = document.getElementById('auto-advance-btn');
  if (!btn || !G.save) return;
  const isAuto = G.save.autoAdvance !== false;
  btn.textContent = isAuto ? 'Auto-Advance: ON' : 'Auto-Advance: OFF';
  if (isAuto) {
    btn.classList.add('active');
    btn.classList.remove('disabled');
  } else {
    btn.classList.remove('active');
    btn.classList.add('disabled');
  }
};

// Combo Burst Visual Triggers
UI.registerHitCombo = function() {
  UI.comboStreak++;
  if (UI.comboTimeout) clearTimeout(UI.comboTimeout);
  UI.comboTimeout = setTimeout(() => { UI.comboStreak = 0; }, 2500);

  const arena = document.getElementById('battle-arena');
  if (!arena) return;

  let comboEl = (arena.querySelector ? arena.querySelector('.combo-burst-container') : null);
  if (!comboEl && arena.appendChild && document.createElement) {
    comboEl = document.createElement('div');
    comboEl.className = 'combo-burst-container';
    arena.appendChild(comboEl);
  }

  if (comboEl) {
    if (UI.comboStreak >= 5) {
      comboEl.innerHTML = `<div class="combo-count">${UI.comboStreak}x COMBO BURST!</div>`;
    } else {
      comboEl.innerHTML = '';
    }
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
      const starCount = item.starCount || 0;
      el.innerHTML = `
        <div class="slot-header">
          <span class="slot-type-icon">${UI.cleanIcon(slot.icon)}</span>
          <span class="item-icon">${UI.cleanIcon(item.icon)}</span>
          <span class="item-rarity" style="color:${rar.color}">${rar.name}</span>
          <span class="item-upgrade-badge">+${item.upgradeLevel}</span>
        </div>
        <div class="item-name">${item.name} ${starCount > 0 ? `<span class="star-badge">⭐${starCount}</span>` : ''}</div>
        <div class="item-affixes">
          ${(item.affixes || []).slice(0, 3).map(af => {
            const poolAf = (GAME_DATA.AFFIXES[slot.id] || []).find(a => a.id === af.id);
            const isMult = poolAf && poolAf.type === 'mult';
            const displayVal = isMult ? `×${af.tierVal.toFixed(1)}` : `+${(af.tierVal * 100).toFixed(1)}%`;
            return `
            <div class="affix-line">
              <span class="affix-tier tier-${af.tier}">[T${af.tier + 1}]</span>
              <span class="affix-name">${af.name}</span>
              <span class="affix-val">${displayVal}</span>
            </div>
          `}).join('')}
          ${item.affixes.length > 3 ? `<div class="affix-more">+${item.affixes.length - 3} more...</div>` : ''}
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="slot-header">
          <span class="slot-type-icon">${UI.cleanIcon(slot.icon)}</span>
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
    <div class="auto-sell-title" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <span>Auto-Dismantle Filter</span>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <label style="color:#f472b6;font-weight:700;cursor:pointer;"><input type="checkbox" id="as-lower-equipped" ${G.save.autoDismantleLowerThanEquipped ? 'checked' : ''} onchange="G.save.autoDismantleLowerThanEquipped=this.checked"> Auto-Dismantle &lt; Equipped Rarity</label>
        <label style="color:#a78bfa;font-weight:700;cursor:pointer;"><input type="checkbox" id="as-autoequip" ${G.save.autoEquip !== false ? 'checked' : ''} onchange="G.save.autoEquip=this.checked"> Auto-Equip Better Drops</label>
      </div>
    </div>
    <div class="auto-sell-options" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <div style="display:flex;gap:12px;">
        <label><input type="checkbox" id="as-common" ${G.save.autoSell.common?'checked':''} onchange="G.save.autoSell.common=this.checked"> Common</label>
        <label><input type="checkbox" id="as-uncommon" ${G.save.autoSell.uncommon?'checked':''} onchange="G.save.autoSell.uncommon=this.checked"> Uncommon</label>
      </div>
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

  let html = `<div class="modal-header"><h2>${slot.name} Slot</h2><button onclick="UI.closeModal('equip-modal')" class="close-btn">✕</button></div>`;

  html += `<div class="modal-section"><h3>Equipped Item</h3>`;
  if (equip) {
    html += UI.itemCardHTML(equip, true) + `<div class="item-actions">
      <button onclick="UI.openRerollPanel('${equip.uid}')" class="btn-primary">Reroll Affixes</button>
      <button onclick="G.upgradeItem(G.save.equipped['${slotId}']); UI.renderEquipment(); UI.openEquipPanel('${slotId}')" class="btn-secondary">Upgrade (+${equip.upgradeLevel})</button>
      <button onclick="G.unequipItem('${slotId}'); UI.renderEquipment(); UI.openEquipPanel('${slotId}')" class="btn-danger">Unequip</button>
    </div>`;
  } else {
    html += `<div class="empty-slot-hint">No item equipped in this slot</div>`;
  }
  html += `</div>`;

  html += `<div class="modal-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <h3 style="margin:0;">Inventory Items (${inv.length})</h3>
      ${inv.length > 0 ? `<button onclick="G.dismantleAllInSlot('${slotId}');UI.renderEquipment();UI.openEquipPanel('${slotId}')" style="padding:6px 14px;background:linear-gradient(90deg,#ef4444,#b91c1c);border:none;border-radius:8px;color:#fff;font-weight:700;cursor:pointer;font-size:0.8rem;">Dismantle All (Keep Equipped)</button>` : ''}
    </div>
    <div class="inventory-grid">`;
  if (inv.length === 0) {
    html += `<div class="empty-hint">No items found for this slot. Kill monsters to get gear drops!</div>`;
  }
  for (const item of inv) {
    html += `<div class="inv-item" onclick="G.equipItem(G.save.inventory.find(i=>i.uid==='${item.uid}')); UI.renderEquipment(); UI.openEquipPanel('${slotId}')">
      ${UI.itemCardHTML(item, false)}
      <button onclick="event.stopPropagation();G.disenchantItem(G.save.inventory.find(i=>i.uid==='${item.uid}'));UI.renderEquipment();UI.openEquipPanel('${slotId}')" style="width:100%;margin-top:4px;padding:3px 0;background:rgba(239,68,68,0.2);border:1px solid #ef4444;border-radius:6px;color:#ef4444;cursor:pointer;font-size:0.75rem;">Dismantle</button>
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
    <h2>Reroll Affixes — ${item.name}</h2>
    <button onclick="UI.closeModal('reroll-modal')" class="close-btn">✕</button>
  </div>
  <div class="reroll-item-card" style="border-color:${rar.color}">
    <div class="reroll-affixes">`;

  for (let i = 0; i < item.affixes.length; i++) {
    const af     = item.affixes[i];
    const locked = lockedAffixes.has(i);
    const tierNames  = ['Basic','Enhanced','Superior','Perfect','Transcendent'];
    const tierColors = ['#9e9e9e','#4caf50','#2196f3','#9c27b0','#ff9800'];

    const poolAf = (GAME_DATA.AFFIXES[item.slotId] || []).find(a => a.id === af.id);
    const isMult = poolAf && poolAf.type === 'mult';
    const displayVal = isMult ? `×${af.tierVal.toFixed(2)}` : `+${(af.tierVal * 100).toFixed(2)}%`;

    html += `<div class="reroll-affix ${locked ? 'locked' : ''}">
      <button class="lock-btn ${locked ? 'active' : ''}" onclick="UI.toggleAffix(${i})">${locked ? 'LOCKED' : 'LOCK'}</button>
      <div class="af-info">
        <span class="af-tier" style="color:${tierColors[af.tier]}">${tierNames[af.tier]}</span>
        <span class="af-name">${af.name}</span>
        <span class="af-value">${displayVal}</span>
      </div>
      <button class="af-upgrade-btn" onclick="UI.upgradeAffix(${i})" title="Upgrade tier (${mats.tierStones} tier stones)">Upgrade</button>
    </div>`;
  }

  html += `</div></div>
  <div class="reroll-actions">
    <div class="mat-display">
      <span class="mat">Chaos: ${mats.chaosShards}</span>
      <span class="mat">Anchor: ${mats.anchorCrystals}</span>
      <span class="mat">Tier Stone: ${mats.tierStones}</span>
    </div>
    <div class="reroll-btns">
      <button onclick="UI.doReroll('chaos')" class="btn-chaos" ${mats.chaosShards < 1 ? 'disabled' : ''}>
        Chaos Roll (1 Chaos Shard)<br><small>Reroll ALL affixes</small>
      </button>
      <button onclick="UI.doReroll('targeted')" class="btn-targeted" ${(mats.anchorCrystals || 0) < 1 ? 'disabled' : ''}>
        Targeted Roll (1 Anchor Crystal)<br><small>Keep locked affixes</small>
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
    G.addLog(`Rerolled ${selectedItem.name} (${mode})`, 'loot');
  } else {
    showToast('Not enough materials!', 'error');
  }
};

UI.itemCardHTML = function(item, showFull) {
  const rar = GAME_DATA.getRarityById(item.rarity);
  const starCount = item ? (item.starCount || 0) : 0;
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
      <span class="icard-icon">${UI.cleanIcon(item.icon)}</span>
      <div>
        <div class="icard-name">${item.name} ${starCount > 0 ? `<span class="star-badge">⭐${starCount}</span>` : ''}</div>
        <div class="icard-rarity" style="color:${rar.color}">${rar.name} ${item.upgradeLevel > 0 ? '+' + item.upgradeLevel : ''} ${starCount > 0 ? `<span class="star-badge">⭐${starCount}</span>` : ''}</div>
      </div>
    </div>
    <div class="icard-affixes">${affixHtml}</div>
  </div>`;
};

UI.getItemTooltipHtml = function(item) {
  if (!item) return '';
  const rar = GAME_DATA.getRarityById(item.rarity);
  const starCount = item.starCount || 0;
  const flavor = UI.getFlavorText(item.name);

  let html = `<div class="glass-tooltip">
    <div class="tt-header" style="color:${rar.color};font-weight:700;">
      ${item.name} ${starCount > 0 ? `<span class="star-badge">⭐${starCount}</span>` : ''}
    </div>
    <div class="tt-rarity" style="color:${rar.color}">${rar.name} ${item.upgradeLevel > 0 ? '+' + item.upgradeLevel : ''} ${starCount > 0 ? `<span class="star-badge">⭐${starCount}</span>` : ''}</div>`;
  if (item.affixes && item.affixes.length > 0) {
    html += `<div class="tt-affixes">`;
    for (const af of item.affixes) {
      html += `<div class="tt-affix">[T${af.tier + 1}] ${af.name}: +${(af.tierVal * 100).toFixed(1)}%</div>`;
    }
    html += `</div>`;
  }
  html += `<div class="tt-flavor-text">"${flavor}"</div>`;
  html += `</div>`;
  return html;
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
        <div class="rp-pet-icon">${pet ? UI.cleanIcon(pet.icon) : 'Slot'}</div>
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
      <div class="rp-mat-item"><span>Chaos Shards</span><span>${m.chaosShards}</span></div>
      <div class="rp-mat-item"><span>Anchor Crystals</span><span>${m.anchorCrystals || 0}</span></div>
      <div class="rp-mat-item"><span>Tier Stones</span><span>${m.tierStones}</span></div>
      <div class="rp-mat-item"><span>Void Essence</span><span>${m.voidEssence}</span></div>
      <div class="rp-mat-item"><span>Pet Essence</span><span>${m.petEssence}</span></div>
      <div class="rp-mat-item"><span>Relic Dust</span><span>${s.relicDust || 0}</span></div>
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

  if (!globalPetLookup && typeof GAME_DATA !== 'undefined' && GAME_DATA.PETS) globalPetLookup = new Map(GAME_DATA.PETS.map(p => [p.id, p]));
  const ownedPetLookup = new Map(G.save.petCollection.map(p => [p.petId, p]));

  let html = `<div class="panel-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
    <h3>Active Pets (${G.save.petSlots} slots)</h3>
    <button class="btn-primary" onclick="if(G.equipBestPets){G.equipBestPets();UI.showToast('Equipped Best Pets!','success');UI.renderPets();}" style="padding:6px 14px;font-size:0.8rem;cursor:pointer;">⚡ EQUIP BEST PETS</button>
  </div>
  <div class="active-pets-row">`;

  for (let i = 0; i < G.save.petSlots; i++) {
    const pid   = G.save.activePets[i];
    const pet   = pid && globalPetLookup ? globalPetLookup.get(pid) : null;
    const owned = pid ? ownedPetLookup.get(pid) : null;
    const rar   = pet ? GAME_DATA.getRarityById(pet.rarity) : null;
    const starCount = owned ? (owned.starCount !== undefined ? owned.starCount : (owned.duplicates || owned.constellation || 0)) : 0;
    html += `<div class="pet-slot ${pet ? 'active' : 'empty'}" style="${rar ? 'border-color:'+rar.color+';box-shadow:'+rar.glow : ''}">
      ${pet ? `
        <div class="pet-icon">${UI.cleanIcon(pet.icon)}</div>
        <div class="pet-name" style="color:${rar.color}">${pet.name} ${starCount > 0 ? `<span class="star-badge">⭐${starCount}</span>` : ''}</div>
        <div class="pet-level">Lv.${owned ? owned.level : 1}${owned && owned.evolved ? ' Evolved' : ''}</div>
        <div class="pet-passive">${pet.passive}</div>
        <button onclick="G.save.activePets[${i}]=null;G.computeStats();UI.renderPets();UI.renderRightPanel()" class="pet-remove">Unequip</button>
      ` : `<div class="pet-empty">Slot ${i+1}<br><small>Empty</small></div>`}
    </div>`;
  }
  html += `</div>`;

  html += `<div class="panel-subheader"><h3>Owned Pet Collection (${G.save.petCollection.length})</h3></div>
  <div class="pet-collection">`;

  if (G.save.petCollection.length === 0) {
    html += `<div class="empty-hint">No pets yet. Use the Summon tab to hatch pets!</div>`;
  }

  for (const owned of G.save.petCollection) {
    const pet = globalPetLookup ? globalPetLookup.get(owned.petId) : null;
    if (!pet) continue;
    const rar = GAME_DATA.getRarityById(pet.rarity);
    const isActive   = G.save.activePets.includes(pet.id);
    const starCount  = owned.starCount !== undefined ? owned.starCount : (owned.duplicates || owned.constellation || 0);
    html += `<div class="pet-card ${isActive ? 'pet-active-card' : ''}" style="border-color:${rar.color}">
      <div class="petc-top">
        <span class="petc-icon">${UI.cleanIcon(pet.icon)}</span>
        <div>
          <div class="petc-name" style="color:${rar.color}">${pet.name} ${starCount > 0 ? `<span class="star-badge">⭐${starCount}</span>` : ''}</div>
          <div class="petc-rar">${rar.name}${owned.evolved ? ' Evolved' : ''}</div>
        </div>
      </div>
      <div class="petc-stats">
        <span>+${(pet.dmgAura * 100 * (1 + owned.level * 0.03)).toFixed(1)}% Dmg</span>
        <span>+${(pet.goldAura * 100 * (1 + owned.level * 0.03)).toFixed(1)}% Gold</span>
      </div>
      <div class="petc-passive">${pet.passive}</div>
      <div class="petc-level">
        <span>Lv.${owned.level}</span>
        <button onclick="G.levelPet('${pet.id}');UI.renderPets();UI.renderRightPanel()" class="btn-lvl" ${G.save.materials.petEssence < owned.level * 5 ? 'disabled':''}>
          Level Up (${owned.level * 5} Essence)
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

  let html = `<div class="panel-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
    <h3>Active Skill Slots (4)</h3>
    <button class="btn-primary" onclick="if(G.equipBestSkills){G.equipBestSkills();UI.showToast('Equipped Best Skills!','success');UI.renderSkills();}" style="padding:6px 14px;font-size:0.8rem;cursor:pointer;">⚡ EQUIP BEST SKILLS</button>
  </div><div class="skill-slots-row">`;
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
        <div class="sk-icon">${UI.cleanIcon(skill.icon)}</div>
        <div class="sk-name">${skill.name}</div>
        <div class="sk-lv">Lv.${owned?owned.level:1}</div>
        ${remaining > 0 ? `<div class="sk-cd-overlay">${remaining.toFixed(1)}s</div>` : '<div class="sk-ready">READY</div>'}
      ` : `<div class="sk-empty">Slot ${i+1}<br><small>Empty</small></div>`}
    </div>`;
  }
  html += `</div>`;

  html += `<div class="panel-header"><h3>Passive Skill Slots (8)</h3></div><div class="passive-slots-row">`;
  for (let i = 0; i < 8; i++) {
    const sid   = G.save.passiveSkills[i];
    const skill = sid ? GAME_DATA.SKILLS.passive.find(s => s.id === sid) : null;
    const rar   = skill ? GAME_DATA.getRarityById(skill.rarity) : null;
    html += `<div class="passive-slot ${skill?'has-skill':'empty'}" style="${rar?'border-color:'+rar.color:''}">
      ${skill ? `<span>${UI.cleanIcon(skill.icon)}</span> <span>${skill.name}</span>` : `<span class="ps-empty">Slot ${i+1}</span>`}
    </div>`;
  }
  html += `</div>`;

  html += `<div class="panel-header"><h3>Skill Library (${G.save.skillCollection.length})</h3></div><div class="skill-collection">`;
  for (const owned of G.save.skillCollection) {
    const skill = [...GAME_DATA.SKILLS.active, ...GAME_DATA.SKILLS.passive].find(s => s.id === owned.skillId);
    if (!skill) continue;
    const rar  = GAME_DATA.getRarityById(skill.rarity);
    const type = owned.type;
    const starCount = owned.starCount !== undefined ? owned.starCount : (owned.constellation || 0);
    html += `<div class="skill-card" style="border-color:${rar.color}">
      <div class="skc-icon">${UI.cleanIcon(skill.icon)}</div>
      <div class="skc-info">
        <div class="skc-name" style="color:${rar.color}">${skill.name} Lv.${owned.level} ${starCount > 0 ? `<span class="star-badge">⭐${starCount}</span>` : ''}</div>
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
    // Refresh both the HUD battle buttons AND the Skills tab slots so cooldowns stay live
    const btn = document.querySelector(`[data-battle-skill-slot="${i}"]`) ||
                document.querySelector(`[data-skill-slot="${i}"]`);
    if (!btn) continue;

    const sid = G.save.activeSkills[i];
    if (!sid) {
      if (!btn.classList.contains('empty')) {
        btn.className = 'skill-slot-btn empty';
        btn.innerHTML = `<div class="sk-empty">Skill ${i+1}<br><small>Empty</small></div>`;
      }
      continue;
    }

    const skill = GAME_DATA.SKILLS.active.find(s => s.id === sid);
    if (!skill) continue;
    const rar   = GAME_DATA.getRarityById(skill.rarity);
    const cs    = G.computedStats;
    const cdms  = skill.cooldown * (1 - (cs.cdReduction || 0)) * 1000;
    const elapsed = Date.now() - (G.save.skillCooldowns[skill.id] || 0);
    const rem    = Math.max(0, cdms - elapsed) / 1000;
    const isReady = rem <= 0;

    btn.style.borderColor = rar.color;
    btn.style.boxShadow = isReady ? `0 0 12px ${rar.color}` : 'none';
    btn.className = `skill-slot-btn has-skill${isReady ? ' ready' : ''}`;

    btn.innerHTML = `
      <div class="sk-icon">${UI.cleanIcon(skill.icon)}</div>
      <div class="sk-name" style="font-size:0.65rem;font-weight:700;color:${rar.color};text-overflow:ellipsis;overflow:hidden;white-space:nowrap;max-width:60px;">${skill.name}</div>
      ${isReady
        ? `<div class="sk-ready" style="font-size:0.7rem;font-weight:800;color:#4ade80;">READY</div>`
        : `<div class="sk-cd-overlay" style="font-size:0.8rem;font-weight:800;color:#f59e0b;">${rem.toFixed(1)}s</div>`
      }`;
  }
};

// ══════════════════════════════════════════════════════════════════
// UPGRADES TAB
// ══════════════════════════════════════════════════════════════════
UI.renderUpgrades = function() {
  const el = document.getElementById('upgrades-panel');
  if (!el) return;

  const tabs = ['combat','wealth','mastery','arcane','petbond'];
  const tabNames = { combat:'Combat', wealth:'Wealth', mastery:'Mastery', arcane:'Arcane', petbond:'Pet Bond' };

  let html = `<div class="sub-tabs-row" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
    <div class="sub-tabs" style="margin-bottom:0;">` + tabs.map(t =>
    `<button class="sub-tab ${currentUpgTab===t?'active':''}" onclick="currentUpgTab='${t}';UI.renderUpgrades()">${tabNames[t]}</button>`
  ).join('') + `</div>
    <button class="btn-buy-all" onclick="G.buyAllUpgrades(currentUpgTab);UI.renderUpgrades()">BUY ALL (${currentUpgTab.toUpperCase()})</button>
  </div><div class="upgrades-grid">`;

  const visible = GAME_DATA.UPGRADES.filter(u => u.tab === currentUpgTab);
  for (const up of visible) {
    const lvl      = G.save.upgradeLevels[up.id] || 0;
    const bought   = up.oneTime && lvl >= 1;
    const cost     = EN.mul(EN.convert(up.baseCost), EN.pow(EN.fromNumber(up.costScale), EN.fromNumber(lvl)));
    const canAfford= EN.meeq(G.save.gold, cost);
    html += `<div class="upgrade-card ${bought ? 'maxed' : ''} ${canAfford && !bought ? 'affordable' : ''}">
      <div class="upg-header">
        <span class="upg-icon">${UI.cleanIcon(up.icon)}</span>
        <div>
          <div class="upg-name">${up.name}</div>
          <div class="upg-desc">${up.desc}</div>
        </div>
        ${!up.oneTime ? `<div class="upg-level">Lv.${lvl}</div>` : ''}
      </div>
      <button onclick="G.buyUpgrade('${up.id}');UI.renderUpgrades()" class="upg-buy-btn" ${bought || !canAfford ? 'disabled' : ''}>
        ${bought ? 'Unlocked' : EN.fmt(cost) + ' Gold'}
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
    { name:'Common',    rate:'60%',    color:'#9e9e9e' },
    { name:'Uncommon',  rate:'25%',    color:'#4caf50' },
    { name:'Rare',      rate:'10%',    color:'#2196f3' },
    { name:'Epic',      rate:'4%',     color:'#9c27b0' },
    { name:'Legendary', rate:'0.8%',   color:'#ff9800' },
    { name:'Mythic',    rate:'0.2%',   color:'#f44336' },
    { name:'Cosmic+',   rate:'0.01%',  color:'#00bcd4' },
  ];

  const animOn  = G.save.showSummonAnim !== false;
  const cost1   = G.getSummonCost ? G.getSummonCost(1) : EN.fromNumber(5000);
  const cost10  = G.getSummonCost ? G.getSummonCost(10) : EN.fromNumber(45000);
  const cost100 = G.getSummonCost ? G.getSummonCost(100) : EN.fromNumber(425000);
  const canAfford1   = EN.meeq(G.save.gold, cost1);
  const canAfford10  = EN.meeq(G.save.gold, cost10);
  const canAfford100 = EN.meeq(G.save.gold, cost100);

  let html = `<div class="panel-header">
    <h3>Gacha Summon</h3>
    <div style="display:flex;gap:10px;align-items:center">
      <span class="gold-display" style="font-weight:700;color:var(--gold)">${EN.fmt(G.save.gold)} Gold</span>
      <button class="anim-toggle-btn ${animOn ? 'active' : ''}" onclick="G.save.showSummonAnim=!G.save.showSummonAnim;UI.renderSummon()" title="Toggle reveal animation">
        ${animOn ? 'Anim ON' : 'Anim OFF'}
      </button>
    </div>
  </div>
  <div class="banner-tabs">`;

  for (const b of GAME_DATA.BANNERS) {
    html += `<button class="banner-tab ${currentBanner===b.id?'active':''}" onclick="currentBanner='${b.id}';UI.renderSummon()">${b.name}</button>`;
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
  <div class="summon-buttons" style="display:flex; gap:10px; flex-wrap:wrap;">
    <button onclick="UI.doSummon('${currentBanner}',1)" class="btn-summon-1" ${!canAfford1 ? 'disabled':''} style="flex:1;">
      × 1 Pull<br><small>${EN.fmt(cost1)} Gold</small>
    </button>
    <button onclick="UI.doSummon('${currentBanner}',10)" class="btn-summon-10" ${!canAfford10 ? 'disabled':''} style="flex:1;">
      × 10 Pull<br><small>${EN.fmt(cost10)} (1 free!)</small>
    </button>
    <button onclick="UI.doSummon('${currentBanner}',100)" class="btn-summon-100" ${!canAfford100 ? 'disabled':''} style="flex:1; background:linear-gradient(90deg, #9333ea, #db2777); color:white; font-weight:bold; border:none; border-radius:8px; padding:10px; cursor:pointer;">
      × 100 Pull<br><small>${EN.fmt(cost100)} (15 free!)</small>
    </button>
  </div>
  <div style="display:flex; gap:10px; margin-top:8px; flex-wrap:wrap;">
    <button onclick="UI.doAutoDrawUntilCosmic('${currentBanner}')" class="btn-summon-cosmic" style="flex:1; background:linear-gradient(90deg,#00bcd4,#e040fb,#ffd700); color:#000; font-weight:900; border:none; border-radius:8px; padding:12px 10px; cursor:pointer; box-shadow:0 0 20px rgba(0,188,212,0.6); font-size:0.9rem;">
      AUTO DRAW UNTIL COSMIC<br><small style='color:#000'>Spends Gold continuously until Cosmic drops!</small>
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
  UI.renderSummon();
  UI.showSummonResult({ bannerId, results });
  UI.renderPets();
  UI.renderSkills();
  UI.renderHUD();
  UI.renderRightPanel();
};

UI.doAutoDrawUntilCosmic = function(bannerId) {
  const COSMIC_RARITIES = new Set(['cosmic', 'eternal', 'divine']);
  let totalPulls = 0;
  let allResults = [];
  let foundCosmic = false;
  let safetyLimit = 5000;

  while (!foundCosmic && safetyLimit-- > 0) {
    const cost100 = G.getSummonCost ? G.getSummonCost(100) : EN.fromNumber(425000);
    if (!EN.meeq(G.save.gold, cost100)) {
      const cost10 = G.getSummonCost ? G.getSummonCost(10) : EN.fromNumber(45000);
      if (!EN.meeq(G.save.gold, cost10)) {
        showToast(`Not enough gold! Pulled ${totalPulls} times, no Cosmic found.`, 'error');
        break;
      }
      const results = G.summon(bannerId, 10);
      if (!results || results.length === 0) break;
      allResults.push(...results);
      totalPulls += 10;
      if (results.some(r => COSMIC_RARITIES.has(r.rarity))) { foundCosmic = true; }
    } else {
      const results = G.summon(bannerId, 100);
      if (!results || results.length === 0) break;
      allResults.push(...results);
      totalPulls += 100;
      if (results.some(r => COSMIC_RARITIES.has(r.rarity))) { foundCosmic = true; }
    }
  }

  if (foundCosmic) {
    showToast(`COSMIC FOUND after ${totalPulls} pulls!`, 'loot');
  }

  if (allResults.length > 0) {
    UI.renderSummon();
    UI.showSummonResult({ bannerId, results: allResults });
  } else {
    UI.renderSummon();
  }
  UI.renderPets();
  UI.renderSkills();
  UI.renderRightPanel();
};

UI.showSummonResult = function({ bannerId, results }) {
  const area = document.getElementById('summon-result-area');
  if (!area || !results) return;

  const useAnim = G.save.showSummonAnim !== false;

  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'cosmic'];
  const counts = {};
  rarityOrder.forEach(r => counts[r] = 0);
  results.forEach(r => {
    const key = (r.rarity || '').toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  });

  let html = `<div class="summon-results-header" style="display:flex;justify-content:space-between;align-items:center;margin:15px 0 10px;padding:8px 12px;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:8px;">
    <div style="font-weight:800;color:var(--gold);font-size:0.95rem;">SUMMON REWARDS (${results.length} PULLS)</div>
    <button onclick="document.getElementById('summon-result-area').innerHTML=''" style="padding:6px 14px;background:linear-gradient(90deg,#ef4444,#b91c1c);border:none;border-radius:6px;color:#fff;font-weight:700;cursor:pointer;font-size:0.8rem;box-shadow:0 0 10px rgba(239,68,68,0.4);">✕ Close / Clear</button>
  </div>`;

  html += `<div class="summon-summary-bar">`;
  const allRarities = Array.from(new Set([...rarityOrder, ...Object.keys(counts)]));
  for (const rKey of allRarities) {
    const count = counts[rKey] || 0;
    if (count === 0 && !rarityOrder.includes(rKey)) continue;
    const rarObj = GAME_DATA.getRarityById ? GAME_DATA.getRarityById(rKey) : { name: rKey.toUpperCase(), color: '#fff' };
    html += `<div class="summary-item" style="border-color:${rarObj.color}">
      <span style="color:${rarObj.color}">${rarObj.name}:</span> <strong>${count}</strong>
    </div>`;
  }
  html += `</div>`;

  const highPulls = results.filter(r => ['legendary', 'mythic', 'cosmic', 'divine', 'eternal'].includes((r.rarity || '').toLowerCase()));
  if (highPulls.length > 0) {
    html += `<div class="summon-showcase" style="margin:10px 0;padding:10px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.3);border-radius:10px;">
      <div style="font-weight:800;color:#fbbf24;font-size:0.85rem;margin-bottom:8px;">HIGH RARITY HIGHLIGHTS (${highPulls.length})</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">`;
    highPulls.forEach(r => {
      let rar, name, icon;
      if (r.type === 'pet') {
        const pet = GAME_DATA.PETS.find(p => p.id === r.id);
        rar  = GAME_DATA.getRarityById(r.rarity);
        name = pet ? pet.name : r.id;
        icon = pet ? pet.icon : 'pet';
      } else if (r.type === 'skill') {
        const sk = [...GAME_DATA.SKILLS.active, ...GAME_DATA.SKILLS.passive].find(s => s.id === r.id);
        rar  = GAME_DATA.getRarityById(r.rarity);
        name = sk ? sk.name : r.id;
        icon = sk ? sk.icon : 'skill';
      } else {
        rar  = GAME_DATA.getRarityById(r.rarity);
        name = r.item ? r.item.name : 'Item';
        icon = r.item ? r.item.icon : 'equip';
      }
      html += `<div class="summon-result-card high-rarity" style="border-color:${rar.color};">
        <div class="src-face">
          <div class="src-icon">${UI.cleanIcon(icon)}</div>
          <div class="src-name">${name}</div>
          <div class="src-rar" style="color:${rar.color}">${rar.name}</div>
          <div class="src-shine"></div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  html += `<div id="summon-grid-container" class="summon-grid-container ${useAnim ? 'anim-on' : ''}" style="max-height: 380px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 6px;">`;
  results.forEach((r, idx) => {
    let rar, name, icon;
    if (r.type === 'pet') {
      const pet = GAME_DATA.PETS.find(p => p.id === r.id);
      rar  = GAME_DATA.getRarityById(r.rarity);
      name = pet ? pet.name : r.id;
      icon = pet ? pet.icon : 'pet';
    } else if (r.type === 'skill') {
      const sk = [...GAME_DATA.SKILLS.active, ...GAME_DATA.SKILLS.passive].find(s => s.id === r.id);
      rar  = GAME_DATA.getRarityById(r.rarity);
      name = sk ? sk.name : r.id;
      icon = sk ? sk.icon : 'skill';
    } else {
      rar  = GAME_DATA.getRarityById(r.rarity);
      name = r.item ? r.item.name : 'Item';
      icon = r.item ? r.item.icon : 'equip';
    }

    const isHigh = ['epic','legendary','mythic','cosmic','divine','eternal'].includes(r.rarity);
    const isSuperHigh = ['mythic','cosmic','divine','eternal'].includes(r.rarity);
    const shakeClass = isSuperHigh && useAnim ? 'shake-animation' : '';
    let animDelay = idx * 0.10;
    if (results.length > 20) animDelay = idx * 0.03;

    html += `<div class="summon-card-mini summon-result-card ${useAnim ? 'summon-reveal' : ''} ${isHigh ? 'high-rarity' : ''} ${shakeClass}" style="border-color:${rar.color};${useAnim ? `animation-delay:${animDelay}s` : ''}" title="${name} (${rar.name})">
      <div class="src-face">
        <div class="src-icon">${UI.cleanIcon(icon)}</div>
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

  const tokens = G.save.dungeonTokens || 0;
  const ad = G.save.activeDungeon;

  let html = `<div class="panel-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
    <h3>Ancient Dungeons &amp; Raids</h3>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:1.1rem;font-weight:800;color:#fbbf24;background:rgba(251,191,36,0.1);padding:6px 14px;border-radius:8px;border:1px solid rgba(251,191,36,0.3);box-shadow:0 0 10px rgba(251,191,36,0.2);">${tokens.toLocaleString()} Tokens</span>
      ${ad ? `<button onclick="G.exitDungeon(false);UI.renderDungeons();UI.renderEnemy();UI.renderRightPanel()" style="padding:6px 12px;background:#ef4444;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer;">Leave Raid</button>` : ''}
    </div>
  </div>`;

  if (ad) {
    html += `<div style="margin:10px 0 15px;padding:12px;background:linear-gradient(90deg,rgba(239,68,68,0.2),rgba(168,85,247,0.2));border:1px solid #ef4444;border-radius:10px;text-align:center;box-shadow:0 0 15px rgba(239,68,68,0.3);">
      <div style="font-weight:800;font-size:1rem;color:#f87171;">CURRENTLY IN RAID: ${ad.name} (LV.${ad.level})</div>
      <div style="font-size:0.85rem;color:var(--text-sec);margin-top:4px;">Check the center Battle Arena! Defeat the Titan before the timer expires to claim your tokens &amp; rewards!</div>
    </div>`;
  }

  html += `<div class="dungeon-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-bottom:24px;">`;
  for (const d of GAME_DATA.DUNGEONS) {
    const lvl = (G.save.dungeonLevels || {})[d.id] || 1;
    const tokensEarned = Math.round(d.tokenReward * lvl * (1 + lvl * 0.1));
    const matMult = 1 + ((G.save.dungeonUpgrades || {})['d_mat1'] || 0) * 1.0;
    const matEarned = Math.round(lvl * 15 * matMult);
    const isThisActive = ad && ad.id === d.id;

    let boostDesc = '';
    if (d.id === 'gold_mine') boostDesc = `Mastery Bonus: +${(lvl-1)*5}% Gold Find`;
    else if (d.id === 'pet_reserve') boostDesc = `Mastery Bonus: +${(lvl-1)*10}% Pet Damage`;
    else if (d.id === 'essence_shrine') boostDesc = `Mastery Bonus: +${(lvl-1)*5}% Drop Rate`;
    else if (d.id === 'relic_spire') boostDesc = `Mastery Bonus: +${(lvl-1)*8}% All Damage`;

    html += `<div class="dungeon-card" style="border:1px solid ${isThisActive ? '#ef4444' : 'var(--border)'};background:rgba(255,255,255,0.02);padding:14px;border-radius:12px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:${isThisActive ? '0 0 20px rgba(239,68,68,0.3)' : 'none'};">
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.8rem;">${UI.cleanIcon(d.icon)}</span>
            <div>
              <div style="font-weight:800;font-size:1.05rem;color:#fff;">${d.name}</div>
              <div style="font-size:0.75rem;color:#fbbf24;font-weight:700;">LEVEL ${lvl} RAID</div>
            </div>
          </div>
          <span style="font-size:0.75rem;padding:3px 8px;background:rgba(255,255,255,0.05);border-radius:12px;color:var(--text-sec)">HP ×${(d.hpMult * Math.pow(1.40, lvl - 1) * 6).toFixed(0)}</span>
        </div>
        <div style="font-size:0.82rem;color:var(--text-sec);margin-bottom:10px;">${d.desc}</div>
        <div style="font-size:0.8rem;color:#34d399;font-weight:600;margin-bottom:4px;">Clear Reward: +${tokensEarned} Tokens &amp; +${matEarned} ${d.material}</div>
        <div style="font-size:0.78rem;color:#a78bfa;font-weight:600;margin-bottom:12px;">${boostDesc}</div>
      </div>
      <div>
        ${isThisActive ?
          `<button onclick="G.exitDungeon(false);UI.renderDungeons();UI.renderEnemy();UI.renderRightPanel()" style="width:100%;padding:10px;background:#ef4444;border:none;border-radius:8px;color:#fff;font-weight:800;cursor:pointer;box-shadow:0 0 12px rgba(239,68,68,0.5);">ABORT RAID</button>` :
          `<button onclick="G.enterDungeon('${d.id}');UI.renderDungeons();UI.renderEnemy();UI.renderRightPanel()" style="width:100%;padding:10px;background:linear-gradient(90deg,#a855f7,#6366f1);border:none;border-radius:8px;color:#fff;font-weight:800;cursor:pointer;box-shadow:0 0 12px rgba(168,85,247,0.4);transition:all 0.2s;">ENTER RAID (LV.${lvl})</button>`
        }
      </div>
    </div>`;
  }
  html += `</div>`;

  // Token Shop
  html += `<div class="panel-header" style="margin-top:10px;border-top:1px solid var(--border);padding-top:16px;">
    <h3>Dungeon Token Shop (Sacred Mastery)</h3>
    <span style="font-size:0.8rem;color:var(--text-sec);">Spend your Dungeon Tokens for permanent raid upgrades!</span>
  </div>
  <div class="relics-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">`;

  for (const du of (GAME_DATA.DUNGEON_UPGRADES || [])) {
    const rk = (G.save.dungeonUpgrades || {})[du.id] || 0;
    const cost = Math.round(du.costBase * Math.pow(du.costScale, rk));
    const canAfford = tokens >= cost;

    html += `<div class="relic-card ${rk > 0 ? 'active' : ''}" style="background:rgba(0,0,0,0.3);border:1px solid ${rk > 0 ? '#fbbf24' : 'var(--border)'};padding:14px;border-radius:12px;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:1.6rem;">${UI.cleanIcon(du.icon)}</span>
          <span style="font-size:0.8rem;font-weight:700;color:#fbbf24;background:rgba(251,191,36,0.1);padding:2px 8px;border-radius:10px;">Rank ${rk}</span>
        </div>
        <div style="font-weight:800;font-size:1rem;color:#fff;margin-bottom:4px;">${du.name}</div>
        <div style="font-size:0.82rem;color:var(--text-sec);margin-bottom:12px;">${du.desc}</div>
      </div>
      <button onclick="G.buyDungeonUpgrade('${du.id}');UI.renderDungeons();UI.renderEnemy();UI.renderRightPanel()" style="width:100%;padding:8px;background:${canAfford ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.05)'};color:${canAfford ? '#fff' : '#666'};border:none;border-radius:6px;font-weight:700;cursor:${canAfford ? 'pointer' : 'not-allowed'};" ${!canAfford ? 'disabled' : ''}>
        Unlock (${cost} Tokens)
      </button>
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

  let html = `<div class="panel-header"><h3>Ancient Relics</h3><span style="color:var(--text-sec);font-size:0.8rem">Dust: ${G.save.relicDust || 0}</span></div>
  <div class="relics-grid">`;
  for (const r of GAME_DATA.RELICS) {
    const lvl = G.save.relicLevels[r.id] || 0;
    const cost = r.costBase * (lvl + 1);
    const canAfford = (G.save.relicDust || 0) >= cost;
    html += `<div class="relic-card ${lvl > 0 ? 'active' : ''}">
      <div class="r-icon">${UI.cleanIcon(r.icon)}</div>
      <div class="r-name">${r.name}</div>
      <div class="r-desc">${r.desc.replace('{v}', (r.val * 100).toFixed(0))}</div>
      <div class="r-level">Lv.${lvl}</div>
      <button onclick="G.upgradeRelic('${r.id}');UI.renderRelics();UI.renderRightPanel()" class="r-btn" ${!canAfford ? 'disabled':''}>
        Upgrade (${cost} Dust)
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
    <div class="prestige-stat">Rebirths: ${s.rebirths}</div>
    <div class="prestige-stat">Soul Shards: ${s.soulShards}</div>
  </div>
  <div class="rebirth-action">
    <div class="rebirth-preview">
      Rebirth now to gain: <strong>${shardsGain} Soul Shards</strong><br>
      <small>Resets gold, EXP, and zone, but keeps Soul Shards &amp; Prestige Upgrades!</small>
    </div>
    <button onclick="UI.confirmRebirth()" class="btn-rebirth">REBIRTH NOW (+${shardsGain} shards)</button>
  </div>
  <div class="prestige-upgrades-grid">
    <h3>Soul Shards Upgrades</h3>
    <div class="pup-grid">`;

  for (const pu of GAME_DATA.PRESTIGE_UPGRADES) {
    const bought = s.prestigeUpgrades[pu.id] || 0;
    const canAfford = s.soulShards >= pu.cost;
    html += `<div class="pup-card ${bought ? 'pup-maxed' : ''} ${canAfford && !bought ? 'pup-affordable' : ''}">
      <div class="pup-icon">${UI.cleanIcon(pu.icon)}</div>
      <div class="pup-name">${pu.name}</div>
      <div class="pup-desc">${pu.desc}</div>
      <button onclick="G.buyPrestigeUpgrade('${pu.id}');UI.renderPrestige()" class="pup-btn" ${bought || !canAfford ? 'disabled':''}>
        ${bought ? 'Unlocked' : `${pu.cost} Shards`}
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
  const critDesc  = critTiers >= 5 ? 'Cosmic Blue Crits!' : (critTiers === 4 ? 'Purple Crits!' : (critTiers === 3 ? 'Red Crits!' : (critTiers === 2 ? 'Orange Crits!' : (cs.critChance >= 1 ? 'Yellow Crits Guaranteed!' : 'Normal Crits'))));

  const html = `<div class="stats-grid">
    <div class="stat-row"><span>Total Damage</span><span>${EN.fmt(s.totalDmgDone)}</span></div>
    <div class="stat-row"><span>Total Kills</span><span>${s.totalKills.toLocaleString()}</span></div>
    <div class="stat-row"><span>Boss Kills</span><span>${s.bossKills.toLocaleString()}</span></div>
    <div class="stat-row"><span>Elite Kills</span><span>${s.stats.eliteKills.toLocaleString()}</span></div>
    <div class="stat-row"><span>Gold Earned</span><span>${EN.fmt(s.totalGoldEarned)}</span></div>
    <div class="stat-row"><span>Time Played</span><span>${h}h ${m}m ${sec}s</span></div>
    <div class="stat-row"><span>Highest Stage</span><span>Stage ${s.maxStage || 1}</span></div>
    <div class="stat-row divider"></div>
    <div class="stat-row"><span>Current DPS</span><span>${EN.fmt(G.getDPS())}</span></div>
    <div class="stat-row"><span>Crit Chance</span><span>${(cs.critChance*100).toFixed(1)}% (${critDesc})</span></div>
    <div class="stat-row"><span>Crit Damage</span><span>${(cs.critDmg*100).toFixed(0)}%</span></div>
    <div class="stat-row"><span>Atk Speed</span><span>${cs.atkSpeed.toFixed(2)}×</span></div>
    <div class="stat-row"><span>Gold Find</span><span>${(cs.goldFind*100).toFixed(0)}%</span></div>
    <div class="stat-row"><span>Pet Dmg</span><span>+${(cs.petDmg*100).toFixed(0)}%</span></div>
    <div class="stat-row"><span>Skill Power</span><span>+${(cs.skillDmg*100).toFixed(0)}%</span></div>
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
// MASTER SUB-LAYER PANELS (MINING, FORGE, ALCHEMY, MONUMENTS)
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
// MASTER SUB-LAYER PANELS (MINING, FORGE, ALCHEMY, MASTERIES, MONUMENTS, CONSTELLATION)
// ══════════════════════════════════════════════════════════════════

// ── 1. MINING UI ──────────────────────────────────────────────────
UI.renderMiningPanel = function() {
  const el = document.getElementById('mining-panel');
  if (!el) return;
  if (currentTab === 'mining-ores')          UI.renderMiningOres();
  else if (currentTab === 'mining-refinery') UI.renderMiningRefinery();
  else                                       UI.renderMiningResources();
};

UI.renderMiningResources = function() {
  const el = document.getElementById('mining-panel');
  if (!el) return;
  const m = G.save.materials || {};
  const list = [
    ['chaosShards', 'Chaos Shards', '#f59e0b'], ['anchorCrystals', 'Anchor Crystals', '#38bdf8'], ['tierStones', 'Tier Stones', '#a855f7'],
    ['voidEssence', 'Void Essence', '#a78bfa'], ['petEssence', 'Pet Essence', '#22c55e'],
    ['ironOre', 'Iron Ore', '#94a3b8'], ['mithrilOre', 'Mithril Ore', '#38bdf8'], ['voidstoneOre', 'Voidstone Ore', '#6b7280'], ['starstoneOre', 'Starstone Ore', '#facc15'],
    ['rubyCrystal', 'Ruby Crystals', '#ef4444'], ['sapphireCrystal', 'Sapphire Crystals', '#3b82f6'], ['emeraldCrystal', 'Emerald Crystals', '#22c55e'], ['topazCrystal', 'Topaz Crystals', '#f59e0b'],
    ['uncutGem', 'Uncut Gems', '#a78bfa'], ['flawlessGem', 'Flawless Gems', '#e879f9'], ['starGem', 'Star Gems', '#fbbf24'],
    ['ironAlloy', 'Iron Alloy', '#94a3b8'], ['mithrilIngot', 'Mithril Ingots', '#38bdf8'], ['voidPlate', 'Void Plates', '#6b7280'], ['starMatrix', 'Star Matrices', '#facc15']
  ];
  let html = `<div class="panel-header"><h3>Materials &amp; Shards</h3><span style="color:var(--text-sec);font-size:0.8rem">All your collected resources</span></div><div class="relics-grid">`;
  for (const [key, name, color] of list) {
    const amt = m[key] || 0;
    html += `<div class="relic-card"><div class="r-icon"><span class="icon-badge" style="background:${color}22;color:${color};border:1px solid ${color}55;">${name[0]}</span></div><div class="r-name">${name}</div><div class="r-level" style="font-size:1.1rem;font-weight:800;color:${color};">${amt}</div></div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
};

UI.renderMiningOres = function() {
  const el = document.getElementById('mining-panel');
  if (!el) return;
  const min = G.save.mining || defaultSaveMiningStub();
  const m = G.save.materials || {};
  let html = `<div class="panel-header"><h3>Deep Ore Extraction</h3><span style="color:var(--text-sec);font-size:0.8rem">Mining Lv.${min.level} · ${min.exp} XP · auto-mines in background</span></div>`;

  // Live Resource Counters Bar
  html += `<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px;background:rgba(0,0,0,0.3);border-radius:8px;margin:8px 0;font-size:0.8rem;color:var(--text-sec);">
    <div>Iron Ore: <b style="color:#94a3b8">${m.ironOre || 0}</b></div> ·
    <div>Mithril: <b style="color:#38bdf8">${m.mithrilOre || 0}</b></div> ·
    <div>Voidstone: <b style="color:#6b7280">${m.voidstoneOre || 0}</b></div> ·
    <div>Starstone: <b style="color:#facc15">${m.starstoneOre || 0}</b></div>
  </div>`;

  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:10px;">`;
  for (const node of GAME_DATA.MINING_NODES) {
    const nodeState = (min.nodes && min.nodes[node.id]) || { progress: 0, level: 1, auto: false };
    const unlocked = (G.save.level || 1) >= node.reqLevel;
    const pct = Math.min(100, Math.floor(((nodeState.progress || 0) / node.baseTicks) * 100));
    const drops = node.drops.map(d => d.min !== undefined
      ? `${UI.materialName(d.item)} x${d.min}-${d.max}`
      : `${UI.materialName(d.item)} ${Math.round((d.chance || 0) * 100)}%`).join(', ');
    html += `<div class="dungeon-card" style="padding:14px;">
      <h4>${UI.cleanIcon(node.icon)} ${node.name} <span style="color:var(--text-sec);font-size:0.75rem;">(Node Lv.${nodeState.level || 1})</span></h4>
      <p style="font-size:0.75rem;color:var(--text-sec);margin:4px 0;">Requires Hero Lv.${node.reqLevel} · ${unlocked ? '<span style="color:#4ade80;">UNLOCKED</span>' : '<span style="color:#f87171;">LOCKED</span>'}</p>
      <div style="height:8px;background:rgba(255,255,255,0.1);border-radius:6px;overflow:hidden;margin:8px 0;"><div style="width:${pct}%;height:100%;background:#f59e0b;"></div></div>
      <p style="font-size:0.72rem;color:var(--text-sec);">Drops: ${drops}</p>
      ${unlocked
        ? `<button onclick="if(G.mineNodeManual('${node.id}')){UI.renderMiningOres();}else{UI.showToast('Not high enough level!','error');}" class="btn-primary" style="width:100%;margin-top:6px;">Mine (${pct}% → auto)</button>
           <button onclick="if(!G.save.mining.nodes['${node.id}'])G.save.mining.nodes['${node.id}']={progress:0,level:1,auto:false};G.save.mining.nodes['${node.id}'].auto=!G.save.mining.nodes['${node.id}'].auto;UI.renderMiningOres();" class="${nodeState.auto ? 'btn-success' : 'btn-secondary'}" style="width:100%;margin-top:4px;font-size:0.75rem;padding:4px 8px;">Auto-Gather: ${nodeState.auto ? 'ON' : 'OFF'}</button>`
        : `<button class="btn-primary" disabled style="width:100%;margin-top:6px;">Reach Hero Lv.${node.reqLevel}</button>`}
    </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
};

function defaultSaveMiningStub() {
  return { level: 1, exp: 0, nodes: {} };
}

UI.renderMiningRefinery = function() {
  const el = document.getElementById('mining-panel');
  if (!el) return;
  const mats = G.save.materials || {};
  let html = `<div class="panel-header"><h3>Void Refinery — Smelting</h3><span style="color:var(--text-sec);font-size:0.8rem">Refine ores &amp; crystals into alloy ingots</span></div><div class="relics-grid">`;
  for (const recipe of GAME_DATA.SMELTING_RECIPES) {
    const costParts = [];
    let canAfford = true;
    for (const k in recipe.inputs) {
      const owned = mats[k] || 0;
      costParts.push(`${recipe.inputs[k]} ${UI.materialName(k)} (${owned})`);
      if (owned < recipe.inputs[k]) canAfford = false;
    }
    const outParts = [];
    for (const k in recipe.output) outParts.push(`${recipe.output[k]} ${UI.materialName(k)}`);
    html += `<div class="relic-card">
      <div class="r-icon">${UI.cleanIcon(recipe.icon || '🧈')}</div>
      <div class="r-name">${recipe.name}</div>
      <div class="r-desc" style="font-size:0.75rem;">Inputs: ${costParts.join(' · ')}</div>
      <div class="r-level" style="color:#4ade80;">Output: ${outParts.join(', ')}</div>
      <button onclick="if(G.smeltAlloy('${recipe.id}')){UI.showToast('Refined ${recipe.name}!','success');}else{UI.showToast('Not enough materials!','error');}UI.renderMiningRefinery();UI.renderRightPanel();" class="r-btn" ${!canAfford ? 'disabled' : ''}>Refine</button>
    </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
};

// ── 2. FORGE UI ───────────────────────────────────────────────────
UI.renderForgePanel = function() {
  const el = document.getElementById('forge-panel');
  if (!el) return;
  if (currentTab === 'forge-smelter')        UI.renderForgeSmelter();
  else if (currentTab === 'forge-equipment') UI.renderForgeEquipment();
  else if (currentTab === 'forge-gems')      UI.renderForgeGems();
  else if (currentTab === 'forge-reroll')    UI.renderForgeAffixes();
  else                                       UI.renderForgeSmelter();
};

UI.renderForgeSmelter = function() {
  UI.renderMiningRefinery();
};

UI.renderForgeEquipment = function() {
  const el = document.getElementById('forge-panel');
  if (!el) return;
  const mats = G.save.materials || {};
  let html = `<div class="panel-header"><h3>Mythic Gear Forge</h3><span style="color:var(--text-sec);font-size:0.8rem">Forge mythic equipment items using alloy ingots</span></div><div class="relics-grid">`;
  for (const recipe of (GAME_DATA.FORGE_RECIPES || [])) {
    const costParts = [];
    let canAfford = true;
    for (const k in recipe.inputs) {
      const owned = mats[k] || 0;
      costParts.push(`${recipe.inputs[k]} ${UI.materialName(k)} (${owned})`);
      if (owned < recipe.inputs[k]) canAfford = false;
    }
    const rarObj = GAME_DATA.getRarityById(recipe.rarity);
    html += `<div class="relic-card" style="border-color:${rarObj.color};">
      <div class="r-icon">${UI.cleanIcon(rarObj.icon || '🛡️')}</div>
      <div class="r-name" style="color:${rarObj.color};">${recipe.name}</div>
      <div class="r-desc" style="font-size:0.75rem;">Slot: ${recipe.slotId.toUpperCase()} · ${rarObj.name.toUpperCase()}</div>
      <div class="r-cost" style="font-size:0.7rem;color:var(--text-sec);">${costParts.join(' · ')}</div>
      <button onclick="if(G.forgeEquipment('${recipe.id}')){UI.showToast('Forged ${recipe.name}!','loot');}else{UI.showToast('Not enough materials!','error');}UI.renderForgeEquipment();UI.renderRightPanel();UI.renderEquipment();" class="r-btn" ${!canAfford ? 'disabled' : ''}>Forge Gear</button>
    </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
};

UI.renderForgeGems = function() {
  const el = document.getElementById('forge-panel');
  if (!el) return;
  const mats = G.save.materials || {};
  const gemsList = [
    { id: 'cut_ruby', name: 'Cut Ruby', stat: '+15% Fire Dmg', color: '#ef4444' },
    { id: 'cut_sapphire', name: 'Cut Sapphire', stat: '+15% Ice Dmg', color: '#3b82f6' },
    { id: 'cut_emerald', name: 'Cut Emerald', stat: '+20% Skill Dmg', color: '#22c55e' },
    { id: 'cut_topaz', name: 'Cut Topaz', stat: '+20% Atk Speed', color: '#f59e0b' },
    { id: 'star_diamond', name: 'Star Diamond', stat: '+50% All Dmg', color: '#e879f9' }
  ];

  let html = `<div class="panel-header"><h3>Gem Socketing</h3><span style="color:var(--text-sec);font-size:0.8rem">Socket cut gems into item slots for stat boosts</span></div>`;

  // Owned Cut Gems Bar
  html += `<div class="panel-subheader"><h3>Owned Cut Gems</h3></div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">`;
  for (const g of gemsList) {
    const qty = mats[g.id] || 0;
    html += `<div style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid ${g.color}55;border-radius:6px;font-size:0.8rem;">
      <span style="color:${g.color};font-weight:bold;">${g.name}</span>: ${qty} <small>(${g.stat})</small>
    </div>`;
  }
  html += `</div>`;

  // Equipped Items with Sockets
  html += `<div class="panel-subheader"><h3>Equipped Gear Sockets</h3></div><div class="relics-grid">`;
  const equippedKeys = Object.keys(G.save.equipped || {});
  let itemFound = false;
  for (const slotKey of equippedKeys) {
    const item = G.save.equipped[slotKey];
    if (!item) continue;
    itemFound = true;
    if (!Array.isArray(item.sockets)) item.sockets = [{ gem: null }, { gem: null }];
    const rarObj = GAME_DATA.getRarityById(item.rarity);
    html += `<div class="relic-card" style="border-color:${rarObj.color};">
      <div class="r-name" style="color:${rarObj.color};">${item.name} <small>(${slotKey})</small></div>
      <div style="margin:6px 0;font-size:0.78rem;">`;
    item.sockets.forEach((sock, idx) => {
      const gObj = sock && sock.gem ? gemsList.find(x => x.id === sock.gem) : null;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:4px;background:rgba(0,0,0,0.2);border-radius:4px;">
        <span>Socket ${idx + 1}: ${gObj ? `<b style="color:${gObj.color}">${gObj.name}</b>` : '<span style="color:var(--text-sec)">Empty</span>'}</span>
        ${gObj
          ? `<button onclick="if(G.unsocketGem('${item.uid}', ${idx})){UI.showToast('Unsocketed Gem!','info');}UI.renderForgeGems();UI.renderRightPanel();" class="btn-secondary" style="padding:2px 6px;font-size:0.7rem;">Unsocket</button>`
          : `<select onchange="if(this.value){G.socketGem('${item.uid}', ${idx}, this.value);UI.showToast('Socketed Gem!','success');UI.renderForgeGems();UI.renderRightPanel();}" style="background:#1e293b;color:#fff;border:1px solid #475569;border-radius:4px;font-size:0.7rem;padding:2px;">
              <option value="">+ Select Gem</option>
              ${gemsList.filter(g => (mats[g.id] || 0) > 0).map(g => `<option value="${g.id}">${g.name} (${mats[g.id]})</option>`).join('')}
            </select>`}
      </div>`;
    });
    html += `</div></div>`;
  }
  if (!itemFound) {
    html += `<div class="empty-hint">No equipment currently equipped. Equip items from the left panel to socket gems!</div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
};

UI.renderForgeAffixes = function() {
  const el = document.getElementById('forge-panel');
  if (!el) return;
  const mats = G.save.materials || {};
  let html = `<div class="panel-header"><h3>Affix Enchanter</h3><span style="color:var(--text-sec);font-size:0.8rem">Reroll affixes using Chaos Shards &amp; Anchor Crystals</span></div>`;

  html += `<div style="padding:8px;background:rgba(0,0,0,0.3);border-radius:8px;margin-bottom:12px;font-size:0.8rem;color:var(--text-sec);">
    Chaos Shards: <b style="color:#f59e0b">${mats.chaosShards || 0}</b> · Anchor Crystals: <b style="color:#38bdf8">${mats.anchorCrystals || 0}</b>
  </div><div class="relics-grid">`;

  const equippedKeys = Object.keys(G.save.equipped || {});
  for (const slotKey of equippedKeys) {
    const item = G.save.equipped[slotKey];
    if (!item) continue;
    const rarObj = GAME_DATA.getRarityById(item.rarity);
    html += `<div class="relic-card" style="border-color:${rarObj.color};">
      <div class="r-name" style="color:${rarObj.color};">${item.name} <small>(${slotKey})</small></div>
      <div style="font-size:0.75rem;margin:6px 0;">`;
    (item.affixes || []).forEach((af, idx) => {
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:3px 0;">
        <span>Tier ${af.tier || 1}: ${af.stat} +${typeof af.tierVal === 'number' ? af.tierVal.toFixed(1) : af.tierVal}</span>
        <label style="font-size:0.7rem;color:var(--text-sec);"><input type="checkbox" id="lock-${item.uid}-${idx}"> Lock</label>
      </div>`;
    });
    html += `</div>
      <button onclick="
        const locks = [];
        (${JSON.stringify(item.affixes || [])}).forEach((_, i) => {
          const cb = document.getElementById('lock-${item.uid}-' + i);
          if (cb && cb.checked) locks.push(i);
        });
        if(G.rerollAffixesWithLocks('${item.uid}', locks)){UI.showToast('Affixes Rerolled!','success');}else{UI.showToast('Not enough materials!','error');}
        UI.renderForgeAffixes();UI.renderRightPanel();
      " class="r-btn">Reroll Affixes</button>
    </div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
};

// Material display name helper
UI.materialName = function(key) {
  const map = {
    chaosShards: 'Chaos Shard', anchorCrystals: 'Anchor Crystal', tierStones: 'Tier Stone',
    voidEssence: 'Void Essence', petEssence: 'Pet Essence', bossBlueprints: 'Blueprint',
    ironOre: 'Iron Ore', mithrilOre: 'Mithril Ore', voidstoneOre: 'Voidstone Ore', starstoneOre: 'Starstone Ore',
    rubyCrystal: 'Ruby Crystal', sapphireCrystal: 'Sapphire Crystal', emeraldCrystal: 'Emerald Crystal', topazCrystal: 'Topaz Crystal',
    uncutGem: 'Uncut Gem', flawlessGem: 'Flawless Gem', starGem: 'Star Gem',
    ironAlloy: 'Iron Alloy', mithrilIngot: 'Mithril Ingot', voidPlate: 'Void Plate', starMatrix: 'Star Matrix',
    cut_ruby: 'Cut Ruby', cut_sapphire: 'Cut Sapphire', cut_emerald: 'Cut Emerald', cut_topaz: 'Cut Topaz', star_diamond: 'Star Diamond'
  };
  return map[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
};

// ── 3. ALCHEMY UI ─────────────────────────────────────────────────
UI.renderAlchemyPanel = function() {
  const el = document.getElementById('alchemy-panel');
  if (!el) return;
  if (currentTab === 'alchemy-brew')        UI.renderAlchemyBrew();
  else if (currentTab === 'alchemy-potions') UI.renderAlchemyPotions();
  else if (currentTab === 'alchemy-tonics')  UI.renderAlchemyTonics();
  else                                       UI.renderAlchemyBrew();
};

UI.renderAlchemyBrew = function() {
  const el = document.getElementById('alchemy-panel');
  if (!el) return;
  const a = G.save.alchemy || { level: 1, exp: 0 };
  const mats = G.save.materials || {};

  let html = `<div class="panel-header"><h3>Brewing Cauldron</h3><span style="color:var(--text-sec);font-size:0.8rem">Lv.${a.level} · ${a.exp} XP</span></div>`;

  // Active brew countdown
  if (a.activeBrew && a.activeBrew.recipeId) {
    const brew = a.activeBrew;
    const rec  = (GAME_DATA.ALCHEMY_RECIPES || []).find(x => x.id === brew.recipeId);
    const left = Math.ceil(brew.secondsLeft || 0);
    html += `<div class="dungeon-card" style="padding:14px;margin-top:10px;">
      <h4 style="color:#a78bfa;">Brewing: ${rec ? rec.name : brew.recipeId}</h4>
      <p style="font-size:0.85rem;color:var(--text-sec);margin:6px 0;">${left > 0 ? `${left}s remaining` : 'Ready to claim!'}</p>
      ${left <= 0 ? `<button onclick="if(G.claimBrewedPotion()){UI.showToast('Potion brewed!','success');}UI.renderAlchemyBrew();UI.renderRightPanel();" class="btn-primary" style="width:100%;">CLAIM BREW</button>` : ''}
    </div>`;
  } else {
    html += `<div class="dungeon-card" style="padding:14px;margin-top:10px;"><p style="font-size:0.85rem;color:var(--text-sec);margin:0;">Select a recipe below to start brewing. Brews tick down automatically.</p></div>`;
  }

  // Recipe list
  html += `<div class="panel-header"><h3>Recipes</h3></div><div class="relics-grid">`;
  for (const rec of (GAME_DATA.ALCHEMY_RECIPES || [])) {
    const invCount = (a.inventory && a.inventory[rec.id]) || 0;
    const costParts = [];
    const inputKeys = Object.keys(rec.inputs || {});
    let canBrew = true;
    for (const k of inputKeys) {
      const owned = mats[k] || 0;
      costParts.push(`${rec.inputs[k]} ${UI.materialName(k)} (${owned})`);
      if (owned < rec.inputs[k]) canBrew = false;
    }
    html += `<div class="relic-card" style="border-color:#a78bfa;">
      <div class="r-icon">${UI.cleanIcon(rec.icon || '🧪')}</div>
      <div class="r-name" style="color:#e9d5ff;">${rec.name}</div>
      <div class="r-desc">${rec.desc}</div>
      <div class="r-level" style="color:var(--text-sec);">${rec.type.toUpperCase()} · Owned: ${invCount}</div>
      <div class="r-cost" style="font-size:0.7rem;color:var(--text-sec);">${costParts.join(' · ')}</div>
      <button onclick="if(G.startBrewing('${rec.id}')){UI.showToast('Brewing started!','success');}UI.renderAlchemyBrew();" class="r-btn" ${!canBrew || (a.activeBrew && a.activeBrew.recipeId) ? 'disabled' : ''}>Brew (${rec.brewTime}s)</button>
    </div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
};

UI.renderAlchemyPotions = function() {
  const el = document.getElementById('alchemy-panel');
  if (!el) return;
  const a = G.save.alchemy || {};

  let html = `<div class="panel-header"><h3>Active Buffs &amp; Potion Bag</h3><span style="color:var(--text-sec);font-size:0.8rem">Use elixirs and flasks for temporary power</span></div>`;

  // Active potions
  const activePotList = Object.keys(a.activePotions || {}).filter(id => (a.activePotions[id] || 0) > 0);
  if (activePotList.length) {
    html += `<div class="panel-subheader"><h3>Active Potion Buffs</h3></div><div class="active-pets-row" style="margin-bottom:12px;">`;
    for (const id of activePotList) {
      const rec = (GAME_DATA.ALCHEMY_RECIPES || []).find(x => x.id === id);
      html += `<div class="skill-slot-btn has-skill" style="border-color:#a78bfa;cursor:default;">
        <div class="sk-icon">${UI.cleanIcon(rec && rec.icon ? rec.icon : '🧪')}</div>
        <div class="sk-name">${rec ? rec.name : id}</div>
        <div class="sk-lv">${Math.ceil(a.activePotions[id])}s</div>
      </div>`;
    }
    html += `</div>`;
  }

  // Potion inventory
  html += `<div class="panel-subheader"><h3>Potion Inventory</h3></div><div class="relics-grid">`;
  const elixirsAndFlasks = (GAME_DATA.ALCHEMY_RECIPES || []).filter(r => r.type === 'elixir' || r.type === 'flask');
  for (const rec of elixirsAndFlasks) {
    const count = (a.inventory && a.inventory[rec.id]) || 0;
    html += `<div class="relic-card" style="border-color:#a78bfa;">
      <div class="r-icon">${UI.cleanIcon(rec.icon || '🧪')}</div>
      <div class="r-name" style="color:#e9d5ff;">${rec.name}</div>
      <div class="r-desc">${rec.desc}</div>
      <div class="r-level" style="color:var(--text-sec);">Owned: ${count}</div>
      <button onclick="if(G.usePotion('${rec.id}')){UI.showToast('Potion used!','success');}else{UI.showToast('No potions available!','error');}UI.renderAlchemyPotions();UI.renderRightPanel();" class="r-btn" ${count <= 0 ? 'disabled' : ''}>Use Potion</button>
    </div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
};

UI.renderAlchemyTonics = function() {
  const el = document.getElementById('alchemy-panel');
  if (!el) return;
  const a = G.save.alchemy || {};
  const mats = G.save.materials || {};

  let html = `<div class="panel-header"><h3>Permanent Tonic Lab</h3><span style="color:var(--text-sec);font-size:0.8rem">Permanently enhance hero baseline attributes</span></div><div class="relics-grid">`;

  const tonics = (GAME_DATA.ALCHEMY_RECIPES || []).filter(r => r.type === 'tonic');
  for (const rec of tonics) {
    const invCount = (a.inventory && a.inventory[rec.id]) || 0;
    const usedCount = (a.tonicsUsed && a.tonicsUsed[rec.id]) || 0;
    const costParts = [];
    const inputKeys = Object.keys(rec.inputs || {});
    let canBrew = true;
    for (const k of inputKeys) {
      const owned = mats[k] || 0;
      costParts.push(`${rec.inputs[k]} ${UI.materialName(k)} (${owned})`);
      if (owned < rec.inputs[k]) canBrew = false;
    }
    const canUse = invCount > 0 || canBrew;
    html += `<div class="relic-card" style="border-color:#a78bfa;">
      <div class="r-icon">${UI.cleanIcon(rec.icon || '🧪')}</div>
      <div class="r-name" style="color:#e9d5ff;">${rec.name}</div>
      <div class="r-desc">${rec.desc}</div>
      <div class="r-level" style="color:#4ade80;">Consumed: ${usedCount} · Inventory: ${invCount}</div>
      <div class="r-cost" style="font-size:0.7rem;color:var(--text-sec);">${costParts.join(' · ')}</div>
      <button onclick="if(G.usePotion('${rec.id}')){UI.showToast('Permanent Tonic Consumed!','loot');}else{UI.showToast('Not enough materials!','error');}UI.renderAlchemyTonics();UI.renderRightPanel();" class="r-btn" ${!canUse ? 'disabled' : ''}>Consume Tonic</button>
    </div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
};

// ── 4. SKILL MASTERIES UI ─────────────────────────────────────────
UI.renderMasteriesPanel = function() {
  const el = document.getElementById('skills-panel');
  if (!el) return;
  const mState = G.save.masteries || { points: {}, allocations: {} };

  let html = `<div class="panel-header"><h3>Skill Masteries Trees</h3><span style="color:var(--text-sec);font-size:0.8rem">Allocate earned mastery points into passive talents</span></div>`;

  if (GAME_DATA.MASTERY_TREES) {
    for (const treeKey in GAME_DATA.MASTERY_TREES) {
      const tree = GAME_DATA.MASTERY_TREES[treeKey];
      const pts  = mState.points[treeKey] || 0;
      const allocs = mState.allocations[treeKey] || {};

      html += `<div class="panel-subheader" style="border-left:4px solid ${tree.color};padding-left:8px;margin-top:12px;">
        <h3 style="color:${tree.color};">${UI.cleanIcon(tree.icon)} ${tree.name} <span style="font-size:0.8rem;color:var(--text-sec);">(Points Available: <b style="color:#fff">${pts}</b>)</span></h3>
      </div><div class="relics-grid">`;

      for (const node of tree.nodes) {
        const rank = allocs[node.id] || 0;
        let reqMet = true;
        if (Array.isArray(node.req) && node.req.length > 0) {
          for (const reqId of node.req) {
            if ((allocs[reqId] || 0) <= 0) reqMet = false;
          }
        }
        const canAllocate = pts > 0 && rank < node.maxLvl && reqMet;
        html += `<div class="relic-card ${rank > 0 ? 'active' : ''}">
          <div class="r-name">${node.name}</div>
          <div class="r-desc">${node.desc}</div>
          <div class="r-level" style="color:${tree.color};">Rank ${rank} / ${node.maxLvl}</div>
          ${!reqMet ? `<div style="font-size:0.7rem;color:#f87171;">Prerequisite Required</div>` : ''}
          <button onclick="if(G.allocateMasteryPoint('${treeKey}', '${node.id}')){UI.showToast('Allocated ${node.name}!','success');}else{UI.showToast('Cannot allocate point!','error');}UI.renderMasteriesPanel();UI.renderRightPanel();" class="r-btn" ${!canAllocate ? 'disabled' : ''}>Allocate Point (+1)</button>
        </div>`;
      }
      html += `</div>`;
    }
  }

  el.innerHTML = html;
};

// ── 5. MONUMENTS UI ───────────────────────────────────────────────
UI.renderMonumentsPanel = function() {
  const el = document.getElementById('monuments-panel');
  if (!el) return;
  const mats = G.save.materials || {};
  const mons = G.save.monuments || {};

  let html = `<div class="panel-header"><h3>Sacred Monuments</h3><span style="color:var(--text-sec);font-size:0.8rem">Construct permanent global multiplier structures</span></div><div class="relics-grid">`;

  for (const mon of (GAME_DATA.MONUMENTS || [])) {
    const lvl = (mons && mons[mon.id]) || 0;
    const scale = mon.costScale || 2.0;
    const costParts = [];
    let canAfford = true;
    for (const k in mon.costs) {
      const qty = Math.floor(mon.costs[k] * Math.pow(scale, lvl));
      const owned = mats[k] || 0;
      costParts.push(`${qty} ${UI.materialName(k)} (${owned})`);
      if (owned < qty) canAfford = false;
    }
    html += `<div class="relic-card ${lvl > 0 ? 'active' : ''}">
      <div class="r-icon">${UI.cleanIcon(mon.icon)}</div>
      <div class="r-name">${mon.name}</div>
      <div class="r-desc">${mon.desc}</div>
      <div class="r-level" style="color:#4ade80;">Current Level: Lv.${lvl}${lvl > 0 ? ' · Active Bonus' : ''}</div>
      <div class="r-cost" style="font-size:0.7rem;color:var(--text-sec);">${costParts.join(' · ')}</div>
      <button onclick="if(G.buildMonument('${mon.id}')){UI.showToast('${mon.name} upgraded!','loot');}else{UI.showToast('Not enough materials!','error');}UI.renderMonumentsPanel();UI.renderRightPanel();" class="r-btn" ${!canAfford ? 'disabled' : ''}>Build (Lv ${lvl + 1})</button>
    </div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
};

// ── 6. CONSTELLATION STAR TREE UI ─────────────────────────────────
UI.renderConstellationPanel = function() {
  const el = document.getElementById('monuments-panel');
  if (!el) return;
  const dust = G.save.starDust || 0;
  const unlocked = (G.save.constellationTree && G.save.constellationTree.unlockedNodes) || [];

  let html = `<div class="panel-header"><h3>Constellation Star Tree</h3><span style="color:var(--text-sec);font-size:0.8rem">Unlock celestial nodes using Star Dust from duplicate gacha pulls</span></div>`;

  html += `<div style="padding:12px;background:rgba(251,191,36,0.1);border:1px solid #fbbf2455;border-radius:8px;margin-bottom:12px;">
    <div style="font-size:1.1rem;font-weight:bold;color:#fbbf24;">Star Dust Balance: ${dust}</div>
    <div style="font-size:0.78rem;color:var(--text-sec);margin-top:2px;">Duplicate pet and skill summons award Star Dust to empower your hero!</div>
  </div><div class="relics-grid">`;

  for (const node of (GAME_DATA.CONSTELLATION_NODES || [])) {
    const isUnlocked = unlocked.includes(node.id);
    let reqMet = true;
    if (Array.isArray(node.req) && node.req.length > 0) {
      for (const reqId of node.req) {
        if (!unlocked.includes(reqId)) reqMet = false;
      }
    }
    const canUnlock = !isUnlocked && dust >= node.cost && reqMet;

    html += `<div class="relic-card ${isUnlocked ? 'active' : ''}" style="border-color:#fbbf24;">
      <div class="r-icon">${UI.cleanIcon(node.icon || '⭐')}</div>
      <div class="r-name" style="color:#fbbf24;">${node.name}</div>
      <div class="r-desc">${node.desc}</div>
      <div class="r-level">${isUnlocked ? '<span style="color:#4ade80;font-weight:bold;">★ UNLOCKED</span>' : `Cost: ${node.cost} Star Dust`}</div>
      ${!isUnlocked && !reqMet ? `<div style="font-size:0.7rem;color:#f87171;">Requires: ${node.req.join(', ')}</div>` : ''}
      ${!isUnlocked ? `<button onclick="if(G.unlockStarNode('${node.id}')){UI.showToast('Unlocked ${node.name}!','loot');}else{UI.showToast('Cannot unlock node!','error');}UI.renderConstellationPanel();UI.renderRightPanel();" class="r-btn" ${!canUnlock ? 'disabled' : ''}>Unlock Node</button>` : ''}
    </div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
};

// ══════════════════════════════════════════════════════════════════
// FLOATING DAMAGE NUMBERS
// ══════════════════════════════════════════════════════════════════
UI.spawnDmgFloat = function({ text, isCrit, isClick, critTier = 0 }) {
  if (typeof text === 'object') {
    text = (window.ENfmt || window.EternityNum.fmt)(text);
  } else if (text === '[object Object]') {
    text = '100';
  }

  const arena = document.getElementById('battle-arena');
  if (!arena) return;

  let recent = document.getElementById('enemy-recent-dmg');
  if (!recent) {
    recent = document.createElement('div');
    recent.id = 'enemy-recent-dmg';
    recent.style.position = 'absolute';
    recent.style.top = '10%';
    recent.style.right = '5%';
    recent.style.fontSize = '1.2rem';
    recent.style.fontWeight = 'bold';
    recent.style.color = '#fff';
    recent.style.textAlign = 'right';
    recent.style.textShadow = '0 2px 4px rgba(0,0,0,0.8)';
    recent.style.pointerEvents = 'none';
    recent.style.zIndex = '100';
    arena.appendChild(recent);
  }

  let tierClass = '';
  if (critTier === 1 || isCrit) tierClass = 'color: #facc15;';
  else if (critTier === 2) tierClass = 'color: #fb923c; font-size: 1.4rem;';
  else if (critTier === 3) tierClass = 'color: #ef4444; font-size: 1.6rem;';
  else if (critTier === 4) tierClass = 'color: #c084fc; font-size: 1.8rem;';
  else if (critTier >= 5) tierClass = 'color: #38bdf8; font-size: 2rem;';

  const fullText = text + (critTier > 1 ? ` (${critTier}x Crit!)` : '');
  recent.innerHTML = `<div style="${tierClass}">-${fullText}</div>`;

  if (UI.dmgTimeout) clearTimeout(UI.dmgTimeout);
  UI.dmgTimeout = setTimeout(() => {
    if (recent) recent.innerHTML = '';
  }, 500);
};

// ══════════════════════════════════════════════════════════════════
// TAB SWITCHING (Master & Sub Tabs)
// ══════════════════════════════════════════════════════════════════
UI.switchMasterTab = function(masterTabId) {
  if (!UI.MASTER_TABS[masterTabId]) masterTabId = 'battle';
  currentMasterTab = masterTabId;

  document.querySelectorAll('[data-master-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.masterTab === masterTabId);
  });

  const subNav = document.getElementById('master-subtabs-nav');
  const masterDef = UI.MASTER_TABS[masterTabId];
  if (subNav && masterDef) {
    subNav.innerHTML = masterDef.subTabs.map(st => `
      <button class="sub-tab-item ${currentTab === st.id ? 'active' : ''}" onclick="UI.switchTab('${st.id}')">
        ${st.name}
      </button>
    `).join('');
  }

  const firstSubId = masterDef.subTabs[0].id;
  const targetTab = masterDef.subTabs.some(s => s.id === currentTab) ? currentTab : firstSubId;
  UI.switchTab(targetTab);
};

UI.switchTab = function(tabId) {
  currentTab = tabId;

  for (const [mId, mDef] of Object.entries(UI.MASTER_TABS)) {
    if (mDef.subTabs.some(st => st.id === tabId)) {
      currentMasterTab = mId;
      break;
    }
  }

  document.querySelectorAll('[data-master-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.masterTab === currentMasterTab);
  });

  const subNav = document.getElementById('master-subtabs-nav');
  const masterDef = UI.MASTER_TABS[currentMasterTab];
  if (subNav && masterDef) {
    subNav.innerHTML = masterDef.subTabs.map(st => `
      <button class="sub-tab-item ${tabId === st.id ? 'active' : ''}" onclick="UI.switchTab('${st.id}')">
        ${st.name}
      </button>
    `).join('');
  }

  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  let panelId = tabId + '-panel';
  if (!document.getElementById(panelId)) {
    if (tabId.startsWith('mining')) panelId = 'mining-panel';
    else if (tabId.startsWith('forge')) panelId = 'forge-panel';
    else if (tabId.startsWith('alchemy')) panelId = 'alchemy-panel';
    else if (tabId.startsWith('monuments') || tabId === 'constellation') panelId = 'monuments-panel';
    else if (tabId === 'tree' || tabId === 'masteries' || tabId === 'skills' || tabId === 'pets') panelId = 'skills-panel';
  }

  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');

  if (tabId === 'upgrades')       UI.renderUpgrades();
  else if (tabId === 'pets')      UI.renderPets();
  else if (tabId === 'skills')    UI.renderSkills();
  else if (tabId === 'summon')    UI.renderSummon();
  else if (tabId === 'dungeons')  UI.renderDungeons();
  else if (tabId === 'relics')    UI.renderRelics();
  else if (tabId === 'prestige')  UI.renderPrestige();
  else if (tabId === 'stats')     UI.renderStats();
  else if (tabId === 'log')       UI.renderCombatLog();
  else if (tabId.startsWith('mining')) UI.renderMiningPanel();
  else if (tabId.startsWith('forge')) UI.renderForgePanel();
  else if (tabId.startsWith('alchemy')) UI.renderAlchemyPanel();
  else if (tabId.startsWith('monuments')) UI.renderMonumentsPanel();
  else if (tabId === 'masteries') UI.renderMasteriesPanel();
  else if (tabId === 'constellation') UI.renderConstellationPanel();
};

UI.onItemDrop = function(item) {
  const rar = GAME_DATA.getRarityById(item.rarity);
  if (GAME_DATA.RARITY_INDEX[item.rarity] >= 3) {
    showToast(`[${rar.name}] ${item.name} dropped!`, 'loot');
  }
  UI.renderEquipment();
};

UI.onRebirth = function({ shards }) {
  showToast(`Rebirth! +${shards} Soul Shards`, 'prestige');
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

  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('open');
    });
  });

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) saveBtn.addEventListener('click', () => { G.saveGame(); showToast('Game Saved!', 'success'); });

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone!')) {
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
  const activeToasts = container.querySelectorAll('.toast');
  if (activeToasts.length >= 4) {
    activeToasts[0].remove();
  }
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

// HUD value updater that preserves each stat's SVG icon by only touching the value span
function setHudVal(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  const existing = el.querySelector('.hud-val');
  if (existing) {
    existing.textContent = text;
    return;
  }
  const svg = el.querySelector('svg');
  el.innerHTML = '';
  if (svg) el.appendChild(svg);
  const span = document.createElement('span');
  span.className = 'hud-val';
  span.textContent = text;
  el.appendChild(span);
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
  UI.renderStats();
  UI.renderCombatLog();
};

window.UI = UI;
window.showToast = showToast;
