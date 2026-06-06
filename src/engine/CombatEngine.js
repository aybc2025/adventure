import { rollAttack, roll } from './DiceRoller.js';
import {
  resolveTriggers,
  resolveStatusRoundStart,
  tickStatuses,
  isHeroSkippingTurn
} from './TriggerResolver.js';
import {
  useItem as inventoryUseItem,
  canUseItem,
  rollLoot,
  collectLoot,
  tickCombatBonuses
} from './InventoryEngine.js';
import { TRIGGER_EVENTS, COMBAT_OUTCOMES } from '../config/constants.js';

/**
 * Initialise combat state for a room.
 *
 * Inputs:
 *   hero: { id, custom_name, hp_max, attack_dice, defense_dice, special_*, ... }
 *   heroInventory: object map { itemId: { item_id, quantity } }
 *   monsters: [{ id, name, hp, attack_dice, defense_dice, position, loot, triggers }]
 *   room: { id, title }
 *   currentHp: optional — preserved HP across rooms
 *
 * Output: state object consumed by all engine fns.
 */
export function initCombat(hero, heroInventory, monsters, room, currentHp = null) {
  const state = {
    hero: {
      id: hero.id,
      name: hero.custom_name || hero.name,
      hp: currentHp ?? hero.hp_max,
      hp_max: hero.hp_max,
      attack_dice: hero.attack_dice,
      defense_dice: hero.defense_dice,
      special_name: hero.special_name,
      special_description: hero.special_description,
      special_trigger: hero.special_trigger,
      special_used: false,
      emoji: hero.emoji,
      statuses: [],
      combat_bonuses: {}
    },
    monsters: monsters.map((m) => ({
      ...m,
      hp_max: m.hp_max ?? m.hp
    })),
    inventory: heroInventory || {},
    room: { id: room.id, title: room.title },
    pendingLoot: [],
    round: 1,
    turn: 'player', // 'player' | 'monsters'
    log: [],
    outcome: COMBAT_OUTCOMES.IN_PROGRESS
  };

  // Fire on_player_enter triggers
  const result = resolveTriggers(state, TRIGGER_EVENTS.ON_PLAYER_ENTER);
  return appendLog(result.state, result.log);
}

function appendLog(state, entries) {
  if (!entries || entries.length === 0) return state;
  return { ...state, log: [...state.log, ...entries] };
}

/**
 * Get effective attack/defense dice including combat bonuses from items.
 */
function getEffectiveDice(hero, type) {
  const base = type === 'attack' ? hero.attack_dice : hero.defense_dice;
  const bonus = hero.combat_bonuses?.[type] || 0;
  if (!bonus) return base;

  // Apply modifier
  const m = base.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return base;
  const head = `${m[1]}d${m[2]}`;
  const currentMod = m[3] ? parseInt(m[3], 10) : 0;
  const newMod = currentMod + bonus;
  if (newMod === 0) return head;
  return `${head}${newMod >= 0 ? '+' : ''}${newMod}`;
}

/**
 * Player attacks a specific monster.
 * Returns { state, attackResult, log }
 */
