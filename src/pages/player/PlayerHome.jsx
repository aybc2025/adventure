import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { usePlayer } from '../../hooks/usePlayer.js';
import { usePlayerHero } from '../../hooks/usePlayerHero.js';
import { useActiveSession } from '../../hooks/useSession.js';
import { ROUTES, buildRoute } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import HPBar from '../../components/ui/HPBar.jsx';
import XPBar from '../../components/ui/XPBar.jsx';

export default function PlayerHome() {
  const { user } = useAuth();
  const { player, loading: playerLoading } = usePlayer();
  const { hero, loading: heroLoading } = usePlayerHero();
  const { session, loading: sessionLoading } = useActiveSession();
  const navigate = useNavigate();

  if (playerLoading || heroLoading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title={`שלום ${user?.displayName || 'גיבור'}!`} />

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {user?.isGM && (
          <Card className="border-gold/40">
            <div className="flex items-center justify-between">
              <span className="text-gold font-display">🛡️ אתה רשום כ-GM</span>
              <Link to={ROUTES.GM_DASHBOARD} className="btn-gold text-sm">
                לממשק ניהול
              </Link>
            </div>
          </Card>
        )}

        {/* No hero yet */}
        {!hero && (
          <Card gold className="text-center animate-fade-in">
            <div className="text-6xl mb-3">⚔️</div>
            <h2 className="text-2xl text-gold mb-2 font-display heading-glow">צור גיבור</h2>
            <p className="text-text/80 mb-4">
              לפני שאתה יוצא להרפתקה, בחר את הכיתה של הגיבור שלך ותן לו שם.
            </p>
            <button
              onClick={() => navigate(ROUTES.HERO_CREATE)}
              className="btn-gold text-lg"
            >
              בחר גיבור
            </button>
          </Card>
        )}

        {/* Hero card */}
        {hero && (
          <Card gold className="animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="text-6xl no-rtl">{hero.emoji || '⚔️'}</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl text-gold font-display mb-1">{hero.custom_name}</h2>
                <p className="text-muted text-sm mb-3">
                  {hero.class} • רמה {hero.level}
                </p>
                <div className="space-y-2">
                  <HPBar current={hero.hp_max} max={hero.hp_max} />
                  <XPBar xp={hero.xp || 0} level={hero.level || 1} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={ROUTES.HERO_PROFILE} className="btn-primary text-sm">
                פרופיל גיבור
              </Link>
            </div>
          </Card>
        )}

        {/* Active session */}
        {hero && session && (
          <Card className="animate-fade-in border-gold/50">
            <h3 className="text-xl text-gold font-display mb-2">🎲 הרפתקה בעיצומה</h3>
            <p className="text-text/80 mb-3 text-sm">
              יש לך הרפתקה פעילה. תרצה להמשיך מאיפה שעצרת?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(buildRoute.roomView(session.id))}
                className="btn-gold flex-1"
              >
                המשך הרפתקה
              </button>
            </div>
          </Card>
        )}

        {/* Actions */}
        {hero && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            {!session && (
              <Link
                to={ROUTES.ADVENTURE_SELECT}
                className="card-fantasy card-fantasy-gold text-center hover:bg-surface-2 transition-colors"
              >
                <div className="text-4xl mb-2">🗺️</div>
                <h3 className="text-lg text-gold font-display">הרפתקה חדשה</h3>
                <p className="text-muted text-sm mt-1">בחר מהרשימה</p>
              </Link>
            )}
            <Link
              to={ROUTES.PLAYER_HISTORY}
              className="card-fantasy text-center hover:bg-surface-2 transition-colors"
            >
              <div className="text-4xl mb-2">📜</div>
              <h3 className="text-lg text-gold font-display">היסטוריה</h3>
              <p className="text-muted text-sm mt-1">
                {player?.stats?.adventures_completed || 0} הרפתקאות הושלמו
              </p>
            </Link>
          </div>
        )}

        {/* Stats summary */}
        {player?.stats && hero && (
          <Card className="text-center animate-fade-in">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-2xl text-gold font-display">
                  {player.stats.adventures_completed || 0}
                </div>
                <div className="text-xs text-muted">הרפתקאות</div>
              </div>
              <div>
                <div className="text-2xl text-gold font-display">
                  {player.stats.total_monsters_defeated || 0}
                </div>
                <div className="text-xs text-muted">מפלצות הובסו</div>
              </div>
              <div>
                <div className="text-2xl text-gold font-display">
                  {player.stats.total_xp_earned || 0}
                </div>
                <div className="text-xs text-muted">XP צבור</div>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
