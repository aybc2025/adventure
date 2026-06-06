import { XP_TABLE, MAX_LEVEL } from '../config/constants.js';

/**
 * Add XP to a hero and compute leveling.
 * Returns { updatedHero, leveledUp, levelsGained, newLevel }
 */
export function addXP(hero, amount) {
  if (amount <= 0) {
    return { updatedHero: hero, leveledUp: false, levelsGained: 0, newLevel: hero.level };
  }

  const newXP = (hero.xp || 0) + amount;
  let newLevel = hero.level || 1;

  // Find the highest level whose XP threshold we've reached
  for (let lvl = newLevel + 1; lvl <= MAX_LEVEL; lvl++) {
    if (newXP >= XP_TABLE[lvl - 1]) {
      newLevel = lvl;
    } else {
      break;
    }
  }

  const leveledUp = newLevel > (hero.level || 1);
  const levelsGained = newLevel - (hero.level || 1);

  const xpToNextLevel = newLevel >= MAX_LEVEL
    ? 0
    : XP_TABLE[newLevel] - XP_TABLE[newLevel - 1];

  return {
    updatedHero: {
      ...hero,
      xp: newXP,
      level: newLevel,
      xp_to_next_level: xpToNextLevel
    },
    leveledUp,
    levelsGained,
    newLevel
  };
}

/**
 * Get 2 random level-up options from the template that the hero hasn't used yet.
 */
export function getLevelUpOptions(template, appliedUpgradeIds = []) {
  const allOptions = template?.level_up_options || [];
  const available = allOptions.filter((opt) => !appliedUpgradeIds.includes(opt.id));

  if (available.length === 0) return [];
  if (available.length <= 2) return available;

  // Pick 2 distinct random options
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

/**
 * Apply a chosen upgrade to a hero.
 * Mutates stats based on the effect, records the upgrade id.
 */
export function applyUpgrade(hero, upgrade) {
  if (!upgrade?.effect) {
    return {
      ...hero,
      applied_upgrades: [...(hero.applied_upgrades || []), upgrade.id]
    };
  }

  const { stat, modifier } = upgrade.effect;
  const newHero = { ...hero };

  switch (stat) {
    case 'hp_max': {
      const delta = modifier || 0;
      newHero.hp_max = (newHero.hp_max || 0) + delta;
      break;
    }
    case 'attack_dice': {
      newHero.attack_dice = bumpDiceCount(newHero.attack_dice, modifier || 0);
      break;
    }
    case 'defense_dice': {
      newHero.defense_dice = bumpDiceCount(newHero.defense_dice, modifier || 0);
      break;
    }
    case 'attack_modifier': {
      newHero.attack_dice = bumpDiceModifier(newHero.attack_dice, modifier || 0);
      break;
    }
    case 'defense_modifier': {
      newHero.defense_dice = bumpDiceModifier(newHero.defense_dice, modifier || 0);
      break;
    }
    default:
      // unknown stat — record the upgrade without applying
      break;
  }

  newHero.applied_upgrades = [...(hero.applied_upgrades || []), upgrade.id];
  return newHero;
}

/**
 * Bump the dice count: "2d6" + 1 -> "3d6"
 */
function bumpDiceCount(expression, delta) {
  if (!expression) return expression;
  const m = expression.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return expression;
  const count = (m[1] === '' ? 1 : parseInt(m[1], 10)) + delta;
  const sides = m[2];
  const mod = m[3] || '';
  return `${Math.max(1, count)}d${sides}${mod}`;
}

/**
 * Bump the dice modifier: "2d6" + 1 -> "2d6+1"
 */
function bumpDiceModifier(expression, delta) {
  if (!expression) return expression;
  const m = expression.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return expression;
  const head = `${m[1]}d${m[2]}`;
  const currentMod = m[3] ? parseInt(m[3], 10) : 0;
  const newMod = currentMod + delta;
  if (newMod === 0) return head;
  return `${head}${newMod >= 0 ? '+' : ''}${newMod}`;
}
