import { usePlayerHistory } from '../../hooks/useHistory.js';
import { ROUTES } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function History() {
  const { history, loading } = usePlayerHistory();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען היסטוריה..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="היסטוריית הרפתקאות" backTo={ROUTES.PLAY_HOME} />
      <main className="max-w-3xl mx-auto p-4 space-y-3">
        {history.length === 0 ? (
          <Card className="text-center">
            <p className="text-text/80">עדיין לא שיחקת בהרפתקאות.</p>
          </Card>
        ) : (
          history.map((h) => (
            <Card key={h.id} className="animate-fade-in">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg text-gold font-display truncate">
                    {h.adventure_title}
                  </h3>
                  <p className="text-muted text-sm">
                    {h.hero_name} • {formatDate(h.played_at)}
                  </p>
                </div>
                <Badge variant={h.outcome === 'victory' ? 'gold' : 'danger'}>
                  {h.outcome === 'victory' ? '🏆 ניצחון' : '💀 הפסד'}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                <div className="bg-bg/50 rounded p-1.5">
                  <div className="text-gold font-display">{h.rooms_completed || 0}</div>
                  <div className="text-muted">חדרים</div>
                </div>
                <div className="bg-bg/50 rounded p-1.5">
                  <div className="text-gold font-display">{h.monsters_defeated || 0}</div>
                  <div className="text-muted">מפלצות</div>
                </div>
                <div className="bg-bg/50 rounded p-1.5">
                  <div className="text-gold font-display">+{h.xp_earned || 0}</div>
                  <div className="text-muted">XP</div>
                </div>
                <div className="bg-bg/50 rounded p-1.5">
                  <div className="text-gold font-display">{h.duration_minutes || 0}'</div>
                  <div className="text-muted">דקות</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
