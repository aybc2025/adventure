// Hero Kids dice system — per Justin Halliday v3.1 PDF rules (p.10):
// "If the attacker's highest die EQUALS OR EXCEEDS the defender's highest die
//  then the attack hits." → binary result: 0 or 1 hit.
// All hits deal exactly 1 damage (PDF p.15: "attacks deal 1 damage when they hit").

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
 *
 * PDF rule (p.10): compare the HIGHEST attack die against the HIGHEST defense die.
 * If highestAttack >= highestDefense → 1 hit (1 damage).
 * Otherwise → 0 hits (miss).
 *
 * Multiple attack dice give a better CHANCE of rolling high,
 * but a single attack always deals exactly 0 or 1 damage.
 *
 * Returns:
 * {
 *   attackRolls: [...],
 *   defenseRolls: [...],
 *   attackModifier, defenseModifier,
 *   highestAttack, highestDefense,
 *   hits,          // always 0 or 1
 *   description:   // Hebrew summary
 * }
 */
export function rollAttack(attackDice, defenseDice) {
  const atk = parseDice(attackDice);
  const def = parseDice(defenseDice);

  const attackRolls  = rollDice(atk.count, atk.sides);
  const defenseRolls = rollDice(def.count, def.sides);

  // Apply modifiers to the highest die in each pool
  const highestAttack  = Math.max(...attackRolls)  + atk.modifier;
  const highestDefense = Math.max(...defenseRolls) + def.modifier;

  // PDF rule: >= (equals OR exceeds)
  const hits = highestAttack >= highestDefense ? 1 : 0;

  return {
    attackRolls,
    defenseRolls,
    attackModifier:  atk.modifier,
    defenseModifier: def.modifier,
    highestAttack,
    highestDefense,
    hits,
    description: hits === 0 ? 'החמצה!' : 'פגיעה!'
  };
}
