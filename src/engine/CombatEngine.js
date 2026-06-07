import { rollAttack } from './DiceRoller.js';
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
 * Roll a single d6.
 */
function d6() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Initialise combat state for a room.
 *
 * PDF rule (p.18 — Initiative):
 *   "Ask one of the players to roll a d6 for all of the heroes,
 *    and then roll a d6 for the monsters.
 *    The side with the highest roll goes first (heroes win on a tie)."
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
  // PDF initiative roll — heroes win ties
  const heroInitiative    = d6();
  const monsterInitiative = d6();
  const firstTurn = heroInitiative >= monsterInitiative ? 'player' : 'monsters';
  const initiativeMsg = firstTurn === 'player'
    ? `יוזמה: גיבור [${heroInitiative}] מול מפלצות [${monsterInitiative}] — הגיבור מתחיל!`
    : `יוזמה: גיבור [${heroInitiative}] מול מפלצות [${monsterInitiative}] — המפלצות מתחילות!`;

  const state = {
    hero: {
      id:                  hero.id,
      name:                hero.custom_name || hero.name,
      hp:                  currentHp ?? hero.hp_max,
      hp_max:              hero.hp_max,
      attack_dice:         hero.attack_dice,
      defense_dice:        hero.defense_dice,
      special_name:        hero.special_name,
      special_description: hero.special_description,
      special_trigger:     hero.special_trigger,
      special_used:        false,
      emoji:               hero.emoji,
      statuses:            [],
      combat_bonuses:      {}
    },
    monsters: monsters.map((m) => ({
      ...m,
      hp_max: m.hp_max ?? m.hp
    })),
    inventory: heroInventory || {},
    room:      { id: room.id, title: room.title },
    pendingLoot: [],
    round:       1,
    turn:        firstTurn,
    log:         [{ type: 'initiative', message: initiativeMsg }],
    outcome:     COMBAT_OUTCOMES.IN_PROGRESS
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
  const base  = type === 'attack' ? hero.attack_dice : hero.defense_dice;
  const bonus = hero.combat_bonuses?.[type] || 0;
  if (!bonus) return base;

  const m = base.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return base;
  const head       = `${m[1]}d${m[2]}`;
  const currentMod = m[3] ? parseInt(m[3], 10) : 0;
  const newMod     = currentMod + bonus;
  if (newMod === 0) return head;
  return `${head}${newMod >= 0 ? '+' : ''}${newMod}`;
}

/**
 * Player attacks a specific monster.
 * Returns { state, attackResult }
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
        type:          'player_attack',
        message:       `${state.hero.name} תקף את ${target.name}: ${attackResult.description}`,
        target_id:     targetMonsterId,
        hits:          attackResult.hits,
        rolls:         attackResult.attackRolls,
        defense_rolls: attackResult.defenseRolls
      }
    ]
  };

  if (attackResult.hits > 0) {
    const hitResult = resolveTriggers(newState, TRIGGER_EVENTS.ON_HIT, targetMonsterId);
    newState = appendLog(hitResult.state, hitResult.log);
  }

  const killedMonster = newState.monsters.find(
    (m) => m.id === targetMonsterId && m.hp <= 0
  );
  if (killedMonster) {
    newState = handleMonsterDeath(newState, killedMonster);
  }

  newState = checkCombatEnd(newState);

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

  const deathResult = resolveTriggers(newState, TRIGGER_EVENTS.ON_DEATH, monster.id);
  newState = appendLog(deathResult.state, deathResult.log);

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

  const result  = inventoryUseItem(item, state);
  let newState  = appendLog(result.state, result.log);
  newState      = { ...newState, turn: 'monsters' };

  return { state: newState };
}

/**
 * Player uses their special ability.
 * Generic for v1 — deals 2 fixed damage to chosen target.
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

  const targetId = params.target_id || state.monsters.find((m) => m.hp > 0)?.id;
  if (!targetId) return { state };

  const target = state.monsters.find((m) => m.id === targetId);
  if (!target) return { state };

  const damage  = params.damage || 2;
  let newState  = {
    ...state,
    hero: { ...state.hero, special_used: true },
    monsters: state.monsters.map((m) =>
      m.id === targetId ? { ...m, hp: Math.max(0, m.hp - damage) } : m
    ),
    log: [
      ...state.log,
      {
        type:      'special',
        message:   `${state.hero.name} השתמש ב-${state.hero.special_name}! ${damage} נזק ל-${target.name}`,
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
 * BFS path from `start` toward a cell adjacent to `heroPos`.
 * Returns steps to take, capped at `moveRange`.
 */
