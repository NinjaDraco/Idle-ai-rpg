/**
 * data.js — Static game content
 * Zones, Enemies, Equipment templates, Pets, Skills, Upgrades, Affixes, Bosses, Dungeons, Relics
 */
"use strict";

// ══════════════════════════════════════════════════════════════════
// RARITIES
// ══════════════════════════════════════════════════════════════════
const RARITIES = [
  { id: 'common',    name: 'Common',    color: '#9e9e9e', glow: 'none',                        weight: 600, affixCount: 2 },
  { id: 'uncommon',  name: 'Uncommon',  color: '#4caf50', glow: '0 0 6px #4caf50',             weight: 250, affixCount: 3 },
  { id: 'rare',      name: 'Rare',      color: '#2196f3', glow: '0 0 8px #2196f3',             weight: 100, affixCount: 3 },
  { id: 'epic',      name: 'Epic',      color: '#9c27b0', glow: '0 0 10px #9c27b0',            weight: 40,  affixCount: 4 },
  { id: 'legendary', name: 'Legendary', color: '#ff9800', glow: '0 0 14px #ff9800',            weight: 8,   affixCount: 5 },
  { id: 'mythic',    name: 'Mythic',    color: '#f44336', glow: '0 0 16px #f44336',            weight: 2,   affixCount: 5 },
  { id: 'cosmic',    name: 'Cosmic',    color: '#00bcd4', glow: '0 0 20px #00bcd4',            weight: 1,   affixCount: 6 },
  { id: 'eternal',   name: 'Eternal',   color: '#e040fb', glow: '0 0 24px #e040fb',            weight: 0.1, affixCount: 6 },
  { id: 'divine',    name: 'Divine',    color: '#ffd700', glow: '0 0 30px #ffd700',            weight: 0.01, affixCount: 6 },
];
const RARITY_INDEX = {};
RARITIES.forEach((r, i) => { RARITY_INDEX[r.id] = i; });

function getRarityById(id) { return RARITIES[RARITY_INDEX[id]] || RARITIES[0]; }
function rollRarity(bias = 1) {
  const pool = RARITIES.map(r => ({ ...r, weight: r.weight * bias }));
  const total = pool.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * total;
  for (const r of pool) { rand -= r.weight; if (rand <= 0) return r.id; }
  return 'common';
}

// ══════════════════════════════════════════════════════════════════
// EQUIPMENT SLOTS
// ══════════════════════════════════════════════════════════════════
const EQUIP_SLOTS = [
  { id: 'weapon',   name: 'Weapon',      icon: '⚔️',  dmgWeight: 0.35, desc: 'Primary damage driver' },
  { id: 'offhand',  name: 'Off-Hand',    icon: '🛡️',  dmgWeight: 0.15, desc: 'Utility & secondary power' },
  { id: 'helmet',   name: 'Helmet',      icon: '⛑️',  dmgWeight: 0.10, desc: 'Crit & EXP focus' },
  { id: 'chest',    name: 'Chest',       icon: '🥋',  dmgWeight: 0.15, desc: 'Bulk & sustain' },
  { id: 'gloves',   name: 'Gloves',      icon: '🧤',  dmgWeight: 0.10, desc: 'Speed & combo' },
  { id: 'boots',    name: 'Boots',       icon: '👢',  dmgWeight: 0.05, desc: 'Gold & flow' },
  { id: 'ring',     name: 'Ring',        icon: '💍',  dmgWeight: 0.05, desc: 'Elemental & specials' },
  { id: 'amulet',   name: 'Amulet',      icon: '📿',  dmgWeight: 0.05, desc: 'Synergy & passives' },
];

