import { useEffect, useState } from 'react';

/**
 * Brief dice-roll animation overlay.
 * Props:
 *  - rolls: number[] (final values)
 *  - color: 'gold' | 'danger'
 *  - onComplete: () => void
 */
export default function DiceAnimation({ rolls, color = 'gold', label = '', onComplete }) {
  const [phase, setPhase] = useState('rolling'); // 'rolling' | 'reveal'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 500);
    const t2 = setTimeout(() => onComplete?.(), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  const colorClass = color === 'danger' ? 'bg-danger text-text' : 'bg-gold text-bg';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 animate-fade-in pointer-events-none">
      <div className="card-fantasy card-fantasy-gold text-center">
        {label && <div className="text-gold font-display text-lg mb-2">{label}</div>}
        <div className="flex gap-2 justify-center">
          {rolls.map((value, i) => (
            <div
              key={i}
              className={`w-14 h-14 ${colorClass} rounded-md flex items-center justify-center
                font-display font-bold text-2xl border-2 border-gold-bright
                ${phase === 'rolling' ? 'animate-dice-roll' : ''}`}
            >
              {phase === 'reveal' ? value : '?'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
