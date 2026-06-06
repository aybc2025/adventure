export default function HPBar({ current, max, showNumbers = true, size = 'md' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const color =
    pct > 60 ? 'bg-success' : pct > 30 ? 'bg-gold' : 'bg-danger';

  const heightClass = { sm: 'h-2', md: 'h-3', lg: 'h-4' }[size];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {showNumbers && (
          <>
            <span className="text-xs text-muted font-display">HP</span>
            <span className="text-xs text-text font-display">
              {current}/{max}
            </span>
          </>
        )}
      </div>
      <div className={`w-full ${heightClass} bg-bg border border-primary/40 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