// ══════════════════════════════════════════════════════════════════
// AFFIXES — grouped by slot
// ══════════════════════════════════════════════════════════════════
const AFFIXES = {
  weapon: [
    { id: 'w_flatdmg',    name: 'Razor Edge',        tiers: [1.5, 3, 6, 12, 25],      type: 'pct',  stat: 'dmgMult',       desc: '+{v}% Base Damage' },
    { id: 'w_fire',       name: 'Flame Blessing',     tiers: [0.08,0.15,0.25,0.40,0.6],type: 'pct',  stat: 'fireDmg',       desc: '+{v}% Fire Damage' },
    { id: 'w_ice',        name: 'Frostbite',          tiers: [0.08,0.15,0.25,0.40,0.6],type: 'pct',  stat: 'iceDmg',        desc: '+{v}% Ice Damage' },
    { id: 'w_lightning',  name: 'Stormweave',         tiers: [0.08,0.15,0.25,0.40,0.6],type: 'pct',  stat: 'lightningDmg',  desc: '+{v}% Lightning Damage' },
    { id: 'w_shadow',     name: 'Void Touch',         tiers: [0.10,0.18,0.30,0.45,0.7],type: 'pct',  stat: 'shadowDmg',     desc: '+{v}% Shadow Damage' },
    { id: 'w_holy',       name: 'Sacred Light',       tiers: [0.10,0.18,0.30,0.45,0.7],type: 'pct',  stat: 'holyDmg',       desc: '+{v}% Holy Damage' },
    { id: 'w_skill',      name: 'Arcane Amp',         tiers: [0.10,0.20,0.35,0.55,0.8],type: 'pct',  stat: 'skillDmg',      desc: '+{v}% Skill Damage' },
    { id: 'w_combo',      name: 'Relentless Strikes',  tiers: [0.05,0.10,0.18,0.28,0.4],type: 'pct',  stat: 'comboMult',     desc: '+{v}% Combo Multiplier' },
    { id: 'w_double',     name: 'Twin Fang',           tiers: [0.03,0.06,0.10,0.15,0.22],type:'pct', stat: 'doubleStrike',   desc: '+{v}% Double Strike Chance' },
    { id: 'w_bleed',      name: 'Hemorrhage',          tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'bleedDmg',       desc: '+{v}% Bleed DoT Damage' },
    { id: 'w_bossdmg',   name: 'Executioner',         tiers: [0.08,0.16,0.28,0.42,0.60],type:'pct', stat: 'bossDmg',        desc: '+{v}% Boss Damage' },
    { id: 'w_attackspd',  name: 'Swift Strikes',       tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'atkSpeed',       desc: '+{v}% Attack Speed' },
  ],
  offhand: [
    { id: 'o_procDmg',   name: 'Parry Counter',       tiers: [0.15,0.25,0.38,0.55,0.80],type:'pct', stat: 'offhandProc',    desc: '+{v}% Off-Hand Proc Damage' },
    { id: 'o_cooldown',  name: 'Haste Rune',          tiers: [0.04,0.08,0.13,0.20,0.30],type:'pct', stat: 'cdReduction',    desc: '-{v}% Skill Cooldowns' },
    { id: 'o_mana',      name: 'Mana Font',           tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'manaRegen',      desc: '+{v}% Mana Regen' },
    { id: 'o_block',     name: 'Iron Bulwark',        tiers: [0.04,0.08,0.13,0.20,0.30],type:'pct', stat: 'blockChance',    desc: '+{v}% Block Chance' },
    { id: 'o_reflect',   name: 'Mirror Shield',       tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'damageReflect',  desc: '+{v}% Damage Reflect' },
    { id: 'o_spelldmg',  name: 'Arcane Tome',         tiers: [0.12,0.22,0.36,0.55,0.80],type:'pct', stat: 'spellPower',     desc: '+{v}% Spell Power' },
    { id: 'o_petpower',  name: 'Beast Bond',          tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'petDmg',         desc: '+{v}% Pet Damage' },
    { id: 'o_skillDmg',  name: 'Runic Focus',         tiers: [0.08,0.16,0.28,0.42,0.60],type:'pct', stat: 'skillDmg',       desc: '+{v}% Skill Damage' },
  ],
  helmet: [
    { id: 'h_crit',      name: 'Eagle Eye',           tiers: [0.03,0.06,0.10,0.16,0.24],type:'pct', stat: 'critChance',     desc: '+{v}% Crit Chance' },
    { id: 'h_critdmg',   name: 'Death Blow',          tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'critDmg',        desc: '+{v}% Crit Damage' },
    { id: 'h_exp',       name: 'Scholar\'s Mark',     tiers: [0.08,0.15,0.25,0.40,0.60],type:'pct', stat: 'expBonus',       desc: '+{v}% EXP Gain' },
    { id: 'h_mental',    name: 'Mental Mastery',      tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'skillDmg',       desc: '+{v}% Skill Damage' },
    { id: 'h_perception',name: 'Hunter\'s Instinct',  tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'eliteDmg',       desc: '+{v}% Elite Enemy Damage' },
    { id: 'h_bossweak',  name: 'Weak-Point Finder',   tiers: [0.06,0.12,0.20,0.32,0.48],type:'pct', stat: 'bossDmg',        desc: '+{v}% Boss Damage' },
    { id: 'h_critall',   name: 'Focus Lens',          tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'critChance',     desc: '+{v}% All Crit' },
  ],
  chest: [
    { id: 'c_maxhp',     name: 'Ironclad',            tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'maxHp',          desc: '+{v}% Max HP' },
    { id: 'c_dmgreduct', name: 'Adamantine Plate',    tiers: [0.03,0.06,0.10,0.16,0.24],type:'pct', stat: 'dmgReduction',   desc: '+{v}% Damage Reduction' },
    { id: 'c_thorns',    name: 'Thornweave',          tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'thornsDmg',      desc: '+{v}% Thorns Damage' },
    { id: 'c_gold',      name: 'Golden Lining',       tiers: [0.08,0.15,0.25,0.40,0.60],type:'pct', stat: 'goldFind',       desc: '+{v}% Gold Find' },
    { id: 'c_adrenaline',name: 'Adrenaline Surge',    tiers: [0.03,0.06,0.10,0.16,0.24],type:'pct', stat: 'adrenaline',     desc: '+{v}% chance to double DPS on kill' },
    { id: 'c_dmgmult',   name: 'War Forging',         tiers: [0.08,0.15,0.25,0.40,0.60],type:'pct', stat: 'dmgMult',        desc: '+{v}% Damage' },
    { id: 'c_lifesteal', name: 'Vampiric Weave',      tiers: [0.02,0.04,0.07,0.11,0.16],type:'pct', stat: 'lifeSteal',      desc: '+{v}% Life Steal' },
  ],
  gloves: [
    { id: 'g_atkspd',    name: 'Quickfingers',        tiers: [0.08,0.15,0.25,0.40,0.60],type:'pct', stat: 'atkSpeed',       desc: '+{v}% Attack Speed' },
    { id: 'g_clickdmg',  name: 'Titan\'s Grip',       tiers: [0.20,0.40,0.65,1.00,1.50],type:'pct', stat: 'clickDmg',       desc: '+{v}% Click Damage' },
    { id: 'g_combo',     name: 'Chain Strike',        tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'comboChance',    desc: '+{v}% Multi-Hit Chance' },
    { id: 'g_finisher',  name: 'Overkill Mastery',    tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'overkillBonus',  desc: '+{v}% Overkill Bonus' },
    { id: 'g_petsync',   name: 'Beast Synchrony',     tiers: [0.08,0.15,0.25,0.40,0.60],type:'pct', stat: 'petAtkSpd',      desc: '+{v}% Pet Attack Speed' },
    { id: 'g_crit',      name: 'Precision Strike',    tiers: [0.03,0.06,0.10,0.16,0.24],type:'pct', stat: 'critChance',     desc: '+{v}% Crit Chance' },
  ],
  boots: [
    { id: 'b_goldmag',   name: 'Gold Magnet',         tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'goldFind',       desc: '+{v}% Gold Find' },
    { id: 'b_zonespd',   name: 'Zone Sprinter',       tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'zoneClearSpd',   desc: '+{v}% Zone Clear Speed' },
    { id: 'b_dodge',     name: 'Shadow Step',         tiers: [0.03,0.06,0.10,0.16,0.24],type:'pct', stat: 'dodgeChance',    desc: '+{v}% Dodge Chance' },
    { id: 'b_droprate',  name: 'Fortune\'s Path',     tiers: [0.08,0.15,0.25,0.40,0.60],type:'pct', stat: 'dropRate',       desc: '+{v}% Drop Rate' },
    { id: 'b_idle',      name: 'Wanderer\'s Rest',    tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'idleBonus',      desc: '+{v}% Idle DPS Bonus' },
    { id: 'b_expbonus',  name: 'Journey\'s Reward',   tiers: [0.08,0.15,0.25,0.40,0.60],type:'pct', stat: 'expBonus',       desc: '+{v}% EXP Gain' },
  ],
  ring: [
    { id: 'r_alelem',    name: 'Prism Core',          tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'allElemDmg',     desc: '+{v}% All Elemental Damage' },
    { id: 'r_resonance', name: 'Elemental Harmony',   tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'elemResonance',  desc: '+{v}% Elemental Resonance' },
    { id: 'r_status',    name: 'Status Master',       tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'statusDuration', desc: '+{v}% Status Duration' },
    { id: 'r_lucky',     name: 'Gambler\'s Luck',     tiers: [0.005,0.01,0.018,0.028,0.04],type:'pct',stat:'luckyStrike',  desc: '+{v}% Lucky Strike (100× damage)' },
    { id: 'r_soul',      name: 'Soul Harvest',        tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'soulHarvest',    desc: '+{v}% Prestige Resource on Kill' },
    { id: 'r_dmgmult',   name: 'Power Ring',          tiers: [0.06,0.12,0.20,0.32,0.48],type:'pct', stat: 'dmgMult',        desc: '+{v}% Damage' },
    { id: 'r_goldmult',  name: 'Midas Touch',         tiers: [0.08,0.15,0.25,0.40,0.60],type:'pct', stat: 'goldFind',       desc: '+{v}% Gold' },
  ],
  amulet: [
    { id: 'a_petaura',   name: 'Beast Lord\'s Chain', tiers: [0.12,0.22,0.36,0.55,0.80],type:'pct', stat: 'petDmg',         desc: '+{v}% Pet Damage' },
    { id: 'a_skillpow',  name: 'Arcane Talisman',     tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'skillDmg',       desc: '+{v}% Active Skill Power' },
    { id: 'a_prestige',  name: 'Ascension Pendant',   tiers: [0.05,0.10,0.18,0.28,0.40],type:'pct', stat: 'prestigeMult',   desc: '+{v}% Prestige Multiplier' },
    { id: 'a_constell',  name: 'Star Cluster',        tiers: [0.08,0.15,0.25,0.40,0.60],type:'pct', stat: 'constellPower',  desc: '+{v}% Constellation Power' },
    { id: 'a_alldmg',    name: 'Omni Essence',        tiers: [0.06,0.12,0.20,0.32,0.48],type:'pct', stat: 'dmgMult',        desc: '+{v}% All Damage' },
    { id: 'a_allgold',   name: 'Fortune Bead',        tiers: [0.10,0.20,0.35,0.55,0.80],type:'pct', stat: 'goldFind',       desc: '+{v}% Gold Find' },
    { id: 'a_allcrit',   name: 'Critical Essence',    tiers: [0.04,0.08,0.13,0.20,0.30],type:'pct', stat: 'critChance',     desc: '+{v}% Crit Chance' },
    { id: 'a_unique',    name: 'Eternity\'s Blessing', tiers:[0.50,1.0,2.0,4.0,8.0],   type:'pct', stat: 'dmgMult',        desc: '+{v}% ALL Damage (Amulet exclusive)' },
  ],
};

