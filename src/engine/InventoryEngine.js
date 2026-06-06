import { ITEM_EFFECTS, STATUS_EFFECTS } from '../config/constants.js';

/**
 * Determine drop results from a monster's loot table.
 * Returns array of { item_id, quantity }.
 */
export function rollLoot(lootTable) {
  if (!Array.isArray(lootTable) || lootTable.length === 0) return [];
  const results = [];
  for (const entry of lootTable) {
    const chance = entry.drop_chance ?? 100;
    if (Math.random() * 100 < chance) {
      results.push({ item_id: entry.item_id, quantity: entry.quantity || 1 });
    }
  }
  return results;
}

/**
 * Merge collected loot into hero's inventory snapshot.
 * inventory: { [itemId]: { item_id, quantity, acquired_at } }
 */
export function collectLoot(pendingLoot, inventory) {
  const newInventory = { ...inventory };
  for (const lootItem of pendingLoot) {
    const existing = newInventory[lootItem.item_id];
    if (existing) {
      newInventory[lootItem.item_id] = {
        ...existing,
        quantity: existing.quantity + lootItem.quantity
      };
    } else {
      newInventory[lootItem.item_id] = {
        item_id: lootItem.item_id,
        quantity: lootItem.quantity,
        acquired_at: Date.now()
      };
    }
  }
  return newInventory;
}

/**
 * Check whether an item can be used right now.
 * Returns { canUse: bool, reason?: string }
 */
export function canUseItem(item, combatState) {
  if (!item) return { canUse: false, reason: 'פריט לא תקף' };
  if (!combatState?.hero) return { canUse: false, reason: 'אין גיבור פעיל' };

  if (item.effect?.type === ITEM_EFFECTS.HEAL) {
    if (combatState.hero.hp >= combatState.hero.hp_max) {
      return { canUse: false, reason: 'כבר ב-HP מקסימלי' };
    }
  }
  if (item.effect?.type === ITEM_EFFECTS.STATUS_CLEAR) {
    if (!combatState.hero.statuses?.length) {
      return { canUse: false, reason: 'אין סטטוסים לנקות' };
    }
  }
  return { canUse: true };
}

/**
 * Apply an item's effect to the combat state.
 * Returns { state, log }
 */
export function useItem(item, combatState) {
  const newState = {
    ...combatState,
    hero: { ...combatState.hero }
  };
  const log = [];
  const effect = item.effect || {};

  switch (effect.type) {
    case ITEM_EFFECTS.HEAL: {
      const before = newState.hero.hp;
      newState.hero.hp = Math.min(
        newState.hero.hp_max,
        newState.hero.hp + (effect.amount || 0)
      );
      const actual = newState.hero.hp - before;
      log.push({
        type: 'item_use',
        message: `${item.name}: ריפוי +${actual}`,
        item_id: item.id || item.itemId
      });
      break;
    }

    case ITEM_EFFECTS.ATTACK_BONUS: {
      newState.hero.combat_bonuses = {
        ...(newState.hero.combat_bonuses || {}),
        attack: (newState.hero.combat_bonuses?.attack || 0) + (effect.amount || 0),
        attack_duration: effect.duration ?? null
      };
      log.push({
        type: 'item_use',
        message: `${item.name}: +${effect.amount} תקיפה`,
        item_id: item.id || item.itemId
      });
      break;
    }

    case ITEM_EFFECTS.DEFENSE_BONUS: {
      newState.hero.combat_bonuses = {
        ...(newState.hero.combat_bonuses || {}),
        defense: (newState.hero.combat_bonuses?.defense || 0) + (effect.amount || 0),
        defense_duration: effect.duration ?? null
      };
      log.push({
        type: 'item_use',
        message: `${item.name}: +${effect.amount} הגנה`,
        item_id: item.id || item.itemId
      });
      break;
    }

    case ITEM_EFFECTS.STATUS_CLEAR: {
      const cleared = (newState.hero.statuses || []).length;
      newState.hero.statuses = [];
      log.push({
        type: 'item_use',
        message: `${item.name}: ניקה ${cleared} סטטוסים`,
        item_id: item.id || item.itemId
      });
      break;
    }

    default:
      log.push({ type: 'item_use', message: `השתמשת ב-${item.name}` });
  }

  // Decrement inventory if consumable
  if (item.consumable !== false) {
    const inv = { ...(newState.inventory || {}) };
    const entry = inv[item.id || item.itemId];
    if (entry) {
      if (entry.quantity > 1) {
        inv[item.id || item.itemId] = { ...entry, quantity: entry.quantity - 1 };
      } else {
        delete inv[item.id || item.itemId];
      }
    }
    newState.inventory = inv;
  }

  return { state: newState, log };
}

/**
 * Tick combat-bonus durations down by 1 round.
 */
export function tickCombatBonuses(state) {
  if (!state.hero?.combat_bonuses) return state;
  const bonuses = { ...state.hero.combat_bonuses };

  if (bonuses.attack_duration != null) {
    bonuses.attack_duration -= 1;
    if (bonuses.attack_duration <= 0) {
      delete bonuses.attack;
      delete bonuses.attack_duration;
    }
  }
  if (bonuses.defense_duration != null) {
    bonuses.defense_duration -= 1;
    if (bonuses.defense_duration <= 0) {
      delete bonuses.defense;
      delete bonuses.defense_duration;
    }
  }

  return {
    ...state,
    hero: { ...state.hero, combat_bonuses: bonuses }
  };
}
