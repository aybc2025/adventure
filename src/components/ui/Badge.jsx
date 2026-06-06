export default function Badge({ variant = 'gold', children, className = '' }) {
  const variantClass = {
    gold: 'bg-gold/20 text-gold border-gold/40',
    primary: 'bg-primary/30 text-text border-primary',
    danger: 'bg-danger/20 text-danger border-danger/40',
    muted: 'bg-surface-2 text-muted border-muted/30'
  }[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-display ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
}