// ══════════════════════════════════════════════════════════════════
// EQUIPMENT BASES
// ══════════════════════════════════════════════════════════════════
const EQUIP_BASES = {
  weapon: [
    { id:'rusty_sword',    name:'Rusty Sword',         icon:'🗡️', minZone:0  },
    { id:'iron_axe',       name:'Iron Axe',            icon:'🪓', minZone:1  },
    { id:'bronze_spear',   name:'Bronze Spear',        icon:'⚡', minZone:3  },
    { id:'steel_blade',    name:'Steel Blade',         icon:'⚔️', minZone:5  },
    { id:'void_saber',     name:'Void Saber',          icon:'🌑', minZone:8  },
    { id:'flame_sword',    name:'Flamebrand',          icon:'🔥', minZone:10 },
    { id:'frost_axe',      name:'Glacial Edge',        icon:'❄️', minZone:12 },
    { id:'thunder_blade',  name:'Stormcleaver',        icon:'⚡', minZone:15 },
    { id:'shadow_dagger',  name:'Umbra Fang',          icon:'🌙', minZone:18 },
    { id:'holy_lance',     name:'Divine Spear',        icon:'✨', minZone:20 },
    { id:'chaos_blade',    name:'Chaos Reaper',        icon:'💀', minZone:23 },
    { id:'eternity_sword', name:'Eternity\'s Edge',    icon:'🌟', minZone:27 },
  ],
  offhand: [
    { id:'wooden_shield',  name:'Wooden Shield',       icon:'🪵', minZone:0  },
    { id:'iron_shield',    name:'Iron Bulwark',        icon:'🛡️', minZone:2  },
    { id:'mage_tome',      name:'Spell Tome',          icon:'📖', minZone:4  },
    { id:'hunters_quiver', name:'Hunter\'s Quiver',    icon:'🏹', minZone:6  },
    { id:'arcane_focus',   name:'Arcane Focus',        icon:'🔮', minZone:9  },
    { id:'void_ward',      name:'Void Ward',           icon:'🌑', minZone:13 },
    { id:'divine_aegis',   name:'Divine Aegis',        icon:'☀️', minZone:18 },
    { id:'eternity_orb',   name:'Eternity Orb',        icon:'🌌', minZone:25 },
  ],
  helmet: [
    { id:'leather_cap',    name:'Leather Cap',         icon:'🎩', minZone:0  },
    { id:'iron_helm',      name:'Iron Helm',           icon:'⛑️', minZone:2  },
    { id:'mage_hood',      name:'Arcane Hood',         icon:'🧙', minZone:5  },
    { id:'shadow_mask',    name:'Shadow Mask',         icon:'🎭', minZone:9  },
    { id:'crown_of_ruin',  name:'Crown of Ruin',       icon:'👑', minZone:15 },
    { id:'void_crown',     name:'Void Crown',          icon:'🌑', minZone:22 },
    { id:'eternity_halo',  name:'Eternity Halo',       icon:'✨', minZone:28 },
  ],
  chest: [
    { id:'cloth_robe',     name:'Cloth Robe',          icon:'👕', minZone:0  },
    { id:'leather_armor',  name:'Leather Armor',       icon:'🦺', minZone:1  },
    { id:'chain_mail',     name:'Chainmail',           icon:'⛓️', minZone:4  },
    { id:'plate_armor',    name:'Plate Armor',         icon:'🛡️', minZone:7  },
    { id:'dragonscale',    name:'Dragonscale',         icon:'🐉', minZone:12 },
    { id:'void_mantle',    name:'Void Mantle',         icon:'🌑', minZone:18 },
    { id:'celestial_robe', name:'Celestial Robe',      icon:'🌠', minZone:25 },
  ],
  gloves: [
    { id:'cloth_gloves',   name:'Cloth Wraps',         icon:'🧤', minZone:0  },
    { id:'iron_gauntlets', name:'Iron Gauntlets',      icon:'⚙️', minZone:3  },
    { id:'swift_gloves',   name:'Swift Grips',         icon:'💨', minZone:7  },
    { id:'arcane_gloves',  name:'Arcane Grips',        icon:'✋', minZone:12 },
    { id:'void_claws',     name:'Void Claws',          icon:'🌑', minZone:20 },
    { id:'eternity_gaunt', name:'Eternity Fists',      icon:'⚡', minZone:28 },
  ],
  boots: [
    { id:'sandals',        name:'Worn Sandals',        icon:'𑡡', minZone:0  },
    { id:'leather_boots',  name:'Leather Boots',       icon:'👢', minZone:2  },
    { id:'swift_boots',    name:'Swift Treads',        icon:'💨', minZone:6  },
    { id:'shadow_steps',   name:'Shadow Steps',        icon:'🌑', minZone:11 },
    { id:'goldfinder',     name:'Goldwoven Boots',     icon:'🏅', minZone:17 },
    { id:'void_striders',  name:'Void Striders',       icon:'🌌', minZone:25 },
  ],
  ring: [
    { id:'copper_ring',    name:'Copper Ring',         icon:'⭕', minZone:0  },
    { id:'silver_ring',    name:'Silver Ring',         icon:'💍', minZone:3  },
    { id:'elemental_band', name:'Elemental Band',      icon:'🌀', minZone:8  },
    { id:'void_signet',    name:'Void Signet',         icon:'🌑', minZone:15 },
    { id:'eternity_loop',  name:'Eternity Loop',       icon:'🌟', minZone:25 },
  ],
  amulet: [
    { id:'bone_necklace',  name:'Bone Necklace',       icon:'🦴', minZone:0  },
    { id:'crystal_pendant',name:'Crystal Pendant',     icon:'💎', minZone:4  },
    { id:'arcane_charm',   name:'Arcane Charm',        icon:'🔮', minZone:9  },
    { id:'beast_tooth',    name:'Beast-Lord Fang',     icon:'🐾', minZone:14 },
    { id:'void_locket',    name:'Void Locket',         icon:'🌑', minZone:20 },
    { id:'eternity_gem',   name:'Eternity Gem',        icon:'✨', minZone:28 },
  ],
};

