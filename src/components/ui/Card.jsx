export default function Card({ gold = false, className = '', children, ...props }) {
  return (
    <div
      className={`card-fantasy ${gold ? 'card-fantasy-gold' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
