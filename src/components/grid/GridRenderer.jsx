import { CELL_COLORS } from '../../config/constants.js';

export default function GridRenderer({
  grid,
  heroPosition = null,
  heroEmoji = '⚔️',
  monsters = [],
  onMonsterClick = null,
  selectedMonsterId = null,
  onCellClick = null,       // (x, y) => void — movement
  reachableCells = null,    // Set<"x,y"> — moveable highlights
  inRangeMonsterIds = null  // Set<monsterId> — attackable highlights
}) {
  if (!grid) return null;
  const cols = grid.cols || 8;
  const rows = grid.rows || 6;

  const cellMap = {};
  (grid.cells || []).forEach((c) => { cellMap[`${c.x},${c.y}`] = c.type; });

  const monsterMap = {};
  monsters.forEach((m) => {
    if (m.position && m.hp > 0) {
      const key = `${m.position.x},${m.position.y}`;
      if (!monsterMap[key]) monsterMap[key] = [];
      monsterMap[key].push(m);
    }
  });

  return (
    <div className="inline-block bg-bg p-2 rounded-md border-2 border-primary/60 overflow-auto max-w-full">
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows }).map((_, y) =>
          Array.from({ length: cols }).map((_, x) => {
            const cellType = cellMap[`${x},${y}`] || 'floor';
            const cellMonsters = monsterMap[`${x},${y}`] || [];
            const isHeroHere = heroPosition?.x === x && heroPosition?.y === y;
            const bg = CELL_COLORS[cellType] || CELL_COLORS.floor;
            const key = `${x},${y}`;
            const canMoveTo =
              reachableCells?.has(key) &&
              cellMonsters.length === 0 &&
              !isHeroHere &&
              onCellClick;

            return (
              <div
                key={`${x}-${y}`}
                className={`aspect-square flex items-center justify-center text-lg sm:text-xl relative
                  ${canMoveTo ? 'cursor-pointer' : ''}`}
                style={{ background: bg, minWidth: '32px', minHeight: '32px' }}
                onClick={canMoveTo ? () => onCellClick(x, y) : undefined}
              >
                {/* Movement range highlight */}
                {canMoveTo && (
                  <div className="absolute inset-0 bg-gold/25 pointer-events-none" />
                )}

                {cellType === 'door' && <span className="absolute opacity-40 no-rtl">🚪</span>}
                {cellType === 'trap' && <span className="absolute opacity-40 no-rtl">⚠️</span>}
                {cellType === 'treasure' && <span className="absolute opacity-50 no-rtl">💰</span>}

                {isHeroHere && (
                  <span className="relative z-10 no-rtl text-2xl drop-shadow-lg filter drop-shadow">
                    {heroEmoji}
                  </span>
                )}

                {cellMonsters.map((m) => {
                  const isSelected = m.id === selectedMonsterId;
                  const isInRange = inRangeMonsterIds?.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={(e) => { e.stopPropagation(); onMonsterClick?.(m.id); }}
                      disabled={!onMonsterClick}
                      className={`relative z-20 no-rtl text-xl sm:text-2xl drop-shadow-lg transition-all ${
                        isSelected
                          ? 'scale-125 ring-2 ring-danger rounded-full'
                          : isInRange
                          ? 'ring-2 ring-gold rounded-full'
                          : ''
                      } ${onMonsterClick ? 'hover:scale-110 cursor-pointer' : ''}`}
                      title={`${m.name} (HP: ${m.hp})`}
                    >
                      {m.emoji || '👹'}
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
