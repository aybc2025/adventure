import { useEffect, useRef } from 'react';

const TYPE_META = {
  player_attack:  { icon: '⚔️',  style: 'border-amber-700/40 bg-amber-950/20' },
  monster_attack: { icon: '🗡️',  style: 'border-red-800/40  bg-red-950/20'   },
  monster_death:  { icon: '💀',  style: 'text-green-400'   },
  victory:        { icon: '🏆',  style: 'text-yellow-400 font-bold' },
  defeat:         { icon: '💀',  style: 'text-red-400 font-bold'   },
  heal:           { icon: '💚',  style: 'text-green-400'   },
  item_use:       { icon: '🧪',  style: 'text-green-300'   },
  item_blocked:   { icon: '🚫',  style: 'text-muted italic' },
  special:        { icon: '✨',  style: 'text-yellow-300'  },
  special_blocked:{ icon: '🚫',  style: 'text-muted italic' },
  status:         { icon: '⚡',  style: 'text-purple-300'  },
  damage:         { icon: '❤️',  style: 'text-red-400'     },
  skip:           { icon: '⏭️',  style: 'text-muted italic' },
  initiative:     { icon: '🎲',  style: 'text-blue-300'    },
  monster_move:   { icon: '🐾',  style: 'text-muted italic text-xs' },
  loot:           { icon: '💰',  style: 'text-yellow-300'  },
  spawn:          { icon: '⚡',  style: 'text-purple-300'  }
};

/**
 * Render a single dice pool as small badges.
 */
function DiceBadges({ rolls, highest, modifier, color }) {
  if (!rolls || rolls.length === 0) return null;
  const baseColor = color === 'attack'
    ? 'bg-amber-800/60 border-amber-600 text-amber-100'
    : 'bg-slate-700/60  border-slate-500 text-slate-100';
  const highlightColor = color === 'attack'
    ? 'bg-amber-500    border-amber-300 text-amber-900 font-bold ring-1 ring-amber-300'
    : 'bg-red-600      border-red-400   text-white      font-bold ring-1 ring-red-400';

  const modStr = modifier && modifier !== 0
    ? (modifier > 0 ? `+${modifier}` : `${modifier}`)
    : '';

  return (
    <span className="inline-flex items-center gap-0.5 flex-wrap">
      {rolls.map((v, i) => {
        const effective = v + (modifier || 0);
        const isHighest = effective === highest;
        return (
          <span
            key={i}
            className={`inline-flex items-center justify-center w-6 h-6 rounded border text-xs
              ${isHighest ? highlightColor : baseColor}`}
          >
            {v}{modStr && i === rolls.length - 1 ? modStr : ''}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Rich display for a player_attack or monster_attack log entry.
 * Shows:  attacker → [atk dice] vs [def dice] → result
 */
function AttackEntry({ entry, isMonster }) {
  const { message, rolls, defense_rolls, highestAttack, highestDefense, hits } = entry;
  const hasBreakdown = rolls?.length > 0 && defense_rolls?.length > 0;

  return (
    <div className={`rounded border px-2 py-1.5 text-xs space-y-1 ${
      isMonster ? 'border-red-800/40 bg-red-950/20' : 'border-amber-700/40 bg-amber-950/20'
    }`}>
      {/* Main line */}
      <div className="flex items-center gap-1.5 text-text/90">
        <span>{isMonster ? '🗡️' : '⚔️'}</span>
        <span>{message}</span>
      </div>

      {/* Dice breakdown */}
      {hasBreakdown && (
        <div className="flex items-center gap-1.5 flex-wrap pr-5 text-text/75">
          {/* Attack pool */}
          <span className="text-amber-400 text-[10px]">
            {isMonster ? 'מפלצת הטילה:' : 'הטלת:'}
          </span>
          <DiceBadges
            rolls={rolls}
            highest={highestAttack}
            modifier={entry.attackModifier}
            color="attack"
          />

          {/* Divider */}
          <span className="text-muted">|</span>

          {/* Defense pool */}
          <span className="text-slate-400 text-[10px]">
            {isMonster ? 'הגנת:' : 'מפלצת הגנה:'}
          </span>
          <DiceBadges
            rolls={defense_rolls}
            highest={highestDefense}
            modifier={entry.defenseModifier}
            color="defense"
          />

          {/* Separator */}
          <span className="text-muted">→</span>

          {/* Result */}
          <span className={hits > 0 ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>
            {hits > 0
              ? `פגיעה! ${highestAttack} ≥ ${highestDefense}`
              : `החמצה! ${highestAttack} < ${highestDefense}`}
          </span>
        </div>
      )}

      {/* Fallback if no breakdown data */}
      {!hasBreakdown && (
        <div className={`text-[10px] ${hits > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {hits > 0 ? 'פגיעה!' : 'החמצה!'}
        </div>
      )}
    </div>
  );
}

export default function CombatLog({ entries = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [entries.length]);

  function renderEntry(e, i) {
    if (e.type === 'player_attack') {
      return <AttackEntry key={i} entry={e} isMonster={false} />;
    }
    if (e.type === 'monster_attack') {
      return <AttackEntry key={i} entry={e} isMonster={true} />;
    }

    const meta  = TYPE_META[e.type] || {};
    const icon  = meta.icon || '';
    const style = meta.style || 'text-text/80';

    return (
      <div key={i} className={`text-xs px-1 ${style}`}>
        {icon && <span className="mr-1">{icon}</span>}
        {e.message}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="bg-bg/70 border border-primary/40 rounded-md p-2 h-40 overflow-y-auto space-y-1.5"
      role="log"
      aria-live="polite"
    >
      {entries.length === 0 && (
        <p className="text-muted text-center italic text-xs">יומן הקרב יופיע כאן...</p>
      )}
      {entries.map((e, i) => renderEntry(e, i))}
    </div>
  );
}
