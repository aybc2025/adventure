import { STATUS_EFFECTS } from '../../config/constants.js';
import HPBar from '../ui/HPBar.jsx';

export default function HeroStats({ heroState }) {
  if (!heroState) return null;
  return (
    <div className="bg-bg/70 border border-gold/40 rounded-lg p-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl no-rtl">{heroState.emoji || '⚔️'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-gold font-display truncate">{heroState.name}</div>
          {heroState.statuses?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {heroState.statuses.map((s, i) => {
                const def = STATUS_EFFECTS[s.key];
                return (
                  <span
                    key={i}
                    className="text-xs bg-surface-2 border border-muted/40 rounded px-1.5 py-0.5"
                    title={def?.label}
                  >
                    {def?.emoji || '🔮'} {def?.label || s.key}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <HPBar current={heroState.hp} max={heroState.hp_max} size="md" />
    </div>
  );
}