// ══════════════════════════════════════════════════════════════════
// WORLDS (Cosmetic themes per 50 stages in Tap Titans style)
// ══════════════════════════════════════════════════════════════════
const WORLDS = [
  { id:0,  name:'Verdant Forest',    bg:'#1a3a1a', accent:'#4caf50', enemyColor:'#2e7d32', icon:'🌲' },
  { id:1,  name:'Goblin Caves',      bg:'#2a2010', accent:'#8d6e63', enemyColor:'#6d4c41', icon:'🗿' },
  { id:2,  name:'Haunted Cemetery',  bg:'#1a1a2e', accent:'#7e57c2', enemyColor:'#4527a0', icon:'💀' },
  { id:3,  name:'Iron Mines',        bg:'#1c1c1c', accent:'#78909c', enemyColor:'#546e7a', icon:'⛏️' },
  { id:4,  name:'Cursed Swamp',      bg:'#0d2b10', accent:'#66bb6a', enemyColor:'#2e7d32', icon:'🐊' },
  { id:5,  name:'Frozen Tundra',     bg:'#0d1b2a', accent:'#4fc3f7', enemyColor:'#0288d1', icon:'❄️' },
  { id:6,  name:'Dragon\'s Lair',    bg:'#2a0d00', accent:'#ff5722', enemyColor:'#d84315', icon:'🐉' },
  { id:7,  name:'Lava Fields',       bg:'#1a0500', accent:'#ff7043', enemyColor:'#bf360c', icon:'🌋' },
  { id:8,  name:'Crystal Caverns',   bg:'#1a1a30', accent:'#b39ddb', enemyColor:'#7e57c2', icon:'💠' },
  { id:9,  name:'Shadow Realm',      bg:'#0a0010', accent:'#ce93d8', enemyColor:'#7b1fa2', icon:'🌑' },
  { id:10, name:'Abyssal Rift',      bg:'#000a15', accent:'#00bcd4', enemyColor:'#0097a7', icon:'🌊' },
  { id:11, name:'Arcane Sanctum',    bg:'#1a0030', accent:'#7c4dff', enemyColor:'#651fff', icon:'🔮' },
  { id:12, name:'Draconic Highlands',bg:'#200a00', accent:'#ff6d00', enemyColor:'#e65100', icon:'🔥' },
  { id:13, name:'Void Expanse',      bg:'#050005', accent:'#e040fb', enemyColor:'#aa00ff', icon:'🌌' },
  { id:14, name:'Ancient Ruins',     bg:'#15100a', accent:'#ffca28', enemyColor:'#f9a825', icon:'🏛️' },
  { id:15, name:'Celestial Spire',   bg:'#000015', accent:'#82b1ff', enemyColor:'#2962ff', icon:'⭐' },
  { id:16, name:'Chaos Wastes',      bg:'#150005', accent:'#ff1744', enemyColor:'#d50000', icon:'☄️' },
  { id:17, name:'Eternal Tundra',    bg:'#000d15', accent:'#80deea', enemyColor:'#006064', icon:'🌨️' },
  { id:18, name:'Infernal Abyss',    bg:'#100000', accent:'#ff6e40', enemyColor:'#bf360c', icon:'👿' },
  { id:19, name:'Quantum Labyrinth', bg:'#030315', accent:'#40c4ff', enemyColor:'#0091ea', icon:'🔬' },
  { id:20, name:'Heaven\'s Gate',    bg:'#15150a', accent:'#fff176', enemyColor:'#f57f17', icon:'☀️' },
  { id:21, name:'Demonic Citadel',   bg:'#150000', accent:'#ff1744', enemyColor:'#b71c1c', icon:'😈' },
  { id:22, name:'Astral Sea',        bg:'#000820', accent:'#b3e5fc', enemyColor:'#01579b', icon:'🌊' },
  { id:23, name:'Primordial Forge',  bg:'#100500', accent:'#ffab40', enemyColor:'#e65100', icon:'⚒️' },
  { id:24, name:'The Null Plane',    bg:'#020202', accent:'#bdbdbd', enemyColor:'#616161', icon:'⬛' },
  { id:25, name:'Eternity\'s Edge',  bg:'#080020', accent:'#ea80fc', enemyColor:'#6a1b9a', icon:'🌟' },
  { id:26, name:'Cosmic Void',       bg:'#000010', accent:'#80d8ff', enemyColor:'#0091ea', icon:'🌌' },
  { id:27, name:'Beyond the Veil',   bg:'#100010', accent:'#f48fb1', enemyColor:'#880e4f', icon:'🎭' },
  { id:28, name:'The Final Rift',    bg:'#050000', accent:'#ff9100', enemyColor:'#e65100', icon:'💥' },
  { id:29, name:'Divine Pantheon',   bg:'#151500', accent:'#ffd700', enemyColor:'#f9a825', icon:'🏆' },
  { id:30, name:'Titan\'s Cradle',   bg:'#1a1005', accent:'#ff9800', enemyColor:'#e65100', icon:'🧗' },
  { id:31, name:'Nebula Garden',     bg:'#0a0a20', accent:'#b388ff', enemyColor:'#7c4dff', icon:'🌺' },
  { id:32, name:'Solar Apex',        bg:'#201500', accent:'#ffff00', enemyColor:'#ffd600', icon:'🌞' },
  { id:33, name:'Abyssal Core',      bg:'#001015', accent:'#00e5ff', enemyColor:'#00b8d4', icon:'🌀' },
  { id:34, name:'Chronos Rift',      bg:'#101010', accent:'#a7ffeb', enemyColor:'#1de9b6', icon:'⌛' },
  { id:35, name:'Oasis of Souls',    bg:'#002010', accent:'#69f0ae', enemyColor:'#00e676', icon:'🏝️' },
  { id:36, name:'Elysian Fields',    bg:'#152015', accent:'#b2ff59', enemyColor:'#76ff03', icon:'🪽' },
  { id:37, name:'Tartarus Depths',   bg:'#200005', accent:'#ff5252', enemyColor:'#ff1744', icon:'⛓️' },
  { id:38, name:'Omega Horizon',     bg:'#150020', accent:'#ea80fc', enemyColor:'#d500f9', icon:'🌅' },
  { id:39, name:'Absolute Infinity', bg:'#000000', accent:'#ffffff', enemyColor:'#e0e0e0', icon:'♾️' },
];
const ZONES = WORLDS; // backward compatibility alias

const ENEMY_TYPES = [
  [
    { name:'Slime',       icon:'🟢', hpMult:0.6, goldMult:0.8 },
    { name:'Goblin',      icon:'👺', hpMult:0.8, goldMult:0.9 },
    { name:'Skeleton',    icon:'💀', hpMult:1.0, goldMult:1.0 },
    { name:'Wolf',        icon:'🐺', hpMult:1.2, goldMult:1.1 },
    { name:'Orc',         icon:'👹', hpMult:1.5, goldMult:1.2 },
    { name:'Troll',       icon:'🧌', hpMult:2.0, goldMult:1.5 },
  ],
  [
    { name:'Stone Golem', icon:'🪨', hpMult:0.8, goldMult:0.9 },
    { name:'Dark Elf',    icon:'🧝', hpMult:1.0, goldMult:1.1 },
    { name:'Basilisk',    icon:'🦎', hpMult:1.3, goldMult:1.2 },
    { name:'Wyvern',      icon:'🐲', hpMult:1.6, goldMult:1.3 },
    { name:'Lich',        icon:'💀', hpMult:2.0, goldMult:1.8 },
    { name:'Demon',       icon:'😈', hpMult:2.5, goldMult:2.0 },
  ],
  [
    { name:'Shadow Imp',  icon:'🌑', hpMult:0.8, goldMult:1.0 },
    { name:'Void Walker', icon:'🌀', hpMult:1.0, goldMult:1.2 },
    { name:'Chaos Spawn', icon:'☄️', hpMult:1.4, goldMult:1.5 },
    { name:'Abyssal',     icon:'🌊', hpMult:1.8, goldMult:1.8 },
    { name:'Soul Reaper', icon:'⚰️', hpMult:2.2, goldMult:2.2 },
    { name:'Elder Demon', icon:'👿', hpMult:3.0, goldMult:3.0 },
  ],
  [
    { name:'Fallen Angel',icon:'😇', hpMult:1.0, goldMult:1.2 },
    { name:'Star Beast',  icon:'⭐', hpMult:1.3, goldMult:1.5 },
    { name:'Cosmic Horror',icon:'🌌',hpMult:1.8, goldMult:2.0 },
    { name:'Void Dragon', icon:'🐉', hpMult:2.5, goldMult:2.8 },
    { name:'Eternity Eye',icon:'👁️', hpMult:3.5, goldMult:4.0 },
  ],
  [
    { name:'Chaos God',   icon:'💥', hpMult:1.2, goldMult:1.5 },
    { name:'Null Entity', icon:'⬛', hpMult:1.8, goldMult:2.2 },
    { name:'Void Titan',  icon:'🌑', hpMult:2.5, goldMult:3.0 },
    { name:'End Bringer', icon:'🌟', hpMult:4.0, goldMult:5.0 },
  ],
];