export function playerAttack(state, targetMonsterId) {
  if (state.outcome !== COMBAT_OUTCOMES.IN_PROGRESS) return { state };
  if (state.turn !== 'player') return { state };

  const target = state.monsters.find((m) => m.id === targetMonsterId);
  if (!target || target.hp <= 0) return { state };

  const attackResult = rollAttack(
    getEffectiveDice(state.hero, 'attack'),
    target.defense_dice
  );

  // Apply damage
  let updatedMonsters = state.monsters.map((m) => {
    if (m.id === targetMonsterId) {
      return { ...m, hp: Math.max(0, m.hp - attackResult.hits) };
    }
    return m;
  });

  let newState = {
    ...state,
    monsters: updatedMonsters,
    log: [
      ...state.log,
      {
        type: 'player_attack',
        message: `${state.hero.name} תקף את ${target.name}: ${attackResult.description}`,
        target_id: targetMonsterId,
        hits: attackResult.hits,
        rolls: attackResult.attackRolls,
        defense_rolls: attackResult.defenseRolls
      }
    ]
  };

  // Fire on_hit triggers if we hit
  if (attackResult.hits > 0) {
    const hitResult = resolveTriggers(newState, TRIGGER_EVENTS.ON_HIT, targetMonsterId);
    newState = appendLog(hitResult.state, hitResult.log);
  }

  // Check for monster death
  const killedMonster = newState.monsters.find(
    (m) => m.id === targetMonsterId && m.hp <= 0
  );
  if (killedMonster) {
    newState = handleMonsterDeath(newState, killedMonster);
  }

  // Check combat end
  newState = checkCombatEnd(newState);

  // If combat still in progress, advance to monsters' turn
  if (newState.outcome === COMBAT_OUTCOMES.IN_PROGRESS) {
    newState = { ...newState, turn: 'monsters' };
  }

  return { state: newState, attackResult };
}

/**
 * Handle a monster death — fire on_death triggers, roll loot.
 */
function handleMonsterDeath(state, monster) {
  let newState = {
    ...state,
    log: [
      ...state.log,
      { type: 'monster_death', message: `${monster.name} הובסה!`, monster_id: monster.id }
    ]
  };

  // Trigger on_death effects BEFORE removing the monster
  const deathResult = resolveTriggers(newState, TRIGGER_EVENTS.ON_DEATH, monster.id);
  newState = appendLog(deathResult.state, deathResult.log);

  // Roll loot from the monster's loot table
  if (monster.loot?.length) {
    const drops = rollLoot(monster.loot);
    if (drops.length > 0) {
      newState = {
        ...newState,
        pendingLoot: [...newState.pendingLoot, ...drops]
      };
    }
  }

  return newState;
}

/**
 * Player uses an inventory item.
 */
export function playerUseItem(state, item) {
  if (state.outcome !== COMBAT_OUTCOMES.IN_PROGRESS) return { state };
  if (state.turn !== 'player') return { state };

  const check = canUseItem(item, state);
  if (!check.canUse) {
    return {
      state: {
        ...state,
        log: [...state.log, { type: 'item_blocked', message: check.reason }]
      }
    };
  }

  const result = inventoryUseItem(item, state);
  let newState = appendLog(result.state, result.log);

  // Using an item ends the turn
  newState = { ...newState, turn: 'monsters' };

  return { state: newState };
}

/**
 * Player uses their special ability.
 * This is intentionally generic — implementations vary by class.
 * The UI passes the chosen target if needed.
 */
export function playerUseSpecial(state, params = {}) {
  if (state.outcome !== COMBAT_OUTCOMES.IN_PROGRESS) return { state };
  if (state.turn !== 'player') return { state };
  if (state.hero.special_trigger === 'once_per_combat' && state.hero.special_used) {
    return {
      state: {
        ...state,
        log: [...state.log, { type: 'special_blocked', message: 'יכולת מיוחדת כבר בשימוש' }]
      }
    };
  }

  // For v1: special does +1 damage to chosen target (override with params for variety)
  const targetId = params.target_id || state.monsters.find((m) => m.hp > 0)?.id;
  if (!targetId) return { state };

  const target = state.monsters.find((m) => m.id === targetId);
  if (!target) return { state };

  const damage = params.damage || 2;
  let newState = {
    ...state,
    hero: { ...state.hero, special_used: true },
    monsters: state.monsters.map((m) =>
      m.id === targetId ? { ...m, hp: Math.max(0, m.hp - damage) } : m
    ),
    log: [
      ...state.log,
      {
        type: 'special',
        message: `${state.hero.name} השתמש ב-${state.hero.special_name}! ${damage} נזק ל-${target.name}`,
        target_id: targetId,
        damage
      }
    ]
  };

  const killed = newState.monsters.find((m) => m.id === targetId && m.hp <= 0);
  if (killed) newState = handleMonsterDeath(newState, killed);

  newState = checkCombatEnd(newState);

  if (newState.outcome === COMBAT_OUTCOMES.IN_PROGRESS) {
    newState = { ...newState, turn: 'monsters' };
  }

  return { state: newState };
}

