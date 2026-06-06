import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { usePlayerHero } from '../../hooks/usePlayerHero.js';
import { useHeroTemplates } from '../../hooks/useHeroTemplates.js';
import { ROUTES, buildRoute } from '../../config/routes.js';
import {
  getLevelUpOptions,
  applyUpgrade
} from '../../engine/ProgressionEngine.js';

import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';

export default function LevelUp() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hero, loading: heroLoading } = usePlayerHero();
  const { templates, loading: tmplLoading } = useHeroTemplates();
  const [chosen, setChosen] = useState(null);
  const [saving, setSaving] = useState(false);

  const template = useMemo(
    () => templates.find((t) => t.id === hero?.template_id),
    [templates, hero]
  );

  const options = useMemo(
    () => (template ? getLevelUpOptions(template, hero?.applied_upgrades || []) : []),
    [template, hero]
  );

  if (heroLoading || tmplLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען..." />
      </div>
    );
  }

  if (!hero || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center max-w-md">
          <p className="text-text mb-3">לא ניתן לטעון את הגיבור</p>
          <button onClick={() => navigate(ROUTES.PLAY_HOME)} className="btn-gold">
            חזור לבית
          </button>
        </Card>
      </div>
    );
  }

  async function handleConfirm() {
    if (!chosen) return;
    setSaving(true);
    try {
      const upgraded = applyUpgrade(hero, chosen);
      const heroRef = doc(db, 'players', user.uid, 'heroes', hero.id);
      await updateDoc(heroRef, {
        hp_max: upgraded.hp_max,
        attack_dice: upgraded.attack_dice,
        defense_dice: upgraded.defense_dice,
        applied_upgrades: upgraded.applied_upgrades
      });
      navigate(buildRoute.gameOver(sessionId));
    } catch (err) {
      console.error('Apply upgrade error:', err);
      setSaving(false);
    }
  }

  // No options available — skip
  if (options.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card gold className="text-center max-w-md">
          <div className="text-6xl mb-3">🌟</div>
          <h2 className="text-2xl text-gold font-display mb-2">עלית רמה!</h2>
          <p className="text-text/80 mb-4">אין שדרוגים חדשים זמינים.</p>
          <button onClick={() => navigate(buildRoute.gameOver(sessionId))} className="btn-gold">
            המשך
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="עלית רמה!" showSignOut={false} />
      <main className="max-w-3xl mx-auto p-4">
        <Card gold className="text-center mb-4 animate-level-up">
          <div className="text-7xl mb-2 animate-pulse-gold inline-block">🌟</div>
          <h2 className="text-3xl text-gold font-display heading-glow mb-1">
            רמה {hero.level}!
          </h2>
          <p className="text-text/80">{hero.custom_name} מתחזק. בחר שדרוג:</p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setChosen(opt)}
              className={`card-fantasy text-right transition-all hover:scale-105
                ${chosen?.id === opt.id ? 'card-fantasy-gold scale-105' : ''}`}
            >
              <h3 className="text-xl text-gold font-display mb-2">{opt.name}</h3>
              <p className="text-text/80 text-sm">{opt.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleConfirm}
            disabled={!chosen || saving}
            className="btn-gold text-lg px-6"
          >
            {saving ? 'שומר...' : 'אישור'}
          </button>
        </div>
      </main>
    </div>
  );
}
