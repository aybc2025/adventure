import HPBar from '../ui/HPBar.jsx';

export default function MonsterCard({ monster, onSelect, selected, disabled }) {
  const dead = monster.hp <= 0;
  return (
    <button
      onClick={() => !disabled && !dead && onSelect?.(monster.id)}
      disabled={disabled || dead}
      className={`w-full text-right rounded-lg p-3 border-2 transition-all
        ${dead ? 'opacity-30 grayscale border-muted/30 bg-bg/40' :
          selected ? 'border-danger bg-danger/10 scale-105 animate-pulse-gold' :
          'border-primary/50 bg-bg/60 hover:border-gold hover:scale-[1.02]'}
        ${disabled || dead ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-3xl no-rtl">{monster.emoji || '👹'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-text font-display text-sm truncate">{monster.name}</div>
          <div className="text-muted text-xs">
            {monster.attack_dice} / {monster.defense_dice}
          </div>
        </div>
      </div>
      <HPBar current={monster.hp} max={monster.hp_max ?? monster.hp} size="sm" />
    </button>
  );
}
