/**
 * game.js — Core game engine
 * All state, save/load, combat tick, equipment, pets, skills, dungeons, relics, prestige
 */
"use strict";

const G = {}; // Global game object

// ══════════════════════════════════════════════════════════════════
// DEFAULT SAVE STATE
// ══════════════════════════════════════════════════════════════════
function defaultSave() {
  return {
    version: 4,
    playerName: 'Hero',
    gold: EN.fromNumber(0),
    gems: 50,
    totalKills: 0,
    bossKills: 0,
    totalDmgDone: EN.fromNumber(0),
    totalGoldEarned: EN.fromNumber(0),
    timePlayed: 0,
    startTime: Date.now(),

    // Level
    level: 1,
    exp: EN.fromNumber(0),
    levelCap: 200,

    // Tap Titans Stage Progression
    currentStage: 1,         // 1 to infinity
    maxStage: 1,             // highest stage reached
    enemiesKilledInStage: 0, // kills in current stage (0 to 9)
    enemiesPerStage: 10,     // 10 enemies per stage
    isBossStage: false,      // boss every 5th stage
    bossTimeLeft: 30,        // 30s timer for boss
    bossTimerActive: false,  // active during boss fight
    autoAdvance: true,       // auto advance when cleared
    autoAdvanceZone: true,   // backwards compatibility alias

    // Stackable Bonuses
    stageBonus: 0,
    zonesMastered: 0,
    zoneMasteryBonus: 0,

    // Summon animation setting
    showSummonAnim: true,

    // Enemy state
    currentEnemy: null,
    killStreak: 0,

    // Equipment (8 slots)
    equipped: {
      weapon: null, offhand: null, helmet: null, chest: null,
      gloves: null, boots: null, ring: null, amulet: null,
    },
    inventory: [],
    autoSell: { common: false, uncommon: false },

    // Pets
    activePets: [null, null, null],
    petCollection: [],
    petSlots: 3,

    // Skills
    activeSkills: [null, null, null, null],
    passiveSkills: [null, null, null, null, null, null, null, null],
    skillCollection: [],
    skillCooldowns: {},

    // Upgrades
    upgradeLevels: {},

    // Dungeons
    dungeonFloor: 1,
    dungeonTokens: 0,

    // Relics
    relicLevels: {},
    relicDust: 0,

    // Prestige
    rebirths: 0,
    soulShards: 0,
    prestigeUpgrades: {},
    ascensions: 0,
    voidCrystals: 0,
    transcendences: 0,
    eternityFragments: 0,

    // Crafting materials
    materials: {
      chaosShards: 10,
      anchorCrystals: 5,
      tierStones: 2,
      voidEssence: 0,
      petEssence: 20,
      bossBlueprints: 0,
    },

    // Gacha pity
    gachaPity: { pet: 0, skill: 0, gear: 0 },

    // Settings & Logs
    showDmgNumbers: true,
    combatLog: [],

    // Stats
    stats: {
      totalClicks: 0,
      eliteKills: 0,
      dungeonRuns: 0,
    },
  };
}

// ══════════════════════════════════════════════════════════════════
// SAVE / LOAD
// ══════════════════════════════════════════════════════════════════
function saveGame() {
  try {
    const s = { ...G.save };
    s.gold = EN.toString(G.save.gold);
    s.exp  = EN.toString(G.save.exp);
    s.totalDmgDone = EN.toString(G.save.totalDmgDone);
    s.totalGoldEarned = EN.toString(G.save.totalGoldEarned);
    if (s.currentEnemy) {
      s.currentEnemy = { ...s.currentEnemy };
      s.currentEnemy.hp    = EN.toString(s.currentEnemy.hp);
      s.currentEnemy.maxHp = EN.toString(s.currentEnemy.maxHp);
      s.currentEnemy.gold  = EN.toString(s.currentEnemy.gold);
    }
    localStorage.setItem('eternityRPGSave', JSON.stringify(s));
  } catch(e) { console.error('Save failed', e); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem('eternityRPGSave');
    if (!raw) return null;
    const s = JSON.parse(raw);
    s.gold = EN.convert(s.gold);
    s.exp  = EN.convert(s.exp);
    s.totalDmgDone    = EN.convert(s.totalDmgDone);
    s.totalGoldEarned = EN.convert(s.totalGoldEarned);
    if (s.currentEnemy) {
      s.currentEnemy.hp    = EN.convert(s.currentEnemy.hp);
      s.currentEnemy.maxHp = EN.convert(s.currentEnemy.maxHp);
      s.currentEnemy.gold  = EN.convert(s.currentEnemy.gold);
    }
    return s;
  } catch(e) { console.error('Load failed', e); return null; }
}

function exportSave() {
  saveGame();
  const raw = localStorage.getItem('eternityRPGSave');
  if (!raw) return '';
  return btoa(unescape(encodeURIComponent(raw)));
}