/**
 * All living monsters take their turn.
 */
export function monstersTurn(state) {
  if (state.outcome !== COMBAT_OUTCOMES.IN_PROGRESS) return { state };
  if (state.turn !== 'monsters') return { state };

  let newState = { ...state };

  for (const monster of newState.monsters) {
    if (monster.hp <= 0) continue;
    if (newState.hero.hp <= 0) break;

    const attackResult = rollAttack(
      monster.attack_dice,
      getEffectiveDice(newState.hero, 'defense')
    );

    newState = {
      ...newState,
      hero: {
        ...newState.hero,
        hp: Math.max(0, newState.hero.hp - attackResult.hits)
      },
      log: [
        ...newState.log,
        {
          type: 'monster_attack',
          message: `${monster.name} תקף: ${attackResult.description}`,
          source_id: monster.id,
          hits: attackResult.hits,
          rolls: attackResult.attackRolls
        }
      ]
    };
  }

  newState = checkCombatEnd(newState);

  if (newState.outcome === COMBAT_OUTCOMES.IN_PROGRESS) {
    newState = advanceTurn(newState);
  }

  return { state: newState };
}

/**
 * End the round: tick statuses, run round_start triggers for next round.
 */
export function advanceTurn(state) {
  let newState = {
    ...state,
    round: state.round + 1,
    turn: 'player'
  };

  // Tick statuses + combat bonuses
  newState = tickStatuses(newState);
  newState = tickCombatBonuses(newState);

  // Resolve status round-start effects (poison damage, etc.)
  const statusResult = resolveStatusRoundStart(newState);
  newState = appendLog(statusResult.state, statusResult.log);

  // Resolve room-level on_round_start triggers
  const roundResult = resolveTriggers(newState, TRIGGER_EVENTS.ON_ROUND_START);
  newState = appendLog(roundResult.state, roundResult.log);

  // If hero is stunned/frozen, skip their turn
  if (isHeroSkippingTurn(newState)) {
    newState = {
      ...newState,
      log: [...newState.log, { type: 'skip', message: 'הגיבור מאבד תור!' }],
      turn: 'monsters'
    };
  }

  // Check combat end after triggers (poison could kill hero)
  newState = checkCombatEnd(newState);

  return newState;
}

/**
 * Determine if combat has ended and set outcome.
 */
function checkCombatEnd(state) {
  if (state.outcome !== COMBAT_OUTCOMES.IN_PROGRESS) return state;

  if (state.hero.hp <= 0) {
    return {
      ...state,
      outcome: COMBAT_OUTCOMES.PLAYER_DEFEAT,
      log: [...state.log, { type: 'defeat', message: 'הגיבור הובס...' }]
    };
  }

  const livingMonsters = state.monsters.filter((m) => m.hp > 0);
  if (livingMonsters.length === 0) {
    return {
      ...state,
      outcome: COMBAT_OUTCOMES.PLAYER_VICTORY,
      log: [...state.log, { type: 'victory', message: 'כל המפלצות הובסו!' }]
    };
  }

  return state;
}

/**
 * Returns true if combat is over.
 */
export function isCombatOver(state) {
  return state.outcome !== COMBAT_OUTCOMES.IN_PROGRESS;
}

/**
 * Returns the outcome details + pending loot.
 */
export function getCombatResult(state) {
  return {
    outcome: state.outcome,
    pendingLoot: state.pendingLoot || [],
    finalHp: state.hero.hp,
    monstersDefeated: state.monsters.filter((m) => m.hp <= 0).length
  };
}

/**
 * Collect pending loot into the hero's inventory; returns new inventory and a clean state.
 */
export function finalizeLoot(state) {
  const newInventory = collectLoot(state.pendingLoot || [], state.inventory || {});
  return {
    state: { ...state, inventory: newInventory, pendingLoot: [] },
    inventory: newInventory
  };
}
