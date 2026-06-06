import { canUseItem } from '../../engine/InventoryEngine.js';

export default function InventoryBar({ inventory, items, combatState, onUseItem, disabled }) {
  const list = Object.values(inventory || {})
    .map((inv) => ({ ...inv, item: items.find((i) => i.id === inv.item_id) }))
    .filter((x) => x.item);

  if (list.length === 0) {
    return (
      <div className="bg-bg/60 border border-primary/30 rounded-md p-2 text-center">
        <span className="text-muted text-xs">אין פריטים</span>
      </div>
    );
  }

  return (
    <div className="bg-bg/60 border border-primary/40 rounded-md p-2">
      <div className="text-xs text-muted font-display mb-1">🎒 פריטים</div>
      <div className="flex flex-wrap gap-2">
        {list.map(({ item, quantity }) => {
          const check = canUseItem(item, combatState);
          const usable = !disabled && check.canUse;
          return (
            <button
              key={item.id}
              onClick={() => usable && onUseItem(item)}
              disabled={!usable}
              title={usable ? item.description : check.reason}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-sm transition-all
                ${usable
                  ? 'bg-surface border-gold/50 hover:bg-gold hover:text-bg active:scale-95'
                  : 'bg-bg/40 border-muted/30 opacity-50 cursor-not-allowed'}`}
            >
              <span className="text-lg no-rtl">{item.emoji || '📦'}</span>
              <span className="font-display text-xs">{item.name}</span>
              <span className="text-xs text-muted">×{quantity}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
