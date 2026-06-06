import { useEffect, useRef } from 'react';

const TYPE_STYLES = {
  player_attack: 'text-gold',
  monster_attack: 'text-danger',
  monster_death: 'text-success',
  defeat: 'text-danger font-bold',
  victory: 'text-gold font-bold',
  damage: 'text-danger',
  heal: 'text-success',
  status: 'text-muted',
  spawn: 'text-gold',
  loot: 'text-gold',
  skip: 'text-muted italic',
  item_use: 'text-success',
  item_blocked: 'text-muted italic',
  special: 'text-gold-bright',
  special_blocked: 'text-muted italic'
};

export default function CombatLog({ entries = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div
      ref={ref}
      className="bg-bg/70 border border-primary/40 rounded-md p-2 h-32 overflow-y-auto text-sm space-y-1"
      role="log"
      aria-live="polite"
    >
      {entries.length === 0 && (
        <p className="text-muted text-center italic">יומן הקרב יופיע כאן...</p>
      )}
      {entries.map((e, i) => (
        <div key={i} className={TYPE_STYLES[e.type] || 'text-text'}>
          {e.message}
        </div>
      ))}
    </div>
  );
}
