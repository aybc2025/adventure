import { useEffect, useState } from 'react';

/**
 * Dice-roll animation overlay — shows BOTH attack and defense pools.
 *
 * Props:
 *  - attackRolls:     number[]   attacker's dice values
 *  - defenseRolls:    number[]   defender's dice values
 *  - highestAttack:   number     highest attack value (after modifier)
 *  - highestDefense:  number     highest defense value (after modifier)
 *  - attackModifier:  number     modifier on attack dice
 *  - defenseModifier: number     modifier on defense dice
 *  - isMonsterAttack: boolean    true = monster is attacking the hero
 *  - hits:            number     0 = miss, 1 = hit
 *  - label:           string     subtitle (attacker → target)
 *  - onComplete:      () => void called when animation finishes
 */
export default function DiceAnimation({
  attackRolls    = [],
  defenseRolls   = [],
  highestAttack,
  highestDefense,
  attackModifier  = 0,
  defenseModifier = 0,
  isMonsterAttack = false,
  hits            = 0,
  label           = '',
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

  function DicePool({ rolls, highest, modifier, poolType, title }) {
    if (!rolls || rolls.length === 0) return null;
    const mod = modifier || 0;
    const effectiveHighest = highest ?? (Math.max(...rolls) + mod);

    const isAttack = poolType === 'attack';
    const isMonsterPool = isAttack && isMonsterAttack;

    const baseStyle = isAttack && !isMonsterPool
      ? 'bg-amber-700 border-amber-400 text-amber-100'
      : isMonsterPool
        ? 'bg-red-800 border-red-400 text-white'
        : 'bg-slate-700 border-slate-400 text-white';

    const highlightStyle = isAttack && !isMonsterPool
      ? 'bg-amber-400 border-white text-amber-950 scale-110 shadow-lg'
      : isMonsterPool
        ? 'bg-red-400 border-white text-white scale-110 shadow-lg'
        : 'bg-slate-300 border-white text-slate-900 scale-110 shadow-lg';

    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="text-xs text-text/60 font-medium">{title}</div>
        <div className="flex gap-1.5 justify-center flex-wrap">
          {rolls.map((v, i) => {
            const effective = v + mod;
            const isHigh = !rolling && effective === effectiveHighest;
            return (
              <div
                key={i}
                className={`w-12 h-12 rounded-md border-2 flex items-center justify-center
                  font-display font-bold text-2xl transition-all duration-300
                  ${rolling ? 'animate-dice-roll ' + baseStyle : isHigh ? highlightStyle : baseStyle}`}
              >
                {rolling ? '?' : v}
              </div>
            );
          })}
        </div>
        {!rolling && (
          <div className="text-[11px] text-text/50">
            הגבוהה: <span className="font-bold text-text/80">{effectiveHighest}</span>
            {mod !== 0 && (
              <span className="text-text/40"> ({Math.max(...rolls)}{modStr(mod)})</span>
            )}
          </div>
        )}
      </div>
    );
  }

  const titleLine   = isMonsterAttack ? 'מפלצת תוקפת 🗡️' : 'אתה תוקף ⚔️';
  const attackTitle = isMonsterAttack ? 'קוביות מפלצת'   : 'קוביות תקיפה';
  const defTitle    = isMonsterAttack ? 'קוביות הגנתך'   : 'קוביות הגנת מפלצת';

  const hit = hits > 0;
  const ha  = highestAttack  ?? (attackRolls.length  ? Math.max(...attackRolls)  + attackModifier  : '?');
  const hd  = highestDefense ?? (defenseRolls.length ? Math.max(...defenseRolls) + defenseModifier : '?');

  const resultMsg = rolling ? '' : hit
    ? `פגיעה! (${ha} ≥ ${hd})`
    : `החמצה! (${ha} < ${hd})`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 animate-fade-in pointer-events-none">
      <div className="card-fantasy card-fantasy-gold text-center max-w-xs w-full mx-4">

        <div className="text-gold font-display text-base mb-1">{titleLine}</div>

        {label && (
          <div className="text-muted text-xs mb-3">{label}</div>
        )}

        <div className="flex justify-center items-start gap-4 mb-3">
          <DicePool
            rolls={attackRolls}
            highest={highestAttack}
            modifier={attackModifier}
            poolType="attack"
            title={attackTitle}
          />

          <div className="flex flex-col items-center justify-center pt-6">
            <span className="text-muted text-lg font-bold">vs</span>
          </div>

          <DicePool
            rolls={defenseRolls}
            highest={highestDefense}
            modifier={defenseModifier}
            poolType="defense"
            title={defTitle}
          />
        </div>

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
