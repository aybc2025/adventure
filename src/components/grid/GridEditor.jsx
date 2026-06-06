import { useState } from 'react';
import { CELL_TYPES, CELL_TYPE_LABELS, CELL_COLORS } from '../../config/constants.js';

const CELL_EMOJIS = {
  floor: '',
  wall: '🧱',
  door: '🚪',
  trap: '⚠️',
  treasure: '💰'
};

/**
 * GridEditor — paint cells, place hero & monster positions.
 *
 * Props:
 *  - grid: { cols, rows, cells: [{x,y,type}] }
 *  - onGridChange: (newGrid) => void
 *  - monsters: [{ id, name, emoji, position }]
 *  - onMonsterPositionChange: (monsterId, position) => void
 */
export default function GridEditor({
  grid,
  onGridChange,
  monsters = [],
  onMonsterPositionChange
}) {
  const [paintType, setPaintType] = useState(CELL_TYPES.FLOOR);
  const [mode, setMode] = useState('paint'); // 'paint' | 'place'
  const [placingMonsterId, setPlacingMonsterId] = useState(null);
  const [isPainting, setIsPainting] = useState(false);

  const cols = grid?.cols || 8;
  const rows = grid?.rows || 6;

  // Map of "x,y" -> type
  const cellMap = {};
  (grid?.cells || []).forEach((c) => {
    cellMap[`${c.x},${c.y}`] = c.type;
  });

  function paintCell(x, y) {
    const key = `${x},${y}`;
    const cells = (grid?.cells || []).filter((c) => !(c.x === x && c.y === y));
    if (paintType !== CELL_TYPES.FLOOR) {
      cells.push({ x, y, type: paintType });
    }
    onGridChange({ ...grid, cols, rows, cells });
  }

  function handleCellClick(x, y) {
    if (mode === 'paint') {
      paintCell(x, y);
    } else if (mode === 'place' && placingMonsterId) {
      onMonsterPositionChange?.(placingMonsterId, { x, y });
      setPlacingMonsterId(null);
    }
  }

  function changeSize(field, value) {
    const v = Math.max(3, Math.min(15, value));
    const newGrid = { ...grid, [field]: v, cols, rows };
    newGrid[field] = v;
    // Remove cells outside new bounds
    newGrid.cells = (newGrid.cells || []).filter(
      (c) => c.x < (field === 'cols' ? v : cols) && c.y < (field === 'rows' ? v : rows)
    );
    onGridChange(newGrid);
  }

  function clearAll() {
    onGridChange({ ...grid, cols, rows, cells: [] });
  }

  // Monster position map
  const monsterMap = {};
  monsters.forEach((m) => {
    if (m.position) {
      const k = `${m.position.x},${m.position.y}`;
      if (!monsterMap[k]) monsterMap[k] = [];
      monsterMap[k].push(m);
    }
  });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setMode('paint')}
            className={`text-xs px-3 py-1.5 rounded ${
              mode === 'paint' ? 'bg-gold text-bg' : 'bg-surface text-text border border-primary/50'
            }`}
          >
            🎨 צייר
          </button>
          <button
            onClick={() => setMode('place')}
            className={`text-xs px-3 py-1.5 rounded ${
              mode === 'place' ? 'bg-gold text-bg' : 'bg-surface text-text border border-primary/50'
            }`}
          >
            👹 מקם מפלצות
          </button>
        </div>

        {mode === 'paint' && (
          <div className="flex flex-wrap gap-1">
            {Object.values(CELL_TYPES).map((type) => (
              <button
                key={type}
                onClick={() => setPaintType(type)}
                className={`text-xs px-2 py-1 rounded border-2 transition-all ${
                  paintType === type ? 'border-gold scale-105' : 'border-transparent'
                }`}
                style={{ background: CELL_COLORS[type] }}
              >
                {CELL_EMOJIS[type] && <span className="no-rtl me-1">{CELL_EMOJIS[type]}</span>}
                <span className="text-text">{CELL_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
        )}

        {mode === 'place' && (
          <div className="flex flex-wrap gap-1">
            {monsters.length === 0 ? (
              <span className="text-muted text-xs">הוסף מפלצות תחילה</span>
            ) : (
              monsters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPlacingMonsterId(m.id)}
                  className={`text-xs px-2 py-1 rounded border-2 flex items-center gap-1 ${
                    placingMonsterId === m.id
                      ? 'border-gold bg-gold/20'
                      : 'border-primary/50 bg-bg'
                  }`}
                >
                  <span className="no-rtl">{m.emoji || '👹'}</span>
                  <span className="text-text">{m.name || 'ללא שם'}</span>
                  {m.position && <span className="text-muted">({m.position.x},{m.position.y})</span>}
                </button>
              ))
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs text-muted">רוחב:</label>
          <input
            type="number"
            min={3}
            max={15}
            value={cols}
            onChange={(e) => changeSize('cols', parseInt(e.target.value, 10) || 8)}
            className="input-fantasy w-16 py-1 text-sm"
          />
          <label className="text-xs text-muted">גובה:</label>
          <input
            type="number"
            min={3}
            max={15}
            value={rows}
            onChange={(e) => changeSize('rows', parseInt(e.target.value, 10) || 6)}
            className="input-fantasy w-16 py-1 text-sm"
          />
          <button onClick={clearAll} className="btn-danger text-xs">
            נקה הכל
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="inline-block bg-bg p-2 rounded-md border-2 border-primary/60 max-w-full overflow-auto">
        <div
          className="grid gap-0.5 select-none"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          onMouseLeave={() => setIsPainting(false)}
        >
          {Array.from({ length: rows }).map((_, y) =>
            Array.from({ length: cols }).map((_, x) => {
              const type = cellMap[`${x},${y}`] || 'floor';
              const cellMonsters = monsterMap[`${x},${y}`] || [];
              return (
                <div
                  key={`${x}-${y}`}
                  onMouseDown={() => {
                    setIsPainting(true);
                    handleCellClick(x, y);
                  }}
                  onMouseUp={() => setIsPainting(false)}
                  onMouseEnter={() => {
                    if (isPainting && mode === 'paint') paintCell(x, y);
                  }}
                  onClick={() => handleCellClick(x, y)}
                  className="aspect-square flex items-center justify-center text-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: CELL_COLORS[type] || CELL_COLORS.floor, minWidth: 28, minHeight: 28 }}
                  title={`(${x},${y}) — ${CELL_TYPE_LABELS[type]}`}
                >
                  {CELL_EMOJIS[type] && <span className="opacity-60 no-rtl">{CELL_EMOJIS[type]}</span>}
                  {cellMonsters.map((m) => (
                    <span key={m.id} className="absolute no-rtl text-xl" title={m.name}>
                      {m.emoji || '👹'}
                    </span>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