function pathTowardHero(start, heroPos, blocked, cols, rows, moveRange) {
  if (!start || !heroPos) return [];
  const queue   = [{ x: start.x, y: start.y, path: [] }];
  const visited = new Set([`${start.x},${start.y}`]);

  while (queue.length) {
    const { x, y, path } = queue.shift();

    if (Math.max(Math.abs(x - heroPos.x), Math.abs(y - heroPos.y)) <= 1 && path.length > 0) {
      return path.slice(0, moveRange);
    }
    if (path.length >= moveRange) continue;

    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (nx === heroPos.x && ny === heroPos.y) continue;
      const key = `${nx},${ny}`;
      if (blocked.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
    }
  }
  return [];
}

/**
 * All living monsters move then attack.
 * Optionally accepts `grid` + `heroPosition` for positional movement.
 */
export function monstersTurn(state, grid = null, heroPosition = null) {
  if (state.outcome !== COMBAT_OUTCOMES.IN_PROGRESS) return { state };
  if (state.turn !== 'monsters') return { state };

  let newState = { ...state };

  // ── 1. Move monsters toward the hero ─────────────────────────
  if (grid && heroPosition) {
    const cols = grid.cols || 8;
    const rows = grid.rows || 6;

    const walls = new Set();
    (grid.cells || []).forEach((c) => { if (c.type === 'wall') walls.add(`${c.x},${c.y}`); });

    const movedMonsters = [...newState.monsters];
    for (let i = 0; i < movedMonsters.length; i++) {
      const m = movedMonsters[i];
      if (m.hp <= 0 || !m.position) continue;

      const alreadyAdjacent =
        Math.max(
          Math.abs(heroPosition.x - m.position.x),
          Math.abs(heroPosition.y - m.position.y)
        ) <= 1;
      if (alreadyAdjacent) continue;

      const moveRange = m.move_range || 2;
      const blocked   = new Set(walls);
      movedMonsters.forEach((other, j) => {
        if (j !== i && other.hp > 0 && other.position)
          blocked.add(`${other.position.x},${other.position.y}`);
      });

      const path = pathTowardHero(m.position, heroPosition, blocked, cols, rows, moveRange);
      if (path.length > 0) {
        movedMonsters[i] = { ...m, position: path[path.length - 1] };
        newState = {
          ...newState,
          log: [
            ...newState.log,
            { type: 'monster_move', message: `${m.name} מתקרב...`, monster_id: m.id }
          ]
        };
      }
    }
    newState = { ...newState, monsters: movedMonsters };
  }

  // ── 2. Attack if adjacent ─────────────────────────────────────
  for (const monster of newState.monsters) {
    if (monster.hp <= 0) continue;
    if (newState.hero.hp <= 0) break;

    if (grid && heroPosition && monster.position) {
      const dist = Math.max(
        Math.abs(heroPosition.x - monster.position.x),
        Math.abs(heroPosition.y - monster.position.y)
      );
      if (dist > 1) continue;
    }

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
          type:      'monster_attack',
          message:   `${monster.name} תקף: ${attackResult.description}`,
          source_id: monster.id,
          hits:      attackResult.hits,
          rolls:     attackResult.attackRolls
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
    turn:  'player'
  };

  newState = tickStatuses(newState);
  newState = tickCombatBonuses(newState);

  const statusResult = resolveStatusRoundStart(newState);
  newState = appendLog(statusResult.state, statusResult.log);

  const roundResult = resolveTriggers(newState, TRIGGER_EVENTS.ON_ROUND_START);
  newState = appendLog(roundResult.state, roundResult.log);

  if (isHeroSkippingTurn(newState)) {
    newState = {
      ...newState,
      log:  [...newState.log, { type: 'skip', message: 'הגיבור מאבד תור!' }],
      turn: 'monsters'
    };
  }

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
 * Returns outcome details + pending loot.
 */
export function getCombatResult(state) {
  return {
    outcome:          state.outcome,
    pendingLoot:      state.pendingLoot || [],
    finalHp:          state.hero.hp,
    monstersDefeated: state.monsters.filter((m) => m.hp <= 0).length
  };
}

/**
 * Collect pending loot into the hero's inventory; returns new inventory and a clean state.
 */
export function finalizeLoot(state) {
  const newInventory = collectLoot(state.pendingLoot || [], state.inventory || {});
  return {
    state:     { ...state, inventory: newInventory, pendingLoot: [] },
    inventory: newInventory
  };
}
