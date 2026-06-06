// Hero Kids dice system: highest attack die vs highest defense die.
// Each attack die that beats the highest defense die = 1 hit.
// (Standard Hero Kids rules per Justin Halliday v3.1)

/**
 * Parse a dice expression like "2d6", "1d6+1", "d6".
 * Returns { count, sides, modifier }.
 */
export function parseDice(expression) {
  if (!expression || typeof expression !== 'string') {
    return { count: 1, sides: 6, modifier: 0 };
  }
  const cleaned = expression.trim().toLowerCase().replace(/\s/g, '');
  const match = cleaned.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) {
    return { count: 1, sides: 6, modifier: 0 };
  }
  const count = match[1] === '' ? 1 : parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  return { count, sides, modifier };
}

/**
 * Roll N dice with given sides, return array of individual results.
 */
function rollDice(count, sides) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * sides) + 1);
  }
  return results;
}

/**
 * Roll a dice expression like "2d6+1".
 * Returns { rolls: [...], modifier, total, highest }.
 */
export function roll(expression) {
  const { count, sides, modifier } = parseDice(expression);
  const rolls = rollDice(count, sides);
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  const highest = Math.max(...rolls) + modifier;
  return { rolls, modifier, total, highest };
}

/**
 * Resolve a Hero Kids attack.
 * Hits = number of attack dice that beat the highest defense die.
 *
 * Returns:
 * {
 *   attackRolls: [...],
 *   defenseRolls: [...],
 *   attackModifier, defenseModifier,
 *   highestDefense, hits,
 *   description: human-readable summary in Hebrew
 * }
 */
export function rollAttack(attackDice, defenseDice) {
  const atk = parseDice(attackDice);
  const def = parseDice(defenseDice);

  const attackRolls = rollDice(atk.count, atk.sides);
  const defenseRolls = rollDice(def.count, def.sides);

  const highestDefense = Math.max(...defenseRolls) + def.modifier;

  let hits = 0;
  for (const a of attackRolls) {
    if (a + atk.modifier > highestDefense) hits++;
  }

  return {
    attackRolls,
    defenseRolls,
    attackModifier: atk.modifier,
    defenseModifier: def.modifier,
    highestDefense,
    hits,
    description: hits === 0
      ? 'החמצה!'
      : `${hits} ${hits === 1 ? 'פגיעה' : 'פגיעות'}!`
  };
}
