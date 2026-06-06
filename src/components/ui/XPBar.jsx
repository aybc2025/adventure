import { XP_TABLE, MAX_LEVEL } from '../../config/constants.js';

export default function XPBar({ xp, level, size = 'md' }) {
  const isMaxLevel = level >= MAX_LEVEL;
  const currentLevelXP = XP_TABLE[level - 1] || 0;
  const nextLevelXP = isMaxLevel ? currentLevelXP : XP_TABLE[level];
  const progress = isMaxLevel ? 100 : ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const heightClass = { sm: 'h-2', md: 'h-3', lg: 'h-4' }[size];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted font-display">
          רמה {level}
          {isMaxLevel && ' (מקסימום)'}
        </span>
        <span className="text-xs text-text font-display">
          {isMaxLevel ? `${xp} XP` : `${xp}/${nextLevelXP} XP`}
        </span>
      </div>
      <div className={`w-full ${heightClass} bg-bg border border-primary/40 rounded-full overflow-hidden`}>
        <div
          className="h-full bg-gold transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}