function importSave(base64Str) {
  try {
    const raw = decodeURIComponent(escape(atob(base64Str.trim())));
    JSON.parse(raw); // validate JSON
    localStorage.setItem('eternityRPGSave', raw);
    location.reload();
    return true;
  } catch(e) {
    console.error('Import failed', e);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════
// COMPUTED STATS
// ══════════════════════════════════════════════════════════════════
function computeStats() {
  const cs = {
    dmgMult:      1,
    atkSpeed:     1,
    critChance:   0.05,
    critDmg:      2.0,
    goldFind:     1,
    expBonus:     1,
    skillDmg:     1,
    petDmg:       1,
    clickDmg:     1,
    bossDmg:      1,
    eliteDmg:     1,
    cdReduction:  0,
    dropRate:     1,
    idleBonus:    1,
    maxHp:        100,
    dmgReduction: 0,
    allElemDmg:   0,
    fireDmg:      0,
    iceDmg:       0,
    lightningDmg: 0,
    shadowDmg:    0,
    holyDmg:      0,
    comboMult:    1,
    doubleStrike: 0,
    offhandProc:  0,
    petAtkSpd:    1,
    overkillBonus:0,
    lifeSteal:    0,
    comboChance:  0,
    luckyStrike:  0,
    soulHarvest:  0,
    adrenaline:   0,
    thornsDmg:    0,
    dodgeChance:  0,
    zoneClearSpd: 1,
    manaRegen:    1,
    blockChance:  0,
    damageReflect:0,
    spellPower:   1,
    constellPower:1,
    prestigeMult: 1,
    elemResonance:0,
    statusDuration:1,
    bleedDmg:     0,
    levelCap:     G.save.levelCap || 200,
    startZone:    0,
    keepUpgrades: 0,
    petSlots:     G.save.petSlots || 3,
  };

  // Level bonus
  const lvl = G.save.level;
  cs.dmgMult += (lvl - 1) * 0.10;

  // Equipment affixes (8 slots)
  for (const slot of GAME_DATA.EQUIP_SLOTS) {
    const item = G.save.equipped[slot.id];
    if (!item) continue;
    for (const af of (item.affixes || [])) {
      if (!af) continue;
      const statKey = af.stat;
      const tierVal = af.tierVal || 0;
      if (statKey in cs) {
        cs[statKey] += tierVal;
      }
    }
  }

  // Active pets
  for (let i = 0; i < G.save.petSlots; i++) {
    const pid = G.save.activePets[i];
    if (!pid) continue;
    const owned = G.save.petCollection.find(p => p.petId === pid);
    const pet   = GAME_DATA.PETS.find(p => p.id === pid);
    if (!pet) continue;
    const lvlBonus = owned ? (1 + owned.level * 0.03) : 1;
    const evolBonus = owned && owned.evolved ? 1.8 : 1;
    cs.dmgMult    += pet.dmgAura  * lvlBonus * evolBonus * (1 + cs.petDmg);
    cs.goldFind   += pet.goldAura * lvlBonus * evolBonus;
    cs.critChance += pet.critAura * lvlBonus * evolBonus;
  }

  // Passive skills
  for (const sid of G.save.passiveSkills) {
    if (!sid) continue;
    const sk = GAME_DATA.SKILLS.passive.find(s => s.id === sid);
    if (!sk) continue;
    const owned = G.save.skillCollection.find(s => s.skillId === sid);
    const lvl   = owned ? owned.level : 1;
    const cst   = owned ? (1 + owned.constellation * 0.10) : 1;
    if (sk.effect.stat in cs) {
      cs[sk.effect.stat] += sk.effect.val * lvl * cst;
    }
  }

  // Upgrades
  for (const up of GAME_DATA.UPGRADES) {
    const lvl = G.save.upgradeLevels[up.id] || 0;
    if (lvl === 0) continue;
    if (up.oneTime) {
      if (up.stat in cs) cs[up.stat] += up.val;
    } else {
      if (up.stat in cs) cs[up.stat] += up.val * lvl;
    }
  }

  // Relics
  for (const r of GAME_DATA.RELICS) {
    const rLvl = G.save.relicLevels[r.id] || 0;
    if (rLvl > 0 && r.stat in cs) {
      cs[r.stat] += r.val * rLvl;
    }
  }

  // Prestige upgrades
  for (const pu of GAME_DATA.PRESTIGE_UPGRADES) {
    const bought = G.save.prestigeUpgrades[pu.id] || 0;
    if (!bought) continue;
    if (pu.stat in cs) cs[pu.stat] += pu.val;
  }

  // Rebirths bonus
  if (G.save.rebirths > 0) {
    cs.dmgMult  *= 1 + G.save.rebirths * 0.50;
    cs.goldFind *= 1 + G.save.rebirths * 0.30;
  }

  // Stage stacking bonus & Boss Mastery (Tap Titans style scaling)
  const maxStg = (G.save.maxStage || 1);
  cs.goldFind *= 1 + (maxStg - 1) * 0.02; // +2% gold per max stage reached
  
  const bossesDefeated = Math.floor((maxStg - 1) / 5);
  if (bossesDefeated > 0) {
    const zmMult = 1 + bossesDefeated * 0.05; // +5% ALL stats per boss defeated!
    cs.dmgMult    *= zmMult;
    cs.goldFind   *= zmMult;
    cs.expBonus   *= zmMult;
    cs.skillDmg   *= zmMult;
    cs.petDmg     *= zmMult;
    cs.critDmg    *= zmMult;
  }

  // Caps (CRIT CHANCE CAP REMOVED FOR WARFRAME MULTI-CRIT!)
  cs.dodgeChance  = Math.min(cs.dodgeChance, 0.75);
  cs.dmgReduction = Math.min(cs.dmgReduction, 0.80);
  cs.cdReduction  = Math.min(cs.cdReduction, 0.75);
  cs.atkSpeed     = Math.max(cs.atkSpeed, 0.1);

  return cs;
}

// ══════════════════════════════════════════════════════════════════
// BASE DAMAGE & DPS
// ══════════════════════════════════════════════════════════════════
function getBaseDmg() {
  const stage = G.save.currentStage || 1;
  const worldIdx = Math.floor((stage - 1) / 50);
  const lvl  = G.save.level;
  let base = EN.fromNumber(1 + lvl * 1.5 + stage * 4);
  base = EN.mul(base, EN.pow(EN.fromNumber(1.08), EN.fromNumber(stage)));
  base = EN.mul(base, EN.pow(EN.fromNumber(1.06), EN.fromNumber(lvl)));

  const weapon = G.save.equipped.weapon;
  if (weapon) {
    const wRarityIdx = GAME_DATA.RARITY_INDEX[weapon.rarity] || 0;
    base = EN.mul(base, EN.fromNumber(1 + wRarityIdx * 0.5 + weapon.upgradeLevel * 0.15));
  }
  return base;
}

function getDPS() {
  const cs   = G.computedStats;
  let dmg    = G.baseDmg;
  dmg        = EN.mul(dmg, EN.fromNumber(1 + cs.dmgMult));
  const atkPerSec = cs.atkSpeed;
  // Warframe multi-crit average multiplier
  const critMult  = 1 + cs.critChance * (Math.max(1, cs.critDmg) - 1);
  dmg = EN.mul(dmg, EN.fromNumber(atkPerSec * critMult));
  return dmg;
}

// ══════════════════════════════════════════════════════════════════
// ENEMY GENERATION
// ══════════════════════════════════════════════════════════════════
function getEnemyTier(zoneId) {
  if (zoneId <= 2)  return 0;
  if (zoneId <= 6)  return 1;
  if (zoneId <= 13) return 2;
  if (zoneId <= 20) return 3;
  return 4;
}

function spawnEnemy(isBoss = false, isElite = false) {
  const stage  = G.save.currentStage || 1;
  const worldIdx = Math.floor((stage - 1) / 50) % GAME_DATA.WORLDS.length;
  const world  = GAME_DATA.WORLDS[worldIdx];
  const tier   = Math.min(Math.floor((stage - 1) / 100), GAME_DATA.ENEMY_TYPES.length - 1);
  const types  = GAME_DATA.ENEMY_TYPES[tier];
  const etype  = types[Math.floor(Math.random() * types.length)];

  // Check if this stage is a boss stage (every 5th stage)
  const isBossStage = (stage % 5 === 0);
  if (isBossStage) isBoss = true;

  const baseHp   = EN.mul(EN.fromNumber(10), EN.pow(EN.fromNumber(1.15), EN.fromNumber(stage)));
  const baseGold = EN.mul(EN.fromNumber(2), EN.pow(EN.fromNumber(1.12), EN.fromNumber(stage)));

  let hpMult   = etype.hpMult;
  let goldMult = etype.goldMult;
  let name     = etype.name;
  let icon     = etype.icon;
  let isBossFlag = false;

  if (isBoss) {
    const bossName = GAME_DATA.BOSS_NAMES[G.save.bossKills % GAME_DATA.BOSS_NAMES.length];
    name     = bossName;
    icon     = '👹';
    hpMult   *= 8;   // Boss has 8× HP
    goldMult *= 8;   // Boss gives 8× gold reward
    isBossFlag = true;
    G.save.isBossStage = true;
    G.save.bossTimeLeft = 30;
    G.save.bossTimerActive = true;
  } else {
    G.save.isBossStage = false;
    G.save.bossTimerActive = false;
    if (isElite) {
      name     = '⚡ Elite ' + name;
      hpMult   *= 3;
      goldMult *= 2.5;
    }
  }

  const hp   = EN.mul(baseHp,   EN.fromNumber(hpMult));
  const gold = EN.mul(baseGold, EN.fromNumber(goldMult));

  return {
    name, icon,
    hp:    EN.clone ? EN.clone(hp) : EN.mul(hp, EN.fromNumber(1)),
    maxHp: EN.clone ? EN.clone(hp) : EN.mul(hp, EN.fromNumber(1)),
    gold,
    isBoss: isBossFlag,
    isElite,
    tier,
    zoneId: worldIdx,
    stageNumber: stage,
    dropRarityBias: isBossFlag ? 4 : (isElite ? 1.8 : 1),
  };
}

// ══════════════════════════════════════════════════════════════════
// COMBAT
// ══════════════════════════════════════════════════════════════════
function dealDamage(multiplier = 1, isClick = false) {
  if (!G.save.currentEnemy) return;
  const cs = G.computedStats;

  let dmg = EN.mul(G.baseDmg, EN.fromNumber(1 + cs.dmgMult));

  if (isClick) dmg = EN.mul(dmg, EN.fromNumber(1 + cs.clickDmg));

  let hits = 1;
  if (Math.random() < cs.doubleStrike) hits = 2;
  if (Math.random() < cs.comboChance)  hits = Math.floor(Math.random() * 4) + 2;
  dmg = EN.mul(dmg, EN.fromNumber(hits));

  // ── Warframe Multi-Layer Criticals ─────────────────────────────
  let critTier = 0;
  if (cs.critChance > 0) {
    const baseTiers = Math.floor(cs.critChance);
    const remainder = cs.critChance - baseTiers;
    critTier = baseTiers + (Math.random() < remainder ? 1 : 0);
  }
  const isCrit = critTier > 0;
  if (isCrit) {
    // Warframe formula: 1 + Tier * (CritDmg - 1)
    const critMult = 1 + critTier * Math.max(1, cs.critDmg - 1);
    dmg = EN.mul(dmg, EN.fromNumber(critMult));
  }

  const elemBonus = cs.allElemDmg + cs.fireDmg + cs.iceDmg + cs.lightningDmg + cs.shadowDmg + cs.holyDmg;
  dmg = EN.mul(dmg, EN.fromNumber(1 + elemBonus * 0.2));

  if (G.save.currentEnemy.isBoss)  dmg = EN.mul(dmg, EN.fromNumber(1 + cs.bossDmg));
  if (G.save.currentEnemy.isElite) dmg = EN.mul(dmg, EN.fromNumber(1 + cs.eliteDmg));

  if (Math.random() < cs.luckyStrike) dmg = EN.mul(dmg, EN.fromNumber(100));

  if (multiplier !== 1) dmg = EN.mul(dmg, EN.fromNumber(multiplier));

  if (cs.offhandProc > 0 && Math.random() < 0.3) {
    dmg = EN.add(dmg, EN.mul(dmg, EN.fromNumber(cs.offhandProc)));
  }

  G.save.currentEnemy.hp = EN.sub(G.save.currentEnemy.hp, dmg);
  G.save.totalDmgDone    = EN.add(G.save.totalDmgDone, dmg);

  if (G.save.showDmgNumbers) {
    spawnDmgFloat(EN.fmt(dmg), isCrit, isClick, critTier);
  }

  if (EN.leeq(G.save.currentEnemy.hp, EN.fromNumber(0))) {
    killEnemy();
  }

  return { dmg, isCrit, critTier };
}

function killEnemy() {
  const enemy = G.save.currentEnemy;
  if (!enemy) return;

  const cs = G.computedStats;

  // Gold & EXP
  let gold = EN.mul(enemy.gold, EN.fromNumber(cs.goldFind));
  G.save.gold = EN.add(G.save.gold, gold);
  G.save.totalGoldEarned = EN.add(G.save.totalGoldEarned, gold);

  const stage = G.save.currentStage || 1;
  const expGain = EN.mul(EN.fromNumber(10 + stage * 5), EN.fromNumber(cs.expBonus));
  G.save.exp    = EN.add(G.save.exp, expGain);
  checkLevelUp();

  // Kills & Counters
  G.save.totalKills++;
  G.save.killStreak++;
  if (enemy.isBoss)  G.save.bossKills++;
  if (enemy.isElite) G.save.stats.eliteKills++;

  // Item Drop
  if (Math.random() < 0.18 * cs.dropRate) {
    dropItem(enemy);
  }
  // Material Drop
  if (Math.random() < 0.10 * cs.dropRate) {
    dropMaterial();
  }

  addLog(`Killed ${enemy.name} | +${EN.fmt(gold)} 💰`, 'kill');

  // ── Tap Titans Stage Progression ────────────────────────────────
  if (enemy.isBoss) {
    // Boss defeated!
    G.save.bossTimerActive = false;
    G.save.maxStage = Math.max(G.save.maxStage || 1, stage + 1);
    addLog(`👑 Stage ${stage} Boss Defeated!`, 'boss');
    G.events.emit('bossDefeated', { stage });

    if (G.save.autoAdvance) {
      G.save.currentStage++;
      G.save.enemiesKilledInStage = 0;
      addLog(`🌟 Advanced to Stage ${G.save.currentStage}!`, 'loot');
    }
  } else {
    // Normal enemy defeated
    G.save.enemiesKilledInStage = (G.save.enemiesKilledInStage || 0) + 1;
    if (G.save.enemiesKilledInStage >= (G.save.enemiesPerStage || 10)) {
      // Cleared the stage!
      G.save.maxStage = Math.max(G.save.maxStage || 1, stage + 1);
      if (G.save.autoAdvance) {
        G.save.currentStage++;
        G.save.enemiesKilledInStage = 0;
        addLog(`🌟 Advanced to Stage ${G.save.currentStage}!`, 'loot');
      } else {
        G.save.enemiesKilledInStage = 0;
      }
    }
  }

  G.computedStats = computeStats();
  G.baseDmg = getBaseDmg();
  G.save.currentEnemy = spawnEnemy();
  G.events.emit('stageProgress', { stage: G.save.currentStage, kills: G.save.enemiesKilledInStage });

  // Adrenaline
  if (Math.random() < cs.adrenaline) {
    G.adrenalineActive = true;
    setTimeout(() => { G.adrenalineActive = false; }, 2000);

  }

  G.events.emit('kill', { enemy, gold });
}

function checkLevelUp() {
  const cap = G.computedStats.levelCap;
  if (G.save.level >= cap) return;
  const expNeeded = EN.mul(EN.fromNumber(10), EN.pow(EN.fromNumber(G.save.level), EN.fromNumber(1.8)));
  if (EN.meeq(G.save.exp, expNeeded)) {
    G.save.exp   = EN.sub(G.save.exp, expNeeded);
    G.save.level += 1;
    G.computedStats = computeStats();
    addLog(`🎉 Level Up! Level ${G.save.level}`, 'level');
    G.events.emit('levelup', G.save.level);
  }
}

// ══════════════════════════════════════════════════════════════════
// EQUIPMENT
// ══════════════════════════════════════════════════════════════════
function generateItem(slotId, rarityId, zoneId) {
  if (!rarityId) rarityId = GAME_DATA.rollRarity();
  const rarity     = GAME_DATA.getRarityById(rarityId);
  const bases      = GAME_DATA.EQUIP_BASES[slotId];
  const validBases = bases.filter(b => b.minZone <= (zoneId || G.save.currentZone));
  const base       = validBases[Math.floor(Math.random() * validBases.length)] || bases[0];
  const affixPool  = GAME_DATA.AFFIXES[slotId] || [];
  const affixCount = rarity.affixCount;

  const shuffled = [...affixPool].sort(() => Math.random() - 0.5);
  const chosen   = shuffled.slice(0, Math.min(affixCount, shuffled.length));

  const affixes = chosen.map(af => {
    const tier    = Math.floor(Math.random() * 5);
    const tierVal = af.tiers[tier] * (1 + Math.random() * 0.3);
    return { id: af.id, name: af.name, stat: af.stat, tier, tierVal, desc: af.desc, locked: false };
  });

  return {
    uid: Math.random().toString(36).slice(2),
    slotId,
    baseId: base.id,
    name: base.name,
    icon: base.icon,
    rarity: rarityId,
    affixes,
    upgradeLevel: 0,
    maxUpgrade: 20,
    zoneId: zoneId || G.save.currentZone,
  };
}

function dropItem(enemy) {
  const slots  = GAME_DATA.EQUIP_SLOTS.map(s => s.id);
  const slotId = slots[Math.floor(Math.random() * slots.length)];
  const bias   = enemy.dropRarityBias || 1;
  const rarityId = GAME_DATA.rollRarity(bias);
  const item   = generateItem(slotId, rarityId, enemy.zoneId);

  // Auto-sell check
  if (G.save.autoSell && G.save.autoSell[rarityId]) {
    disenchantItem(item);
    addLog(`✨ Auto-dismantled [${rarityId}] ${item.name}`, 'loot');
    return;
  }

  G.save.inventory.push(item);
  addLog(`🎁 Dropped: [${item.rarity.toUpperCase()}] ${item.name}`, 'loot');

  if (G.save.autoEquip) autoEquipCheck(item);
  G.events.emit('itemDrop', item);
}

function equipItem(item) {
  const old = G.save.equipped[item.slotId];
  G.save.equipped[item.slotId] = item;
  const idx = G.save.inventory.findIndex(i => i.uid === item.uid);
  if (idx >= 0) G.save.inventory.splice(idx, 1);
  if (old) G.save.inventory.push(old);

  G.computedStats = computeStats();
  G.baseDmg = getBaseDmg();
  G.events.emit('equip', { item, old });
}

function unequipItem(slotId) {
  const item = G.save.equipped[slotId];
  if (!item) return;
  G.save.inventory.push(item);
  G.save.equipped[slotId] = null;
  G.computedStats = computeStats();
  G.baseDmg = getBaseDmg();
}

function autoEquipCheck(newItem) {
  const currentEquipped = G.save.equipped[newItem.slotId];
  if (!currentEquipped) { equipItem(newItem); return; }
  const currRarIdx = GAME_DATA.RARITY_INDEX[currentEquipped.rarity] || 0;
  const newRarIdx  = GAME_DATA.RARITY_INDEX[newItem.rarity] || 0;
  if (newRarIdx > currRarIdx) equipItem(newItem);
  else if (newRarIdx === currRarIdx && newItem.affixes.length > currentEquipped.affixes.length) equipItem(newItem);
}

function rerollItem(item, mode, lockedIndices) {
  const affixPool = GAME_DATA.AFFIXES[item.slotId] || [];
  if (mode === 'chaos') {
    if (G.save.materials.chaosShards < 1) return false;
    G.save.materials.chaosShards -= 1;
    const rarity     = GAME_DATA.getRarityById(item.rarity);
    const shuffled   = [...affixPool].sort(() => Math.random() - 0.5);
    item.affixes = shuffled.slice(0, rarity.affixCount).map(af => {
      const tier    = Math.floor(Math.random() * 5);
      const tierVal = af.tiers[tier] * (1 + Math.random() * 0.3);
      return { id: af.id, name: af.name, stat: af.stat, tier, tierVal, desc: af.desc, locked: false };
    });
    return true;
  }
  if (mode === 'targeted') {
    if (G.save.materials.anchorCrystals < 1) return false;
    G.save.materials.anchorCrystals -= 1;
    const locked = new Set(lockedIndices || []);
    const rarity = GAME_DATA.getRarityById(item.rarity);
    const newPool = [...affixPool].filter(a => !item.affixes.some((af, i) => af.id === a.id && locked.has(i)));
    newPool.sort(() => Math.random() - 0.5);
    let newIdx = 0;
    item.affixes = item.affixes.map((af, i) => {
      if (locked.has(i)) return af;
      const a = newPool[newIdx++] || af;
      const tier    = Math.floor(Math.random() * 5);
      const tierVal = a.tiers[tier] * (1 + Math.random() * 0.3);
      return { id: a.id, name: a.name, stat: a.stat, tier, tierVal, desc: a.desc, locked: false };
    });
    return true;
  }
  return false;
}

function upgradeAffix(item, affixIndex) {
  if (G.save.materials.tierStones < 1) return false;
  const af = item.affixes[affixIndex];
  if (!af || af.tier >= 4) return false;
  G.save.materials.tierStones -= 1;
  af.tier += 1;
  const poolAf = (GAME_DATA.AFFIXES[item.slotId] || []).find(a => a.id === af.id);
  if (poolAf) {
    af.tierVal = poolAf.tiers[af.tier] * (1 + Math.random() * 0.3);
  }
  return true;
}

function upgradeItem(item) {
  const cost = EN.mul(EN.fromNumber(100), EN.pow(EN.fromNumber(1.5), EN.fromNumber(item.upgradeLevel)));
  if (EN.le(G.save.gold, cost)) return false;
  G.save.gold = EN.sub(G.save.gold, cost);
  item.upgradeLevel = Math.min(item.upgradeLevel + 1, item.maxUpgrade);
  item.affixes.forEach(af => { af.tierVal *= 1.05; });
  G.computedStats = computeStats();
  G.baseDmg = getBaseDmg();
  return true;
}

function disenchantItem(item) {
  const rarIdx = GAME_DATA.RARITY_INDEX[item.rarity] || 0;
  G.save.materials.chaosShards   += 1 + rarIdx;
  G.save.materials.anchorCrystals += Math.max(0, rarIdx - 2);
  G.save.materials.tierStones     += Math.max(0, rarIdx - 4);
  if (rarIdx >= 6) G.save.materials.voidEssence += 1;
  const idx = G.save.inventory.findIndex(i => i.uid === item.uid);
  if (idx >= 0) G.save.inventory.splice(idx, 1);
}

function combineItems(items) {
  if (items.length < 3) return null;
  const rar = items[0].rarity;
  const rarIdx = GAME_DATA.RARITY_INDEX[rar];
  if (rarIdx >= GAME_DATA.RARITIES.length - 1) return null;
  const newRar = GAME_DATA.RARITIES[rarIdx + 1].id;
  for (const it of items) {
    const idx = G.save.inventory.findIndex(i => i.uid === it.uid);
    if (idx >= 0) G.save.inventory.splice(idx, 1);
  }
  const newItem = generateItem(items[0].slotId, newRar, G.save.currentZone);
  G.save.inventory.push(newItem);
  return newItem;
}

// ══════════════════════════════════════════════════════════════════
// MATERIALS DROP & RELICS
// ══════════════════════════════════════════════════════════════════
function dropMaterial() {
  const roll = Math.random();
  if (roll < 0.45) G.save.materials.chaosShards++;
  else if (roll < 0.75) G.save.materials.anchorCrystals++;
  else if (roll < 0.90) G.save.materials.tierStones++;
  else if (roll < 0.97) G.save.materials.petEssence += 2;
  else G.save.relicDust += 5;
}

function upgradeRelic(relicId) {
  const relic = GAME_DATA.RELICS.find(r => r.id === relicId);
  if (!relic) return false;
  const lvl  = G.save.relicLevels[relicId] || 0;
  const cost = relic.costBase * (lvl + 1);
  if (G.save.relicDust < cost) return false;
  G.save.relicDust -= cost;
  G.save.relicLevels[relicId] = lvl + 1;
  G.computedStats = computeStats();
  G.baseDmg = getBaseDmg();
  addLog(`🏛️ Upgraded ${relic.name} to Lv.${lvl+1}!`, 'loot');
  return true;
}

// ══════════════════════════════════════════════════════════════════
// PETS & ACTIVE PET DAMAGE
// ══════════════════════════════════════════════════════════════════
function addPet(petId) {
  const existing = G.save.petCollection.find(p => p.petId === petId);
  if (existing) {
    existing.duplicates = (existing.duplicates || 0) + 1;
    existing.constellation = Math.min((existing.constellation || 0) + 1, 6);
    G.save.materials.petEssence += 5;
  } else {
    G.save.petCollection.push({ petId, level: 1, exp: 0, evolved: false, constellation: 0, duplicates: 0 });
  }
  G.events.emit('petAdded', petId);
}

function setPetActive(petId, slot) {
  if (slot >= G.save.petSlots) return false;
  G.save.activePets[slot] = petId;
  G.computedStats = computeStats();
  return true;
}

function levelPet(petId) {
  const owned = G.save.petCollection.find(p => p.petId === petId);
  if (!owned) return false;
  const cost = owned.level * 5;
  if (G.save.materials.petEssence < cost) return false;
  G.save.materials.petEssence -= cost;
  owned.level++;
  if (owned.level >= 50 && !owned.evolved) {
    if (G.save.materials.petEssence >= 100) {
      G.save.materials.petEssence -= 100;
      owned.evolved = true;
      addLog(`✨ ${petId} Evolved!`, 'loot');
    }
  }
  G.computedStats = computeStats();
  return true;
}

// ══════════════════════════════════════════════════════════════════
// SKILLS & GACHA
// ══════════════════════════════════════════════════════════════════
function addSkill(skillId, type) {
  const existing = G.save.skillCollection.find(s => s.skillId === skillId);
  if (existing) {
    existing.constellation = Math.min((existing.constellation || 0) + 1, 6);
    existing.level = Math.min(existing.level + 1, 10);
  } else {
    G.save.skillCollection.push({ skillId, type, level: 1, constellation: 0 });
  }
  G.events.emit('skillAdded', skillId);
}

function useSkill(slot) {
  const sid = G.save.activeSkills[slot];
  if (!sid) return false;
  const skill = GAME_DATA.SKILLS.active.find(s => s.id === sid);
  if (!skill) return false;
  const cs = G.computedStats;
  const cd = skill.cooldown * (1 - cs.cdReduction);
  const now = Date.now();
  const lastUsed = G.save.skillCooldowns[sid] || 0;
  if (now - lastUsed < cd * 1000) return false;

  G.save.skillCooldowns[sid] = now;
  const owned = G.save.skillCollection.find(s => s.skillId === sid);
  const lvlBonus = owned ? (1 + (owned.level - 1) * 0.2) : 1;
  const constBonus = owned ? (1 + owned.constellation * 0.1) : 1;
  const totalMult = skill.dmgMult * (1 + cs.skillDmg) * lvlBonus * constBonus;

  dealDamage(totalMult);
  addLog(`💫 Skill: ${skill.name} (×${totalMult.toFixed(1)} dmg)`, 'skill');
  G.events.emit('skillUsed', { sid, slot });
  return true;
}

function getSummonCost(count = 1) {
  const pulls = (count === 10 ? 9 : count);
  const stage = G.save.currentStage || 1;
  const basePerPull = EN.mul(EN.fromNumber(5000), EN.pow(EN.fromNumber(1.10), EN.fromNumber(stage)));
  return EN.mul(basePerPull, EN.fromNumber(pulls));
}

function summon(bannerId, count = 1) {
  const banner = GAME_DATA.BANNERS.find(b => b.id === bannerId);
  if (!banner) return [];
  const cost = getSummonCost(count);
  if (EN.le(G.save.gold, cost)) return [];
  G.save.gold = EN.sub(G.save.gold, cost);

  const results = [];
  for (let i = 0; i < count; i++) {
    G.save.gachaPity[bannerId]++;
    const pity = G.save.gachaPity[bannerId];
    let rarityId = pity >= 100 ? 'legendary' : (pity >= 50 ? 'epic' : GAME_DATA.rollRarity(pity >= 40 ? 2 : 1));
    if (pity >= 100 || (pity >= 50 && rarityId === 'epic')) G.save.gachaPity[bannerId] = 0;

    if (bannerId === 'pet') {
      const pool = GAME_DATA.PETS.filter(p => p.rarity === rarityId);
      const chosen = (pool.length ? pool : GAME_DATA.PETS)[Math.floor(Math.random() * (pool.length || GAME_DATA.PETS.length))];
      addPet(chosen.id);
      results.push({ type: 'pet', id: chosen.id, rarity: rarityId });
    } else if (bannerId === 'skill') {
      const allSkills = [...GAME_DATA.SKILLS.active, ...GAME_DATA.SKILLS.passive].filter(s => s.rarity === rarityId);
      const pool2 = allSkills.length ? allSkills : GAME_DATA.SKILLS.active;
      const chosen = pool2[Math.floor(Math.random() * pool2.length)];
      const type   = GAME_DATA.SKILLS.active.includes(chosen) ? 'active' : 'passive';
      addSkill(chosen.id, type);
      results.push({ type: 'skill', id: chosen.id, rarity: rarityId, skillType: type });
    } else if (bannerId === 'gear') {
      const slots = GAME_DATA.EQUIP_SLOTS.map(s => s.id);
      const slotId = slots[Math.floor(Math.random() * slots.length)];
      const item   = generateItem(slotId, rarityId);
      G.save.inventory.push(item);
      if (G.save.autoEquip) autoEquipCheck(item);
      results.push({ type: 'gear', item, rarity: rarityId });
    }
  }

  G.computedStats = computeStats();
  G.events.emit('summonResult', { bannerId, results });
  return results;
}

// ══════════════════════════════════════════════════════════════════
// UPGRADES & PRESTIGE
// ══════════════════════════════════════════════════════════════════
function buyUpgrade(upId, silent = false) {
  const up = GAME_DATA.UPGRADES.find(u => u.id === upId);
  if (!up) return false;
  const lvl  = G.save.upgradeLevels[upId] || 0;
  if (up.oneTime && lvl >= 1) return false;
  const cost = EN.mul(EN.convert(up.baseCost), EN.pow(EN.fromNumber(up.costScale), EN.fromNumber(lvl)));
  if (EN.le(G.save.gold, cost)) return false;
  G.save.gold = EN.sub(G.save.gold, cost);
  G.save.upgradeLevels[upId] = lvl + 1;
  if (!silent) {
    G.computedStats = computeStats();
    G.baseDmg = getBaseDmg();
    addLog(`✅ Upgraded: ${up.name}`, 'level');
    G.events.emit('upgradeBought', upId);
  }
  return true;
}

function buyAllUpgrades(tabFilter = null) {
  let boughtAny = false;
  let changed = false;
  let loops = 0;
  const list = tabFilter ? GAME_DATA.UPGRADES.filter(u => u.tab === tabFilter) : GAME_DATA.UPGRADES;
  do {
    changed = false;
    for (const up of list) {
      if (buyUpgrade(up.id, true)) {
        changed = true;
        boughtAny = true;
      }
    }
    loops++;
  } while (changed && loops < 200);

  if (boughtAny) {
    G.computedStats = computeStats();
    G.baseDmg = getBaseDmg();
    addLog(`⚡ Bought affordable ${tabFilter ? tabFilter.toUpperCase() : 'all'} upgrades!`, 'level');
    G.events.emit('upgradeBought', tabFilter || 'all');
  }
  return boughtAny;
}

function buyPrestigeUpgrade(upId) {
  const pu = GAME_DATA.PRESTIGE_UPGRADES.find(u => u.id === upId);
  if (!pu) return false;
  if (G.save.prestigeUpgrades[upId]) return false;
  if (G.save.soulShards < pu.cost) return false;
  G.save.soulShards -= pu.cost;
  G.save.prestigeUpgrades[upId] = 1;
  G.computedStats = computeStats();
  G.baseDmg = getBaseDmg();
  return true;
}

function getSoulShardsGain() {
  const stage = G.save.currentStage || 1;
  const kills = G.save.totalKills;
  const base  = Math.floor(Math.sqrt(kills / 30) + stage * 0.5);
  return Math.max(1, base);
}

function rebirth() {
  const shards = getSoulShardsGain();
  G.save.soulShards += shards;
  G.save.rebirths++;

  const keepFrac = G.computedStats.keepUpgrades || 0;
  const oldUpgrades = { ...G.save.upgradeLevels };

  G.save.gold = EN.fromNumber(0);
  G.save.exp  = EN.fromNumber(0);
  G.save.level = 1;
  G.save.totalKills = 0;
  G.save.bossKills = 0;
  G.save.stageKills = 0;
  G.save.currentStage = G.computedStats.startStage || 1;
  G.save.enemiesKilledInStage = 0;
  G.save.killStreak = 0;
  G.save.upgradeLevels = {};

  if (keepFrac > 0) {
    for (const [k, v] of Object.entries(oldUpgrades)) {
      G.save.upgradeLevels[k] = Math.floor(v * keepFrac);
    }
  }

  G.computedStats = computeStats();
  G.baseDmg = getBaseDmg();
  G.save.currentEnemy = spawnEnemy();
  addLog(`🌟 Rebirth #${G.save.rebirths}! +${shards} Soul Shards`, 'prestige');
  G.events.emit('rebirth', { shards });
}

function travelToZone(stageNum) {
  if (stageNum < 1 || stageNum > (G.save.maxStage || 1)) return false;
  G.save.currentStage = stageNum;
  G.save.enemiesKilledInStage = 0;
  G.save.currentEnemy = spawnEnemy();
  G.computedStats = computeStats();
  G.baseDmg = getBaseDmg();
  return true;
}

// ══════════════════════════════════════════════════════════════════
// LOGS & EVENTS
// ══════════════════════════════════════════════════════════════════
function addLog(msg, type = 'info') {
  if (!G.save.combatLog) G.save.combatLog = [];
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  G.save.combatLog.unshift({ text: msg, type, time: timestamp });
  if (G.save.combatLog.length > 50) G.save.combatLog.pop();
}

function spawnDmgFloat(text, isCrit, isClick, critTier = 0) {
  G.events.emit('dmgFloat', { text, isCrit, isClick, critTier });
}

G.events = {
  _listeners: {},
  on(evt, fn) {
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(fn);
  },
  emit(evt, data) {
    (this._listeners[evt] || []).forEach(fn => { try { fn(data); } catch(e){ console.error(e); } });
  }
};

// ══════════════════════════════════════════════════════════════════
// MAIN GAME TICK (100ms)
// ══════════════════════════════════════════════════════════════════
let lastTick = Date.now();
let petTickAcc = 0;

function gameTick() {
  const now = Date.now();
  const dt  = (now - lastTick) / 1000;
  lastTick  = now;
  G.save.timePlayed += dt;

  // ── Boss Timer Countdown (Tap Titans style) ────────────────────
  if (G.save.bossTimerActive && G.save.isBossStage && G.save.currentEnemy && G.save.currentEnemy.isBoss) {
    G.save.bossTimeLeft -= dt;
    if (G.save.bossTimeLeft <= 0) {
      G.save.bossTimerActive = false;
      // Timer expired! Retreat 4 stages back (or to stage 1 if < 5)
      const targetStage = Math.max(1, G.save.currentStage - 4);
      addLog(`⏰ Boss Timer Expired! Retreating to Stage ${targetStage}...`, 'boss');
      G.save.currentStage = targetStage;
      G.save.enemiesKilledInStage = 0;
      G.save.currentEnemy = spawnEnemy();
      G.computedStats = computeStats();
      G.baseDmg = getBaseDmg();
      G.events.emit('stageRetreat', targetStage);
    }
  }

  // Auto-attack
  const autoAtkLvl = G.save.upgradeLevels['autoatk1'] || 0;
  if (autoAtkLvl > 0 && G.save.currentEnemy) {
    const cs = G.computedStats;
    G.atkAccum = (G.atkAccum || 0) + dt * cs.atkSpeed;
    while (G.atkAccum >= 1) {
      G.atkAccum -= 1;
      if (G.save.currentEnemy) {
        dealDamage(G.adrenalineActive ? 2 : 1);
      }
    }
  }

  // Active Pets Damage Tick (every 1 second)
  petTickAcc += dt;
  if (petTickAcc >= 1.0) {
    petTickAcc = 0;
    if (G.save.currentEnemy) {
      let petDmgTotal = EN.fromNumber(0);
      for (let i = 0; i < G.save.petSlots; i++) {
        const pid = G.save.activePets[i];
        if (!pid) continue;
        const pet = GAME_DATA.PETS.find(p => p.id === pid);
        const owned = G.save.petCollection.find(p => p.petId === pid);
        if (!pet) continue;
        const petDmg = EN.mul(G.baseDmg, EN.fromNumber(pet.dmgAura * (1 + (owned ? owned.level * 0.05 : 0))));
        petDmgTotal = EN.add(petDmgTotal, petDmg);
      }
      if (EN.me(petDmgTotal, EN.fromNumber(0))) {
        dealDamage(0.5); // Pet strike
      }
    }
  }

  // Skill auto-cooldown tick & use
  for (let i = 0; i < 4; i++) {
    const sid = G.save.activeSkills[i];
    if (!sid) continue;
    const skill = GAME_DATA.SKILLS.active.find(s => s.id === sid);
    if (!skill) continue;
    const cs = G.computedStats;
    const cd = skill.cooldown * (1 - cs.cdReduction);
    if ((now - (G.save.skillCooldowns[sid] || 0)) >= cd * 1000) {
      useSkill(i);
    }
  }

  G.events.emit('tick', dt);
}

// ══════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════
function initGame() {
  const saved = loadGame();
  G.save = saved || defaultSave();

  // Save migration to Tap Titans style stage system
  if (G.save.currentStage === undefined) G.save.currentStage = Math.max(1, (G.save.currentZone || 0) * 50 + (G.save.stageNumber || 1));
  if (G.save.maxStage === undefined) G.save.maxStage = Math.max(G.save.currentStage, (G.save.highestZone || 0) * 50 + 1);
  if (G.save.enemiesKilledInStage === undefined) G.save.enemiesKilledInStage = G.save.stageKills || 0;
  if (G.save.enemiesPerStage === undefined) G.save.enemiesPerStage = 10;
  if (G.save.autoAdvance === undefined) G.save.autoAdvance = G.save.autoAdvanceZone !== undefined ? G.save.autoAdvanceZone : true;
  if (G.save.bossTimeLeft === undefined) G.save.bossTimeLeft = 30;
  if (G.save.bossTimerActive === undefined) G.save.bossTimerActive = G.save.currentStage % 5 === 0;
  if (G.save.isBossStage === undefined) G.save.isBossStage = G.save.currentStage % 5 === 0;

  if (!G.save.materials) G.save.materials = defaultSave().materials;
  if (!G.save.autoSell) G.save.autoSell = { common: false, uncommon: false };
  if (!G.save.relicLevels) G.save.relicLevels = {};
  if (G.save.showSummonAnim === undefined) G.save.showSummonAnim = true;
  if (!G.save.stats) G.save.stats = { totalClicks:0, eliteKills:0, dungeonRuns:0 };

  while (G.save.activePets.length < 5) G.save.activePets.push(null);
  while (G.save.activeSkills.length < 4) G.save.activeSkills.push(null);
  while (G.save.passiveSkills.length < 8) G.save.passiveSkills.push(null);

  G.computedStats = computeStats();
  G.baseDmg       = getBaseDmg();
  G.adrenalineActive = false;
  G.atkAccum      = 0;

  if (!G.save.currentEnemy) {
    G.save.currentEnemy = spawnEnemy();
  }

  setInterval(saveGame, 30000);
  setInterval(gameTick, 100);

  // Expose API
  G.computeStats    = computeStats;
  G.getBaseDmg      = getBaseDmg;
  G.getDPS          = getDPS;
  G.dealDamage      = dealDamage;
  G.useSkill        = useSkill;
  G.spawnEnemy      = spawnEnemy;
  G.travelToZone    = travelToZone;
  G.generateItem    = generateItem;
  G.equipItem       = equipItem;
  G.unequipItem     = unequipItem;
  G.rerollItem      = rerollItem;
  G.upgradeAffix    = upgradeAffix;
  G.upgradeItem     = upgradeItem;
  G.disenchantItem  = disenchantItem;
  G.combineItems    = combineItems;
  G.upgradeRelic    = upgradeRelic;
  G.addPet          = addPet;
  G.setPetActive    = setPetActive;
  G.levelPet        = levelPet;
  G.addSkill        = addSkill;
  G.getSummonCost   = getSummonCost;
  G.summon          = summon;
  G.buyUpgrade      = buyUpgrade;
  G.buyAllUpgrades  = buyAllUpgrades;
  G.buyPrestigeUpgrade = buyPrestigeUpgrade;
  G.rebirth         = rebirth;
  G.getSoulShardsGain = getSoulShardsGain;
  G.addLog          = addLog;
  G.saveGame        = saveGame;
  G.exportSave      = exportSave;
  G.importSave      = importSave;

  console.log('🎮 Eternity RPG Engine v4 (Tap Titans Edition) Ready!');
}

window.G = G;
window.initGame = initGame;
