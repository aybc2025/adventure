// ===== Trigger system =====
export const TRIGGER_EVENTS = {
  ON_HIT: 'on_hit',
  ON_DEATH: 'on_death',
  ON_ROUND_START: 'on_round_start',
  ON_PLAYER_ENTER: 'on_player_enter'
};

export const TRIGGER_EVENT_LABELS = {
  on_hit: 'כשפוגעים במפלצת',
  on_death: 'כשהמפלצת מתה',
  on_round_start: 'בתחילת כל סיבוב',
  on_player_enter: 'כשגיבור נכנס לחדר'
};

export const TRIGGER_EFFECTS = {
  DEAL_DAMAGE: 'deal_damage',
  HEAL: 'heal',
  APPLY_STATUS: 'apply_status',
  SPAWN_MONSTER: 'spawn_monster',
  DROP_ITEM: 'drop_item'
};

export const TRIGGER_EFFECT_LABELS = {
  deal_damage: 'גרום נזק',
  heal: 'רפא',
  apply_status: 'הוסף סטטוס',
  spawn_monster: 'הזמן מפלצת',
  drop_item: 'הפל פריט'
};

// ===== Grid cell types =====
export const CELL_TYPES = {
  FLOOR: 'floor',
  WALL: 'wall',
  DOOR: 'door',
  TRAP: 'trap',
  TREASURE: 'treasure'
};

export const CELL_TYPE_LABELS = {
  floor: 'רצפה',
  wall: 'קיר',
  door: 'דלת',
  trap: 'מלכודת',
  treasure: 'אוצר'
};

export const CELL_COLORS = {
  floor: '#2a1a08',
  wall: '#3d2818',
  door: '#8B4513',
  trap: '#8b0000',
  treasure: '#d4a017'
};

// ===== XP & Levels =====
export const XP_TABLE = [0, 10, 30, 60, 100];
export const MAX_LEVEL = 5;

export function getXPToNextLevel(currentLevel) {
  if (currentLevel >= MAX_LEVEL) return Infinity;
  return XP_TABLE[currentLevel] - XP_TABLE[currentLevel - 1];
}

export function getLevelForXP(totalXP) {
  for (let i = MAX_LEVEL; i >= 1; i--) {
    if (totalXP >= XP_TABLE[i - 1]) return i;
  }
  return 1;
}

// ===== Status Effects =====
export const STATUS_EFFECTS = {
  poisoned: {
    label: 'מורעל',
    emoji: '☠️',
    on_round_start: { effect: 'deal_damage', params: { amount: 1 } }
  },
  frozen: {
    label: 'קפוא',
    emoji: '❄️',
    skip_turn: true,
    duration: 1
  },
  stunned: {
    label: 'מסונוור',
    emoji: '💫',
    skip_turn: true,
    duration: 1
  },
  burning: {
    label: 'בוער',
    emoji: '🔥',
    on_round_start: { effect: 'deal_damage', params: { amount: 1 } },
    duration: 2
  }
};

// ===== Item effect types =====
export const ITEM_EFFECTS = {
  HEAL: 'heal',
  ATTACK_BONUS: 'attack_bonus',
  DEFENSE_BONUS: 'defense_bonus',
  STATUS_CLEAR: 'status_clear'
};

export const ITEM_EFFECT_LABELS = {
  heal: 'רפא',
  attack_bonus: 'בונוס תקיפה',
  defense_bonus: 'בונוס הגנה',
  status_clear: 'נקה סטטוס'
};

// ===== Special ability triggers =====
export const SPECIAL_TRIGGERS = {
  ONCE_PER_COMBAT: 'once_per_combat',
  ALWAYS: 'always',
  PASSIVE: 'passive'
};

export const SPECIAL_TRIGGER_LABELS = {
  once_per_combat: 'פעם אחת בקרב',
  always: 'תמיד זמין',
  passive: 'פסיבי (אוטומטי)'
};

// ===== Combat outcomes =====
export const COMBAT_OUTCOMES = {
  IN_PROGRESS: 'in_progress',
  PLAYER_VICTORY: 'player_victory',
  PLAYER_DEFEAT: 'player_defeat'
};

// ===== Session statuses =====
export const SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed'
};
