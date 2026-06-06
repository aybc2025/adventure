import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer = null, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`card-fantasy card-fantasy-gold w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gold/30">
            <h3 className="text-xl text-gold font-display">{title}</h3>
            <button onClick={onClose} className="text-muted hover:text-gold text-2xl leading-none">
              ×
            </button>
          </div>
        )}
        <div className="mb-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 pt-3 border-t border-gold/30">{footer}</div>
        )}
      </div>
    </div>
  );
}
