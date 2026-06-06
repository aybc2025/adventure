import { STATUS_EFFECTS } from '../config/constants.js';

/**
 * TriggerResolver — runs effects when triggers fire.
 * Pure: receives a state, returns a new state + log entries.
 * Never mutates inputs.
 */

/**
 * Generate a unique monster ID for spawned monsters.
 */
function genId(prefix = 'spawned') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

const EFFECTS = {
  deal_damage: (state, params, sourceId) => {
    const amount = params?.amount || 1;
    const target = params?.target || 'hero';
    const newState = { ...state, hero: { ...state.hero } };
    const log = [];

    if (target === 'hero') {
      newState.hero.hp = Math.max(0, newState.hero.hp - amount);
      log.push({
        type: 'damage',
        message: params?.message || `הגיבור ספג ${amount} נזק`,
        amount
      });
    }
    return { state: newState, log };
  },

  heal: (state, params, sourceId) => {
    const amount = params?.amount || 1;
    const target = params?.target || 'hero';
    const newState = { ...state, hero: { ...state.hero } };
    const log = [];

    if (target === 'hero') {
      const before = newState.hero.hp;
      newState.hero.hp = Math.min(newState.hero.hp_max, newState.hero.hp + amount);
      const actual = newState.hero.hp - before;
      log.push({
        type: 'heal',
        message: params?.message || `הגיבור התרפא ב-${actual}`,
        amount: actual
      });
    } else if (target === 'monster') {
      newState.monsters = newState.monsters.map((m) => {
        if (m.id === sourceId) {
          const newHp = Math.min(m.hp_max ?? m.hp, m.hp + amount);
          return { ...m, hp: newHp };
        }
        return m;
      });
      log.push({
        type: 'heal',
        message: params?.message || `המפלצת התרפאה ב-${amount}`,
        amount
      });
    }
    return { state: newState, log };
  },

  apply_status: (state, params, sourceId) => {
    const statusKey = params?.status;
    const target = params?.target || 'hero';
    if (!statusKey || !STATUS_EFFECTS[statusKey]) {
      return { state, log: [] };
    }
    const def = STATUS_EFFECTS[statusKey];
    const log = [];
    const newState = { ...state };

    if (target === 'hero') {
      newState.hero = { ...newState.hero };
      newState.hero.statuses = [
        ...(newState.hero.statuses || []).filter((s) => s.key !== statusKey),
        { key: statusKey, duration: def.duration || null }
      ];
      log.push({
        type: 'status',
        message: params?.message || `הגיבור ${def.label}!`,
        status: statusKey
      });
    }
    return { state: newState, log };
  },

  spawn_monster: (state, params, sourceId) => {
    const log = [];
    if (!params?.monster) return { state, log };

    const newMonster = {
      id: genId('spawned'),
      ...params.monster,
      hp: params.monster.hp,
      hp_max: params.monster.hp,
      position: params.position || { x: 0, y: 0 }
    };

    const newState = {
      ...state,
      monsters: [...state.monsters, newMonster]
    };

    log.push({
      type: 'spawn',
      message: params?.message || `${newMonster.name} הופיעה!`,
      monster: newMonster
    });
    return { state: newState, log };
  },

  drop_item: (state, params, sourceId) => {
    const log = [];
    if (!params?.item_id) return { state, log };

    const pendingLoot = state.pendingLoot || [];
    const newState = {
      ...state,
      pendingLoot: [...pendingLoot, { item_id: params.item_id, quantity: params.quantity || 1 }]
    };

    log.push({
      type: 'loot',
      message: params?.message || 'פריט הופל!',
      item_id: params.item_id
    });
    return { state: newState, log };
  }
};

/**
 * Resolve all triggers matching a given event for a specific source.
 *
 * @param {object} state - current combat state
 * @param {string} event - one of TRIGGER_EVENTS values
 * @param {string} sourceId - which monster/source the event came from (or null for room-wide)
 * @returns {{ state, log }} - new state and an array of log entries
 */
export function resolveTriggers(state, event, sourceId = null) {
  let currentState = state;
  const allLogs = [];

  // Collect triggers from monsters and room
  const allTriggers = [];

  // Monster-specific triggers
  if (sourceId) {
    const monster = state.monsters.find((m) => m.id === sourceId);
    if (monster?.triggers) {
      for (const trigger of monster.triggers) {
        if (trigger.event === event) {
          allTriggers.push({ trigger, sourceId });
        }
      }
    }
  } else {
    // Iterate all monsters for room-wide events
    for (const monster of state.monsters) {
      if (!monster.triggers) continue;
      for (const trigger of monster.triggers) {
        if (trigger.event === event) {
          allTriggers.push({ trigger, sourceId: monster.id });
        }
      }
    }
  }

  // Execute each
  for (const { trigger, sourceId: src } of allTriggers) {
    const handler = EFFECTS[trigger.effect];
    if (!handler) continue;
    const result = handler(currentState, trigger.params || {}, src);
    currentState = result.state;
    allLogs.push(...result.log);
  }

  return { state: currentState, log: allLogs };
}

/**
 * Decrement status durations and remove expired ones.
 */
export function tickStatuses(state) {
  if (!state.hero?.statuses?.length) return state;
  const newStatuses = state.hero.statuses
    .map((s) => (s.duration == null ? s : { ...s, duration: s.duration - 1 }))
    .filter((s) => s.duration == null || s.duration > 0);
  return {
    ...state,
    hero: { ...state.hero, statuses: newStatuses }
  };
}

/**
 * Run all on_round_start effects from active statuses on the hero.
 */
export function resolveStatusRoundStart(state) {
  if (!state.hero?.statuses?.length) return { state, log: [] };

  let currentState = state;
  const logs = [];

  for (const status of state.hero.statuses) {
    const def = STATUS_EFFECTS[status.key];
    if (def?.on_round_start) {
      const handler = EFFECTS[def.on_round_start.effect];
      if (handler) {
        const result = handler(
          currentState,
          { ...def.on_round_start.params, target: 'hero' },
          null
        );
        currentState = result.state;
        logs.push(...result.log);
      }
    }
  }

  return { state: currentState, log: logs };
}

/**
 * Check if hero must skip their turn due to status effects.
 */
export function isHeroSkippingTurn(state) {
  if (!state.hero?.statuses?.length) return false;
  return state.hero.statuses.some((s) => STATUS_EFFECTS[s.key]?.skip_turn);
}
