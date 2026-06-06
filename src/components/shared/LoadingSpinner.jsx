export default function LoadingSpinner({ size = 'medium', label = null }) {
  const sizeClass = {
    small: 'w-5 h-5 border-2',
    medium: 'w-8 h-8 border-4',
    large: 'w-14 h-14 border-4'
  }[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`inline-block ${sizeClass} border-primary border-t-gold rounded-full animate-spin`}
        role="status"
      />
      {label && <span className="text-muted text-sm font-display">{label}</span>}
    </div>
  );
}
