export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    gold: 'btn-gold',
    danger: 'btn-danger',
    ghost: 'btn-ghost'
  }[variant];

  const sizeClass = {
    sm: 'text-sm px-3 py-1.5',
    md: '',
    lg: 'text-lg px-6 py-3'
  }[size];

  return (
    <button className={`${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