const BOSS_NAMES = [
  'Grognak the Devourer','Shademore, Lich King','Crimson Empress','Void Harbinger',
  'Abyss Sovereign','The Eternal Watcher','Chaos Prime','Null God','Divine Destroyer',
  'The Endless','Omniarch','Supremacy','Void Father','The Last Light','Eternity\'s End',
];

// ══════════════════════════════════════════════════════════════════
// PETS
// ══════════════════════════════════════════════════════════════════
const PETS = [
  // Common
  { id:'ember_fox',     name:'Ember Fox',       icon:'🦊', rarity:'common',    dmgAura:0.05, goldAura:0.02, critAura:0.01, passive:'Fire Aura: +5% fire dmg' },
  { id:'stone_turtle',  name:'Stone Turtle',    icon:'🐢', rarity:'common',    dmgAura:0.03, goldAura:0.05, critAura:0.00, passive:'Gold Shell: +5% gold' },
  { id:'tiny_bat',      name:'Tiny Bat',        icon:'🦇', rarity:'common',    dmgAura:0.04, goldAura:0.01, critAura:0.02, passive:'Night Hunter: +2% crit' },
  { id:'field_mouse',   name:'Field Mouse',     icon:'🐭', rarity:'common',    dmgAura:0.02, goldAura:0.08, critAura:0.00, passive:'Scavenger: +8% gold' },
  { id:'forest_sprite', name:'Forest Sprite',   icon:'🧚', rarity:'common',    dmgAura:0.06, goldAura:0.02, critAura:0.01, passive:'Nature\'s Wrath: +6% dmg' },
  { id:'rock_crab',     name:'Rock Crab',       icon:'🦀', rarity:'common',    dmgAura:0.03, goldAura:0.03, critAura:0.01, passive:'Pincer Strike: +3% dmg, +3% gold' },
  // Uncommon
  { id:'crystal_wolf',  name:'Crystal Wolf',    icon:'🐺', rarity:'uncommon',  dmgAura:0.08, goldAura:0.03, critAura:0.05, passive:'Pack Hunter: +5% crit chance' },
  { id:'fire_sprite',   name:'Fire Sprite',     icon:'🔥', rarity:'uncommon',  dmgAura:0.12, goldAura:0.02, critAura:0.02, passive:'Ignition: +12% fire dmg' },
  { id:'ice_spirit',    name:'Ice Spirit',      icon:'❄️', rarity:'uncommon',  dmgAura:0.10, goldAura:0.04, critAura:0.03, passive:'Chill Aura: Slow enemies' },
  { id:'lightning_pup', name:'Storm Pup',       icon:'⚡', rarity:'uncommon',  dmgAura:0.11, goldAura:0.02, critAura:0.04, passive:'Static: +11% lightning dmg' },
  { id:'shadow_cat',    name:'Shadow Cat',      icon:'🐱', rarity:'uncommon',  dmgAura:0.09, goldAura:0.06, critAura:0.04, passive:'Shadow Strike: +4% crit' },
  { id:'golden_bee',    name:'Golden Bee',      icon:'🐝', rarity:'uncommon',  dmgAura:0.04, goldAura:0.15, critAura:0.01, passive:'Honey Collector: +15% gold' },
  // Rare
  { id:'arcane_owl',    name:'Arcane Owl',      icon:'🦉', rarity:'rare',      dmgAura:0.15, goldAura:0.05, critAura:0.08, passive:'Wisdom: +8% crit, +15% skill dmg' },
  { id:'earth_golem',   name:'Earth Golem',     icon:'🪨', rarity:'rare',      dmgAura:0.20, goldAura:0.08, critAura:0.03, passive:'Unstoppable: +20% dmg' },
  { id:'sea_dragon',    name:'Sea Dragon',      icon:'🐉', rarity:'rare',      dmgAura:0.18, goldAura:0.10, critAura:0.05, passive:'Tidal Force: +18% dmg, +10% gold' },
  { id:'thunder_hawk',  name:'Thunder Hawk',    icon:'🦅', rarity:'rare',      dmgAura:0.22, goldAura:0.04, critAura:0.06, passive:'Dive Bomb: +6% crit, +22% dmg' },
  { id:'lava_hound',    name:'Lava Hound',      icon:'🐕', rarity:'rare',      dmgAura:0.25, goldAura:0.06, critAura:0.04, passive:'Molten Fur: +25% fire dmg' },
  // Epic
  { id:'shadow_dragon', name:'Shadow Dragon',   icon:'🌑', rarity:'epic',      dmgAura:0.40, goldAura:0.10, critAura:0.10, passive:'Soul Drain: +50% boss dmg' },
  { id:'storm_griffin', name:'Storm Griffin',   icon:'🦁', rarity:'epic',      dmgAura:0.35, goldAura:0.12, critAura:0.15, passive:'Gale Force: +15% crit, +35% dmg' },
  { id:'void_serpent',  name:'Void Serpent',    icon:'🐍', rarity:'epic',      dmgAura:0.50, goldAura:0.08, critAura:0.08, passive:'Void Bite: +50% shadow dmg' },
  { id:'celestial_lion',name:'Celestial Lion',  icon:'🦁', rarity:'epic',      dmgAura:0.45, goldAura:0.15, critAura:0.12, passive:'Solar Roar: All dmg +45%' },
  // Legendary
  { id:'void_phoenix',  name:'Void Phoenix',    icon:'🦅', rarity:'legendary', dmgAura:0.80, goldAura:0.20, critAura:0.20, passive:'Rebirth: +100% DPS' },
  { id:'cosmic_wolf',   name:'Cosmic Wolf',     icon:'🐺', rarity:'legendary', dmgAura:0.90, goldAura:0.15, critAura:0.25, passive:'Pack Law: +25% crit, +90% dmg' },
  { id:'thunder_titan', name:'Thunder Titan',   icon:'⚡', rarity:'legendary', dmgAura:1.00, goldAura:0.10, critAura:0.18, passive:'Thunderclap: Stun chance' },
  // Mythic
  { id:'eternity_serp', name:'Eternity Serpent',icon:'🌟', rarity:'mythic',    dmgAura:1.50, goldAura:1.00, critAura:0.30, passive:'Gold Tide: ×10 gold' },
  { id:'void_leviathan',name:'Void Leviathan',  icon:'🌊', rarity:'mythic',    dmgAura:2.00, goldAura:0.50, critAura:0.25, passive:'Deep Terror: +200% dmg' },
  // Cosmic / Divine
  { id:'cosmos_dragon', name:'Cosmos Dragon',   icon:'🌌', rarity:'cosmic',    dmgAura:3.00, goldAura:1.50, critAura:0.40, passive:'Star Fury: +300% all dmg' },
  { id:'null_entity',   name:'Null Entity',     icon:'⬛', rarity:'eternal',   dmgAura:5.00, goldAura:3.00, critAura:0.50, passive:'Nullify: +500% dmg' },
  { id:'deity_beast',   name:'The Deity Beast',  icon:'✨', rarity:'divine',   dmgAura:10.0, goldAura:5.00, critAura:0.75, passive:'Divine Providence: All stats ×2' },
];

