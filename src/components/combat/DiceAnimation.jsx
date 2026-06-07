import { useEffect, useState } from 'react';

/**
 * Dice-roll animation overlay.
 *
 * Shows BOTH the attacker's dice pool and the defender's dice pool
 * so the outcome is immediately understandable — just like rolling
 * on a table in the physical game.
 *
 * Props:
 *  - attackRolls:    number[]   attacker's dice values
 *  - defenseRolls:   number[]   defender's dice values
 *  - highestAttack:  number     highest attack value (after modifier)
 *  - highestDefense: number     highest defense value (after modifier)
 *  - attackModifier: number     modifier on attack dice (+1, -1, …)
 *  - defenseModifier:number     modifier on defense dice
 *  - isMonsterAttack: boolean   true when a monster is attacking the hero
 *  - hits:           number     0 = miss, 1 = hit
 *  - label:          string     e.g. attacker name + target name
 *  - onComplete:     () => void called when animation finishes
 */
export default function DiceAnimation({
  attackRolls   = [],
  defenseRolls  = [],
  highestAttack,
  highestDefense,
  attackModifier  = 0,
  defenseModifier = 0,
  isMonsterAttack = false,
  hits           = 0,
  label          = '',
  onComplete
}) {
  const [phase, setPhase] = useState('rolling'); // 'rolling' | 'reveal'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 600);
    const t2 = setTimeout(() => onComplete?.(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  const rolling = phase === 'rolling';

  function modStr(mod) {
    if (!mod || mod === 0) return '';
    return mod > 0 ? `+${mod}` : `${mod}`;
  }

  function DicePool({ rolls, highest, modifier, color, title }) {
    if (!rolls || rolls.length === 0) return null;
    const isGold = color === 'attack' && !isMonsterAttack;
    const baseStyle = isGold
      ? 'bg-amber-600 border-amber-300 text-amber-950'
      : color === 'attack'
        ? 'bg-red-700 border-red-300 text-white'
        : 'bg-slate-600 border-slate-300 text-white';
    const highlightStyle = isGold
      ? 'bg-amber-300 border-white text-amber-950 scale-110'
      : color === 'attack'
        ? 'bg-red-400 border-white text-white scale-110'
        : 'bg-slate-300 border-white text-slate-900 scale-110';

    const mod = modifier || 0;
    const effectiveHighest = highest ?? (Math.max(...rolls) + mod);

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs text-text/60 font-medium">{title}</div>
        <div className="flex gap-1.5 justify-center flex-wrap">
          {rolls.map((v, i) => {
            const effective = v + mod;
            const isHigh = !rolling && effective === effectiveHighest;
            return (
              <div
                key={i}
                className={`w-12 h-12 rounded-md border-2 flex items-center justify-center
                  font-display font-bold text-xl transition-all duration-300
                  ${rolling ? 'animate-dice-roll ' + baseStyle : isHigh ? highlightStyle : baseStyle}`}
              >
                {rolling ? '?' : v}
              </div>
            );
          })}
        </div>
        {!rolling && (
          <div className="text-xs text-text/50 mt-0.5">
            הגבוהה: <span className="font-bold text-text/80">{effectiveHighest}</span>
            {mod !== 0 && <span className="text-text/40"> ({Math.max(...rolls)}{modStr(mod)})</span>}
          </div>
        )}
      </div>
    );
  }

  const attackerLabel  = isMonsterAttack ? 'מפלצת תוקפת 🗡️' : 'אתה תוקף ⚔️';
  const attackTitle    = isMonsterAttack ? 'קוביות מפלצת' : 'קוביות תקיפה';
  const defenseTitle   = isMonsterAttack ? 'קוביות הגנתך' : 'קוביות הגנת מפלצת';

  const hit  = hits > 0;
  const resultMsg = !rolling
    ? hit
      ? `פגיעה! (${highestAttack ?? '?'} ≥ ${highestDefense ?? '?'})`
      : `החמצה! (${highestAttack ?? '?'} < ${highestDefense ?? '?'})`
    : '';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 animate-fade-in pointer-events-none">
      <div className="card-fantasy card-fantasy-gold text-center max-w-xs w-full mx-4">

        {/* Who is attacking */}
        <div className="text-gold font-display text-base mb-1">{attackerLabel}</div>
        {label && (
          <div className="text-muted text-xs mb-3">{label}</div>
        )}

        {/* Dice pools side by side */}
        <div className="flex justify-center items-start gap-4 mb-3">
          <DicePool
            rolls={attackRolls}
            highest={highestAttack}
            modifier={attackModifier}
            color="attack"
            title={attackTitle}
          />

          <div className="flex flex-col items-center justify-center pt-5">
            <div className="text-muted text-lg font-bold">vs</div>
          </div>

          <DicePool
            rolls={defenseRolls}
            highest={highestDefense}
            modifier={defenseModifier}
            color="defense"
            title={defenseTitle}
          />
        </div>

        {/* Result */}
        {!rolling && (
          <div className={`text-base font-display font-bold mt-1 ${
            hit ? 'text-red-400' : 'text-green-400'
          }`}>
            {resultMsg}
          </div>
        )}
      </div>
    </div>
  );
}
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