// ══════════════════════════════════════════════════════════════════
// SKILLS
// ══════════════════════════════════════════════════════════════════
const SKILLS = {
  active: [
    { id:'blade_storm',   name:'Blade Storm',      icon:'🌀', rarity:'common',    cooldown:8,  dmgMult:3,      desc:'Spin and hit all for 300% dmg' },
    { id:'power_strike',  name:'Power Strike',     icon:'⚡', rarity:'common',    cooldown:5,  dmgMult:4,      desc:'Single massive hit 400% dmg' },
    { id:'fire_bomb',     name:'Fire Bomb',        icon:'🔥', rarity:'uncommon',  cooldown:10, dmgMult:8,      desc:'Throw a bomb for 800% fire dmg' },
    { id:'frost_nova',    name:'Frost Nova',       icon:'❄️', rarity:'uncommon',  cooldown:12, dmgMult:6,      desc:'Deal 600% ice dmg' },
    { id:'mana_burst',    name:'Mana Burst',       icon:'💫', rarity:'rare',      cooldown:15, dmgMult:20,     desc:'1000% magic dmg' },
    { id:'thunder_call',  name:'Thunder Call',     icon:'⚡', rarity:'rare',      cooldown:18, dmgMult:25,     desc:'Call lightning for 2500% dmg' },
    { id:'void_rift',     name:'Void Rift',        icon:'🌑', rarity:'epic',      cooldown:25, dmgMult:80,     desc:'Open void: 5000% shadow dmg' },
    { id:'dragons_breath',name:'Dragon\'s Breath', icon:'🐉', rarity:'epic',      cooldown:30, dmgMult:150,    desc:'Breathe fire: 15000% burn dmg' },
    { id:'starfall',      name:'Starfall',         icon:'⭐', rarity:'legendary', cooldown:45, dmgMult:500,    desc:'Rain stars: 50000% cosmic dmg' },
    { id:'eternity_col',  name:'Eternity Collapse',icon:'🌌', rarity:'mythic',    cooldown:120,dmgMult:10000,  desc:'Collapse reality: 1e6× dmg' },
    { id:'divine_wrath',  name:'Divine Wrath',     icon:'☀️', rarity:'cosmic',    cooldown:300,dmgMult:1e8,    desc:'God\'s judgment: instant boss kill' },
  ],
  passive: [
    { id:'iron_skin',     name:'Iron Skin',        icon:'🛡️', rarity:'common',    effect:{ stat:'dmgReduction', val:0.05 }, desc:'+5% Damage Reduction' },
    { id:'sharp_eyes',    name:'Sharp Eyes',       icon:'👁️', rarity:'common',    effect:{ stat:'critChance',   val:0.03 }, desc:'+3% Crit Chance' },
    { id:'greed',         name:'Greed',            icon:'💰', rarity:'common',    effect:{ stat:'goldFind',     val:0.10 }, desc:'+10% Gold Find' },
    { id:'quick_hands',   name:'Quick Hands',      icon:'👐', rarity:'uncommon',  effect:{ stat:'atkSpeed',     val:0.10 }, desc:'+10% Attack Speed' },
    { id:'berserker',     name:'Berserker',        icon:'💢', rarity:'uncommon',  effect:{ stat:'dmgMult',      val:0.15 }, desc:'+15% Damage' },
    { id:'treasure_sense',name:'Treasure Sense',   icon:'🏆', rarity:'uncommon',  effect:{ stat:'dropRate',     val:0.12 }, desc:'+12% Item Drop Rate' },
    { id:'crit_mastery',  name:'Crit Mastery',     icon:'💥', rarity:'rare',      effect:{ stat:'critDmg',      val:0.30 }, desc:'+30% Crit Damage' },
    { id:'swift_killer',  name:'Swift Killer',     icon:'💨', rarity:'rare',      effect:{ stat:'atkSpeed',     val:0.25 }, desc:'+25% Attack Speed' },
    { id:'gold_emperor',  name:'Gold Emperor',     icon:'👑', rarity:'epic',      effect:{ stat:'goldFind',     val:0.50 }, desc:'+50% Gold Find' },
    { id:'death_mark',    name:'Death Mark',       icon:'💀', rarity:'epic',      effect:{ stat:'bossDmg',      val:0.60 }, desc:'+60% Boss Damage' },
    { id:'void_mastery',  name:'Void Mastery',     icon:'🌑', rarity:'legendary', effect:{ stat:'dmgMult',      val:1.00 }, desc:'+100% All Damage' },
    { id:'eternity_aura', name:'Eternity Aura',    icon:'🌟', rarity:'mythic',    effect:{ stat:'dmgMult',      val:3.00 }, desc:'+300% All Damage' },
  ],
};

// ══════════════════════════════════════════════════════════════════
// UPGRADES
// ══════════════════════════════════════════════════════════════════
const UPGRADES = [
  // Combat
  { id:'dmg1',      tab:'combat',  name:'Sharpened Blade',    icon:'⚔️', desc:'+25% Damage',         stat:'dmgMult',   val:0.25, baseCost:'50',    costScale:1.6  },
  { id:'dmg2',      tab:'combat',  name:'Warrior\'s Spirit',  icon:'💪', desc:'+50% Damage',         stat:'dmgMult',   val:0.50, baseCost:'500',   costScale:1.7  },
  { id:'dmg3',      tab:'combat',  name:'Berserker Mode',     icon:'💢', desc:'+100% Damage',        stat:'dmgMult',   val:1.00, baseCost:'5e3',   costScale:1.8  },
  { id:'dmg4',      tab:'combat',  name:'Ancient Power',      icon:'🏺', desc:'+200% Damage',        stat:'dmgMult',   val:2.00, baseCost:'5e4',   costScale:1.9  },
  { id:'dmg5',      tab:'combat',  name:'Void Infusion',      icon:'🌑', desc:'+500% Damage',        stat:'dmgMult',   val:5.00, baseCost:'5e5',   costScale:2.0  },
  { id:'spd1',      tab:'combat',  name:'Quick Strikes',      icon:'⚡', desc:'+20% Atk Speed',      stat:'atkSpeed',  val:0.20, baseCost:'120',   costScale:1.65 },
  { id:'spd2',      tab:'combat',  name:'Haste',              icon:'💨', desc:'+40% Atk Speed',      stat:'atkSpeed',  val:0.40, baseCost:'2e3',   costScale:1.75 },
  { id:'spd3',      tab:'combat',  name:'Blur',               icon:'🌪️', desc:'+80% Atk Speed',      stat:'atkSpeed',  val:0.80, baseCost:'3e4',   costScale:1.85 },
  { id:'crit1',     tab:'combat',  name:'Critical Eye',       icon:'👁️', desc:'+5% Crit Chance',     stat:'critChance',val:0.05, baseCost:'300',   costScale:1.7  },
  { id:'crit2',     tab:'combat',  name:'Fatal Precision',    icon:'🎯', desc:'+10% Crit Chance',    stat:'critChance',val:0.10, baseCost:'8e3',   costScale:1.8  },
  { id:'crit3',     tab:'combat',  name:'Death\'s Kiss',      icon:'💋', desc:'+20% Crit Chance',    stat:'critChance',val:0.20, baseCost:'2e5',   costScale:1.9  },
  { id:'crit4',     tab:'combat',  name:'Multi-Crit Mastery', icon:'🔥', desc:'+50% Crit Chance (Orange Crit!)', stat:'critChance',val:0.50, baseCost:'5e7', costScale:2.0 },
  { id:'crit5',     tab:'combat',  name:'Red Crit Awakening', icon:'☄️', desc:'+100% Crit Chance (Red Crit!)',   stat:'critChance',val:1.00, baseCost:'1e10',costScale:2.1 },
  { id:'crit6',     tab:'combat',  name:'Cosmic Crit Resonance',icon:'🌌',desc:'+250% Crit Chance (Purple/Blue!)',stat:'critChance',val:2.50,baseCost:'5e13',costScale:2.2 },
  { id:'cdmg1',     tab:'combat',  name:'Heavy Crit',         icon:'💥', desc:'+50% Crit Dmg',       stat:'critDmg',   val:0.50, baseCost:'1e3',   costScale:1.7  },
  { id:'cdmg2',     tab:'combat',  name:'Crushing Blow',      icon:'🔨', desc:'+100% Crit Dmg',      stat:'critDmg',   val:1.00, baseCost:'5e4',   costScale:1.85 },
  { id:'cdmg3',     tab:'combat',  name:'God of Crits',       icon:'🌩️', desc:'+300% Crit Dmg',      stat:'critDmg',   val:3.00, baseCost:'5e6',   costScale:2.0  },
  { id:'cdmg4',     tab:'combat',  name:'Supercrit Multiplier',icon:'💥',desc:'+1000% Crit Dmg',     stat:'critDmg',   val:10.0, baseCost:'1e10',  costScale:2.15 },
  { id:'click1',    tab:'combat',  name:'Strong Wrist',       icon:'✊', desc:'+50% Click Damage',   stat:'clickDmg',  val:0.50, baseCost:'200',   costScale:1.6  },
  { id:'click2',    tab:'combat',  name:'Titan Punch',        icon:'👊', desc:'+200% Click Damage',  stat:'clickDmg',  val:2.00, baseCost:'1e4',   costScale:1.75 },
  { id:'click3',    tab:'combat',  name:'Hand of God',        icon:'⚡', desc:'+1000% Click Damage', stat:'clickDmg',  val:10.0, baseCost:'1e8',   costScale:2.0  },
  { id:'autoatk1',  tab:'combat',  name:'Auto Battle I',      icon:'🤖', desc:'Enable Auto-Attack',  stat:'autoAtk',   val:1,    baseCost:'100',   costScale:1,   oneTime:true },
  // Wealth
  { id:'gold1',     tab:'wealth',  name:'Coin Purse',         icon:'💰', desc:'+20% Gold',           stat:'goldFind',  val:0.20, baseCost:'80',    costScale:1.6  },
  { id:'gold2',     tab:'wealth',  name:'Merchant\'s Eye',    icon:'🧿', desc:'+50% Gold',           stat:'goldFind',  val:0.50, baseCost:'2e3',   costScale:1.7  },
  { id:'gold3',     tab:'wealth',  name:'Gold Sense',         icon:'🔔', desc:'+100% Gold',          stat:'goldFind',  val:1.00, baseCost:'3e4',   costScale:1.8  },
  { id:'gold4',     tab:'wealth',  name:'Fortune\'s Favor',   icon:'🍀', desc:'+300% Gold',          stat:'goldFind',  val:3.00, baseCost:'5e5',   costScale:1.95 },
  { id:'gold5',     tab:'wealth',  name:'Midas Legacy',       icon:'👑', desc:'+1000% Gold',         stat:'goldFind',  val:10.0, baseCost:'1e7',   costScale:2.1  },
  { id:'gold6',     tab:'wealth',  name:'Titan Treasury',     icon:'🏛️', desc:'+5000% Gold',         stat:'goldFind',  val:50.0, baseCost:'1e11',  costScale:2.2  },
  { id:'drop1',     tab:'wealth',  name:'Lucky Clover',       icon:'🍀', desc:'+15% Drop Rate',      stat:'dropRate',  val:0.15, baseCost:'500',   costScale:1.7  },
  { id:'drop2',     tab:'wealth',  name:'Fortune Hunter',     icon:'🏹', desc:'+30% Drop Rate',      stat:'dropRate',  val:0.30, baseCost:'2e4',   costScale:1.8  },
  { id:'drop3',     tab:'wealth',  name:'Treasure Master',    icon:'💎', desc:'+60% Drop Rate',      stat:'dropRate',  val:0.60, baseCost:'5e5',   costScale:1.95 },
  { id:'drop4',     tab:'wealth',  name:'Divine Luck',        icon:'🌟', desc:'+150% Drop Rate',     stat:'dropRate',  val:1.50, baseCost:'5e8',   costScale:2.1  },
  // Mastery
  { id:'exp1',      tab:'mastery', name:'Student\'s Guide',   icon:'📚', desc:'+20% EXP',            stat:'expBonus',  val:0.20, baseCost:'150',   costScale:1.6  },
  { id:'exp2',      tab:'mastery', name:'Adept Scholar',      icon:'📖', desc:'+50% EXP',            stat:'expBonus',  val:0.50, baseCost:'4e3',   costScale:1.75 },
  { id:'exp3',      tab:'mastery', name:'Grand Master',       icon:'🎓', desc:'+100% EXP',           stat:'expBonus',  val:1.00, baseCost:'1e5',   costScale:1.9  },
  { id:'exp4',      tab:'mastery', name:'Cosmic Knowledge',   icon:'🌌', desc:'+500% EXP',           stat:'expBonus',  val:5.00, baseCost:'1e9',   costScale:2.1  },
  { id:'lvlcap1',   tab:'mastery', name:'Level Break I',      icon:'🔓', desc:'+50 Max Level',       stat:'levelCap',  val:50,   baseCost:'1e4',   costScale:1,   oneTime:true },
  { id:'lvlcap2',   tab:'mastery', name:'Level Break II',     icon:'🔓', desc:'+100 Max Level',      stat:'levelCap',  val:100,  baseCost:'1e6',   costScale:1,   oneTime:true },
  { id:'lvlcap3',   tab:'mastery', name:'Limitless I',        icon:'♾️', desc:'+500 Max Level',      stat:'levelCap',  val:500,  baseCost:'1e9',   costScale:1,   oneTime:true },
  { id:'lvlcap4',   tab:'mastery', name:'Limitless II',       icon:'♾️', desc:'+2000 Max Level',     stat:'levelCap',  val:2000, baseCost:'1e12',  costScale:1,   oneTime:true },
  { id:'lvlcap5',   tab:'mastery', name:'God Realm',          icon:'👑', desc:'+10000 Max Level',    stat:'levelCap',  val:10000,baseCost:'1e16',  costScale:1,   oneTime:true },
  // Arcane
  { id:'skill1',    tab:'arcane',  name:'Mana Training',      icon:'🔮', desc:'+20% Skill Power',    stat:'skillDmg',  val:0.20, baseCost:'2e3',   costScale:1.7  },
  { id:'skill2',    tab:'arcane',  name:'Arcane Mastery',     icon:'🌀', desc:'+60% Skill Power',    stat:'skillDmg',  val:0.60, baseCost:'5e4',   costScale:1.85 },
  { id:'skill3',    tab:'arcane',  name:'Spell God',          icon:'⭐', desc:'+150% Skill Power',   stat:'skillDmg',  val:1.50, baseCost:'1e6',   costScale:2.0  },
  { id:'skill4',    tab:'arcane',  name:'Archmage Resonance', icon:'☄️', desc:'+500% Skill Power',   stat:'skillDmg',  val:5.00, baseCost:'1e10',  costScale:2.15 },
  { id:'cd1',       tab:'arcane',  name:'Flow State',         icon:'💧', desc:'-10% Skill CDs',      stat:'cdReduction',val:0.10, baseCost:'3e3', costScale:1.75 },
  { id:'cd2',       tab:'arcane',  name:'Time Warp',          icon:'⏱️', desc:'-20% Skill CDs',      stat:'cdReduction',val:0.20, baseCost:'1e5', costScale:1.9  },
  // Pet Bond
  { id:'pet1',      tab:'petbond', name:'Tamer\'s Call',      icon:'🐾', desc:'+20% Pet Damage',     stat:'petDmg',    val:0.20, baseCost:'5e3',   costScale:1.7  },
  { id:'pet2',      tab:'petbond', name:'Beast Lord',         icon:'🦁', desc:'+50% Pet Damage',     stat:'petDmg',    val:0.50, baseCost:'2e5',   costScale:1.85 },
  { id:'pet3',      tab:'petbond', name:'Wild Harmony',       icon:'🌿', desc:'+150% Pet Damage',    stat:'petDmg',    val:1.50, baseCost:'5e6',   costScale:2.0  },
  { id:'pet4',      tab:'petbond', name:'Primal Swarm',       icon:'🐉', desc:'+500% Pet Damage',    stat:'petDmg',    val:5.00, baseCost:'1e10',  costScale:2.15 },
  { id:'petslot1',  tab:'petbond', name:'Pet Slot +1',        icon:'➕', desc:'Unlock 4th pet slot', stat:'petSlots',  val:1,    baseCost:'1e4',   costScale:1,   oneTime:true },
  { id:'petslot2',  tab:'petbond', name:'Pet Slot +1',        icon:'➕', desc:'Unlock 5th pet slot', stat:'petSlots',  val:1,    baseCost:'1e6',   costScale:1,   oneTime:true },
];

// ══════════════════════════════════════════════════════════════════
// PRESTIGE UPGRADES
// ══════════════════════════════════════════════════════════════════
const PRESTIGE_UPGRADES = [
  { id:'p_dmg1',   name:'Shard-Forged Blade', icon:'⚔️', desc:'×2 All Damage',       stat:'dmgMult',   val:1.00, cost:5   },
  { id:'p_dmg2',   name:'Soul Rend',          icon:'💀', desc:'×5 All Damage',       stat:'dmgMult',   val:4.00, cost:15  },
  { id:'p_dmg3',   name:'Eternal Fury',       icon:'🌟', desc:'×10 All Damage',      stat:'dmgMult',   val:9.00, cost:40  },
  { id:'p_gold1',  name:'Soul Wealth',        icon:'💰', desc:'×2 Gold',             stat:'goldFind',  val:1.00, cost:5   },
  { id:'p_gold2',  name:'Infinite Greed',     icon:'👑', desc:'×5 Gold',             stat:'goldFind',  val:4.00, cost:18  },
  { id:'p_start1', name:'Head Start',         icon:'🚀', desc:'Start at Stage 50',   stat:'startStage', val:50,  cost:10  },
  { id:'p_start2', name:'Veteran\'s Return',  icon:'🏆', desc:'Start at Stage 200',  stat:'startStage', val:200, cost:25  },
  { id:'p_pet1',   name:'Eternal Bond',       icon:'🐾', desc:'×3 Pet Damage',       stat:'petDmg',    val:2.00, cost:20  },
  { id:'p_skill1', name:'Ancient Arts',       icon:'🔮', desc:'×3 Skill Power',      stat:'skillDmg',  val:2.00, cost:20  },
  { id:'p_crit1',  name:'Shard Sight',        icon:'👁️', desc:'+50% Crit Chance',    stat:'critChance',val:0.50, cost:12  },
  { id:'p_speed1', name:'Time Shard',         icon:'⏱️', desc:'+50% Atk Speed',      stat:'atkSpeed',  val:0.50, cost:8   },
  { id:'p_keep1',  name:'Memory Fragments',   icon:'🧠', desc:'Keep 10% of upgrades', stat:'keepUpgrades', val:0.10, cost:30 },
];

// ══════════════════════════════════════════════════════════════════
// DUNGEONS
// ══════════════════════════════════════════════════════════════════
const DUNGEONS = [
  { id:'gold_mine',    name:'Midas Vault',       icon:'💰', desc:'Abundant gold drops & materials', hpMult:1.5, tokenReward:5,  material:'chaosShards' },
  { id:'pet_reserve',  name:'Beast Den',         icon:'🐾', desc:'Earn Pet Essence & rare pet eggs', hpMult:2.0, tokenReward:8,  material:'petEssence' },
  { id:'essence_shrine',name:'Arcane Shrine',    icon:'🔮', desc:'Earn Tier Stones & Void Essence', hpMult:3.0, tokenReward:12, material:'tierStones' },
  { id:'relic_spire',  name:'Ancient Reliquary', icon:'🏛️', desc:'Earn Relic Dust for ancient treasures', hpMult:5.0, tokenReward:20, material:'relicDust' },
];

// ══════════════════════════════════════════════════════════════════
// RELICS / ARTIFACTS
// ══════════════════════════════════════════════════════════════════
const RELICS = [
  { id:'crown_midas',   name:'Crown of Midas',      icon:'👑', desc:'+50% Gold Find per level',       stat:'goldFind', val:0.50, costBase:20 },
  { id:'dragon_heart',  name:'Dragon Heart',        icon:'🐉', desc:'+100% All Damage per level',      stat:'dmgMult',  val:1.00, costBase:25 },
  { id:'void_core',     name:'Void Core',           icon:'🌑', desc:'+40% Skill Power per level',      stat:'skillDmg', val:0.40, costBase:30 },
  { id:'beast_tome',    name:'Book of Beasts',      icon:'📖', desc:'+60% Pet Damage per level',       stat:'petDmg',   val:0.60, costBase:30 },
  { id:'time_glass',    name:'Hourglass of Fate',   icon:'⏳', desc:'-5% Skill Cooldowns per level',   stat:'cdReduction', val:0.05, costBase:50 },
  { id:'clover_divine', name:'Seven-Leaf Clover',   icon:'🍀', desc:'+20% Drop Rate per level',        stat:'dropRate', val:0.20, costBase:40 },
];

// ══════════════════════════════════════════════════════════════════
// GACHA BANNERS
// ══════════════════════════════════════════════════════════════════
const BANNERS = [
  { id:'pet',   name:'Pet Summon',    icon:'🐾', currency:'gems', cost:1,  pity50:'epic',   pity100:'legendary', pool:'pets'   },
  { id:'skill', name:'Skill Summon',  icon:'🌟', currency:'gems', cost:1,  pity50:'rare',   pity100:'epic',      pool:'skills' },
  { id:'gear',  name:'Gear Summon',   icon:'⚔️', currency:'gems', cost:1,  pity50:'rare',   pity100:'epic',      pool:'gear'   },
];

// ══════════════════════════════════════════════════════════════════
// DUNGEON UPGRADES (TOKEN SHOP)
// ══════════════════════════════════════════════════════════════════
const DUNGEON_UPGRADES = [
  { id:'d_dmg1',    name:'Sacred Titan Blade',   icon:'⚔️', desc:'+100% All Damage per rank',           stat:'dmgMult',   val:1.00, costBase:10, costScale:1.5 },
  { id:'d_wealth1', name:'Vault Master Greed',   icon:'💰', desc:'+100% Gold & Drop Rate per rank',     stat:'goldFind',  val:1.00, costBase:15, costScale:1.6 },
  { id:'d_slayer1', name:'Raid Titan Slayer',    icon:'👹', desc:'+50% Damage to Bosses & Titans',      stat:'bossDmg',   val:0.50, costBase:20, costScale:1.7 },
  { id:'d_timer1',  name:'Chronos Extension',    icon:'⏱️', desc:'+5s Boss & Raid Timers per rank',     stat:'bossTimer', val:5,    costBase:30, costScale:1.8 },
  { id:'d_mat1',    name:'Alchemist Resonance',  icon:'🧪', desc:'+100% Material & Dust Drops in Raids', stat:'matMult',   val:1.00, costBase:25, costScale:1.75 },
];

// Expose all data
window.GAME_DATA = {
  RARITIES, RARITY_INDEX, getRarityById, rollRarity,
  EQUIP_SLOTS, AFFIXES, EQUIP_BASES,
  ZONES, WORLDS, ENEMY_TYPES, BOSS_NAMES,
  PETS, SKILLS, UPGRADES, PRESTIGE_UPGRADES, DUNGEONS, DUNGEON_UPGRADES, RELICS, BANNERS,
};
